// Analítica opcional: Google Analytics 4 y píxel de Meta (Facebook / Instagram).
// Cada una se activa solo si su ID está en el .env (VITE_GA_ID, VITE_META_PIXEL_ID);
// sin IDs no se carga ningún script de terceros. El panel de admin nunca se mide.

const GA_ID = import.meta.env.VITE_GA_ID
const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID

export const analiticaActiva = Boolean(GA_ID || PIXEL_ID)

const MONEDA = 'ARS'
const CLAVE_COMPRA = 'compraPendiente'

function cargarScript(src) {
  const s = document.createElement('script')
  s.async = true
  s.src = src
  document.head.appendChild(s)
}

export function iniciarAnalitica() {
  if (GA_ID) {
    window.dataLayer = window.dataLayer || []
    window.gtag = function () { window.dataLayer.push(arguments) }
    window.gtag('js', new Date())
    // Las páginas vistas se mandan a mano en cada cambio de ruta (es una SPA)
    window.gtag('config', GA_ID, { send_page_view: false })
    cargarScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`)
  }
  if (PIXEL_ID) {
    const fbq = function () {
      fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments)
    }
    fbq.push = fbq
    fbq.loaded = true
    fbq.version = '2.0'
    fbq.queue = []
    window.fbq = window._fbq = fbq
    window.fbq('init', PIXEL_ID)
    cargarScript('https://connect.facebook.net/en_US/fbevents.js')
  }
}

const fueraDelAdmin = () => !window.location.pathname.startsWith('/admin')

export function registrarPagina(path, titulo) {
  if (!analiticaActiva || path.startsWith('/admin')) return
  window.gtag?.('event', 'page_view', { page_path: path, page_title: titulo, page_location: window.location.href })
  window.fbq?.('track', 'PageView')
}

const itemGa = i => ({ item_id: String(i.productoId), item_name: i.nombre, price: i.precio, quantity: i.cantidad })

export function registrarAgregadoAlCarrito(item) {
  if (!analiticaActiva || !fueraDelAdmin()) return
  const valor = item.precio * item.cantidad
  window.gtag?.('event', 'add_to_cart', { currency: MONEDA, value: valor, items: [itemGa(item)] })
  window.fbq?.('track', 'AddToCart', { content_ids: [String(item.productoId)], content_type: 'product', value: valor, currency: MONEDA })
}

export function registrarInicioCheckout(items, total) {
  if (!analiticaActiva) return
  window.gtag?.('event', 'begin_checkout', { currency: MONEDA, value: total, items: items.map(itemGa) })
  window.fbq?.('track', 'InitiateCheckout', { value: total, currency: MONEDA, num_items: items.length })
}

// La compra se confirma en otra página (después de Mercado Pago), así que el checkout deja
// anotado el pedido y la página de confirmación lo registra una sola vez
export function anotarCompra(ordenId, total, items) {
  if (!analiticaActiva) return
  try {
    localStorage.setItem(CLAVE_COMPRA, JSON.stringify({ ordenId: String(ordenId), total, items: items.map(itemGa) }))
  } catch { /* sin almacenamiento no se mide la compra, no pasa nada */ }
}

export function registrarCompra(ordenId) {
  if (!analiticaActiva) return
  let compra
  try {
    compra = JSON.parse(localStorage.getItem(CLAVE_COMPRA))
  } catch { return }
  if (!compra || compra.ordenId !== String(ordenId)) return
  localStorage.removeItem(CLAVE_COMPRA)
  window.gtag?.('event', 'purchase', { transaction_id: compra.ordenId, currency: MONEDA, value: compra.total, items: compra.items })
  window.fbq?.('track', 'Purchase', { value: compra.total, currency: MONEDA, content_type: 'product' })
}
