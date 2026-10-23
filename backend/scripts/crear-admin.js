// Crea un administrador, o convierte en administrador una cuenta que ya existe.
// Usa la conexión del .env. La contraseña se pide en la terminal y no se muestra ni se guarda en ningún archivo.
// Uso, desde la carpeta backend:  node scripts/crear-admin.js
// Con la tienda cerrada nadie puede registrarse, así que el primer admin se crea con este script;
// los siguientes se pueden crear desde el panel (Usuarios → Hacer admin).
require('dotenv').config({ quiet: true })
const readline = require('readline')
const bcrypt = require('bcrypt')
const { sql, poolPromise } = require('../db')

const esTerminal = Boolean(process.stdin.isTTY)

// Respuestas que llegan por tubería (ej: pruebas automáticas): se guardan en una cola, así no se
// pierde ninguna mientras se consulta la base
const lineas = []
let esperando = null
let rl = null
if (!esTerminal) {
  rl = readline.createInterface({ input: process.stdin })
  rl.on('line', linea => (esperando ? (esperando(linea), esperando = null) : lineas.push(linea)))
  rl.on('close', () => esperando?.(''))
}

// En una terminal se lee tecla por tecla: así se puede ocultar la contraseña (se muestra * por cada
// caracter) sin depender de readline, que en la terminal de Windows se comporta distinto.
// Las teclas se guardan en una cola desde el principio, así no se pierde ninguna mientras se consulta la base
const teclas = []
let lectorActivo = null
if (esTerminal) {
  process.stdin.setRawMode(true)
  process.stdin.setEncoding('utf8')
  process.stdin.on('data', datos => {
    for (const c of datos) {
      if (c === '\u0003') { process.stdout.write('\n'); process.exit(130) }   // Ctrl+C
      teclas.push(c)
    }
    lectorActivo?.()
  })
  process.stdin.resume()
}

function leerDeTerminal(oculto) {
  return new Promise(resolve => {
    let texto = ''
    let ignorarEspecial = false
    lectorActivo = () => {
      while (teclas.length) {
        const c = teclas.shift()
        if (c === '\r' || c === '\n') {
          lectorActivo = null
          process.stdout.write('\n')
          return resolve(texto)
        }
        if (c === '\u001b') { ignorarEspecial = true; continue }          // flechas y otras teclas especiales
        if (ignorarEspecial) { if (/[A-Za-z~]/.test(c)) ignorarEspecial = false; continue }
        if (c === '\u007f' || c === '\b') {                              // Retroceso
          if (texto) { texto = texto.slice(0, -1); process.stdout.write('\b \b') }
        } else if (c >= ' ') {
          texto += c
          process.stdout.write(oculto ? '*' : c)
        }
      }
    }
    lectorActivo()
  })
}

// Deja la terminal como estaba antes de salir
function terminar(codigo) {
  rl?.close()
  if (esTerminal) process.stdin.setRawMode(false)
  process.exit(codigo)
}

async function preguntar(texto, oculto = false) {
  process.stdout.write(texto)
  let respuesta
  if (esTerminal) {
    respuesta = await leerDeTerminal(oculto)
  } else {
    respuesta = await new Promise(resolve => (lineas.length ? resolve(lineas.shift()) : (esperando = resolve)))
    if (oculto) process.stdout.write('\n')
  }
  return oculto ? respuesta : respuesta.trim()
}

// Pide un dato sin mostrar lo que se escribe (para la contraseña)
const preguntarOculto = texto => preguntar(texto, true)

;(async () => {
  const pool = await poolPromise
  if (!pool) throw new Error('No se pudo conectar a la base. Revisá las variables DB_* del .env')
  console.log(`Base: ${process.env.DB_DATABASE} en ${process.env.DB_SERVER}\n`)

  const email = (await preguntar('Email del administrador: ')).toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Email inválido')

  const existente = (await pool.request().input('email', sql.NVarChar, email)
    .query('SELECT Id, Nombre, Rol FROM Usuarios WHERE Email = @email')).recordset[0]

  if (existente) {
    await pool.request().input('id', sql.Int, existente.Id)
      .query("UPDATE Usuarios SET Rol = 'Admin', Activo = 1, EmailVerificado = 1 WHERE Id = @id")
    console.log(`\n✔ ${existente.Nombre} (${email}) ya existía y ahora es administrador. Su contraseña no cambió.`)
  } else {
    const nombre = await preguntar('Nombre: ')
    if (!nombre) throw new Error('Falta el nombre')
    const password = await preguntarOculto('Contraseña (mínimo 8 caracteres, no se ve al escribir): ')
    if (password.length < 8) throw new Error('La contraseña tiene que tener al menos 8 caracteres')
    const repetida = await preguntarOculto('Repetí la contraseña: ')
    if (password !== repetida) throw new Error('Las contraseñas no coinciden')

    await pool.request()
      .input('nombre', sql.NVarChar, nombre)
      .input('email', sql.NVarChar, email)
      .input('hash', sql.NVarChar, await bcrypt.hash(password, 10))
      .query(`INSERT INTO Usuarios (Nombre, Email, PasswordHash, Rol, EmailVerificado)
              VALUES (@nombre, @email, @hash, 'Admin', 1)`)
    console.log(`\n✔ Administrador creado: ${nombre} (${email}). Ya puede iniciar sesión en el sitio.`)
  }
  terminar(0)
})().catch(err => {
  console.error('\n✖ Error:', err.message)
  terminar(1)
})
