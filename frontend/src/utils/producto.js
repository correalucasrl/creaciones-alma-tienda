// Convierte un nombre en un slug para URLs: "Álbum Día del Padre" -> "album-dia-del-padre"
export function slugify(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// La URL lleva el id adelante (/producto/3-stickers-personalizados): hay productos con el
// mismo nombre, y si se renombra uno el link viejo sigue funcionando (redirige al nuevo slug)
export function urlProducto(producto) {
  const slug = slugify(producto.Nombre)
  return `/producto/${producto.Id}${slug ? '-' + slug : ''}`
}

export function idDesdeSlug(slug) {
  const id = parseInt(String(slug), 10)
  return Number.isInteger(id) && id > 0 ? id : null
}
