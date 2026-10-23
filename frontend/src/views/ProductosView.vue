<template>
  <div>
    <section class="tienda-encabezado">
      <div class="container text-center">
        <span class="eyebrow">{{ ocasionActual ? 'Regalos para' : (soloOfertas ? 'Precios especiales' : 'Tienda') }}</span>
        <h1 class="tienda-titulo">
          <template v-if="ocasionActual"><em>{{ ocasionActual.Nombre }}</em></template>
          <template v-else-if="soloOfertas">Ofertas <em>del momento</em></template>
          <template v-else-if="categoriaActual">{{ categoriaActual.Nombre }}</template>
          <template v-else>Todos los <em>productos</em></template>
        </h1>
        <p class="section-subtitle mb-0">
          {{ ocasionActual?.Descripcion || 'Elegí, personalizá y recibilo en tu casa o retiralo en Marcos Paz.' }}
        </p>
      </div>
    </section>

    <div class="container pb-5">
      <div class="filtros">
        <div class="chips" role="tablist" aria-label="Categorías">
          <button type="button" class="chip" :class="{ activo: !slugActivo }" @click="elegirCategoria(null)">Todos</button>
          <button
            v-for="cat in categorias"
            :key="cat.Id"
            type="button"
            class="chip"
            :class="{ activo: slugActivo === cat.Slug }"
            @click="elegirCategoria(cat.Slug)"
          >
            {{ cat.Nombre }}
          </button>
        </div>

        <div class="controles">
          <div class="buscador">
            <i class="bi bi-search" aria-hidden="true"></i>
            <input v-model="busqueda" type="search" placeholder="Buscar..." aria-label="Buscar productos" />
          </div>
          <select v-if="ocasiones.some(o => o.CantidadProductos > 0) || ocasionSlug" :value="ocasionSlug || ''" class="form-select orden" aria-label="Filtrar por ocasión" @change="elegirOcasion($event.target.value)">
            <option value="">Todas las ocasiones</option>
            <option v-for="o in ocasiones.filter(o => o.CantidadProductos > 0 || o.Slug === ocasionSlug)" :key="o.Id" :value="o.Slug">{{ o.Nombre }}</option>
          </select>
          <label class="interruptor">
            <input v-model="soloOfertas" type="checkbox" class="form-check-input" />
            Solo ofertas
          </label>
          <select v-model="orden" class="form-select orden" aria-label="Ordenar productos">
            <option value="destacados">Destacados</option>
            <option value="nuevos">Más nuevos</option>
            <option value="precio-asc">Menor precio</option>
            <option value="precio-desc">Mayor precio</option>
            <option value="descuento">Mayor descuento</option>
          </select>
        </div>
      </div>

      <p v-if="!cargando" class="resultado">
        {{ productosFiltrados.length }} {{ productosFiltrados.length === 1 ? 'producto' : 'productos' }}
        <button v-if="hayFiltros" type="button" class="limpiar" @click="limpiarFiltros">Limpiar filtros</button>
      </p>

      <div v-if="cargando" class="row g-4">
        <div v-for="n in 8" :key="n" class="col-6 col-md-4 col-lg-3">
          <div class="esqueleto"></div>
        </div>
      </div>

      <div v-else-if="productosFiltrados.length === 0" class="vacio">
        <i class="bi bi-search-heart" aria-hidden="true"></i>
        <template v-if="ocasionActual && !productos.length">
          <p class="vacio-titulo">Estamos preparando ideas para {{ ocasionActual.Nombre }}</p>
          <p class="text-secondary">Mientras tanto, escribinos y armamos algo a medida para esa fecha.</p>
        </template>
        <template v-else>
          <p class="vacio-titulo">No encontramos productos con esos filtros</p>
          <p class="text-secondary">Probá con otra búsqueda o escribinos: hacemos pedidos a medida.</p>
        </template>
        <button type="button" class="btn btn-alma-borde" @click="limpiarFiltros">Ver todos los productos</button>
      </div>

      <div v-else class="row g-3 g-md-4">
        <div class="col-6 col-md-4 col-lg-3" v-for="producto in productosFiltrados" :key="producto.Id">
          <ProductoCard :producto="producto" @agregar="agregarAlCarrito" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../services/api'
import { useCartStore } from '../stores/cart'
import ProductoCard from '../components/ProductoCard.vue'

const route = useRoute()
const router = useRouter()
const cart = useCartStore()
const mostrarToast = inject('mostrarToast')

const categorias = ref([])
const productos = ref([])
const cargando = ref(true)
const busqueda = ref(route.query.buscar || '')
const soloOfertas = ref(route.query.ofertas === '1')
const orden = ref('destacados')

const ocasiones = ref([])

const slugActivo = computed(() => route.query.categoria || null)
const categoriaActual = computed(() => categorias.value.find(c => c.Slug === slugActivo.value))
const ocasionSlug = computed(() => route.query.ocasion || null)
const ocasionActual = computed(() => ocasiones.value.find(o => o.Slug === ocasionSlug.value))
const hayFiltros = computed(() => !!(slugActivo.value || ocasionSlug.value || busqueda.value.trim() || soloOfertas.value))

// Normaliza para buscar sin importar tildes ni mayúsculas ("album" encuentra "Álbum")
const normalizar = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const productosFiltrados = computed(() => {
  let lista = productos.value
  // Con ocasión, los productos vienen filtrados por ocasión y la categoría se aplica acá
  if (ocasionSlug.value && categoriaActual.value) lista = lista.filter(p => p.CategoriaId === categoriaActual.value.Id)
  const texto = normalizar(busqueda.value.trim())
  if (texto) lista = lista.filter(p => normalizar(p.Nombre).includes(texto) || normalizar(p.Descripcion).includes(texto))
  if (soloOfertas.value) lista = lista.filter(p => p.EnOferta)

  const precio = p => p.PrecioFinal ?? p.Precio
  const ordenes = {
    destacados: (a, b) => (b.Destacado - a.Destacado) || (b.EnOferta - a.EnOferta),
    nuevos: (a, b) => new Date(b.FechaCreacion) - new Date(a.FechaCreacion),
    'precio-asc': (a, b) => precio(a) - precio(b),
    'precio-desc': (a, b) => precio(b) - precio(a),
    descuento: (a, b) => (b.DescuentoPct || 0) - (a.DescuentoPct || 0)
  }
  return [...lista].sort(ordenes[orden.value])
})

async function cargarCategorias() {
  try {
    const { data } = await api.get('/categorias')
    categorias.value = data
  } catch (err) {
    console.error('Error al traer categorías:', err)
  }
}

async function cargarProductos() {
  cargando.value = true
  try {
    const url = ocasionSlug.value
      ? `/productos/ocasion/${encodeURIComponent(ocasionSlug.value)}`
      : (slugActivo.value ? `/productos/categoria/${slugActivo.value}` : '/productos')
    const { data } = await api.get(url)
    productos.value = data
  } catch (err) {
    console.error('Error al traer productos:', err)
  } finally {
    cargando.value = false
  }
}

// Los filtros viven en la URL, así se pueden compartir y el botón "atrás" funciona
function actualizarUrl(cambios) {
  const query = { ...route.query, ...cambios }
  Object.keys(query).forEach(k => { if (!query[k]) delete query[k] })
  router.replace({ path: '/productos', query })
}

function elegirCategoria(slug) {
  router.push({ path: '/productos', query: { ...route.query, categoria: slug || undefined } })
}

function elegirOcasion(slug) {
  router.push({ path: '/productos', query: { ...route.query, ocasion: slug || undefined } })
}

async function cargarOcasiones() {
  try {
    const { data } = await api.get('/ocasiones')
    ocasiones.value = data
  } catch (err) {
    console.error('Error al traer ocasiones:', err)
  }
}

function limpiarFiltros() {
  busqueda.value = ''
  soloOfertas.value = false
  router.push({ path: '/productos' })
}

watch(busqueda, v => actualizarUrl({ buscar: v.trim() || undefined }))
watch(soloOfertas, v => actualizarUrl({ ofertas: v ? '1' : undefined }))
watch(() => route.query.buscar, v => { if ((v || '') !== busqueda.value.trim()) busqueda.value = v || '' })
watch(() => route.query.ofertas, v => { soloOfertas.value = v === '1' })
watch(() => [route.query.categoria, route.query.ocasion], cargarProductos)

onMounted(async () => {
  await Promise.all([cargarCategorias(), cargarOcasiones()])
  await cargarProductos()
})

function agregarAlCarrito(producto) {
  cart.agregarProducto(producto)
  mostrarToast(`${producto.Nombre} se sumó a tu carrito`)
}
</script>

<style scoped>
.tienda-encabezado {
  padding: 56px 0 32px;
}
.tienda-titulo {
  font-size: clamp(2rem, 4vw, 3rem);
  margin-bottom: 0.6rem;
}
.tienda-titulo em {
  color: var(--rosa-viejo);
  font-style: italic;
}
.filtros {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}
.chips {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: none;
  justify-content: center;
  flex-wrap: wrap;
}
.chip {
  border: 1px solid var(--rosa-polvo-medio);
  background: var(--blanco);
  color: var(--ciruela);
  border-radius: 999px;
  padding: 8px 18px;
  font-size: 0.9rem;
  white-space: nowrap;
  transition: background-color 0.2s, border-color 0.2s, color 0.2s;
}
.chip:hover { border-color: var(--rosa-viejo); }
.chip.activo {
  background: var(--lila-fuerte);
  border-color: var(--lila-fuerte);
  color: var(--crema);
}
.controles {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}
.buscador {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--blanco);
  border: 1px solid var(--rosa-polvo-medio);
  border-radius: 999px;
  padding: 8px 16px;
  min-width: 240px;
}
.buscador input {
  border: none;
  outline: none;
  background: transparent;
  flex: 1;
  color: var(--ciruela);
  min-width: 0;
}
.interruptor {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.92rem;
  cursor: pointer;
  margin: 0;
}
.interruptor .form-check-input { margin: 0; }
.orden {
  width: auto;
  border-radius: 999px;
  font-size: 0.92rem;
  padding-right: 2.2rem;
}
.resultado {
  color: var(--ciruela-suave);
  font-size: 0.9rem;
  margin-bottom: 18px;
}
.limpiar {
  border: none;
  background: none;
  color: var(--rosa-texto);
  text-decoration: underline;
  text-underline-offset: 3px;
  margin-left: 8px;
  font-size: 0.9rem;
}
.esqueleto {
  aspect-ratio: 3 / 4;
  border-radius: var(--radio-grande);
  background: linear-gradient(90deg, var(--rosa-polvo) 25%, var(--crema-oscura) 50%, var(--rosa-polvo) 75%);
  background-size: 200% 100%;
  animation: brillo 1.4s infinite;
}
@keyframes brillo { to { background-position: -200% 0; } }
.vacio {
  text-align: center;
  padding: 60px 0;
}
.vacio i {
  font-size: 2.8rem;
  color: var(--rosa-viejo);
}
.vacio-titulo {
  font-family: var(--fuente-titulos);
  font-size: 1.4rem;
  margin: 12px 0 6px;
}
</style>
