const jwt = require('jsonwebtoken')
const { sql, poolPromise } = require('../db')

// Verifica el JWT y además consulta la base: si el admin deshabilitó la cuenta o le cambió
// el rol, se aplica en el siguiente pedido (sin esperar a que venza el token de 4 horas).
// Devuelve el usuario como lo guardan las rutas en req.usuario, o null si no vale.
async function usuarioDesdeToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null

  let decoded
  try {
    decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET)
  } catch {
    return null
  }

  const pool = await poolPromise
  const result = await pool.request()
    .input('id', sql.Int, decoded.id)
    .query('SELECT Id, Email, Rol, Activo FROM Usuarios WHERE Id = @id')

  const usuario = result.recordset[0]
  if (!usuario || !usuario.Activo) return null

  return { ...decoded, email: usuario.Email, rol: usuario.Rol }
}

async function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado, falta token' })
  }

  try {
    const usuario = await usuarioDesdeToken(authHeader)
    if (!usuario) {
      return res.status(401).json({ error: 'Token inválido o expirado' })
    }
    req.usuario = usuario
    next()
  } catch (err) {
    next(err)
  }
}

// Igual que verificarToken, pero NO bloquea si no hay token — solo completa
// req.usuario si lo hay. Sirve para rutas que aceptan tanto usuarios logueados
// como invitados (ej: checkout).
async function verificarTokenOpcional(req, res, next) {
  try {
    req.usuario = await usuarioDesdeToken(req.headers.authorization)
    next()
  } catch (err) {
    next(err)
  }
}

function verificarAdmin(req, res, next) {
  if (req.usuario?.rol !== 'Admin') {
    return res.status(403).json({ error: 'No tenés permisos de administrador' })
  }
  next()
}

module.exports = { verificarToken, verificarTokenOpcional, verificarAdmin, usuarioDesdeToken }
