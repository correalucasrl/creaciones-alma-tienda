require('dotenv').config()
const sql = require('mssql')

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    // En producción (Azure SQL, servidor remoto) poné DB_ENCRYPT=true y DB_TRUST_CERT=false
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_CERT !== 'false'
  }
}

// En la nube la base puede no responder por unos segundos (ej: al reiniciar el servidor): se reintenta
// varias veces antes de darse por vencido. Una vez conectado, el pool reconecta solo si se corta.
// Si igual falla, poolPromise queda en undefined y /api/health avisa el error (lo ve la comprobación de estado de Azure)
const ESPERAS_REINTENTO_MS = [2000, 4000, 8000, 16000]

async function conectar() {
  for (let intento = 0; ; intento++) {
    try {
      const pool = await new sql.ConnectionPool(config).connect()
      console.log('✅ Conectado a SQL Server')
      return pool
    } catch (err) {
      const espera = ESPERAS_REINTENTO_MS[intento]
      if (espera === undefined) {
        console.log('❌ Error de conexión a SQL Server: ', err)
        return undefined
      }
      console.log(`⚠️ No se pudo conectar a SQL Server (${err.message}). Reintento en ${espera / 1000} s...`)
      await new Promise(resolve => setTimeout(resolve, espera))
    }
  }
}

const poolPromise = conectar()

module.exports = { sql, poolPromise }