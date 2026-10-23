<template>
  <div class="container py-5">
    <div v-if="cargando" class="text-center py-5">
      <div class="spinner-border text-secondary" role="status"><span class="visually-hidden">Cargando...</span></div>
    </div>

    <div v-else-if="!producto" class="text-center py-5">
      <h1 class="section-title">No encontramos este producto</h1>
      <p class="text-secondary mb-4">Puede que ya no esté disponible.</p>
      <router-link to="/productos" class="btn btn-turquesa">Ver todos los productos</router-link>
    </div>

    <template v-else>
      <nav aria-label="Ubicación" class="mb-4">
        <ol class="breadcrumb small mb-0">
          <li class="breadcrumb-item"><router-link to="/">Inicio</router-link></li>
          <li class="breadcrumb-item"><router-link to="/productos">Productos</router-link></li>
          <li v-if="producto.CategoriaSlug" class="breadcrumb-item">
            <router-link :to="{ path: '/productos', query: { categoria: producto.CategoriaSlug } }">
              {{ producto.CategoriaNombre }}
            </router-link>
          </li>
          <li class="breadcrumb-item active" aria-current="page">{{ producto.Nombre }}</li>
        </ol>
      </nav>

      <div class="row g-4 g-lg-5">
        <div class="col-12 col-md-6">
          <img
            :src="imagenActual"
            :alt="producto.Nombre"
            class="img-principal w-100"
            role="button"
            @click="lightboxAbierto = true"
          />
          <div v-if="imagenes.length > 1" class="d-flex gap-2 mt-3 flex-wrap">
            <button
              v-for="(img, i) in imagenes"
              :key="img"
              type="button"
              class="miniatura p-0"
              :class="{ activa: img === imagenActual }"
              :aria-label="`Ver imagen ${i + 1} de ${producto.Nombre}`"
              @click="imagenActual = img"
            >
              <img :src="img" :alt="`${producto.Nombre} - imagen ${i + 1}`" loading="lazy" />
            </button>
          </div>
        </div>

        <div class="col-12 col-md-6">
          <p v-if="producto.CategoriaNombre" class="categoria small mb-1">{{ producto.CategoriaNombre }}</p>
          <h1 class="nombre mb-2">{{ producto.Nombre }}</h1>
          <div class="bloque-precio">
            <template v-if="producto.EnOferta">
              <span class="precio precio-oferta">${{ formato(producto.PrecioFinal) }}</span>
              <span class="precio-tachado">${{ formato(producto.Precio) }}</span>
              <span class="badge-alma badge-oferta">{{ producto.DescuentoPct }}% OFF</span>
            </template>
            <span v-else class="precio">${{ formato(producto.PrecioFinal ?? producto.Precio) }}</span>
          </div>
          <p v-if="producto.EnOferta && producto.OfertaHasta" class="oferta-hasta">
            <i class="bi bi-clock me-1"></i>Oferta válida hasta el {{ new Date(producto.OfertaHasta).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', day: 'numeric', month: 'long' }) }}
          </p>
          <p v-if="precioTransferencia" class="precio-transferencia">
            <i class="bi bi-bank me-1"></i><strong>${{ formato(precioTransferencia) }}</strong> pagando con transferencia
          </p>

          <p v-if="producto.Stock > 0" class="disponibilidad ok">
            <i class="bi bi-check-circle me-1"></i>Disponible{{ producto.Stock <= 5 ? ` · ¡quedan ${producto.Stock}!` : '' }}
          </p>
          <p v-else class="disponibilidad agotado"><i class="bi bi-x-circle me-1"></i>Sin stock por ahora</p>

          <div v-if="producto.Stock > 0" class="d-flex gap-2 align-items-center mb-4">
            <div class="input-group cantidad">
              <button class="btn btn-cantidad" type="button" aria-label="Restar uno" :disabled="cantidad <= 1" @click="cantidad--">−</button>
              <input
                v-model.number="cantidad"
                type="number"
                class="form-control text-center"
                min="1"
                :max="maxCantidad"
                aria-label="Cantidad"
                @change="ajustarCantidad"
              />
              <button class="btn btn-cantidad" type="button" aria-label="Sumar uno" :disabled="cantidad >= maxCantidad" @click="cantidad++">+</button>
            </div>
            <button class="btn btn-turquesa flex-grow-1" @click="agregarAlCarrito">
              <i class="bi bi-cart-plus me-1"></i>Agregar al carrito
            </button>
          </div>

          <a v-if="linkWhatsapp" :href="linkWhatsapp" target="_blank" rel="noopener" class="btn-whatsapp">
            <i class="bi bi-whatsapp" aria-hidden="true"></i>
            <span>
              <strong>Consultar por WhatsApp</strong>
              <small>¿Lo querés personalizado o tenés dudas? Te respondemos.</small>
            </span>
          </a>

          <div v-if="producto.Ocasiones?.length" class="ocasiones-producto">
            <span class="ocasiones-label">Ideal para</span>
            <router-link
              v-for="o in producto.Ocasiones"
              :key="o.Slug"
              :to="{ path: '/productos', query: { ocasion: o.Slug } }"
              class="ocasion-chip"
            >{{ o.Nombre }}</router-link>
          </div>

          <div v-if="producto.Descripcion" class="mb-4">
            <h2 class="h6 fw-bold">Descripción</h2>
            <p class="descripcion text-secondary mb-0">{{ producto.Descripcion }}</p>
          </div>

          <div class="info-box p-3 small">
            <p v-if="Number(config.valores.envio_gratis_desde) > 0" class="mb-2 envio-gratis">
              <i class="bi bi-gift me-2"></i>Envío gratis en compras desde ${{ formato(config.valores.envio_gratis_desde) }}
            </p>
            <p v-if="config.valores.texto_envios" class="mb-2"><i class="bi bi-truck me-2"></i>{{ config.valores.texto_envios }}</p>
            <p v-if="config.valores.texto_retiro" class="mb-2"><i class="bi bi-geo-alt me-2"></i>{{ config.valores.texto_retiro }}</p>
            <p class="mb-2"><i class="bi bi-credit-card me-2"></i>Mercado Pago, transferencia o efectivo en el retiro</p>
            <p class="mb-0">
              <i class="bi bi-arrow-counterclockwise me-2"></i>
              <router-link to="/devoluciones">Cambios y devoluciones</router-link>
              <span class="text-secondary"> (los productos personalizados no admiten arrepentimiento)</span>
            </p>
          </div>
        </div>
      </div>

      <section v-if="producto.Relacionados.length" class="mt-5">
        <h2 class="relacionados-titulo">También te puede <em>gustar</em></h2>
        <div class="row g-4">
          <div v-for="rel in producto.Relacionados" :key="rel.Id" class="col-6 col-md-3">
            <ProductoCard :producto="rel" @agregar="agregarRelacionado" />
          </div>
        </div>
      </section>
    </template>

    <LightboxGaleria
      :visible="lightboxAbierto"
      :imagenes="imagenes"
      :titulo="producto?.Nombre || ''"
      :indice-inicial="Math.max(imagenes.indexOf(imagenActual), 0)"
      @cerrar="lightboxAbierto = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../services/api'
import { useCartStore } from '../stores/cart'
import { useConfigStore } from '../stores/config'
import ProductoCard from '../components/ProductoCard.vue'
import LightboxGaleria from '../components/LightboxGaleria.vue'
import { idDesdeSlug, urlProducto } from '../utils/producto'
import { aplicarSeo, SITE_URL } from '../seo'

const MAX_CANTIDAD = 100

const route = useRoute()
const router = useRouter()
const cart = useCartStore()
const config = useConfigStore()
const mostrarToast = inject('mostrarToast')

const producto = ref(null)
const cargando = ref(true)
const cantidad = ref(1)
const imagenActual = ref('')
const lightboxAbierto = ref(false)

const imagenes = computed(() => {
  if (!producto.value) return []
  const todas = [producto.value.ImagenPrincipalUrl, ...producto.value.Imagenes].filter(Boolean)
  return todas.length ? [...new Set(todas)] : [placeholder(producto.value.Nombre)]
})

const maxCantidad = computed(() => Math.max(1, Math.min(producto.value?.Stock || 1, MAX_CANTIDAD)))

const precioTransferencia = computed(() => {
  const pct = Number(config.valores.descuento_transferencia_pct)
  if (!(pct > 0) || !producto.value) return null
  return Math.round((producto.value.PrecioFinal ?? producto.value.Precio) * (1 - pct / 100))
})

// Mensaje de WhatsApp ya armado con el producto y su link, para que la consulta llegue con contexto
const linkWhatsapp = computed(() => {
  const numero = config.valores.whatsapp_numero
  if (!numero || !producto.value) return null
  const texto = `¡Hola! Quería consultar por "${producto.value.Nombre}" 💗\n${SITE_URL}${urlProducto(producto.value)}`
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`
})

function formato(n) {
  return Number(n).toLocaleString('es-AR', { maximumFractionDigits: 2 })
}

function placeholder(nombre) {
  return 'https://placehold.co/600x600/ede9fe/6d28d9?text=' + encodeURIComponent(nombre)
}

function ajustarCantidad() {
  const n = Math.floor(Number(cantidad.value))
  cantidad.value = Number.isFinite(n) ? Math.min(Math.max(n, 1), maxCantidad.value) : 1
}

function agregarAlCarrito() {
  ajustarCantidad()
  cart.agregarProducto(producto.value, cantidad.value)
  mostrarToast(`${producto.value.Nombre} agregado exitosamente 🛍`)
}

function agregarRelacionado(rel) {
  cart.agregarProducto(rel)
  mostrarToast(`${rel.Nombre} agregado exitosamente 🛍`)
}

function aplicarSeoProducto(p) {
  const url = SITE_URL + urlProducto(p)
  const descripcion = (p.Descripcion || `${p.Nombre}, hecho a mano por Creaciones Alma.`).slice(0, 155)

  aplicarSeo({
    path: urlProducto(p),
    meta: {
      titulo: p.Nombre,
      descripcion,
      tipo: 'product',
      // Solo fotos reales; si no hay, seo.js usa la imagen general de la marca
      imagen: [p.ImagenPrincipalUrl, ...(p.Imagenes || [])].find(Boolean),
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Product',
            name: p.Nombre,
            description: p.Descripcion || undefined,
            image: imagenes.value,
            sku: String(p.Id),
            category: p.CategoriaNombre || undefined,
            brand: { '@type': 'Brand', name: 'Creaciones Alma' },
            offers: {
              '@type': 'Offer',
              url,
              price: Number(p.PrecioFinal ?? p.Precio).toFixed(2),
              ...(p.EnOferta && p.OfertaHasta && { priceValidUntil: new Date(p.OfertaHasta).toISOString().slice(0, 10) }),
              priceCurrency: 'ARS',
              availability: p.Stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
              itemCondition: 'https://schema.org/NewCondition',
              seller: { '@type': 'Organization', name: 'Creaciones Alma' }
            }
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE_URL + '/' },
              { '@type': 'ListItem', position: 2, name: 'Productos', item: SITE_URL + '/productos' },
              { '@type': 'ListItem', position: 3, name: p.Nombre, item: url }
            ]
          }
        ]
      }
    }
  })
}

async function cargar() {
  const id = idDesdeSlug(route.params.slug)
  cargando.value = true
  producto.value = null
  cantidad.value = 1

  try {
    if (!id) throw new Error('slug inválido')
    const { data } = await api.get(`/productos/detalle/${id}`)
    producto.value = data
    imagenActual.value = imagenes.value[0]

    // Si el nombre cambió o el link vino sin slug, se corrige la URL a la canónica
    const canonica = urlProducto(data)
    if (route.path !== canonica) {
      router.replace(canonica)
    }

    aplicarSeoProducto(data)
  } catch {
    aplicarSeo({ path: route.path, meta: { titulo: 'Producto no encontrado', noindex: true } })
  } finally {
    cargando.value = false
  }
}

watch(() => route.params.slug, (nuevo, anterior) => {
  // Al corregir solo el texto del slug (mismo id) no hace falta recargar
  if (anterior && idDesdeSlug(nuevo) === idDesdeSlug(anterior) && producto.value) {
    aplicarSeoProducto(producto.value)
    return
  }
  cargar()
}, { immediate: true })
</script>

<style scoped>
.breadcrumb {
  font-size: 0.85rem;
}
.breadcrumb a {
  color: var(--ciruela-suave);
  text-decoration: none;
}
.breadcrumb a:hover {
  color: var(--rosa-texto);
}
.breadcrumb-item.active {
  color: var(--ciruela);
}
.img-principal {
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 28px;
  background: var(--rosa-polvo);
  cursor: zoom-in;
  box-shadow: var(--sombra-suave);
}
.miniatura {
  width: 76px;
  height: 76px;
  border-radius: 14px;
  overflow: hidden;
  border: 2px solid transparent;
  background: none;
  transition: border-color 0.2s;
}
.miniatura.activa {
  border-color: var(--rosa-viejo);
}
.miniatura img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.categoria {
  color: var(--rosa-texto);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-size: 0.75rem;
}
.nombre {
  font-size: clamp(1.9rem, 3.5vw, 2.6rem);
  line-height: 1.1;
}
.bloque-precio {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 6px;
}
.precio {
  font-family: var(--fuente-titulos);
  font-size: 2rem;
  color: var(--ciruela);
}
.precio.precio-oferta {
  color: var(--oferta);
}
.precio-tachado {
  font-size: 1.1rem;
}
.oferta-hasta {
  font-size: 0.85rem;
  color: var(--oferta);
  margin-bottom: 6px;
}
.precio-transferencia {
  display: inline-block;
  background: var(--salvia);
  color: var(--salvia-texto);
  border-radius: 999px;
  padding: 6px 14px;
  font-size: 0.88rem;
  margin: 6px 0 14px;
}
.disponibilidad {
  font-size: 0.9rem;
  margin-bottom: 18px;
}
.disponibilidad.ok { color: var(--salvia-texto); }
.disponibilidad.agotado { color: var(--oferta); }
.cantidad {
  width: 132px;
  border: 1px solid var(--rosa-polvo-medio);
  border-radius: 999px;
  background: var(--blanco);
  overflow: hidden;
  flex-wrap: nowrap;
}
.cantidad .form-control {
  border: none;
  background: transparent;
  box-shadow: none;
}
.btn-cantidad {
  border: none;
  color: var(--ciruela);
  font-size: 1.1rem;
  padding: 0 14px;
}
.btn-cantidad:hover:not(:disabled) {
  background: var(--rosa-polvo);
}
.cantidad input::-webkit-outer-spin-button,
.cantidad input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.cantidad input {
  -moz-appearance: textfield;
}
.descripcion {
  white-space: pre-line;
  line-height: 1.7;
}
.info-box {
  background: var(--blanco);
  border: 1px solid var(--borde);
  border-radius: var(--radio-grande);
}
.info-box i {
  color: var(--rosa-viejo);
}
.info-box a {
  color: var(--rosa-texto);
}
.btn-whatsapp {
  display: flex;
  align-items: center;
  gap: 14px;
  border: 1px solid #bbf7d0;
  background: #f0fdf4;
  border-radius: 16px;
  padding: 12px 16px;
  margin: -6px 0 18px;
  text-decoration: none;
  color: var(--ciruela);
  transition: border-color 0.2s, background-color 0.2s;
}
.btn-whatsapp:hover {
  border-color: #25d366;
  background: #dcfce7;
  color: var(--ciruela);
}
.btn-whatsapp i {
  font-size: 1.7rem;
  color: #16a34a;
}
.btn-whatsapp span {
  display: flex;
  flex-direction: column;
}
.btn-whatsapp strong { font-weight: 500; }
.btn-whatsapp small { color: var(--ciruela-suave); }
.ocasiones-producto {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}
.ocasiones-label {
  font-size: 0.85rem;
  color: var(--ciruela-suave);
}
.ocasion-chip {
  background: var(--lila-suave);
  color: var(--lila-fuerte);
  border-radius: 999px;
  padding: 4px 12px;
  font-size: 0.82rem;
  text-decoration: none;
}
.ocasion-chip:hover {
  background: var(--rosa-polvo);
  color: var(--rosa-texto);
}
.envio-gratis {
  color: var(--salvia-texto);
  font-weight: 500;
}
.relacionados-titulo {
  font-size: clamp(1.6rem, 3vw, 2.1rem);
  margin-bottom: 24px;
}
.relacionados-titulo em {
  color: var(--rosa-viejo);
  font-style: italic;
}
</style>
