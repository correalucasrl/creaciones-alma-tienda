const express = require('express')
const router = express.Router()
const { sql, poolPromise } = require('../db')
const { manejarError } = require('../utils/errores')
const { verificarToken, verificarAdmin } = require('../middleware/authMiddleware')

// Público: testimonios activos, con nombre del usuario
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise
    const result = await pool.request().query(`
      SELECT t.Id, t.Comentario, t.Calificacion, t.FechaCreacion, u.Nombre
      FROM Testimonios t
      JOIN Usuarios u ON u.Id = t.UsuarioId
      WHERE t.Activo = 1
      ORDER BY t.FechaCreacion DESC
    `)
    res.json(result.recordset)
  } catch (err) {
    manejarError(res, err)
  }
})

// Usuario logueado: traer MI propio testimonio (si ya dejó uno)
router.get('/mio', verificarToken, async (req, res) => {
  try {
    const pool = await poolPromise
    const result = await pool.request()
      .input('usuarioId', sql.Int, req.usuario.id)
      .query('SELECT * FROM Testimonios WHERE UsuarioId = @usuarioId')

    res.json(result.recordset[0] || null)
  } catch (err) {
    manejarError(res, err)
  }
})

// Usuario logueado: crear o actualizar SU testimonio (uno por usuario)
router.post('/', verificarToken, async (req, res) => {
  try {
    const { comentario, calificacion } = req.body

    if (!comentario || comentario.trim().length < 5) {
      return res.status(400).json({ error: 'Escribí un comentario un poco más largo' })
    }

    const pool = await poolPromise

    const usuarioCheck = await pool.request()
      .input('usuarioId', sql.Int, req.usuario.id)
      .query('SELECT PuedeComentar FROM Usuarios WHERE Id = @usuarioId')

    if (!usuarioCheck.recordset[0]?.PuedeComentar) {
      return res.status(403).json({ error: 'No podés dejar comentarios en este momento' })
    }
    await pool.request()
      .input('usuarioId', sql.Int, req.usuario.id)
      .input('comentario', sql.NVarChar, comentario.trim())
      .input('calificacion', sql.Int, calificacion || 5)
      .query(`
        IF EXISTS (SELECT 1 FROM Testimonios WHERE UsuarioId = @usuarioId)
          UPDATE Testimonios
          SET Comentario = @comentario, Calificacion = @calificacion, Activo = 1
          WHERE UsuarioId = @usuarioId
        ELSE
          INSERT INTO Testimonios (UsuarioId, Comentario, Calificacion)
          VALUES (@usuarioId, @comentario, @calificacion)
      `)

    res.json({ ok: true })
  } catch (err) {
    manejarError(res, err)
  }
})

// Admin: traer TODOS los testimonios (activos e inactivos) con datos del usuario
router.get('/admin/todos', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const pool = await poolPromise
    const result = await pool.request().query(`
      SELECT t.*, u.Nombre, u.Email
      FROM Testimonios t
      JOIN Usuarios u ON u.Id = t.UsuarioId
      ORDER BY t.FechaCreacion DESC
    `)
    res.json(result.recordset)
  } catch (err) {
    manejarError(res, err)
  }
})

// Admin: modificar cualquier testimonio
router.put('/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { comentario, calificacion, activo } = req.body
    const pool = await poolPromise

    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('comentario', sql.NVarChar, comentario)
      .input('calificacion', sql.Int, calificacion)
      .input('activo', sql.Bit, activo)
      .query(`
        UPDATE Testimonios
        SET Comentario = @comentario, Calificacion = @calificacion, Activo = @activo
        WHERE Id = @id
      `)

    res.json({ ok: true })
  } catch (err) {
    manejarError(res, err)
  }
})

// Admin: eliminar (soft delete)
router.delete('/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const pool = await poolPromise
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('UPDATE Testimonios SET Activo = 0 WHERE Id = @id')

    res.json({ ok: true })
  } catch (err) {
    manejarError(res, err)
  }
})

module.exports = router