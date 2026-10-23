const express = require('express')
const router = express.Router()
const { sql, poolPromise } = require('../db')
const { manejarError } = require('../utils/errores')
const { verificarToken, verificarAdmin } = require('../middleware/authMiddleware')

function slugify(texto) {
  return String(texto || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

// Público: ocasiones activas, con cuántos productos activos tiene cada una
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise
    const result = await pool.request().query(`
      SELECT o.Id, o.Nombre, o.Slug, o.Descripcion, o.ImagenUrl, o.Icono, o.Orden,
             (SELECT COUNT(*) FROM ProductoOcasiones po JOIN Productos p ON p.Id = po.ProductoId
              WHERE po.OcasionId = o.Id AND p.Activo = 1) AS CantidadProductos
      FROM Ocasiones o
      WHERE o.Activo = 1
      ORDER BY o.Orden, o.Nombre
    `)
    res.json(result.recordset)
  } catch (err) {
    manejarError(res, err)
  }
})

// ---------- Admin ----------

function datosOcasion(body) {
  const nombre = String(body.nombre || '').trim()
  if (nombre.length < 2 || nombre.length > 80) throw new Error('El nombre tiene que tener entre 2 y 80 caracteres')

  const slug = slugify(body.slug || nombre)
  if (!slug) throw new Error('El nombre tiene que tener letras o números')

  const imagenUrl = body.imagenUrl ? String(body.imagenUrl) : null
  if (imagenUrl && (!/^https:\/\//.test(imagenUrl) || imagenUrl.length > 255)) throw new Error('La imagen no es válida')

  const icono = body.icono ? String(body.icono).trim() : null
  if (icono && !/^bi-[a-z0-9-]{1,36}$/.test(icono)) throw new Error('El ícono tiene que ser un nombre de Bootstrap Icons, por ejemplo bi-gift')

  return {
    nombre,
    slug,
    descripcion: body.descripcion ? String(body.descripcion).slice(0, 300) : null,
    imagenUrl,
    icono,
    orden: Number.isInteger(Number(body.orden)) ? Number(body.orden) : 0,
    activo: body.activo !== false
  }
}

function cargarInputs(request, d) {
  return request
    .input('nombre', sql.NVarChar, d.nombre)
    .input('slug', sql.NVarChar, d.slug)
    .input('descripcion', sql.NVarChar, d.descripcion)
    .input('imagenUrl', sql.NVarChar, d.imagenUrl)
    .input('icono', sql.NVarChar, d.icono)
    .input('orden', sql.Int, d.orden)
    .input('activo', sql.Bit, d.activo)
}

const esSlugDuplicado = err => /UQ_Ocasiones_Slug|UNIQUE/i.test(err.message)

router.get('/admin/todas', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const pool = await poolPromise
    const result = await pool.request().query(`
      SELECT o.*, (SELECT COUNT(*) FROM ProductoOcasiones po WHERE po.OcasionId = o.Id) AS CantidadProductos
      FROM Ocasiones o ORDER BY o.Orden, o.Nombre
    `)
    res.json(result.recordset)
  } catch (err) {
    manejarError(res, err)
  }
})

router.post('/admin', verificarToken, verificarAdmin, async (req, res) => {
  let datos
  try {
    datos = datosOcasion(req.body)
  } catch (err) {
    return res.status(400).json({ error: err.message })
  }
  try {
    const pool = await poolPromise
    const result = await cargarInputs(pool.request(), datos).query(`
      INSERT INTO Ocasiones (Nombre, Slug, Descripcion, ImagenUrl, Icono, Orden, Activo)
      OUTPUT INSERTED.*
      VALUES (@nombre, @slug, @descripcion, @imagenUrl, @icono, @orden, @activo)
    `)
    res.json(result.recordset[0])
  } catch (err) {
    if (esSlugDuplicado(err)) return res.status(409).json({ error: 'Ya existe una ocasión con ese nombre' })
    manejarError(res, err)
  }
})

router.put('/admin/:id', verificarToken, verificarAdmin, async (req, res) => {
  let datos
  try {
    datos = datosOcasion(req.body)
  } catch (err) {
    return res.status(400).json({ error: err.message })
  }
  try {
    const pool = await poolPromise
    const result = await cargarInputs(pool.request(), datos)
      .input('id', sql.Int, req.params.id)
      .query(`
        UPDATE Ocasiones SET Nombre = @nombre, Slug = @slug, Descripcion = @descripcion, ImagenUrl = @imagenUrl,
               Icono = @icono, Orden = @orden, Activo = @activo
        WHERE Id = @id
      `)
    if (result.rowsAffected[0] === 0) return res.status(404).json({ error: 'Ocasión no encontrada' })
    res.json({ ok: true })
  } catch (err) {
    if (esSlugDuplicado(err)) return res.status(409).json({ error: 'Ya existe una ocasión con ese nombre' })
    manejarError(res, err)
  }
})

module.exports = router
