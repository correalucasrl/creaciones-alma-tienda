const express = require('express')
const router = express.Router()
const { sql, poolPromise } = require('../db')
const { manejarError } = require('../utils/errores')
const { verificarToken, verificarTokenOpcional, verificarAdmin } = require('../middleware/authMiddleware')
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago')
const {
  enviarNotificacionPedido, enviarConfirmacionPedido, enviarPagoAprobado, enviarPedidoEnviado, enviarPedidoCancelado
} = require('../utils/email')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const { cotizarEnvio } = require('../utils/correoArgentino')
const { precioVigente, evaluarCupon, redondear } = require('../utils/precios')
const { buscarCupon, normalizarCodigo } = require('./cupones')

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN
})

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
// URL pública del backend (https). Mercado Pago necesita poder llegar al webhook desde internet
const BACKEND_URL = process.env.BACKEND_URL

const MAX_CANTIDAD_POR_PRODUCTO = 100
const MAX_RENGLONES_CARRITO = 50
const ESTADOS_VALIDOS = ['Pendiente', 'Pagado', 'Enviado', 'Entregado', 'Cancelado']

class ErrorStock extends Error {
  constructor(nombreProducto) {
    super(`Sin stock suficiente de ${nombreProducto}`)
  }
}

class ErrorCupon extends Error {}

// Suma o resta un uso al cupón de la orden (al crearla, cancelarla o reactivarla).
// Al sumar se controla el límite de forma atómica, igual que con el stock
async function moverUsoCupon(transaction, cuponId, delta, controlarLimite = false) {
  if (!cuponId) return
  const result = await new sql.Request(transaction)
    .input('id', sql.Int, cuponId)
    .input('delta', sql.Int, delta)
    .query(`
      UPDATE Cupones SET Usos = CASE WHEN Usos + @delta < 0 THEN 0 ELSE Usos + @delta END
      WHERE Id = @id ${controlarLimite ? 'AND Activo = 1 AND (UsosMaximos IS NULL OR Usos < UsosMaximos)' : ''}
    `)
  if (controlarLimite && result.rowsAffected[0] === 0) {
    throw new ErrorCupon('Ese cupón ya alcanzó su límite de usos')
  }
}

// Resta el stock de cada producto dentro de la transacción. El "AND Stock >= @cantidad"
// hace la resta atómica: si dos compras llegan juntas, solo una se lleva la última unidad
async function descontarStock(transaction, detalles) {
  for (const d of detalles) {
    const result = await new sql.Request(transaction)
      .input('id', sql.Int, d.productoId)
      .input('cantidad', sql.Int, d.cantidad)
      .query('UPDATE Productos SET Stock = Stock - @cantidad WHERE Id = @id AND Stock >= @cantidad')

    if (result.rowsAffected[0] === 0) {
      throw new ErrorStock(d.nombre)
    }
  }
}

async function devolverStock(transaction, ordenId) {
  await new sql.Request(transaction)
    .input('ordenId', sql.Int, ordenId)
    .query(`
      UPDATE p SET p.Stock = p.Stock + od.Cantidad
      FROM Productos p
      JOIN OrdenDetalles od ON od.ProductoId = p.Id
      WHERE od.OrdenId = @ordenId
    `)
}

async function rollbackSeguro(transaction) {
  try {
    await transaction.rollback()
  } catch {
    // La transacción ya estaba abortada por SQL Server, no hay nada que deshacer
  }
}

// Avisa al cliente por mail cuando su pedido pasa a Pagado, Enviado o Cancelado.
// Nunca rompe el flujo que la llamó: si el mail falla, solo se loguea
async function notificarCambioEstado(ordenId, nuevoEstado) {
  try {
    const pool = await poolPromise
    const result = await pool.request()
      .input('id', sql.Int, ordenId)
      .query(`
        SELECT o.Total, o.NumeroSeguimiento, u.Nombre, u.Email
        FROM Ordenes o
        JOIN Usuarios u ON u.Id = o.UsuarioId
        WHERE o.Id = @id
      `)
    const orden = result.recordset[0]
    if (!orden) return

    const datos = { destino: orden.Email, nombre: orden.Nombre, ordenId }

    if (nuevoEstado === 'Pagado') {
      await enviarPagoAprobado({ ...datos, total: orden.Total })
    } else if (nuevoEstado === 'Enviado') {
      await enviarPedidoEnviado({ ...datos, numeroSeguimiento: orden.NumeroSeguimiento })
    } else if (nuevoEstado === 'Cancelado') {
      await enviarPedidoCancelado(datos)
    }
  } catch (err) {
    console.error(`No se pudo avisar al cliente el cambio de estado de la orden ${ordenId}:`, err.message)
  }
}

// Cambia el estado de una orden manteniendo el stock consistente:
// al cancelar se devuelve el stock, y al "des-cancelar" se vuelve a descontar.
// StockDescontado evita devolver stock de órdenes viejas que nunca lo descontaron.
// Si el estado cambió, avisa al cliente por mail (salvo opciones.notificar === false).
// Devuelve false si la orden no existe.
async function cambiarEstadoOrden(ordenId, nuevoEstado, campos = {}, opciones = {}) {
  const pool = await poolPromise
  const transaction = new sql.Transaction(pool)
  await transaction.begin()

  let aviso = null

  try {
    const actual = await new sql.Request(transaction)
      .input('id', sql.Int, ordenId)
      .query('SELECT Estado, StockDescontado, NumeroSeguimiento, CuponId FROM Ordenes WITH (UPDLOCK, ROWLOCK) WHERE Id = @id')

    if (actual.recordset.length === 0) {
      await rollbackSeguro(transaction)
      return false
    }

    const {
      Estado: estadoAnterior, StockDescontado: stockDescontado, NumeroSeguimiento: seguimientoAnterior, CuponId: cuponId
    } = actual.recordset[0]

    // Se avisa cuando cambia el estado, o cuando un pedido ya Enviado recibe su número de seguimiento
    const seCargoSeguimiento = nuevoEstado === 'Enviado' && !seguimientoAnterior && !!campos.numeroSeguimiento
    if (opciones.notificar !== false && (estadoAnterior !== nuevoEstado || seCargoSeguimiento)) {
      aviso = nuevoEstado
    }
    let nuevoStockDescontado = stockDescontado

    // El uso del cupón acompaña al stock: se libera al cancelar y se vuelve a tomar al reactivar
    if (nuevoEstado === 'Cancelado' && stockDescontado) {
      await devolverStock(transaction, ordenId)
      await moverUsoCupon(transaction, cuponId, -1)
      nuevoStockDescontado = false
    } else if (estadoAnterior === 'Cancelado' && nuevoEstado !== 'Cancelado' && !stockDescontado) {
      const detalles = await new sql.Request(transaction)
        .input('ordenId', sql.Int, ordenId)
        .query(`
          SELECT od.ProductoId AS productoId, od.Cantidad AS cantidad, p.Nombre AS nombre
          FROM OrdenDetalles od
          JOIN Productos p ON p.Id = od.ProductoId
          WHERE od.OrdenId = @ordenId
        `)
      await descontarStock(transaction, detalles.recordset)
      await moverUsoCupon(transaction, cuponId, 1)
      nuevoStockDescontado = true
    }

    const request = new sql.Request(transaction)
      .input('id', sql.Int, ordenId)
      .input('estado', sql.NVarChar, nuevoEstado)
      .input('stockDescontado', sql.Bit, nuevoStockDescontado)
    let set = 'Estado = @estado, StockDescontado = @stockDescontado'

    if ('numeroSeguimiento' in campos) {
      request.input('seguimiento', sql.NVarChar, campos.numeroSeguimiento || null)
      set += ', NumeroSeguimiento = @seguimiento'
    }
    if ('paymentId' in campos) {
      request.input('paymentId', sql.NVarChar, campos.paymentId)
      set += ', MercadoPagoPaymentId = @paymentId'
    }

    await request.query(`UPDATE Ordenes SET ${set} WHERE Id = @id`)
    await transaction.commit()
  } catch (err) {
    await rollbackSeguro(transaction)
    throw err
  }

  // Después del commit, para no avisar de un cambio que terminó deshaciéndose
  if (aviso) {
    await notificarCambioEstado(ordenId, aviso)
  }
  return true
}

// Crear orden (checkout)
router.post('/checkout', verificarTokenOpcional, async (req, res) => {
  const { items, tipoEntrega, direccion, invitado, metodoPago, aceptaTerminos, codigoCupon } = req.body

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'El carrito está vacío' })
  }

  if (aceptaTerminos !== true) {
    return res.status(400).json({ error: 'Tenés que aceptar los términos y condiciones para comprar' })
  }

  if (items.length > MAX_RENGLONES_CARRITO) {
    return res.status(400).json({ error: 'El carrito tiene demasiados productos' })
  }

  if (!['Retiro', 'Envio'].includes(tipoEntrega)) {
    return res.status(400).json({ error: 'Elegí una forma de entrega' })
  }

  if (!['mercadopago', 'transferencia'].includes(metodoPago)) {
    return res.status(400).json({ error: 'Elegí un medio de pago' })
  }

  if (tipoEntrega === 'Envio' && (!direccion || !direccion.calle || !direccion.numero || !direccion.localidad || !direccion.provincia || !direccion.codigoPostal)) {
    return res.status(400).json({ error: 'Completá la dirección de envío' })
  }

  // Las cantidades vienen del navegador: tienen que ser enteros positivos.
  // Además se agrupan por producto, para que repetir un renglón no saltee el control de stock
  const cantidadesPorProducto = new Map()

  for (const item of items) {
    const productoId = Number(item?.productoId)
    const cantidad = Number(item?.cantidad)

    if (!Number.isInteger(productoId) || productoId <= 0 || !Number.isInteger(cantidad) || cantidad < 1) {
      return res.status(400).json({ error: 'Hay un producto con una cantidad inválida en el carrito' })
    }

    cantidadesPorProducto.set(productoId, (cantidadesPorProducto.get(productoId) || 0) + cantidad)
  }

  for (const cantidad of cantidadesPorProducto.values()) {
    if (cantidad > MAX_CANTIDAD_POR_PRODUCTO) {
      return res.status(400).json({ error: `Podés comprar hasta ${MAX_CANTIDAD_POR_PRODUCTO} unidades de cada producto` })
    }
  }

  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const regexTelefono = /^[0-9+\-\s()]{8,20}$/

  if (!req.usuario) {
    if (!invitado || !invitado.nombre || !invitado.email || !invitado.telefono) {
      return res.status(400).json({ error: 'Faltan tus datos para completar la compra como invitado' })
    }
    if (!regexEmail.test(invitado.email)) {
      return res.status(400).json({ error: 'El email no tiene un formato válido' })
    }
    if (!regexTelefono.test(invitado.telefono)) {
      return res.status(400).json({ error: 'El teléfono no tiene un formato válido' })
    }
  }

  try {
    const pool = await poolPromise

    let subtotal = 0
    const detallesValidados = []

    // Primera validación (sin bloquear): da un error claro antes de crear nada.
    // El control definitivo de stock se hace al descontarlo dentro de la transacción
    for (const [productoId, cantidad] of cantidadesPorProducto) {
      const productoResult = await pool.request()
        .input('id', sql.Int, productoId)
        .query('SELECT Id, Nombre, Precio, PrecioOferta, OfertaHasta, Stock FROM Productos WHERE Id = @id AND Activo = 1')

      const producto = productoResult.recordset[0]

      if (!producto) {
        return res.status(400).json({ error: `Producto ${productoId} no encontrado` })
      }

      if (producto.Stock < cantidad) {
        return res.status(400).json({ error: `Sin stock suficiente de ${producto.Nombre}` })
      }

      // Se cobra el precio vigente (el de oferta, si hay una activa), calculado acá y no en el navegador
      const precioUnitario = precioVigente(producto)
      subtotal += precioUnitario * cantidad

      detallesValidados.push({
        productoId: producto.Id,
        nombre: producto.Nombre,
        cantidad,
        precioUnitario,
        precioLista: Number(producto.Precio)
      })
    }
    subtotal = redondear(subtotal)

    const configResult = await pool.request().query(`
      SELECT Clave, Valor FROM Configuracion
      WHERE Clave IN ('correo_customer_id', 'correo_cp_origen', 'paquete_peso_gramos', 'paquete_alto_cm', 'paquete_ancho_cm',
                      'paquete_largo_cm', 'envio_gratis_desde', 'descuento_transferencia_pct')
    `)
    const config = {}
    configResult.recordset.forEach(row => { config[row.Clave] = row.Valor })

    // Cupón: se vuelve a validar acá (lo que mostró el checkout es solo una vista previa)
    let cupon = null
    let descuentoCupon = 0
    if (codigoCupon && normalizarCodigo(codigoCupon)) {
      cupon = await buscarCupon(pool, codigoCupon)
      const resultado = evaluarCupon(cupon, subtotal)
      if (!resultado.ok) {
        return res.status(400).json({ error: resultado.error, codigo: 'CUPON_INVALIDO' })
      }
      descuentoCupon = resultado.descuento
    }

    const baseProductos = redondear(subtotal - descuentoCupon)

    let costoEnvio = null
    const envioGratisDesde = Number(config.envio_gratis_desde) || 0

    if (tipoEntrega === 'Envio' && envioGratisDesde > 0 && baseProductos >= envioGratisDesde) {
      costoEnvio = 0
    } else if (tipoEntrega === 'Envio') {
      // El costo de envío SIEMPRE se calcula acá en el servidor, nunca se confía
      // en un valor que venga del navegador (evita que alguien lo manipule)
      try {
        costoEnvio = await cotizarEnvio({
          customerId: config.correo_customer_id,
          postalCodeOrigin: config.correo_cp_origen,
          postalCodeDestination: direccion.codigoPostal,
          dimensions: {
            weight: parseInt(config.paquete_peso_gramos),
            height: parseInt(config.paquete_alto_cm),
            width: parseInt(config.paquete_ancho_cm),
            length: parseInt(config.paquete_largo_cm)
          }
        })
      } catch (envioErr) {
        console.error('No se pudo cotizar el envío en el checkout:', envioErr)
        return res.status(400).json({ error: 'No pudimos calcular el costo de envío a ese código postal' })
      }
    }

    // Descuento por pagar con transferencia: sobre los productos, no sobre el envío
    const pctTransferencia = Math.min(Math.max(Number(config.descuento_transferencia_pct) || 0, 0), 50)
    const descuentoTransferencia = metodoPago === 'transferencia' && pctTransferencia > 0
      ? redondear(baseProductos * pctTransferencia / 100)
      : 0

    const total = redondear(baseProductos - descuentoTransferencia + (costoEnvio || 0))

    let usuarioId

    if (req.usuario) {
      usuarioId = req.usuario.id
    } else {
      // Compra como invitado. Si el email ya tiene cuenta, NO se le carga el pedido: cualquiera
      // podría meter pedidos y direcciones en la cuenta de otra persona sabiendo su email.
      // Se pide iniciar sesión (o recuperar la contraseña, si la cuenta se creó en una compra anterior)
      const existente = await pool.request()
        .input('email', sql.NVarChar, invitado.email)
        .query('SELECT Id FROM Usuarios WHERE Email = @email')

      if (existente.recordset.length > 0) {
        return res.status(409).json({
          error: 'Ese email ya tiene una cuenta. Iniciá sesión para completar la compra.',
          codigo: 'EMAIL_REGISTRADO'
        })
      } else {
        const passwordAleatoria = await bcrypt.hash(crypto.randomBytes(20).toString('hex'), 10)

        const nuevoUsuario = await pool.request()
          .input('nombre', sql.NVarChar, invitado.nombre)
          .input('email', sql.NVarChar, invitado.email)
          .input('telefono', sql.NVarChar, invitado.telefono || null)
          .input('passwordHash', sql.NVarChar, passwordAleatoria)
          .query(`
            INSERT INTO Usuarios (Nombre, Email, Telefono, PasswordHash)
            OUTPUT INSERTED.Id
            VALUES (@nombre, @email, @telefono, @passwordHash)
          `)

        usuarioId = nuevoUsuario.recordset[0].Id
      }
    }

    // Dirección, stock, orden y detalles van juntos: o se guarda todo, o nada
    let ordenId
    const transaction = new sql.Transaction(pool)
    await transaction.begin()

    try {
      let direccionId = null

      if (tipoEntrega === 'Envio') {
        const dirResult = await new sql.Request(transaction)
          .input('usuarioId', sql.Int, usuarioId)
          .input('calle', sql.NVarChar, direccion.calle)
          .input('numero', sql.NVarChar, direccion.numero)
          .input('localidad', sql.NVarChar, direccion.localidad)
          .input('provincia', sql.NVarChar, direccion.provincia)
          .input('cp', sql.NVarChar, direccion.codigoPostal)
          .query(`
            INSERT INTO Direcciones (UsuarioId, Calle, Numero, Localidad, Provincia, CodigoPostal)
            OUTPUT INSERTED.Id
            VALUES (@usuarioId, @calle, @numero, @localidad, @provincia, @cp)
          `)
        direccionId = dirResult.recordset[0].Id
      }

      await descontarStock(transaction, detallesValidados)
      await moverUsoCupon(transaction, cupon?.Id, 1, true)

      const ordenResult = await new sql.Request(transaction)
        .input('usuarioId', sql.Int, usuarioId)
        .input('total', sql.Decimal(10, 2), total)
        .input('subtotal', sql.Decimal(10, 2), subtotal)
        .input('costoEnvio', sql.Decimal(10, 2), costoEnvio)
        .input('tipoEntrega', sql.NVarChar, tipoEntrega)
        .input('direccionId', sql.Int, direccionId)
        .input('cuponId', sql.Int, cupon?.Id || null)
        .input('cuponCodigo', sql.NVarChar, cupon?.Codigo || null)
        .input('descuentoCupon', sql.Decimal(10, 2), descuentoCupon || null)
        .input('descuentoTransferencia', sql.Decimal(10, 2), descuentoTransferencia || null)
        .query(`
          INSERT INTO Ordenes (UsuarioId, Total, Subtotal, CostoEnvio, TipoEntrega, DireccionId, Estado, StockDescontado,
                               CuponId, CuponCodigo, DescuentoCupon, DescuentoTransferencia)
          OUTPUT INSERTED.Id
          VALUES (@usuarioId, @total, @subtotal, @costoEnvio, @tipoEntrega, @direccionId, 'Pendiente', 1,
                  @cuponId, @cuponCodigo, @descuentoCupon, @descuentoTransferencia)
        `)

      ordenId = ordenResult.recordset[0].Id

      for (const detalle of detallesValidados) {
        await new sql.Request(transaction)
          .input('ordenId', sql.Int, ordenId)
          .input('productoId', sql.Int, detalle.productoId)
          .input('cantidad', sql.Int, detalle.cantidad)
          .input('precioUnitario', sql.Decimal(10, 2), detalle.precioUnitario)
          .query(`
            INSERT INTO OrdenDetalles (OrdenId, ProductoId, Cantidad, PrecioUnitario)
            VALUES (@ordenId, @productoId, @cantidad, @precioUnitario)
          `)
      }

      await transaction.commit()
    } catch (err) {
      await rollbackSeguro(transaction)
      if (err instanceof ErrorStock) {
        return res.status(409).json({ error: err.message })
      }
      if (err instanceof ErrorCupon) {
        return res.status(409).json({ error: err.message, codigo: 'CUPON_INVALIDO' })
      }
      throw err
    }

    let initPoint = null

    // Transferencia: no pasa por Mercado Pago, la orden queda pendiente
    // hasta que el admin confirme el comprobante a mano
    if (metodoPago === 'mercadopago') {
      try {
        // Un solo ítem con el total del pedido: así el cobro incluye el envío y los descuentos
        // (Mercado Pago no acepta ítems con precio negativo para restar un cupón)
        const itemsMP = [{
          id: String(ordenId),
          title: `Pedido #${ordenId} - Creaciones Alma`,
          description: detallesValidados.map(d => `${d.nombre} x${d.cantidad}`).join(', ').slice(0, 250),
          quantity: 1,
          unit_price: total,
          currency_id: 'ARS'
        }]

        const urlRetorno = `${FRONTEND_URL}/orden-confirmada/${ordenId}`
        const preference = new Preference(client)

        const resultado = await preference.create({
          body: {
            items: itemsMP,
            external_reference: ordenId.toString(),
            back_urls: {
              success: urlRetorno,
              failure: urlRetorno,
              pending: urlRetorno
            },
            ...(BACKEND_URL && { notification_url: `${BACKEND_URL}/api/ordenes/webhook-mercadopago` })
          }
        })

        await pool.request()
          .input('ordenId', sql.Int, ordenId)
          .input('preferenceId', sql.NVarChar, resultado.id)
          .query('UPDATE Ordenes SET MercadoPagoPreferenceId = @preferenceId WHERE Id = @ordenId')

        initPoint = resultado.init_point
      } catch (mpErr) {
        // Si no se pudo armar el pago, la orden no sirve: se cancela y se devuelve el stock
        console.error(`No se pudo crear la preferencia de Mercado Pago para la orden ${ordenId}:`, mpErr)
        // Sin mail de "cancelado": el cliente ya ve el error en pantalla
        await cambiarEstadoOrden(ordenId, 'Cancelado', {}, { notificar: false })
        return res.status(502).json({ error: 'No pudimos iniciar el pago con Mercado Pago. Probá de nuevo en unos minutos.' })
      }
    }

    // Mails de confirmación al cliente y de aviso al admin (si fallan, no rompen el checkout)
    try {
      const compradorResult = await pool.request()
        .input('id', sql.Int, usuarioId)
        .query('SELECT Nombre, Email, Telefono FROM Usuarios WHERE Id = @id')
      const comprador = compradorResult.recordset[0]

      const configMailsResult = await pool.request().query(`
        SELECT Clave, Valor FROM Configuracion
        WHERE Clave IN ('admin_email', 'transferencia_alias', 'transferencia_titular')
      `)
      const configMails = {}
      configMailsResult.recordset.forEach(row => { configMails[row.Clave] = row.Valor })

      const resultados = await Promise.allSettled([
        enviarConfirmacionPedido({
          destino: comprador.Email,
          nombre: comprador.Nombre,
          ordenId,
          items: detallesValidados,
          total,
          costoEnvio,
          descuentoCupon,
          cuponCodigo: cupon?.Codigo,
          descuentoTransferencia,
          tipoEntrega,
          metodoPago,
          transferencia: { alias: configMails.transferencia_alias, titular: configMails.transferencia_titular }
        }),
        configMails.admin_email && enviarNotificacionPedido({
          ordenId,
          comprador,
          tipoEntrega,
          items: detallesValidados,
          total,
          metodoPago,
          adminEmail: configMails.admin_email
        })
      ])

      resultados
        .filter(r => r.status === 'rejected')
        .forEach(r => console.error(`No se pudo enviar un mail del pedido ${ordenId}:`, r.reason.message))
    } catch (mailErr) {
      console.error(`No se pudieron preparar los mails del pedido ${ordenId}:`, mailErr.message)
    }

    if (metodoPago === 'transferencia') {
      return res.json({ ordenId, total })
    }

    res.json({ ordenId, total, initPoint })
  } catch (err) {
    manejarError(res, err, 'No pudimos procesar tu pedido. Probá de nuevo en unos minutos.')
  }
})

// Webhook de confirmación de pago
router.post('/webhook-mercadopago', async (req, res) => {
  try {
    const paymentClient = new Payment(client)
    const paymentId = req.query['data.id'] || req.body?.data?.id

    if (!paymentId) {
      return res.sendStatus(200)
    }

    // El estado se consulta directo a la API de Mercado Pago: no se confía en el body del aviso
    const payment = await paymentClient.get({ id: paymentId })
    const ordenId = parseInt(payment.external_reference)

    if (!Number.isInteger(ordenId)) {
      return res.sendStatus(200)
    }

    // Solo los estados definitivos cambian la orden; los intermedios (in_process, pending...)
    // no la tocan, así un aviso tardío no puede "bajar" una orden que ya estaba Pagada
    let nuevoEstado = null
    if (payment.status === 'approved') nuevoEstado = 'Pagado'
    else if (payment.status === 'rejected' || payment.status === 'cancelled') nuevoEstado = 'Cancelado'

    if (nuevoEstado) {
      try {
        await cambiarEstadoOrden(ordenId, nuevoEstado, { paymentId: payment.id.toString() })
      } catch (err) {
        if (err instanceof ErrorStock) {
          // Pago aprobado de una orden que ya estaba cancelada y cuyo stock se vendió: hay que resolverlo a mano
          console.error(`⚠️ Pago ${payment.id} aprobado para la orden cancelada ${ordenId}, pero ya no hay stock: ${err.message}`)
        } else {
          throw err
        }
      }
    }

    res.sendStatus(200)
  } catch (err) {
    console.error('Error en webhook:', err)
    res.sendStatus(200)
  }
})

// Traer las órdenes del usuario logueado
router.get('/mis-ordenes', verificarToken, async (req, res) => {
  try {
    const pool = await poolPromise
    const result = await pool.request()
      .input('usuarioId', sql.Int, req.usuario.id)
      .query('SELECT * FROM Ordenes WHERE UsuarioId = @usuarioId ORDER BY FechaCreacion DESC')

    res.json(result.recordset)
  } catch (err) {
    manejarError(res, err)
  }
})

// --- RUTAS DE ADMIN (tienen que ir ANTES de /:id) ---

// Traer TODAS las órdenes (solo admin)
router.get('/admin/todas', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const pool = await poolPromise
    const result = await pool.request().query(`
      SELECT o.*, u.Nombre AS UsuarioNombre, u.Email AS UsuarioEmail
      FROM Ordenes o
      JOIN Usuarios u ON u.Id = o.UsuarioId
      ORDER BY o.FechaCreacion DESC
    `)
    res.json(result.recordset)
  } catch (err) {
    manejarError(res, err)
  }
})

// Actualizar estado y/o tracking de una orden (solo admin)
router.put('/admin/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { estado, numeroSeguimiento } = req.body

    if (!ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' })
    }

    const existe = await cambiarEstadoOrden(req.params.id, estado, { numeroSeguimiento })

    if (!existe) {
      return res.status(404).json({ error: 'Orden no encontrada' })
    }

    res.json({ ok: true })
  } catch (err) {
    if (err instanceof ErrorStock) {
      return res.status(409).json({ error: `No se puede reactivar el pedido: ${err.message}` })
    }
    manejarError(res, err)
  }
})

// Detalle completo de una orden (usuario dueño o admin) — va AL FINAL porque es la ruta más "genérica"
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const pool = await poolPromise
    const ordenId = req.params.id

    const ordenResult = await pool.request()
      .input('id', sql.Int, ordenId)
      .query(`
        SELECT o.*, u.Nombre AS CompradorNombre, u.Email AS CompradorEmail, u.Telefono AS CompradorTelefono
        FROM Ordenes o
        JOIN Usuarios u ON u.Id = o.UsuarioId
        WHERE o.Id = @id
      `)

    const orden = ordenResult.recordset[0]

    if (!orden) {
      return res.status(404).json({ error: 'Orden no encontrada' })
    }

    if (orden.UsuarioId !== req.usuario.id && req.usuario.rol !== 'Admin') {
      return res.status(403).json({ error: 'No tenés permiso para ver esta orden' })
    }

    const detallesResult = await pool.request()
      .input('ordenId', sql.Int, ordenId)
      .query(`
        SELECT od.*, p.Nombre AS ProductoNombre, p.ImagenPrincipalUrl
        FROM OrdenDetalles od
        JOIN Productos p ON p.Id = od.ProductoId
        WHERE od.OrdenId = @ordenId
      `)

    let direccion = null
    if (orden.DireccionId) {
      const dirResult = await pool.request()
        .input('id', sql.Int, orden.DireccionId)
        .query('SELECT * FROM Direcciones WHERE Id = @id')
      direccion = dirResult.recordset[0]
    }

    res.json({
      orden,
      detalles: detallesResult.recordset,
      direccion
    })
  } catch (err) {
    manejarError(res, err)
  }
})

module.exports = router
