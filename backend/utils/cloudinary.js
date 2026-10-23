const crypto = require('crypto')

// Firma de Cloudinary: se ordenan los parámetros alfabéticamente, se unen como
// "clave=valor&clave=valor", se le pega el API secret al final y se calcula el SHA-1.
// https://cloudinary.com/documentation/authentication_signatures
function firmarParametros(parametros, apiSecret) {
  const texto = Object.keys(parametros)
    .filter(clave => parametros[clave] !== undefined && parametros[clave] !== null && parametros[clave] !== '')
    .sort()
    .map(clave => `${clave}=${parametros[clave]}`)
    .join('&')

  return crypto.createHash('sha1').update(texto + apiSecret).digest('hex')
}

module.exports = { firmarParametros }
