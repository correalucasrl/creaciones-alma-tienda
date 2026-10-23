const express = require('express')
const router = express.Router()
const crypto = require('crypto')
const { sql, poolPromise } = require('../db')
const { manejarError } = require('../utils/errores')
const { verificarToken, verificarAdmin } = require('../middleware/authMiddleware')
const { enviarConstanciaArrepentimiento, enviarAvisoArrepentimiento } = require('../utils/email')
const { diaArgentina } = require('../utils/fechas')

const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Botón de arrepentimiento (Res. 424/2020): público, sin necesidad de estar registrado.
// Guarda la solicitud, le devuelve al cliente un código de identificación y avisa al admin
router.post('/', async (req, res) => {
  try {
    const { nombre, email, telefono, numeroPedido, motivo } = req.body

    if (!nombre || !email) {
      return res.status(400).json({ error: 'Completá tu nombre y email' })
    }
    if (!regexEmail.test(email)) {
      return res.status(400).json({ error: 'El email no tiene un formato válido' })
    }
    if (String(nombre).length > 100 || String(email).length > 150 || String(telefono || '').length > 30) {
      return res.status(400).json({ error: 'Algún dato es demasiado largo' })
    }
    if (motivo && String(motivo).length > 1000) {
      return res.status(400).json({ error: 'El motivo puede tener hasta 1000 caracteres' })
    }

    let ordenId = null
    if (numeroPedido !== undefined && numeroPedido !== null && String(numeroPedido).trim() !== '') {
      ordenId = Number(String(numeroPedido).replace('#', '').trim())
      if (!Number.isInteger(ordenId) || ordenId <= 0) {
        return res.status(400).json({ error: 'El número de pedido no es válido' })
      }
    }

    const codigo = `ARR-${diaArgentina().replace(/-/g, '')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`

    const pool = await poolPromise
    await pool.request()
      .input('codigo', sql.NVarChar, codigo)
      .input('nombre', sql.NVarChar, nombre)
      .input('email', sql.NVarChar, email)
      .input('telefono', sql.NVarChar, telefono || null)
      .input('ordenId', sql.Int, ordenId)
      .input('motivo', sql.NVarChar, motivo || null)
      .query(`
        INSERT INTO Arrepentimientos (Codigo, Nombre, Email, Telefono, OrdenId, Motivo)
        VALUES (@codigo, @nombre, @email, @telefono, @ordenId, @motivo)
      `)

    // Si falla un mail no se pierde la solicitud: ya quedó guardada y el código se muestra en pantalla
    try {
      await enviarConstanciaArrepentimiento({ destino: email, nombre, codigo, ordenId })
    } catch (mailErr) {
      console.error(`No se pudo enviar la constancia de arrepentimiento ${codigo}:`, mailErr.message)
    }

    try {
      const configResult = await pool.request()
        .query("SELECT Valor FROM Configuracion WHERE Clave = 'admin_email'")
      const adminEmail = configResult.recordset[0]?.Valor || process.env.ADMIN_EMAIL

      if (adminEmail) {
        await enviarAvisoArrepentimiento({ adminEmail, codigo, nombre, email, telefono, ordenId, motivo })
      }
    } catch (mailErr) {
      console.error(`No se pudo avisar al admin del arrepentimiento ${codigo}:`, mailErr.message)
    }

    res.json({ ok: true, codigo })
  } catch (err) {
    manejarError(res, err, 'No pudimos registrar tu solicitud. Escribinos por WhatsApp o email y la gestionamos igual.')
  }
})

const ESTADOS_SOLICITUD = ['Pendiente', 'En proceso', 'Resuelto', 'Rechazado']

// Admin: listar solicitudes, con los datos básicos del pedido si el cliente indicó uno
router.get('/admin/todas', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const pool = await poolPromise
    const result = await pool.request().query(`
      SELECT a.*, o.Estado AS PedidoEstado, o.Total AS PedidoTotal, o.FechaCreacion AS PedidoFecha,
             u.Email AS PedidoEmail
      FROM Arrepentimientos a
      LEFT JOIN Ordenes o ON o.Id = a.OrdenId
      LEFT JOIN Usuarios u ON u.Id = o.UsuarioId
      ORDER BY a.FechaCreacion DESC
    `)
    res.json(result.recordset)
  } catch (err) {
    manejarError(res, err)
  }
})

// Admin: actualizar estado y notas internas de una solicitud
router.put('/admin/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { estado, notas } = req.body

    if (!ESTADOS_SOLICITUD.includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' })
    }
    if (notas && String(notas).length > 1000) {
      return res.status(400).json({ error: 'Las notas pueden tener hasta 1000 caracteres' })
    }

    const pool = await poolPromise
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('estado', sql.NVarChar, estado)
      .input('notas', sql.NVarChar, notas || null)
      .query('UPDATE Arrepentimientos SET Estado = @estado, NotasAdmin = @notas WHERE Id = @id')

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Solicitud no encontrada' })
    }

    res.json({ ok: true })
  } catch (err) {
    manejarError(res, err)
  }
})

module.exports = router
