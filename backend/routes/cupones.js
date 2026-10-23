const express = require('express')
const router = express.Router()
const { sql, poolPromise } = require('../db')
const { manejarError } = require('../utils/errores')
const { verificarToken, verificarAdmin } = require('../middleware/authMiddleware')
const { evaluarCupon } = require('../utils/precios')
const { inicioDiaArgentina, finDiaArgentina } = require('../utils/fechas')

const normalizarCodigo = codigo => String(codigo || '').trim().toUpperCase()

async function buscarCupon(pool, codigo) {
  const result = await pool.request()
    .input('codigo', sql.NVarChar, normalizarCodigo(codigo))
    .query('SELECT * FROM Cupones WHERE Codigo = @codigo')
  return result.recordset[0] || null
}

// Público: el checkout consulta si un cupón sirve para el subtotal actual y cuánto descuenta.
// Es solo una vista previa: el descuento real se vuelve a calcular en el servidor al confirmar
router.post('/validar', async (req, res) => {
  try {
    const { codigo, subtotal } = req.body
    if (!normalizarCodigo(codigo)) {
      return res.status(400).json({ error: 'Ingresá un código' })
    }

    const pool = await poolPromise
    const cupon = await buscarCupon(pool, codigo)
    const resultado = evaluarCupon(cupon, Number(subtotal) || 0)

    if (!resultado.ok) {
      return res.status(400).json({ error: resultado.error })
    }

    res.json({
      codigo: cupon.Codigo,
      descripcion: cupon.Descripcion,
      tipo: cupon.Tipo,
      valor: Number(cupon.Valor),
      descuento: resultado.descuento
    })
  } catch (err) {
    manejarError(res, err)
  }
})

// ---------- Admin ----------

// Valida y normaliza los datos de un cupón que manda el admin
function datosCupon(body) {
  const codigo = normalizarCodigo(body.codigo)
  if (!/^[A-Z0-9_-]{3,40}$/.test(codigo)) {
    throw new Error('El código tiene que tener entre 3 y 40 letras, números, guiones o guiones bajos')
  }
  if (!['porcentaje', 'monto'].includes(body.tipo)) throw new Error('Elegí si el descuento es un porcentaje o un monto fijo')

  const valor = Number(body.valor)
  if (!(valor > 0)) throw new Error('El valor del descuento tiene que ser mayor a cero')
  if (body.tipo === 'porcentaje' && valor > 100) throw new Error('El porcentaje no puede ser mayor a 100')

  const minimo = body.minimoCompra === '' || body.minimoCompra === null || body.minimoCompra === undefined ? null : Number(body.minimoCompra)
  if (minimo !== null && !(minimo >= 0)) throw new Error('El mínimo de compra no es válido')

  const usosMaximos = body.usosMaximos === '' || body.usosMaximos === null || body.usosMaximos === undefined ? null : Number(body.usosMaximos)
  if (usosMaximos !== null && !(Number.isInteger(usosMaximos) && usosMaximos > 0)) throw new Error('El límite de usos tiene que ser un número entero')

  const fecha = (v, fn) => {
    if (!v) return null
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new Error('Alguna fecha no es válida')
    return fn(v)
  }
  const fechaInicio = fecha(body.fechaInicio, inicioDiaArgentina)
  const fechaFin = fecha(body.fechaFin, finDiaArgentina)
  if (fechaInicio && fechaFin && fechaFin < fechaInicio) throw new Error('La fecha de fin es anterior a la de inicio')

  return {
    codigo,
    descripcion: body.descripcion ? String(body.descripcion).slice(0, 200) : null,
    tipo: body.tipo,
    valor,
    minimo,
    usosMaximos,
    fechaInicio,
    fechaFin,
    activo: body.activo !== false
  }
}

function cargarInputs(request, d) {
  return request
    .input('codigo', sql.NVarChar, d.codigo)
    .input('descripcion', sql.NVarChar, d.descripcion)
    .input('tipo', sql.NVarChar, d.tipo)
    .input('valor', sql.Decimal(10, 2), d.valor)
    .input('minimo', sql.Decimal(10, 2), d.minimo)
    .input('usosMaximos', sql.Int, d.usosMaximos)
    .input('fechaInicio', sql.DateTime, d.fechaInicio)
    .input('fechaFin', sql.DateTime, d.fechaFin)
    .input('activo', sql.Bit, d.activo)
}

const esCodigoDuplicado = err => /UQ_Cupones_Codigo|UNIQUE/i.test(err.message)

router.get('/admin/todos', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const pool = await poolPromise
    const result = await pool.request().query('SELECT * FROM Cupones ORDER BY FechaCreacion DESC')
    res.json(result.recordset)
  } catch (err) {
    manejarError(res, err)
  }
})

router.post('/admin', verificarToken, verificarAdmin, async (req, res) => {
  let datos
  try {
    datos = datosCupon(req.body)
  } catch (err) {
    return res.status(400).json({ error: err.message })
  }

  try {
    const pool = await poolPromise
    const result = await cargarInputs(pool.request(), datos).query(`
      INSERT INTO Cupones (Codigo, Descripcion, Tipo, Valor, MinimoCompra, UsosMaximos, FechaInicio, FechaFin, Activo)
      OUTPUT INSERTED.*
      VALUES (@codigo, @descripcion, @tipo, @valor, @minimo, @usosMaximos, @fechaInicio, @fechaFin, @activo)
    `)
    res.json(result.recordset[0])
  } catch (err) {
    if (esCodigoDuplicado(err)) return res.status(409).json({ error: 'Ya existe un cupón con ese código' })
    manejarError(res, err)
  }
})

router.put('/admin/:id', verificarToken, verificarAdmin, async (req, res) => {
  let datos
  try {
    datos = datosCupon(req.body)
  } catch (err) {
    return res.status(400).json({ error: err.message })
  }

  try {
    const pool = await poolPromise
    const result = await cargarInputs(pool.request(), datos)
      .input('id', sql.Int, req.params.id)
      .query(`
        UPDATE Cupones
        SET Codigo = @codigo, Descripcion = @descripcion, Tipo = @tipo, Valor = @valor, MinimoCompra = @minimo,
            UsosMaximos = @usosMaximos, FechaInicio = @fechaInicio, FechaFin = @fechaFin, Activo = @activo
        WHERE Id = @id
      `)
    if (result.rowsAffected[0] === 0) return res.status(404).json({ error: 'Cupón no encontrado' })
    res.json({ ok: true })
  } catch (err) {
    if (esCodigoDuplicado(err)) return res.status(409).json({ error: 'Ya existe un cupón con ese código' })
    manejarError(res, err)
  }
})

module.exports = { router, buscarCupon, normalizarCodigo }
