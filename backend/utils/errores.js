// Loguea el error real en el servidor y le devuelve al cliente un mensaje genérico,
// para no exponer detalles internos (SQL Server, APIs externas, rutas, etc.)
function manejarError(res, err, mensaje = 'Ocurrió un error inesperado. Probá de nuevo en unos minutos.') {
  console.error(`[${new Date().toISOString()}]`, err)
  res.status(500).json({ error: mensaje })
}

module.exports = { manejarError }
