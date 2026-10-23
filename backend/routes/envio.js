const express = require('express')
const router = express.Router()
const { sql, poolPromise } = require('../db')
const { manejarError } = require('../utils/errores')
const { cotizarEnvio } = require('../utils/correoArgentino')

router.get('/cotizar', async (req, res) => {
  try {
    const { codigoPostal } = req.query

    if (!codigoPostal) {
      return res.status(400).json({ error: 'Falta el código postal de destino' })
    }

    const pool = await poolPromise
    const configResult = await pool.request().query(`
      SELECT Clave, Valor FROM Configuracion
      WHERE Clave IN ('correo_customer_id', 'correo_cp_origen', 'paquete_peso_gramos', 'paquete_alto_cm', 'paquete_ancho_cm', 'paquete_largo_cm')
    `)

    const config = {}
    configResult.recordset.forEach(row => { config[row.Clave] = row.Valor })

    if (!config.correo_customer_id || !config.correo_cp_origen) {
      return res.status(400).json({ error: 'Todavía no configuraste la integración con Correo Argentino' })
    }

    const costo = await cotizarEnvio({
      customerId: config.correo_customer_id,
      postalCodeOrigin: config.correo_cp_origen,
      postalCodeDestination: codigoPostal,
      dimensions: {
        weight: parseInt(config.paquete_peso_gramos),
        height: parseInt(config.paquete_alto_cm),
        width: parseInt(config.paquete_ancho_cm),
        length: parseInt(config.paquete_largo_cm)
      }
    })

    res.json({ costo })
  } catch (err) {
    manejarError(res, err, 'No pudimos calcular el envío a ese código postal')
  }
})

module.exports = router