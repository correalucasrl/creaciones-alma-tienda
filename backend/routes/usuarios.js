const express = require('express')
const router = express.Router()
const { sql, poolPromise } = require('../db')
const { manejarError } = require('../utils/errores')
const { verificarToken, verificarAdmin } = require('../middleware/authMiddleware')

// Admin: listar todos los usuarios
router.get('/admin/todos', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const pool = await poolPromise
    const result = await pool.request().query(`
      SELECT Id, Nombre, Email, Telefono, Rol, Activo, PuedeComentar, FechaRegistro
      FROM Usuarios
      ORDER BY FechaRegistro DESC
    `)
    res.json(result.recordset)
  } catch (err) {
    manejarError(res, err)
  }
})

// Admin: bloquear / desbloquear cuenta completa
router.put('/admin/:id/activo', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { activo } = req.body

    if (Number(req.params.id) === req.usuario.id && !activo) {
      return res.status(400).json({ error: 'No podés bloquear tu propia cuenta' })
    }

    const pool = await poolPromise
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('activo', sql.Bit, activo)
      .query('UPDATE Usuarios SET Activo = @activo WHERE Id = @id')

    res.json({ ok: true })
  } catch (err) {
    manejarError(res, err)
  }
})

// Admin: permitir / bloquear que el usuario deje comentarios
router.put('/admin/:id/comentarios', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { puedeComentar } = req.body
    const pool = await poolPromise

    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('puedeComentar', sql.Bit, puedeComentar)
      .query('UPDATE Usuarios SET PuedeComentar = @puedeComentar WHERE Id = @id')

    res.json({ ok: true })
  } catch (err) {
    manejarError(res, err)
  }
})

// Admin: dar o quitar permisos de administrador (body: { admin: true | false })
router.put('/admin/:id/rol', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const admin = req.body.admin === true
    const id = Number(req.params.id)

    if (id === req.usuario.id && !admin) {
      return res.status(400).json({ error: 'No podés quitarte el rol de administrador a vos mismo' })
    }

    const pool = await poolPromise
    const actual = (await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT Rol, Activo FROM Usuarios WHERE Id = @id')).recordset[0]
    if (!actual) return res.status(404).json({ error: 'Usuario no encontrado' })

    // Nunca puede quedar el sitio sin ningún administrador activo
    if (!admin && actual.Rol === 'Admin') {
      const { cantidad } = (await pool.request()
        .query("SELECT COUNT(*) AS cantidad FROM Usuarios WHERE Rol = 'Admin' AND Activo = 1")).recordset[0]
      if (cantidad <= 1) return res.status(400).json({ error: 'Tiene que quedar al menos un administrador' })
    }

    await pool.request()
      .input('id', sql.Int, id)
      .input('rol', sql.NVarChar, admin ? 'Admin' : 'Cliente')
      .query('UPDATE Usuarios SET Rol = @rol WHERE Id = @id')

    res.json({ ok: true })
  } catch (err) {
    manejarError(res, err)
  }
})

module.exports = router