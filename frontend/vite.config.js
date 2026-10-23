import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { urlProducto } from './src/utils/producto.js'

// Páginas públicas que Google tiene que indexar (las privadas llevan noindex desde el router)
const RUTAS_PUBLICAS = [
  { path: '/', prioridad: '1.0', frecuencia: 'weekly' },
  { path: '/productos', prioridad: '0.9', frecuencia: 'weekly' },
  { path: '/regalos', prioridad: '0.8', frecuencia: 'weekly' },
  { path: '/galeria', prioridad: '0.7', frecuencia: 'monthly' },
  { path: '/nosotros', prioridad: '0.5', frecuencia: 'yearly' },
  { path: '/terminos', prioridad: '0.3', frecuencia: 'yearly' },
  { path: '/privacidad', prioridad: '0.3', frecuencia: 'yearly' },
  { path: '/devoluciones', prioridad: '0.3', frecuencia: 'yearly' },
  { path: '/arrepentimiento', prioridad: '0.3', frecuencia: 'yearly' },
]

// Pide a la API los productos activos para sumarlos al sitemap. Si la API no responde
// (ej: build sin backend levantado), el sitemap sale igual con las páginas fijas
// Páginas de "comprar por ocasión" (la tienda filtrada por ocasión)
async function urlsDeOcasiones(apiUrl) {
  try {
    const resp = await fetch(`${apiUrl.replace(/\/$/, '')}/ocasiones`, { signal: AbortSignal.timeout(10000) })
    if (!resp.ok) throw new Error(`status ${resp.status}`)
    const ocasiones = await resp.json()
    return ocasiones.map(o => ({ path: `/productos?ocasion=${encodeURIComponent(o.Slug)}`, prioridad: '0.6', frecuencia: 'monthly' }))
  } catch (err) {
    console.warn(`\n⚠️  sitemap.xml sin ocasiones: no se pudo consultar ${apiUrl} (${err.message})`)
    return []
  }
}

async function urlsDeProductos(apiUrl) {
  try {
    const resp = await fetch(`${apiUrl.replace(/\/$/, '')}/productos`, { signal: AbortSignal.timeout(10000) })
    if (!resp.ok) throw new Error(`status ${resp.status}`)
    const productos = await resp.json()
    return productos.map(p => ({ path: urlProducto(p), prioridad: '0.8', frecuencia: 'weekly' }))
  } catch (err) {
    console.warn(`\n⚠️  sitemap.xml sin productos: no se pudo consultar ${apiUrl} (${err.message})`)
    return []
  }
}

// Genera robots.txt y sitemap.xml con la URL real del sitio (VITE_SITE_URL).
// En desarrollo los sirve en vivo; en el build los escribe en dist/
function seoArchivos(siteUrl, apiUrl) {
  const base = (siteUrl || 'http://localhost:5173').replace(/\/$/, '')

  const robots = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin/',
    'Disallow: /checkout',
    'Disallow: /mis-pedidos',
    'Disallow: /orden-confirmada/',
    'Disallow: /resetear-password/',
    'Disallow: /verificar-email/',
    '',
    `Sitemap: ${base}/sitemap.xml`,
    '',
  ].join('\n')

  async function generarSitemap() {
    const rutas = [...RUTAS_PUBLICAS, ...(await urlsDeOcasiones(apiUrl)), ...(await urlsDeProductos(apiUrl))]
    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...rutas.map(r =>
        `  <url><loc>${base}${r.path}</loc><changefreq>${r.frecuencia}</changefreq><priority>${r.prioridad}</priority></url>`
      ),
      '</urlset>',
      '',
    ].join('\n')
  }

  const archivos = {
    '/robots.txt': ['text/plain', async () => robots],
    '/sitemap.xml': ['application/xml', generarSitemap],
  }

  return {
    name: 'seo-archivos',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const archivo = archivos[req.url]
        if (!archivo) return next()
        res.setHeader('Content-Type', `${archivo[0]}; charset=utf-8`)
        res.end(await archivo[1]())
      })
    },
    // Completa las URLs absolutas de index.html (imagen para compartir en redes)
    transformIndexHtml(html) {
      return html.replaceAll('__SITE_URL__', base)
    },
    async generateBundle() {
      for (const [ruta, [, generar]] of Object.entries(archivos)) {
        this.emitFile({ type: 'asset', fileName: ruta.slice(1), source: await generar() })
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  return {
    plugins: [
      vue(),
      vueDevTools(),
      seoArchivos(env.VITE_SITE_URL, env.VITE_API_URL || 'http://localhost:3000/api'),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      // El único archivo que pasa los 500 kB es ECharts (gráficos del panel de admin):
      // se descarga solo al entrar al Dashboard o a Finanzas, nunca en la tienda
      chunkSizeWarningLimit: 600,
    },
  }
})
