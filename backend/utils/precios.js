// Precio que se cobra hoy por un producto: el de oferta si está cargado, es menor
// al precio normal y no venció. Toda la lógica de precios del sitio pasa por acá,
// así el checkout cobra exactamente lo que muestra el catálogo.
function enOferta(producto, ahora = new Date()) {
  const oferta = producto.PrecioOferta === null || producto.PrecioOferta === undefined ? null : Number(producto.PrecioOferta)
  if (oferta === null || !(oferta > 0) || oferta >= Number(producto.Precio)) return false
  if (producto.OfertaHasta && new Date(producto.OfertaHasta) < ahora) return false
  return true
}

function precioVigente(producto, ahora = new Date()) {
  return enOferta(producto, ahora) ? Number(producto.PrecioOferta) : Number(producto.Precio)
}

// Agrega al producto los campos calculados que usa el frontend
function decorarProducto(producto, ahora = new Date()) {
  const oferta = enOferta(producto, ahora)
  const precioFinal = precioVigente(producto, ahora)
  return {
    ...producto,
    EnOferta: oferta,
    PrecioFinal: precioFinal,
    DescuentoPct: oferta ? Math.round((1 - precioFinal / Number(producto.Precio)) * 100) : 0
  }
}

const redondear = n => Math.round(n * 100) / 100

// Evalúa un cupón para un subtotal. Devuelve { ok, descuento } o { ok: false, error }
function evaluarCupon(cupon, subtotal, ahora = new Date()) {
  if (!cupon || !cupon.Activo) return { ok: false, error: 'Ese cupón no existe o ya no está vigente' }
  if (cupon.FechaInicio && new Date(cupon.FechaInicio) > ahora) return { ok: false, error: 'Ese cupón todavía no está vigente' }
  if (cupon.FechaFin && new Date(cupon.FechaFin) < ahora) return { ok: false, error: 'Ese cupón ya venció' }
  if (cupon.UsosMaximos !== null && cupon.Usos >= cupon.UsosMaximos) return { ok: false, error: 'Ese cupón ya alcanzó su límite de usos' }
  if (cupon.MinimoCompra && subtotal < Number(cupon.MinimoCompra)) {
    return { ok: false, error: `Este cupón es para compras desde $${Number(cupon.MinimoCompra).toLocaleString('es-AR')}` }
  }

  const descuento = cupon.Tipo === 'porcentaje'
    ? subtotal * Number(cupon.Valor) / 100
    : Math.min(Number(cupon.Valor), subtotal)

  return { ok: true, descuento: redondear(descuento) }
}

module.exports = { enOferta, precioVigente, decorarProducto, evaluarCupon, redondear }
