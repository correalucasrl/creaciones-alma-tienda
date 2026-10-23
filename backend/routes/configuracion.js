const express = require('express')
const router = express.Router()
const { sql, poolPromise } = require('../db')
const { manejarError } = require('../utils/errores')
const { verificarToken, verificarTokenOpcional, verificarAdmin } = require('../middleware/authMiddleware')
const { sitioAbierto, olvidarEstadoSitio } = require('../middleware/sitioAbierto')

// Claves que necesita el sitio público. El resto (email de admin, datos de Correo Argentino,
// meta de ventas, etc.) solo lo ve el admin. Si agregás una clave que se muestra en el sitio, sumala acá
const CLAVES_PUBLICAS = [
  'whatsapp_numero', 'instagram_usuario', 'instagram_url', 'email_contacto',
  'texto_envios', 'texto_retiro',
  'transferencia_alias', 'transferencia_titular',
  'hero_subtitulo', 'hero_imagen_1', 'hero_imagen_2', 'hero_imagen_3',
  'legal_razon_social', 'legal_nombre_fantasia', 'legal_cuit', 'legal_domicilio', 'data_fiscal_url',
  'envio_gratis_desde', 'descuento_transferencia_pct', 'anuncio_barra', 'newsletter_descuento_pct',
  'sitio_abierto'
]

// Con el sitio cerrado, quien no es admin recibe solo lo que usa la página "Próximamente"
// y las páginas legales (nada de textos de la tienda, envíos ni datos de transferencia)
const CLAVES_SITIO_CERRADO = [
  'sitio_abierto', 'whatsapp_numero', 'instagram_usuario', 'instagram_url', 'email_contacto', 'newsletter_descuento_pct',
  'legal_razon_social', 'legal_nombre_fantasia', 'legal_cuit', 'legal_domicilio', 'data_fiscal_url'
]

async function leerConfiguracion(soloPublicas) {
  const pool = await poolPromise
  const result = await pool.request().query('SELECT Clave, Valor FROM Configuracion')

  const config = {}
  result.recordset.forEach(row => {
    if (!soloPublicas || CLAVES_PUBLICAS.includes(row.Clave)) {
      config[row.Clave] = row.Valor
    }
  })
  return config
}

// Público: configuración que muestra el sitio, como objeto { clave: valor }
router.get('/', verificarTokenOpcional, async (req, res) => {
  try {
    const config = await leerConfiguracion(true)
    if (req.usuario?.rol !== 'Admin' && !(await sitioAbierto())) {
      return res.json(Object.fromEntries(Object.entries(config).filter(([clave]) => CLAVES_SITIO_CERRADO.includes(clave))))
    }
    res.json(config)
  } catch (err) {
    manejarError(res, err)
  }
})

// Admin: toda la configuración (para el formulario de Configuración)
router.get('/admin', verificarToken, verificarAdmin, async (req, res) => {
  try {
    res.json(await leerConfiguracion(false))
  } catch (err) {
    manejarError(res, err)
  }
})

// Admin: actualizar varias claves de una (body: { clave1: valor1, clave2: valor2, ... })
router.put('/', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const pool = await poolPromise
    const entradas = Object.entries(req.body)

    for (const [clave, valor] of entradas) {
      await pool.request()
        .input('clave', sql.NVarChar, clave)
        .input('valor', sql.NVarChar, valor)
        .query(`
          IF EXISTS (SELECT 1 FROM Configuracion WHERE Clave = @clave)
            UPDATE Configuracion SET Valor = @valor WHERE Clave = @clave
          ELSE
            INSERT INTO Configuracion (Clave, Valor) VALUES (@clave, @valor)
        `)
    }

    olvidarEstadoSitio()
    res.json({ ok: true })
  } catch (err) {
    manejarError(res, err)
  }
})

module.exports = router