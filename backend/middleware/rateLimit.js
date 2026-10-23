const { rateLimit } = require('express-rate-limit')

const MINUTO = 60 * 1000

function limitador(ventanaMs, maximo, mensaje) {
  return rateLimit({
    windowMs: ventanaMs,
    limit: maximo,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: mensaje }
  })
}

// Límite general para toda la API (evita que un solo IP sature el servidor)
const limiteGeneral = limitador(15 * MINUTO, 500, 'Demasiadas solicitudes. Esperá unos minutos y probá de nuevo.')

// Login y registro: frena la fuerza bruta de contraseñas
const limiteLogin = limitador(15 * MINUTO, 10, 'Demasiados intentos. Esperá 15 minutos y probá de nuevo.')

// Mails de recuperación / reseteo: evita usar el sitio para mandar spam
const limiteRecuperacion = limitador(60 * MINUTO, 5, 'Demasiados pedidos de recuperación. Esperá una hora y probá de nuevo.')

// Checkout y cotización de envío (pegan contra Mercado Pago y Correo Argentino)
const limiteCheckout = limitador(15 * MINUTO, 20, 'Demasiados intentos de compra. Esperá unos minutos y probá de nuevo.')
const limiteCotizacion = limitador(15 * MINUTO, 30, 'Demasiadas cotizaciones. Esperá unos minutos y probá de nuevo.')

// Contador de visitas: unas pocas por IP alcanzan, el resto inflaría el número
const limiteVisitas = limitador(60 * MINUTO, 10, 'Demasiadas visitas registradas.')

// Botón de arrepentimiento (público, manda mails)
const limiteArrepentimiento = limitador(60 * MINUTO, 5, 'Demasiadas solicitudes. Esperá una hora o escribinos por WhatsApp.')

// Validar cupones: evita probar códigos a fuerza bruta
const limiteCupones = limitador(15 * MINUTO, 20, 'Demasiados intentos con cupones. Esperá unos minutos.')

// Suscripción al newsletter (manda un mail con cupón por cada alta)
const limiteNewsletter = limitador(60 * MINUTO, 5, 'Demasiados intentos. Probá de nuevo más tarde.')

module.exports = {
  limiteGeneral, limiteLogin, limiteRecuperacion, limiteCheckout, limiteCotizacion, limiteVisitas, limiteArrepentimiento, limiteCupones,
  limiteNewsletter
}
