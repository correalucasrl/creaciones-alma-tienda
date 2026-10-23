const express = require('express')
const router = express.Router()
const { sql, poolPromise } = require('../db')
const { manejarError } = require('../utils/errores')
const { verificarToken, verificarAdmin } = require('../middleware/authMiddleware')

// Público: listar todas las categorías activas
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise
    const result = await pool.request()
      .query('SELECT * FROM Categorias WHERE Activo = 1 ORDER BY Nombre')
    res.json(result.recordset)
  } catch (err) {
    manejarError(res, err)
  }
})

// Admin: crear categoría
router.post('/', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { nombre, slug, iconoUrl } = req.body

    if (!nombre || !slug) {
      return res.status(400).json({ error: 'Nombre y slug son obligatorios' })
    }

    const pool = await poolPromise
    const result = await pool.request()
      .input('nombre', sql.NVarChar, nombre)
      .input('slug', sql.NVarChar, slug)
      .input('iconoUrl', sql.NVarChar, iconoUrl || null)
      .query(`
        INSERT INTO Categorias (Nombre, Slug, IconoUrl)
        OUTPUT INSERTED.*
        VALUES (@nombre, @slug, @iconoUrl)
      `)

    res.json(result.recordset[0])
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Ya existe una categoría con ese slug' })
    }
    manejarError(res, err)
  }
})

// Admin: editar categoría
router.put('/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { nombre, slug, iconoUrl, activo } = req.body
    const pool = await poolPromise

    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('nombre', sql.NVarChar, nombre)
      .input('slug', sql.NVarChar, slug)
      .input('iconoUrl', sql.NVarChar, iconoUrl || null)
      .input('activo', sql.Bit, activo)
      .query(`
        UPDATE Categorias
        SET Nombre = @nombre, Slug = @slug, IconoUrl = @iconoUrl, Activo = @activo
        WHERE Id = @id
      `)

    res.json({ ok: true })
  } catch (err) {
    manejarError(res, err)
  }
})

// Admin: eliminar categoría (soft delete)
router.delete('/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const pool = await poolPromise

    const productosResult = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT Id, Nombre, Precio FROM Productos WHERE CategoriaId = @id AND Activo = 1')

    if (productosResult.recordset.length > 0) {
      return res.status(400).json({
        error: `No se puede eliminar: hay ${productosResult.recordset.length} producto(s) usando esta categoría`,
        productos: productosResult.recordset
      })
    }

    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('UPDATE Categorias SET Activo = 0 WHERE Id = @id')

    res.json({ ok: true })
  } catch (err) {
    manejarError(res, err)
  }
})

// Admin: traer TODAS las categorías (activas e inactivas)
router.get('/admin/todas', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const pool = await poolPromise
    const result = await pool.request()
      .query('SELECT * FROM Categorias ORDER BY Nombre')
    res.json(result.recordset)
  } catch (err) {
    manejarError(res, err)
  }
})

// Admin: reactivar categoría
router.put('/admin/:id/reactivar', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const pool = await poolPromise
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('UPDATE Categorias SET Activo = 1 WHERE Id = @id')

    res.json({ ok: true })
  } catch (err) {
    manejarError(res, err)
  }
})

module.exports = router