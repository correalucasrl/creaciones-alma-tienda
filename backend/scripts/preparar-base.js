// Crea las tablas y carga los datos iniciales en una base NUEVA (ej: Azure SQL).
// Usa la conexión del .env (DB_SERVER, DB_DATABASE, DB_USER, DB_PASSWORD, DB_ENCRYPT...).
// Uso, desde la carpeta backend:  node scripts/preparar-base.js
// Se puede correr más de una vez: lo que ya existe no se vuelve a crear.
require('dotenv').config({ quiet: true })
const fs = require('fs')
const path = require('path')
const { poolPromise } = require('../db')

const ARCHIVOS = ['esquema-completo.sql', 'datos-iniciales.sql']

;(async () => {
  const pool = await poolPromise
  if (!pool) throw new Error('No se pudo conectar a la base. Revisá las variables DB_* del .env')

  console.log(`Base: ${process.env.DB_DATABASE} en ${process.env.DB_SERVER}\n`)
  for (const archivo of ARCHIVOS) {
    const contenido = fs.readFileSync(path.join(__dirname, '..', 'sql', archivo), 'utf8')
    // GO separa los lotes en los scripts de SQL Server; el driver los manda de a uno
    const lotes = contenido.split(/^\s*GO\s*$/m).map(l => l.trim()).filter(Boolean)
    for (const lote of lotes) await pool.request().batch(lote)
    console.log(`✔ ${archivo}`)
  }

  const resumen = (await pool.request().query(`
    SELECT (SELECT COUNT(*) FROM sys.tables) AS tablas,
           (SELECT COUNT(*) FROM Categorias) AS categorias,
           (SELECT COUNT(*) FROM Ocasiones) AS ocasiones,
           (SELECT COUNT(*) FROM Usuarios WHERE Rol = 'Admin') AS admins,
           (SELECT Valor FROM Configuracion WHERE Clave = 'sitio_abierto') AS sitioAbierto`)).recordset[0]
  console.log(`\nListo: ${resumen.tablas} tablas, ${resumen.categorias} categorías, ${resumen.ocasiones} ocasiones, ` +
    `${resumen.admins} administradores. Tienda ${resumen.sitioAbierto === '0' ? 'CERRADA' : 'abierta'} al público.`)
  if (!resumen.admins) console.log('Siguiente paso: crear un administrador con  node scripts/crear-admin.js')
  process.exit(0)
})().catch(err => {
  console.error('\n✖ Error:', err.message)
  process.exit(1)
})
