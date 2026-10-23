const BASE_URL = process.env.CORREOARGENTINO_BASE_URL || 'https://apitest.correoargentino.com.ar/micorreo/v1'

let tokenCache = null
let tokenExpira = null

// Pide un token nuevo (Basic Auth) solo si el que tenemos ya venció o no existe
async function obtenerToken() {
  if (tokenCache && tokenExpira && new Date(tokenExpira) > new Date()) {
    return tokenCache
  }

  const credenciales = Buffer.from(
    `${process.env.CORREOARGENTINO_API_USER}:${process.env.CORREOARGENTINO_API_PASSWORD}`
  ).toString('base64')

  const resp = await fetch(`${BASE_URL}/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${credenciales}` }
  })

  if (!resp.ok) {
    throw new Error(`No se pudo autenticar con Correo Argentino (status ${resp.status})`)
  }

  const data = await resp.json()
  tokenCache = data.token
  tokenExpira = data.expires
  return tokenCache
}

// Cotiza un envío a domicilio (deliveredType "D") para un CP de destino,
// usando el CP de origen y el "paquete tipo" que carga el admin en Configuración
async function cotizarEnvio({ customerId, postalCodeOrigin, postalCodeDestination, dimensions }) {
  const token = await obtenerToken()

  const resp = await fetch(`${BASE_URL}/rates`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      customerId,
      postalCodeOrigin,
      postalCodeDestination,
      deliveredType: 'D',
      dimensions
    })
  })

  if (!resp.ok) {
    const errorBody = await resp.text()
    throw new Error(`Error al cotizar envío (status ${resp.status}): ${errorBody}`)
  }

  const data = await resp.json()
  const tarifa = data.rates?.find(r => r.deliveredType === 'D')

  if (!tarifa) {
    throw new Error('Correo Argentino no devolvió una tarifa de envío a domicilio para ese destino')
  }

  return tarifa.price
}

module.exports = { cotizarEnvio }