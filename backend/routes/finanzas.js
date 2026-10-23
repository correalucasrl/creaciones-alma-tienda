const express = require('express')
const router = express.Router()
const { sql, poolPromise } = require('../db')
const { manejarError } = require('../utils/errores')
const { verificarToken, verificarAdmin } = require('../middleware/authMiddleware')
const {
  partesArgentina, diaArgentina, lunesArgentina, inicioDiaArgentina, finDiaArgentina, sqlArgentina, SQL_AHORA_ARGENTINA
} = require('../utils/fechas')

router.use(verificarToken, verificarAdmin)

// Filtros "desde"/"hasta" del admin (AAAA-MM-DD): son días de Argentina, no de UTC
function rangoFechas(request, desde, hasta) {
  const valido = d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)
  request.input('desde', sql.DateTime2, valido(desde) ? inicioDiaArgentina(desde) : null)
  request.input('hasta', sql.DateTime2, valido(hasta) ? finDiaArgentina(hasta) : null)
}

// Celda de CSV segura. Si un texto empieza con = + - @ (o tab / salto de línea), Excel lo
// ejecuta como fórmula al abrir el archivo: un cliente llamado =HYPERLINK(...) podría
// meter un link malicioso. Se le antepone un apóstrofo para que quede como texto.
// Los números (cantidades, precios) no se tocan, así un importe negativo sigue siendo número.
function celdaCsv(valor) {
  let texto = String(valor ?? '')
  if (typeof valor === 'string' && /^[=+\-@\t\r]/.test(texto)) {
    texto = "'" + texto
  }
  return `"${texto.replace(/"/g, '""')}"`
}

// Tarjetas resumen (KPIs)
router.get('/resumen', async (req, res) => {
  try {
    const pool = await poolPromise

    const pagados = await pool.request().query(`
      SELECT SUM(Total) AS totalFacturado, SUM(ISNULL(CostoEnvio, 0)) AS costoEnvioAcumulado
      FROM Ordenes WHERE Estado = 'Pagado'
    `)
    const pendientes = await pool.request().query(`
      SELECT SUM(Total) AS totalPendiente FROM Ordenes WHERE Estado = 'Pendiente'
    `)
    const cancelados = await pool.request().query(`
      SELECT SUM(Total) AS totalCancelado FROM Ordenes WHERE Estado = 'Cancelado'
    `)

    const totalFacturado = pagados.recordset[0].totalFacturado || 0
    const costoEnvioAcumulado = pagados.recordset[0].costoEnvioAcumulado || 0

    res.json({
      totalFacturado,
      totalPendiente: pendientes.recordset[0].totalPendiente || 0,
      totalCancelado: cancelados.recordset[0].totalCancelado || 0,
      costoEnvioAcumulado,
      ingresoNeto: totalFacturado - costoEnvioAcumulado
    })
  } catch (err) {
    manejarError(res, err)
  }
})

// Detalle de ventas (producto por producto), con filtro opcional de fechas
router.get('/detalle-ventas', async (req, res) => {
  try {
    const { desde, hasta } = req.query
    const pool = await poolPromise

    const request = pool.request()
    rangoFechas(request, desde, hasta)

    const result = await request.query(`
      SELECT
        o.Id AS ordenId,
        o.FechaCreacion AS fecha,
        u.Nombre AS cliente,
        u.Email AS email,
        p.Nombre AS producto,
        od.Cantidad AS cantidad,
        od.PrecioUnitario AS precioUnitario,
        (od.Cantidad * od.PrecioUnitario) AS subtotal,
        o.Estado AS estado
      FROM OrdenDetalles od
      JOIN Ordenes o ON o.Id = od.OrdenId
      JOIN Usuarios u ON u.Id = o.UsuarioId
      JOIN Productos p ON p.Id = od.ProductoId
      WHERE (@desde IS NULL OR o.FechaCreacion >= @desde)
        AND (@hasta IS NULL OR o.FechaCreacion <= @hasta)
      ORDER BY o.FechaCreacion DESC
    `)

    res.json(result.recordset)
  } catch (err) {
    manejarError(res, err)
  }
})

// Mismo detalle, pero como CSV para descargar
router.get('/detalle-ventas/exportar', async (req, res) => {
  try {
    const { desde, hasta } = req.query
    const pool = await poolPromise

    const request = pool.request()
    rangoFechas(request, desde, hasta)

    const result = await request.query(`
      SELECT
        o.Id AS ordenId, o.FechaCreacion AS fecha, u.Nombre AS cliente, u.Email AS email,
        p.Nombre AS producto, od.Cantidad AS cantidad, od.PrecioUnitario AS precioUnitario,
        (od.Cantidad * od.PrecioUnitario) AS subtotal, o.Estado AS estado
      FROM OrdenDetalles od
      JOIN Ordenes o ON o.Id = od.OrdenId
      JOIN Usuarios u ON u.Id = o.UsuarioId
      JOIN Productos p ON p.Id = od.ProductoId
      WHERE (@desde IS NULL OR o.FechaCreacion >= @desde)
        AND (@hasta IS NULL OR o.FechaCreacion <= @hasta)
      ORDER BY o.FechaCreacion DESC
    `)

    const encabezado = 'Orden,Fecha,Cliente,Email,Producto,Cantidad,PrecioUnitario,Subtotal,Estado'
    const filas = result.recordset.map(r =>
      [r.ordenId, new Date(r.fecha).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }), r.cliente, r.email, r.producto, r.cantidad, r.precioUnitario, r.subtotal, r.estado]
        .map(celdaCsv)
        .join(',')
    )
    const csv = [encabezado, ...filas].join('\n')

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="detalle-ventas.csv"')
    res.send('\uFEFF' + csv) // el \uFEFF hace que Excel abra bien los acentos
  } catch (err) {
    manejarError(res, err)
  }
})

// Top clientes por total gastado (pedidos Pagados)
router.get('/top-clientes', async (req, res) => {
  try {
    const pool = await poolPromise
    const result = await pool.request().query(`
      SELECT TOP 10 u.Nombre AS nombre, u.Email AS email,
        COUNT(DISTINCT o.Id) AS cantidadPedidos, SUM(o.Total) AS totalGastado
      FROM Ordenes o
      JOIN Usuarios u ON u.Id = o.UsuarioId
      WHERE o.Estado = 'Pagado'
      GROUP BY u.Nombre, u.Email
      ORDER BY totalGastado DESC
    `)
    res.json(result.recordset)
  } catch (err) {
    manejarError(res, err)
  }
})

// Meta mensual vs facturación del mes actual
router.get('/meta', async (req, res) => {
  try {
    const pool = await poolPromise

    const configResult = await pool.request().query(`
      SELECT Valor FROM Configuracion WHERE Clave = 'meta_mensual'
    `)
    const meta = parseFloat(configResult.recordset[0]?.Valor) || 0

    const facturadoResult = await pool.request().query(`
      SELECT SUM(Total) AS total FROM Ordenes
      WHERE Estado = 'Pagado'
        AND YEAR(${sqlArgentina('FechaCreacion')}) = YEAR(${SQL_AHORA_ARGENTINA})
        AND MONTH(${sqlArgentina('FechaCreacion')}) = MONTH(${SQL_AHORA_ARGENTINA})
    `)

    res.json({
      meta,
      facturadoMesActual: facturadoResult.recordset[0].total || 0
    })
  } catch (err) {
    manejarError(res, err)
  }
})

// Clave de bucket en hora argentina
function claveDePeriodoVentas(fechaStr, periodo) {
  if (periodo === 'diario') return diaArgentina(fechaStr)
  if (periodo === 'semanal') return lunesArgentina(fechaStr)
  const { anio, mes } = partesArgentina(fechaStr)
  if (periodo === 'anual') return `${anio}`
  return `${anio}-${String(mes).padStart(2, '0')}` // mensual
}

// Plata facturada por mes de un año dado, filtrable por estado
router.get('/ventas-por-mes', async (req, res) => {
  try {
    const anio = parseInt(req.query.anio) || partesArgentina().anio
    const estado = req.query.estado || 'Todos'
    const pool = await poolPromise

    const request = pool.request().input('anio', sql.Int, anio)
    let filtroEstado = ''
    if (estado !== 'Todos') {
      request.input('estado', sql.NVarChar, estado)
      filtroEstado = 'AND Estado = @estado'
    }

    const result = await request.query(`
      SELECT MONTH(${sqlArgentina('FechaCreacion')}) AS mes, SUM(Total) AS total
      FROM Ordenes
      WHERE YEAR(${sqlArgentina('FechaCreacion')}) = @anio ${filtroEstado}
      GROUP BY MONTH(${sqlArgentina('FechaCreacion')})
    `)

    const porMes = Array.from({ length: 12 }, (_, i) => {
      const encontrado = result.recordset.find(r => r.mes === i + 1)
      return encontrado ? encontrado.total : 0
    })

    res.json(porMes)
  } catch (err) {
    manejarError(res, err)
  }
})

// Cantidad de pedidos agrupados por período, filtrable por categoría o producto
router.get('/pedidos-por-periodo', async (req, res) => {
  try {
    const periodo = req.query.periodo || 'mensual'
    const categoriaId = req.query.categoriaId
    const productoId = req.query.productoId
    const pool = await poolPromise
    const request = pool.request()

    let query = `SELECT DISTINCT o.Id, o.FechaCreacion AS fecha FROM Ordenes o`

    if (productoId) {
      query += ` JOIN OrdenDetalles od ON od.OrdenId = o.Id WHERE od.ProductoId = @productoId`
      request.input('productoId', sql.Int, productoId)
    } else if (categoriaId) {
      query += ` JOIN OrdenDetalles od ON od.OrdenId = o.Id JOIN Productos p ON p.Id = od.ProductoId WHERE p.CategoriaId = @categoriaId`
      request.input('categoriaId', sql.Int, categoriaId)
    }

    const result = await request.query(query)

    const buckets = new Map()
    result.recordset.forEach(r => {
      const clave = claveDePeriodoVentas(r.fecha, periodo)
      buckets.set(clave, (buckets.get(clave) || 0) + 1)
    })

    const salida = Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([periodo, cantidad]) => ({ periodo, cantidad }))

    res.json(salida)
  } catch (err) {
    manejarError(res, err)
  }
})

module.exports = router