const express = require('express')
const router = express.Router()
const crypto = require('crypto')
const { sql, poolPromise } = require('../db')
const { manejarError } = require('../utils/errores')
const { verificarToken, verificarAdmin } = require('../middleware/authMiddleware')
const { enviarBienvenidaNewsletter } = require('../utils/email')
const { evaluarCupon } = require('../utils/precios')

const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

// Código legible y difícil de adivinar: BIENVENIDA-7K2QXM (sin 0/O ni 1/I para que no se confundan)
function codigoBienvenida() {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.randomBytes(6)
  return 'BIENVENIDA-' + Array.from(bytes, b => letras[b % letras.length]).join('')
}

async function leerConfig(pool) {
  const result = await pool.request().query(`
    SELECT Clave, Valor FROM Configuracion WHERE Clave IN ('newsletter_descuento_pct', 'newsletter_cupon_dias')
  `)
  const config = {}
  result.recordset.forEach(r => { config[r.Clave] = r.Valor })
  const pct = Math.min(Math.max(Number(config.newsletter_descuento_pct) || 10, 1), 50)
  const dias = Math.min(Math.max(Number(config.newsletter_cupon_dias) || 30, 1), 365)
  return { pct, dias }
}

async function mandarCupon(cupon, email, tokenBaja) {
  try {
    await enviarBienvenidaNewsletter({
      destino: email,
      codigo: cupon.Codigo,
      porcentaje: Number(cupon.Valor),
      vence: cupon.FechaFin,
      linkBaja: `${FRONTEND_URL}/newsletter/baja/${tokenBaja}`
    })
    return true
  } catch (err) {
    console.error(`No se pudo mandar el cupón de bienvenida a ${email}:`, err.message)
    return false
  }
}

// Público: suscribirse. El cupón NO se muestra en pantalla: llega por mail, así se valida
// que el email exista y no se pueden sacar cupones infinitos con emails inventados
router.post('/', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase()
    const origen = ['inicio', 'popup', 'footer', 'checkout', 'proximamente'].includes(req.body.origen) ? req.body.origen : null

    if (!regexEmail.test(email) || email.length > 150) {
      return res.status(400).json({ error: 'Ingresá un email válido' })
    }

    const pool = await poolPromise
    const existente = (await pool.request()
      .input('email', sql.NVarChar, email)
      .query(`
        SELECT s.*, c.Codigo, c.Valor, c.FechaFin, c.Activo AS CuponActivo, c.Usos, c.UsosMaximos, c.FechaInicio, c.MinimoCompra, c.Tipo
        FROM Suscriptores s LEFT JOIN Cupones c ON c.Id = s.CuponId
        WHERE s.Email = @email
      `)).recordset[0]

    if (existente) {
      if (!existente.Activo) {
        await pool.request()
          .input('id', sql.Int, existente.Id)
          .query('UPDATE Suscriptores SET Activo = 1, FechaBaja = NULL WHERE Id = @id')
      }

      // Si su cupón sigue sirviendo, se le reenvía; si ya lo usó o venció, no se genera otro
      const cupon = existente.CuponId && { ...existente, Activo: existente.CuponActivo }
      if (cupon && evaluarCupon(cupon, Number.MAX_SAFE_INTEGER).ok) {
        await mandarCupon(cupon, email, existente.TokenBaja)
        return res.json({
          ok: true,
          mensaje: existente.Activo
            ? 'Ya estabas suscripto: te reenviamos tu cupón de bienvenida por email.'
            : '¡Te volviste a suscribir! Te reenviamos tu cupón de bienvenida por email.'
        })
      }
      return res.json({ ok: true, mensaje: existente.Activo ? 'Ya estás suscripto. ¡Gracias!' : '¡Te volviste a suscribir!' })
    }

    const { pct, dias } = await leerConfig(pool)
    const tokenBaja = crypto.randomBytes(24).toString('hex')
    const fechaFin = new Date(Date.now() + dias * 86400000)

    const transaction = new sql.Transaction(pool)
    await transaction.begin()
    let cupon
    try {
      // Cupón personal: un solo uso, vence a los N días
      let intentos = 0
      while (!cupon) {
        try {
          cupon = (await new sql.Request(transaction)
            .input('codigo', sql.NVarChar, codigoBienvenida())
            .input('descripcion', sql.NVarChar, `Bienvenida newsletter: ${email}`.slice(0, 200))
            .input('valor', sql.Decimal(10, 2), pct)
            .input('fechaFin', sql.DateTime, fechaFin)
            .query(`
              INSERT INTO Cupones (Codigo, Descripcion, Tipo, Valor, UsosMaximos, FechaFin)
              OUTPUT INSERTED.*
              VALUES (@codigo, @descripcion, 'porcentaje', @valor, 1, @fechaFin)
            `)).recordset[0]
        } catch (err) {
          // Choque de código (muy improbable): se prueba con otro
          if (!/UQ_Cupones_Codigo|UNIQUE/i.test(err.message) || ++intentos > 3) throw err
        }
      }

      await new sql.Request(transaction)
        .input('email', sql.NVarChar, email)
        .input('origen', sql.NVarChar, origen)
        .input('cuponId', sql.Int, cupon.Id)
        .input('token', sql.NVarChar, tokenBaja)
        .query('INSERT INTO Suscriptores (Email, Origen, CuponId, TokenBaja) VALUES (@email, @origen, @cuponId, @token)')

      await transaction.commit()
    } catch (err) {
      await transaction.rollback().catch(() => {})
      // Dos altas simultáneas del mismo email: la segunda se toma como "ya suscripto"
      if (/UQ_Suscriptores_Email|UNIQUE/i.test(err.message)) {
        return res.json({ ok: true, mensaje: 'Ya estás suscripto. ¡Gracias!' })
      }
      throw err
    }

    const enviado = await mandarCupon(cupon, email, tokenBaja)
    res.json({
      ok: true,
      mensaje: enviado
        ? `¡Listo! Te mandamos tu cupón de ${pct}% OFF a ${email}. Revisá también la carpeta de spam.`
        : '¡Te suscribiste! No pudimos mandarte el cupón ahora; escribinos y te lo pasamos.'
    })
  } catch (err) {
    manejarError(res, err, 'No pudimos suscribirte. Probá de nuevo en unos minutos.')
  }
})

// Público: darse de baja desde el link del mail
router.post('/baja/:token', async (req, res) => {
  try {
    const pool = await poolPromise
    const result = await pool.request()
      .input('token', sql.NVarChar, String(req.params.token))
      .query(`
        UPDATE Suscriptores SET Activo = 0, FechaBaja = SYSUTCDATETIME()
        OUTPUT INSERTED.Email
        WHERE TokenBaja = @token
      `)
    if (!result.recordset.length) {
      return res.status(404).json({ error: 'El link de baja no es válido' })
    }
    // Se muestra el email enmascarado (ma***@gmail.com) para confirmar sin exponerlo
    const [usuario, dominio] = result.recordset[0].Email.split('@')
    res.json({ ok: true, email: `${usuario.slice(0, 2)}***@${dominio}` })
  } catch (err) {
    manejarError(res, err)
  }
})

// ---------- Admin ----------

const CONSULTA_ADMIN = `
  SELECT s.Id, s.Email, s.Origen, s.Activo, s.FechaAlta, s.FechaBaja,
         c.Codigo AS CuponCodigo, c.Usos AS CuponUsos, c.FechaFin AS CuponVence
  FROM Suscriptores s LEFT JOIN Cupones c ON c.Id = s.CuponId
`

router.get('/admin/todos', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const pool = await poolPromise
    const result = await pool.request().query(`${CONSULTA_ADMIN} ORDER BY s.FechaAlta DESC`)
    res.json(result.recordset)
  } catch (err) {
    manejarError(res, err)
  }
})

// CSV de suscriptores activos, para importar en una herramienta de envío de mails
router.get('/admin/exportar', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const pool = await poolPromise
    const result = await pool.request().query(`${CONSULTA_ADMIN} WHERE s.Activo = 1 ORDER BY s.FechaAlta`)
    const celda = v => `"${String(v ?? '').replace(/^([=+\-@\t\r])/, "'$1").replace(/"/g, '""')}"`
    const filas = result.recordset.map(r => [
      r.Email,
      new Date(r.FechaAlta).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }),
      r.Origen,
      r.CuponCodigo,
      r.CuponUsos ? 'Sí' : 'No'
    ].map(celda).join(','))

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="suscriptores.csv"')
    res.send('﻿' + ['Email,FechaAlta,Origen,Cupon,CuponUsado', ...filas].join('\n'))
  } catch (err) {
    manejarError(res, err)
  }
})

module.exports = router
