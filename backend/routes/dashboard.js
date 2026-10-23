const express = require('express')
const router = express.Router()
const { sql, poolPromise } = require('../db')
const { manejarError } = require('../utils/errores')
const { verificarToken, verificarAdmin } = require('../middleware/authMiddleware')
const { partesArgentina, diaArgentina, lunesArgentina, sqlArgentina } = require('../utils/fechas')

router.use(verificarToken, verificarAdmin)

// Devuelve la "clave" de bucket (día/semana/quincena/mes) para una fecha dada, en hora argentina
function claveDePeriodo(fechaStr, periodo) {
  if (periodo === 'diario') {
    return diaArgentina(fechaStr)
  }
  if (periodo === 'semanal') {
    return lunesArgentina(fechaStr)
  }
  const { anio, mes, dia } = partesArgentina(fechaStr)
  if (periodo === 'quincenal') {
    const mitad = dia <= 15 ? '1ra quincena' : '2da quincena'
    return `${anio}-${String(mes).padStart(2, '0')} (${mitad})`
  }
  return `${anio}-${String(mes).padStart(2, '0')}` // mensual
}

// Suma un valor por bucket (sirve para facturación, o para "contar" pasando valor=1)
function sumarPorPeriodo(filas, periodo) {
  const buckets = new Map()
  filas.forEach(f => {
    const clave = claveDePeriodo(f.fecha, periodo)
    buckets.set(clave, (buckets.get(clave) || 0) + f.valor)
  })
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([periodo, valor]) => ({ periodo, valor }))
}

// Promedia un valor por bucket (para ticket promedio)
function promediarPorPeriodo(filas, periodo) {
  const buckets = new Map()
  filas.forEach(f => {
    const clave = claveDePeriodo(f.fecha, periodo)
    if (!buckets.has(clave)) buckets.set(clave, { suma: 0, cantidad: 0 })
    const b = buckets.get(clave)
    b.suma += f.valor
    b.cantidad += 1
  })
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([periodo, b]) => ({ periodo, valor: b.suma / b.cantidad }))
}

// Facturación agrupada por período (solo pedidos Pagados)
router.get('/facturacion', async (req, res) => {
  try {
    const periodo = req.query.periodo || 'mensual'
    const pool = await poolPromise
    const result = await pool.request().query(`
      SELECT FechaCreacion AS fecha, Total AS valor
      FROM Ordenes WHERE Estado = 'Pagado' ORDER BY FechaCreacion
    `)
    res.json(sumarPorPeriodo(result.recordset, periodo))
  } catch (err) {
    manejarError(res, err)
  }
})

// Cantidad de pedidos por estado
router.get('/estados', async (req, res) => {
  try {
    const pool = await poolPromise
    const result = await pool.request().query(`
      SELECT Estado, COUNT(*) AS cantidad FROM Ordenes GROUP BY Estado
    `)
    res.json(result.recordset)
  } catch (err) {
    manejarError(res, err)
  }
})

// Cantidad de pedidos por tipo de entrega
router.get('/entrega', async (req, res) => {
  try {
    const pool = await poolPromise
    const result = await pool.request().query(`
      SELECT TipoEntrega, COUNT(*) AS cantidad FROM Ordenes GROUP BY TipoEntrega
    `)
    res.json(result.recordset)
  } catch (err) {
    manejarError(res, err)
  }
})

// Top 10 productos más vendidos (por cantidad)
router.get('/productos-top', async (req, res) => {
  try {
    const pool = await poolPromise
    const result = await pool.request().query(`
      SELECT TOP 10 p.Nombre, SUM(od.Cantidad) AS cantidad
      FROM OrdenDetalles od
      JOIN Productos p ON p.Id = od.ProductoId
      JOIN Ordenes o ON o.Id = od.OrdenId
      WHERE o.Estado != 'Cancelado'
      GROUP BY p.Nombre
      ORDER BY cantidad DESC
    `)
    res.json(result.recordset)
  } catch (err) {
    manejarError(res, err)
  }
})

// Ventas por categoría (excluye pedidos cancelados)
router.get('/categorias', async (req, res) => {
  try {
    const pool = await poolPromise
    const result = await pool.request().query(`
      SELECT c.Nombre AS categoria, SUM(od.Cantidad * od.PrecioUnitario) AS total
      FROM OrdenDetalles od
      JOIN Productos p ON p.Id = od.ProductoId
      JOIN Categorias c ON c.Id = p.CategoriaId
      JOIN Ordenes o ON o.Id = od.OrdenId
      WHERE o.Estado != 'Cancelado'
      GROUP BY c.Nombre
      ORDER BY total DESC
    `)
    res.json(result.recordset)
  } catch (err) {
    manejarError(res, err)
  }
})

// Clientes nuevos registrados por período
// Clientes nuevos registrados por período (viejo, ya no lo usa el dashboard)
router.get('/clientes-nuevos', async (req, res) => {
  try {
    const periodo = req.query.periodo || 'mensual'
    const pool = await poolPromise
    const result = await pool.request().query(`
      SELECT FechaRegistro AS fecha, 1 AS valor FROM Usuarios
    `)
    res.json(sumarPorPeriodo(result.recordset, periodo))
  } catch (err) {
    manejarError(res, err)
  }
})

// Clientes nuevos por mes de un año dado (mismo patrón que /visitas)
router.get('/clientes-nuevos-anio', async (req, res) => {
  try {
    const anio = parseInt(req.query.anio) || partesArgentina().anio
    const pool = await poolPromise
    const result = await pool.request()
      .input('anio', sql.Int, anio)
      .query(`
        SELECT MONTH(${sqlArgentina('FechaRegistro')}) AS mes, COUNT(*) AS cantidad
        FROM Usuarios
        WHERE YEAR(${sqlArgentina('FechaRegistro')}) = @anio
        GROUP BY MONTH(${sqlArgentina('FechaRegistro')})
      `)

    const porMes = Array.from({ length: 12 }, (_, i) => {
      const encontrado = result.recordset.find(r => r.mes === i + 1)
      return encontrado ? encontrado.cantidad : 0
    })

    res.json(porMes)
  } catch (err) {
    manejarError(res, err)
  }
})

// Ticket promedio por período (pedidos Pagados)
router.get('/ticket-promedio', async (req, res) => {
  try {
    const periodo = req.query.periodo || 'mensual'
    const pool = await poolPromise
    const result = await pool.request().query(`
      SELECT FechaCreacion AS fecha, Total AS valor
      FROM Ordenes WHERE Estado = 'Pagado' ORDER BY FechaCreacion
    `)
    res.json(promediarPorPeriodo(result.recordset, periodo))
  } catch (err) {
    manejarError(res, err)
  }
})

// Métodos de pago elegidos (Mercado Pago vs Transferencia)
router.get('/metodos-pago', async (req, res) => {
  try {
    const pool = await poolPromise
    const result = await pool.request().query(`
      SELECT
        CASE WHEN MercadoPagoPreferenceId IS NOT NULL THEN 'Mercado Pago' ELSE 'Transferencia' END AS metodo,
        COUNT(*) AS cantidad
      FROM Ordenes
      GROUP BY CASE WHEN MercadoPagoPreferenceId IS NOT NULL THEN 'Mercado Pago' ELSE 'Transferencia' END
    `)
    res.json(result.recordset)
  } catch (err) {
    manejarError(res, err)
  }
})

// Productos con poco stock (alerta, no histórico)
router.get('/stock-bajo', async (req, res) => {
  try {
    const pool = await poolPromise
    const result = await pool.request().query(`
      SELECT Nombre, Stock FROM Productos
      WHERE Activo = 1 AND Stock <= 5
      ORDER BY Stock ASC
    `)
    res.json(result.recordset)
  } catch (err) {
    manejarError(res, err)
  }
})

// Distribución de calificaciones de testimonios + promedio
router.get('/calificaciones', async (req, res) => {
  try {
    const pool = await poolPromise
    const distribucion = await pool.request().query(`
      SELECT Calificacion, COUNT(*) AS cantidad
      FROM Testimonios WHERE Activo = 1
      GROUP BY Calificacion
    `)
    const promedioResult = await pool.request().query(`
      SELECT AVG(CAST(Calificacion AS FLOAT)) AS promedio
      FROM Testimonios WHERE Activo = 1
    `)
    res.json({
      distribucion: distribucion.recordset,
      promedio: promedioResult.recordset[0].promedio
    })
  } catch (err) {
    manejarError(res, err)
  }
})

// Visitas por mes de un año dado (para el gráfico)
router.get('/visitas', async (req, res) => {
  try {
    const anio = parseInt(req.query.anio) || partesArgentina().anio
    const pool = await poolPromise
    const result = await pool.request()
      .input('anio', sql.Int, anio)
      .query(`
        SELECT MONTH(${sqlArgentina('Fecha')}) AS mes, COUNT(*) AS cantidad
        FROM Visitas
        WHERE YEAR(${sqlArgentina('Fecha')}) = @anio
        GROUP BY MONTH(${sqlArgentina('Fecha')})
      `)

    // Devuelve los 12 meses siempre, con 0 en los que no hay visitas
    const porMes = Array.from({ length: 12 }, (_, i) => {
      const encontrado = result.recordset.find(r => r.mes === i + 1)
      return encontrado ? encontrado.cantidad : 0
    })

    res.json(porMes)
  } catch (err) {
    manejarError(res, err)
  }
})

// Top 10 productos MENOS vendidos (incluye los que nunca se vendieron)
router.get('/productos-menos-vendidos', async (req, res) => {
  try {
    const pool = await poolPromise
    const result = await pool.request().query(`
      SELECT TOP 10 p.Nombre,
        ISNULL(SUM(CASE WHEN o.Estado != 'Cancelado' THEN od.Cantidad END), 0) AS cantidad
      FROM Productos p
      LEFT JOIN OrdenDetalles od ON od.ProductoId = p.Id
      LEFT JOIN Ordenes o ON o.Id = od.OrdenId
      WHERE p.Activo = 1
      GROUP BY p.Nombre
      ORDER BY cantidad ASC
    `)
    res.json(result.recordset)
  } catch (err) {
    manejarError(res, err)
  }
})

module.exports = router