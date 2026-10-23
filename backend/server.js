require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const { sql, poolPromise } = require('./db')
const { manejarError } = require('./utils/errores')
const {
  limiteGeneral, limiteLogin, limiteRecuperacion, limiteCheckout, limiteCotizacion, limiteVisitas, limiteArrepentimiento, limiteCupones,
  limiteNewsletter
} = require('./middleware/rateLimit')
const { soloAdminConSitioCerrado } = require('./middleware/sitioAbierto')

const app = express()

// Detrás de un proxy (Azure App Service, Nginx, etc.) el IP real del visitante viene en
// X-Forwarded-For. TRUST_PROXY=1 indica cuántos proxies hay adelante; sin esto el rate limit
// trataría a todos los visitantes como si fueran uno solo
if (process.env.TRUST_PROXY) {
  app.set('trust proxy', Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY)
}

// Solo el frontend propio puede llamar a la API desde el navegador.
// CORS_ORIGINS acepta varias URLs separadas por coma (ej: https://creacionesalma.com.ar,https://www.creacionesalma.com.ar)
const origenesPermitidos = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean)

app.use(helmet())
app.use(cors({ origin: origenesPermitidos }))
app.use(express.json({ limit: '100kb' }))

app.use('/api', limiteGeneral)
app.use('/api/auth/login', limiteLogin)
app.use('/api/auth/registro', limiteLogin)
app.use('/api/auth/olvide-password', limiteRecuperacion)
app.use('/api/auth/resetear-password', limiteRecuperacion)
app.use('/api/ordenes/checkout', limiteCheckout)
app.use('/api/envio/cotizar', limiteCotizacion)
app.use('/api/visitas', limiteVisitas)
// Solo el formulario público: el admin consulta y actualiza las solicitudes sin este límite
app.post('/api/arrepentimiento', limiteArrepentimiento)
app.use('/api/cupones/validar', limiteCupones)
app.post('/api/newsletter', limiteNewsletter)

// Con el sitio cerrado al público ("modo próximamente") la API solo atiende a administradores,
// salvo el login, la recuperación de contraseña, el newsletter y poco más (ver middleware/sitioAbierto.js)
app.use('/api', soloAdminConSitioCerrado)

// Lo consulta la comprobación de estado de Azure App Service: si la base no está conectada responde 503
// y Azure marca la instancia como no sana. No expone detalles del error
app.get('/api/health', async (req, res) => {
  const pool = await poolPromise
  if (!pool?.connected) return res.status(503).json({ status: 'error', mensaje: 'Sin conexión a la base de datos' })
  res.json({ status: 'ok', mensaje: 'Backend funcionando' })
})

// Diagnóstico de la conexión a la base: solo fuera de producción
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/test-db', async (req, res) => {
    try {
      const pool = await poolPromise
      const result = await pool.request().query('SELECT GETDATE() AS fecha')
      res.json({ conectado: true, resultado: result.recordset })
    } catch (err) {
      manejarError(res, err)
    }
  })
}

const PORT = process.env.PORT || 3000

const authRoutes = require('./routes/auth')
app.use('/api/auth', authRoutes)

const productosRoutes = require('./routes/productos')
app.use('/api/productos', productosRoutes)

const ordenesRoutes = require('./routes/ordenes')
app.use('/api/ordenes', ordenesRoutes)

const categoriasRoutes = require('./routes/categorias')
app.use('/api/categorias', categoriasRoutes)

const galeriaRoutes = require('./routes/galeria')      // ← NUEVO
app.use('/api/galeria', galeriaRoutes)

const configuracionRoutes = require('./routes/configuracion')   // ← NUEVO
app.use('/api/configuracion', configuracionRoutes)               // ← NUEVO

const testimoniosRoutes = require('./routes/testimonios')   // ← NUEVO
app.use('/api/testimonios', testimoniosRoutes)                // ← NUEVO

const usuariosRoutes = require('./routes/usuarios')   // ← NUEVO
app.use('/api/usuarios', usuariosRoutes)                // ← NUEVO

const envioRoutes = require('./routes/envio')   // ← NUEVO
app.use('/api/envio', envioRoutes)                // ← NUEVO

const dashboardRoutes = require('./routes/dashboard')   // ← NUEVO
app.use('/api/dashboard', dashboardRoutes)                // ← NUEVO

const visitasRoutes = require('./routes/visitas')   // ← NUEVO
app.use('/api/visitas', visitasRoutes)                // ← NUEVO

const finanzasRoutes = require('./routes/finanzas')   // ← NUEVO
app.use('/api/finanzas', finanzasRoutes)                // ← NUEVO

const arrepentimientoRoutes = require('./routes/arrepentimiento')
app.use('/api/arrepentimiento', arrepentimientoRoutes)

const uploadsRoutes = require('./routes/uploads')
app.use('/api/uploads', uploadsRoutes)

const { router: cuponesRoutes } = require('./routes/cupones')
app.use('/api/cupones', cuponesRoutes)

const newsletterRoutes = require('./routes/newsletter')
app.use('/api/newsletter', newsletterRoutes)

const ocasionesRoutes = require('./routes/ocasiones')
app.use('/api/ocasiones', ocasionesRoutes)

// Cualquier ruta de la API que no exista
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' })
})

// Último recurso: errores que no atrapó ninguna ruta (JSON mal formado, body demasiado grande, etc.)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la solicitud no es JSON válido' })
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'La solicitud es demasiado grande' })
  }
  manejarError(res, err)
})

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
})
