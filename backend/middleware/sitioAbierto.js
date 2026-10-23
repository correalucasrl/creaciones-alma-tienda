const { poolPromise } = require('../db')
const { usuarioDesdeToken } = require('./authMiddleware')

// "Modo próximamente": mientras la clave sitio_abierto de Configuracion valga '0', la API solo
// atiende a administradores. Si la clave no existe el sitio se considera abierto.
// Se guarda unos segundos en memoria para no consultar la base en cada pedido
const DURACION_CACHE_MS = 15 * 1000
let cache = null

async function sitioAbierto() {
  if (cache && Date.now() - cache.leido < DURACION_CACHE_MS) return cache.abierto
  const pool = await poolPromise
  const result = await pool.request().query("SELECT Valor FROM Configuracion WHERE Clave = 'sitio_abierto'")
  const abierto = result.recordset[0]?.Valor !== '0'
  cache = { abierto, leido: Date.now() }
  return abierto
}

// Se llama al guardar la configuración, así abrir o cerrar el sitio se aplica al instante
function olvidarEstadoSitio() {
  cache = null
}

// Lo único que funciona para cualquiera con el sitio cerrado (rutas relativas a /api).
// Todo lo demás (catálogo, galería, testimonios, registro, checkout...) requiere un admin real
const PERMITIDAS_CON_SITIO_CERRADO = [
  ['GET', /^\/health$/],
  ['GET', /^\/configuracion$/],               // devuelve solo lo que necesita la página "Próximamente"
  ['POST', /^\/auth\/login$/],                // el admin tiene que poder entrar
  ['GET', /^\/auth\/yo$/],                    // el front confirma quién es el usuario
  ['POST', /^\/auth\/olvide-password$/],
  ['POST', /^\/auth\/resetear-password$/],
  ['GET', /^\/auth\/verificar\/[^/]+$/],
  ['POST', /^\/newsletter$/],                 // juntar emails antes de abrir
  ['POST', /^\/newsletter\/baja\/[^/]+$/],
  ['POST', /^\/visitas$/],
  ['POST', /^\/ordenes\/webhook-mercadopago$/] // avisos de pago de las compras de prueba del admin
]

const permitida = req => PERMITIDAS_CON_SITIO_CERRADO.some(([metodo, ruta]) =>
  (req.method === metodo || (metodo === 'GET' && req.method === 'HEAD')) && ruta.test(req.path))

// Se monta en /api: con el sitio cerrado, rechaza todo lo que no esté en la lista de arriba
// salvo que el pedido traiga el token de un admin (validado contra la base, no solo el JWT)
async function soloAdminConSitioCerrado(req, res, next) {
  try {
    if (req.method === 'OPTIONS' || permitida(req) || await sitioAbierto()) return next()
    const usuario = await usuarioDesdeToken(req.headers.authorization)
    if (usuario?.rol === 'Admin') return next()
    res.status(503).json({ error: 'La tienda todavía no está abierta al público. ¡Muy pronto!', codigo: 'SITIO_CERRADO' })
  } catch (err) {
    next(err)
  }
}

module.exports = { sitioAbierto, olvidarEstadoSitio, soloAdminConSitioCerrado }
