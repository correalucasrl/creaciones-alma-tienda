const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const { sql, poolPromise } = require('../db')
const { manejarError } = require('../utils/errores')
const { enviarEmailVerificacion, enviarEmailRecuperacion } = require('../utils/email')
const { verificarToken } = require('../middleware/authMiddleware')

// Registro
router.post('/registro', async (req, res) => {
  try {
    const { nombre, email, password, telefono, aceptaTerminos } = req.body

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' })
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'La contraseña tiene que tener al menos 8 caracteres' })
    }

    if (aceptaTerminos !== true) {
      return res.status(400).json({ error: 'Tenés que aceptar los términos y la política de privacidad' })
    }

    const pool = await poolPromise

    // Verificar que el email no exista ya
    const existente = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT Id FROM Usuarios WHERE Email = @email')

    if (existente.recordset.length > 0) {
      return res.status(400).json({ error: 'Ese email ya está registrado' })
    }

    // Hashear la contraseña
    const passwordHash = await bcrypt.hash(password, 10)
    const tokenVerificacion = crypto.randomBytes(32).toString('hex')

    const result = await pool.request()
      .input('nombre', sql.NVarChar, nombre)
      .input('email', sql.NVarChar, email)
      .input('passwordHash', sql.NVarChar, passwordHash)
      .input('telefono', sql.NVarChar, telefono || null)
      .input('tokenVerificacion', sql.NVarChar, tokenVerificacion)
      .query(`
        INSERT INTO Usuarios (Nombre, Email, PasswordHash, Telefono, TokenVerificacion)
        OUTPUT INSERTED.Id, INSERTED.Nombre, INSERTED.Email, INSERTED.Rol
        VALUES (@nombre, @email, @passwordHash, @telefono, @tokenVerificacion)
      `)

    const usuario = result.recordset[0]
    const token = generarToken(usuario)

    // Si falla el envío del mail no rompemos el registro, solo lo logueamos
    try {
      await enviarEmailVerificacion(usuario.Email, usuario.Nombre, tokenVerificacion)
    } catch (mailErr) {
      console.error('No se pudo enviar el mail de verificación:', mailErr.message)
    }

    res.json({ token, usuario })
  } catch (err) {
    manejarError(res, err)
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Faltan datos' })
    }

    const pool = await poolPromise
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM Usuarios WHERE Email = @email')

    const usuario = result.recordset[0]

    if (!usuario) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' })
    }

    if (!usuario.Activo) {
      return res.status(403).json({ error: 'Tu cuenta fue deshabilitada. Contactanos si creés que es un error.' })
    }

    const passwordValida = await bcrypt.compare(password, usuario.PasswordHash)

    if (!passwordValida) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' })
    }

    const token = generarToken(usuario)

    res.json({
      token,
      usuario: {
        Id: usuario.Id,
        Nombre: usuario.Nombre,
        Email: usuario.Email,
        Rol: usuario.Rol
      }
    })
  } catch (err) {
    manejarError(res, err)
  }
})

// Confirmar cuenta por el link del mail
router.get('/verificar/:token', async (req, res) => {
  try {
    const pool = await poolPromise
    const result = await pool.request()
      .input('token', sql.NVarChar, req.params.token)
      .query('SELECT Id FROM Usuarios WHERE TokenVerificacion = @token')

    const usuario = result.recordset[0]

    if (!usuario) {
      return res.status(400).json({ error: 'El link de verificación no es válido o ya fue usado' })
    }

    await pool.request()
      .input('id', sql.Int, usuario.Id)
      .query('UPDATE Usuarios SET EmailVerificado = 1, TokenVerificacion = NULL WHERE Id = @id')

    res.json({ ok: true })
  } catch (err) {
    manejarError(res, err)
  }
})

// Pedir recuperación de contraseña
router.post('/olvide-password', async (req, res) => {
  try {
    const { email } = req.body
    const pool = await poolPromise

    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT Id, Nombre, Email FROM Usuarios WHERE Email = @email')

    const usuario = result.recordset[0]

    // Por seguridad, respondemos lo mismo exista o no el email (no confirmamos qué mails están registrados)
    if (usuario) {
      const token = crypto.randomBytes(32).toString('hex')
      const expira = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

      await pool.request()
        .input('id', sql.Int, usuario.Id)
        .input('token', sql.NVarChar, token)
        .input('expira', sql.DateTime, expira)
        .query('UPDATE Usuarios SET TokenRecuperacion = @token, TokenRecuperacionExpira = @expira WHERE Id = @id')

      try {
        await enviarEmailRecuperacion(usuario.Email, usuario.Nombre, token)
      } catch (mailErr) {
        console.error('No se pudo enviar el mail de recuperación:', mailErr.message)
      }
    }

    res.json({ ok: true, mensaje: 'Si ese email está registrado, te enviamos instrucciones para recuperar tu contraseña' })
  } catch (err) {
    manejarError(res, err)
  }
})

// Confirmar nueva contraseña con el token del mail
router.post('/resetear-password', async (req, res) => {
  try {
    const { token, password } = req.body

    if (!token || !password || password.length < 8) {
      return res.status(400).json({ error: 'Datos inválidos' })
    }

    const pool = await poolPromise
    const result = await pool.request()
      .input('token', sql.NVarChar, token)
      .query('SELECT Id, TokenRecuperacionExpira FROM Usuarios WHERE TokenRecuperacion = @token')

    const usuario = result.recordset[0]

    if (!usuario || new Date(usuario.TokenRecuperacionExpira) < new Date()) {
      return res.status(400).json({ error: 'El link venció o no es válido. Pedí uno nuevo.' })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    await pool.request()
      .input('id', sql.Int, usuario.Id)
      .input('passwordHash', sql.NVarChar, passwordHash)
      .query('UPDATE Usuarios SET PasswordHash = @passwordHash, TokenRecuperacion = NULL, TokenRecuperacionExpira = NULL WHERE Id = @id')

    res.json({ ok: true })
  } catch (err) {
    manejarError(res, err)
  }
})

function generarToken(usuario) {
  return jwt.sign(
    { id: usuario.Id, email: usuario.Email, rol: usuario.Rol },
    process.env.JWT_SECRET,
    { expiresIn: '4h' }
  )
}

// Usuario de la sesión actual, leído de la base. El front lo usa para confirmar el rol
// en vez de confiar en lo que quedó guardado en el navegador
router.get('/yo', verificarToken, async (req, res) => {
  try {
    const pool = await poolPromise
    const usuario = (await pool.request()
      .input('id', sql.Int, req.usuario.id)
      .query('SELECT Id, Nombre, Email, Rol FROM Usuarios WHERE Id = @id')).recordset[0]
    res.json({ usuario })
  } catch (err) {
    manejarError(res, err)
  }
})

module.exports = router