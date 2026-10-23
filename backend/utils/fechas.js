// Las fechas se guardan en UTC (SYSUTCDATETIME). Para agrupar o filtrar por día, semana
// o mes hay que pasarlas a hora de Argentina; si no, un pedido de las 22 h caería en el día
// siguiente. Todo esto funciona igual sin importar en qué zona horaria corra el servidor.
const ZONA = 'America/Argentina/Buenos_Aires'
const ZONA_SQL = 'Argentina Standard Time'

const formato = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short'
})
const DIAS = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }

// Año, mes, día y día de la semana (1 = lunes ... 7 = domingo) en hora argentina
function partesArgentina(fecha = new Date()) {
  const p = Object.fromEntries(formato.formatToParts(new Date(fecha)).map(x => [x.type, x.value]))
  return { anio: Number(p.year), mes: Number(p.month), dia: Number(p.day), diaSemana: DIAS[p.weekday] }
}

const dos = n => String(n).padStart(2, '0')

// "AAAA-MM-DD" del día en Argentina
function diaArgentina(fecha = new Date()) {
  const { anio, mes, dia } = partesArgentina(fecha)
  return `${anio}-${dos(mes)}-${dos(dia)}`
}

// "AAAA-MM-DD" del lunes de la semana (en Argentina) de esa fecha
function lunesArgentina(fecha) {
  const { anio, mes, dia, diaSemana } = partesArgentina(fecha)
  const lunes = new Date(Date.UTC(anio, mes - 1, dia - (diaSemana - 1)))
  return lunes.toISOString().slice(0, 10)
}

// Convierte "AAAA-MM-DD" (un día de Argentina) en el instante UTC en que empieza o termina
function inicioDiaArgentina(diaTexto) {
  return new Date(`${diaTexto}T00:00:00.000-03:00`)
}
function finDiaArgentina(diaTexto) {
  return new Date(`${diaTexto}T23:59:59.997-03:00`)
}

// Expresión SQL que pasa una columna guardada en UTC a hora argentina (para YEAR, MONTH, etc.)
function sqlArgentina(columna) {
  return `(CAST(${columna} AS DATETIME2) AT TIME ZONE 'UTC' AT TIME ZONE '${ZONA_SQL}')`
}

// Expresión SQL de "ahora" en hora argentina
const SQL_AHORA_ARGENTINA = `(SYSDATETIMEOFFSET() AT TIME ZONE '${ZONA_SQL}')`

module.exports = {
  partesArgentina, diaArgentina, lunesArgentina, inicioDiaArgentina, finDiaArgentina, sqlArgentina, SQL_AHORA_ARGENTINA
}
