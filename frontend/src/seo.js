// Título, descripción, canonical y robots por página. Cada ruta los define en su "meta";
// las que no lo hacen usan los valores por defecto del sitio. Las páginas con datos que
// llegan de la API (ej: ficha de producto) llaman a aplicarSeo de nuevo cuando cargan.
const NOMBRE_SITIO = 'Creaciones Alma'
const DESCRIPCION_DEFECTO =
  'Papelería creativa hecha a mano: fotos Polaroid, stickers, álbumes e impresiones personalizadas. Envíos a todo el país y retiro en Marcos Paz.'
export const SITE_URL = (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, '')

function setMeta(atributo, clave, contenido) {
  let etiqueta = document.head.querySelector(`meta[${atributo}="${clave}"]`)
  if (!contenido) {
    etiqueta?.remove()
    return
  }
  if (!etiqueta) {
    etiqueta = document.createElement('meta')
    etiqueta.setAttribute(atributo, clave)
    document.head.appendChild(etiqueta)
  }
  etiqueta.setAttribute('content', contenido)
}

function setCanonical(url) {
  let link = document.head.querySelector('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', url)
}

// Datos estructurados propios de la página (ej: Product). Se reemplazan en cada navegación;
// el JSON-LD general de la tienda que está en index.html no se toca
function setJsonLdPagina(datos) {
  document.head.querySelector('script[data-seo-pagina]')?.remove()
  if (!datos) return

  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.dataset.seoPagina = ''
  script.textContent = JSON.stringify(datos)
  document.head.appendChild(script)
}

export function aplicarSeo(ruta) {
  const titulo = ruta.meta.titulo ? `${ruta.meta.titulo} | ${NOMBRE_SITIO}` : `${NOMBRE_SITIO} | Papelería creativa`
  const descripcion = ruta.meta.descripcion || DESCRIPCION_DEFECTO
  const url = SITE_URL + ruta.path

  document.title = titulo
  setMeta('name', 'description', descripcion)
  setMeta('name', 'robots', ruta.meta.noindex ? 'noindex, nofollow' : 'index, follow')
  setMeta('property', 'og:type', ruta.meta.tipo || 'website')
  setMeta('property', 'og:title', titulo)
  setMeta('property', 'og:description', descripcion)
  setMeta('property', 'og:url', url)
  // Sin imagen propia (por ejemplo, una ficha sin foto), se usa la imagen general de la marca
  setMeta('property', 'og:image', ruta.meta.imagen || `${SITE_URL}/og-imagen.png`)
  setMeta('name', 'twitter:image', ruta.meta.imagen || `${SITE_URL}/og-imagen.png`)
  setCanonical(url)
  setJsonLdPagina(ruta.meta.jsonLd)
}
