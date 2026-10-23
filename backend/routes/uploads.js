const express = require('express')
const router = express.Router()
const { verificarToken, verificarAdmin } = require('../middleware/authMiddleware')
const { firmarParametros } = require('../utils/cloudinary')

const CARPETA = process.env.CLOUDINARY_FOLDER || 'creaciones-alma'
const FORMATOS_PERMITIDOS = 'jpg,jpeg,png,webp,gif,avif'

// Admin: devuelve una firma para subir UNA imagen directo a Cloudinary desde el navegador.
// El API secret nunca sale del servidor, y sin una firma válida Cloudinary rechaza la subida,
// así que solo un admin logueado puede subir. La firma vence a la hora (la controla Cloudinary
// con el timestamp) y solo sirve para esta carpeta y estos formatos.
router.post('/firma', verificarToken, verificarAdmin, (req, res) => {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.error('Falta configurar CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY o CLOUDINARY_API_SECRET en el .env')
    return res.status(503).json({ error: 'La subida de imágenes no está configurada todavía' })
  }

  const parametros = {
    allowed_formats: FORMATOS_PERMITIDOS,
    folder: CARPETA,
    timestamp: Math.floor(Date.now() / 1000)
  }

  res.json({
    cloudName: CLOUDINARY_CLOUD_NAME,
    apiKey: CLOUDINARY_API_KEY,
    parametros,
    signature: firmarParametros(parametros, CLOUDINARY_API_SECRET)
  })
})

module.exports = router
