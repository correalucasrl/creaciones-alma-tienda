<template>
  <div class="admin-pagina">
    <header class="admin-encabezado">
      <div>
        <h1 class="admin-titulo">Productos y ofertas</h1>
        <p class="admin-descripcion">Cargá productos, precios, stock, fotos y ofertas.</p>
      </div>
    </header>

    <div class="row mb-4">
      <div class="col-12 col-lg-9">
        <div class="form-card p-4">
          <h6 class="fw-bold mb-3">{{ editando ? 'Editar producto' : 'Nuevo producto' }}</h6>

          <div v-if="error" class="alert alert-danger py-2 small">{{ error }}</div>

          <form @submit.prevent="guardar">
            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label class="form-label small fw-semibold">Nombre</label>
                <input v-model="form.nombre" class="form-control" required />
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label small fw-semibold">Categoría</label>
                <select v-model="form.categoriaId" class="form-select" required>
                  <option value="" disabled>Elegí una categoría</option>
                  <option v-for="cat in categorias" :key="cat.Id" :value="cat.Id">{{ cat.Nombre }}</option>
                </select>
              </div>

              <div class="col-6 col-md-3">
                <label class="form-label small fw-semibold">Precio</label>
                <input v-model.number="form.precio" type="number" step="0.01" class="form-control" required />
              </div>
              <div class="col-6 col-md-3">
                <label class="form-label small fw-semibold">Stock</label>
                <input v-model.number="form.stock" type="number" class="form-control" required />
              </div>

              <div v-if="ocasiones.length" class="col-12">
                <span class="form-label small fw-semibold d-block">Ocasiones para regalar (opcional)</span>
                <div class="d-flex flex-wrap gap-2">
                  <label v-for="o in ocasiones" :key="o.Id" class="chip-ocasion" :class="{ activa: form.ocasiones.includes(o.Id) }">
                    <input v-model="form.ocasiones" type="checkbox" :value="o.Id" class="visually-hidden" />
                    <i :class="['bi', o.Icono || 'bi-gift']" aria-hidden="true"></i> {{ o.Nombre }}
                  </label>
                </div>
              </div>

              <div class="col-12">
                <div class="oferta-box p-3">
                  <div class="row g-2 align-items-end">
                    <div class="col-6 col-md-4">
                      <label class="form-label small fw-semibold">Precio de oferta (opcional)</label>
                      <input v-model.number="form.precioOferta" type="number" step="0.01" min="0" class="form-control" placeholder="Sin oferta" />
                    </div>
                    <div class="col-6 col-md-4">
                      <label class="form-label small fw-semibold">Oferta válida hasta (opcional)</label>
                      <input v-model="form.ofertaHasta" type="date" class="form-control" :disabled="!form.precioOferta" />
                    </div>
                    <div class="col-12 col-md-4 small">
                      <span v-if="porcentajeOferta > 0" class="badge-alma badge-oferta">{{ porcentajeOferta }}% OFF</span>
                      <span v-else-if="form.precioOferta" class="text-danger">Tiene que ser menor al precio</span>
                      <span v-else class="text-secondary">Se muestra el precio tachado y el % OFF</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-12 col-md-6">
              <SubidaImagen v-model="form.imagenPrincipalUrl" label="Imagen principal" />
              </div>

              <div class="col-12">
                <label class="form-label small fw-semibold d-block mb-1">
                  Imágenes extra <span class="text-secondary fw-normal">({{ form.imagenes.length }}/{{ MAX_IMAGENES }}, se ven como miniaturas en la ficha del producto)</span>
                </label>
                <div class="d-flex flex-wrap gap-3 align-items-start">
                  <div v-for="(url, i) in form.imagenes" :key="url" class="extra">
                    <img :src="url" :alt="`Imagen extra ${i + 1}`" />
                    <div class="extra-acciones">
                      <button type="button" :disabled="i === 0" :aria-label="`Mover imagen ${i + 1} a la izquierda`" @click="moverImagen(i, -1)">
                        <i class="bi bi-chevron-left"></i>
                      </button>
                      <button type="button" :aria-label="`Quitar imagen ${i + 1}`" @click="form.imagenes.splice(i, 1)">
                        <i class="bi bi-trash"></i>
                      </button>
                      <button type="button" :disabled="i === form.imagenes.length - 1" :aria-label="`Mover imagen ${i + 1} a la derecha`" @click="moverImagen(i, 1)">
                        <i class="bi bi-chevron-right"></i>
                      </button>
                    </div>
                  </div>
                  <div v-if="form.imagenes.length < MAX_IMAGENES" class="extra-subida">
                    <SubidaImagen v-model="nuevaImagen" label="" />
                  </div>
                </div>
              </div>

              <div class="col-12">
                <label class="form-label small fw-semibold">Descripción</label>
                <textarea v-model="form.descripcion" class="form-control" rows="2"></textarea>
              </div>

              <div class="col-12 d-flex align-items-center gap-2">
                <input v-model="form.destacado" type="checkbox" id="destacado" class="form-check-input" />
                <label for="destacado" class="form-check-label small">Mostrar en "Productos destacados"</label>
              </div>

              <div class="col-12 d-flex gap-2">
                <button type="submit" class="btn btn-turquesa">
                  {{ editando ? 'Guardar cambios' : 'Crear producto' }}
                </button>
                <button v-if="editando" type="button" class="btn btn-outline-secondary" @click="cancelarEdicion">
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>

    <div class="admin-filtros" role="group" aria-label="Filtrar productos">
      <button
        v-for="f in filtros"
        :key="f.valor"
        type="button"
        class="admin-filtro"
        :class="{ activo: filtro === f.valor }"
        :aria-pressed="filtro === f.valor"
        @click="filtro = f.valor"
      >
        {{ f.nombre }}<small>{{ f.cantidad }}</small>
      </button>
    </div>

    <div v-if="!productosFiltrados.length" class="admin-vacio">
      <i class="bi bi-box-seam" aria-hidden="true"></i>
      {{ filtro === 'stockBajo' ? 'Ningún producto activo tiene stock bajo.' : 'No hay productos para mostrar.' }}
    </div>

    <div v-else class="table-responsive">
      <table class="table align-middle bg-white admin-table">
        <thead>
          <tr>
            <th></th>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="prod in productosFiltrados" :key="prod.Id">
            <td>
              <img :src="prod.ImagenPrincipalUrl || 'https://placehold.co/50x50/f3c6d8/333?text=?'" class="thumb" />
            </td>
            <td class="fw-semibold">{{ prod.Nombre }}</td>
            <td class="small text-secondary">{{ prod.CategoriaNombre || '—' }}</td>
            <td>
              <template v-if="prod.EnOferta">
                <span class="precio-oferta">${{ prod.PrecioFinal.toLocaleString('es-AR') }}</span>
                <span class="precio-tachado d-block">${{ prod.Precio.toLocaleString('es-AR') }}</span>
              </template>
              <template v-else>${{ prod.Precio.toLocaleString('es-AR') }}</template>
            </td>
            <td class="text-nowrap">
              {{ prod.Stock }}
              <span v-if="tieneStockBajo(prod)" class="badge-estado ms-1" :class="prod.Stock <= 0 ? 'estado-sin-stock' : 'estado-pendiente'">
                {{ prod.Stock <= 0 ? 'Sin stock' : 'Stock bajo' }}
              </span>
            </td>
            <td>
              <span class="badge-estado" :class="prod.Activo ? 'estado-activo' : 'estado-inactivo'">
                {{ prod.Activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td>
            <button class="btn btn-sm btn-outline-secondary me-2" @click="editar(prod)">
                <i class="bi bi-pencil"></i>
            </button>
            <button v-if="prod.Activo" class="btn btn-sm btn-outline-danger" @click="eliminar(prod)">
                <i class="bi bi-trash"></i>
            </button>
            <button v-else class="btn btn-sm btn-outline-success" @click="reactivar(prod)">
                <i class="bi bi-arrow-counterclockwise"></i>
            </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject, watch } from 'vue'
import api from '../services/api'
import SubidaImagen from '../components/SubidaImagen.vue'
import { STOCK_BAJO, tieneStockBajo } from '../utils/stock'

const MAX_IMAGENES = 8

const productos = ref([])
const nuevaImagen = ref('')
const categorias = ref([])
const ocasiones = ref([])
const editando = ref(null)
const error = ref('')
const mostrarToast = inject('mostrarToast')
const refrescarContadores = inject('refrescarContadores', () => {})

const filtro = ref('')
const filtros = computed(() => [
  { valor: '', nombre: 'Todos', cantidad: productos.value.length },
  { valor: 'stockBajo', nombre: `Stock bajo (${STOCK_BAJO} o menos)`, cantidad: productos.value.filter(tieneStockBajo).length },
  { valor: 'inactivos', nombre: 'Inactivos', cantidad: productos.value.filter(p => !p.Activo).length }
])
const productosFiltrados = computed(() => {
  if (filtro.value === 'stockBajo') return productos.value.filter(tieneStockBajo)
  if (filtro.value === 'inactivos') return productos.value.filter(p => !p.Activo)
  return productos.value
})

const formVacio = {
  nombre: '',
  descripcion: '',
  precio: null,
  stock: 0,
  categoriaId: '',
  imagenPrincipalUrl: '',
  destacado: false,
  imagenes: [],
  ocasiones: [],
  precioOferta: null,
  ofertaHasta: ''
}

const porcentajeOferta = computed(() => {
  const { precio, precioOferta } = form.value
  if (!precio || !precioOferta || precioOferta >= precio) return 0
  return Math.round((1 - precioOferta / precio) * 100)
})

// Fecha guardada en UTC -> "AAAA-MM-DD" del día en Argentina, para el input de fecha
function diaArgentina(fecha) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date(fecha))
}
const form = ref(nuevoForm())

// Copia nueva del formulario vacío (el array de imágenes no se tiene que compartir entre ediciones)
function nuevoForm() {
  return { ...formVacio, imagenes: [], ocasiones: [] }
}

// Cuando termina de subir una imagen extra, se suma a la lista y la zona de subida queda libre
watch(nuevaImagen, (url) => {
  if (!url) return
  if (!form.value.imagenes.includes(url)) form.value.imagenes.push(url)
  nuevaImagen.value = ''
})

function moverImagen(i, direccion) {
  const lista = form.value.imagenes
  const destino = i + direccion
  ;[lista[i], lista[destino]] = [lista[destino], lista[i]]
}

onMounted(async () => {
  await Promise.all([cargarProductos(), cargarCategorias(), cargarOcasiones()])
})

async function cargarProductos() {
  const { data } = await api.get('/productos/admin/todos')
  productos.value = data
  refrescarContadores()
}

async function cargarOcasiones() {
  try {
    const { data } = await api.get('/ocasiones/admin/todas')
    ocasiones.value = data
  } catch (err) {
    console.error('No se pudieron cargar las ocasiones:', err)
  }
}

async function cargarCategorias() {
  const { data } = await api.get('/categorias')
  categorias.value = data
}

async function guardar() {
  error.value = ''
  try {
    if (editando.value) {
      await api.put(`/productos/${editando.value}`, { ...form.value, activo: true })
      mostrarToast('Producto actualizado ✅')
    } else {
      await api.post('/productos', form.value)
      mostrarToast('Producto creado 🎉')
    }
    form.value = nuevoForm()
    editando.value = null
    await cargarProductos()
  } catch (err) {
    error.value = err.response?.data?.error || 'Error al guardar'
  }
}

function editar(prod) {
  form.value = {
    nombre: prod.Nombre,
    descripcion: prod.Descripcion || '',
    precio: prod.Precio,
    stock: prod.Stock,
    categoriaId: prod.CategoriaId,
    imagenPrincipalUrl: prod.ImagenPrincipalUrl || '',
    destacado: prod.Destacado,
    imagenes: [...(prod.Imagenes || [])],
    precioOferta: prod.PrecioOferta ?? null,
    ofertaHasta: prod.OfertaHasta ? diaArgentina(prod.OfertaHasta) : '',
    ocasiones: [...(prod.Ocasiones || [])]
  }
  editando.value = prod.Id
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function cancelarEdicion() {
  form.value = nuevoForm()
  editando.value = null
}

const mostrarConfirm = inject('mostrarConfirm')

async function eliminar(prod) {
  const ok = await mostrarConfirm({
    titulo: '¿Eliminar producto?',
    mensaje: `Estás por eliminar "${prod.Nombre}". Esta acción se puede revertir después.`,
    esError: false
  })

  if (!ok) return

  try {
    await api.delete(`/productos/${prod.Id}`)
    mostrarToast('Producto eliminado')
    await cargarProductos()
  } catch (err) {
    await mostrarConfirm({
      titulo: 'Error',
      mensaje: err.response?.data?.error || 'Error al eliminar',
      esError: true,
      soloInfo: true
    })
  }
}

async function reactivar(prod) {
  try {
    await api.put(`/productos/admin/${prod.Id}/reactivar`)
    mostrarToast('Producto reactivado ✅')
    await cargarProductos()
  } catch (err) {
    alert(err.response?.data?.error || 'Error al reactivar')
  }
}
</script>

<style scoped>
.thumb {
  width: 45px;
  height: 45px;
  border-radius: 8px;
  object-fit: cover;
}
.chip-ocasion {
  border: 1px solid var(--rosa-polvo-medio);
  border-radius: 999px;
  padding: 6px 14px;
  font-size: 0.85rem;
  cursor: pointer;
  background: white;
  transition: background-color 0.2s, border-color 0.2s;
}
.chip-ocasion:focus-within {
  outline: 2px solid var(--rosa-viejo);
  outline-offset: 2px;
}
.chip-ocasion.activa {
  background: var(--rosa-polvo);
  border-color: var(--rosa-viejo);
  color: var(--rosa-texto);
}
.oferta-box {
  background: var(--rosa-polvo);
  border-radius: 14px;
}
.extra {
  width: 110px;
}
.extra img {
  width: 110px;
  height: 110px;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}
.extra-acciones {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
}
.extra-acciones button {
  border: none;
  background: #f3f4f6;
  border-radius: 8px;
  width: 32px;
  height: 28px;
  font-size: 0.8rem;
}
.extra-acciones button:disabled {
  opacity: 0.35;
}
.extra-subida {
  width: 140px;
}
</style>