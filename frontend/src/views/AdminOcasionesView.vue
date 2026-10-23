<template>
  <div class="admin-pagina">
    <header class="admin-encabezado">
      <div>
        <h1 class="admin-titulo">Ocasiones</h1>
        <p class="admin-descripcion">Aparecen en el inicio ("Comprá por ocasión") y como filtro en la tienda. Los productos de cada ocasión se eligen en <router-link to="/admin/productos">Productos</router-link>.</p>
      </div>
    </header>

    <div class="row mb-4">
      <div class="col-12 col-lg-9">
        <form class="form-card p-4" @submit.prevent="guardar">
          <h6 class="fw-bold mb-3">{{ editando ? `Editar "${form.nombre}"` : 'Nueva ocasión' }}</h6>
          <div v-if="error" class="alert alert-danger py-2 small">{{ error }}</div>

          <div class="row g-3">
            <div class="col-12 col-md-6">
              <label class="form-label small fw-semibold" for="oc-nombre">Nombre</label>
              <input id="oc-nombre" v-model="form.nombre" class="form-control" placeholder="Día del Maestro" required maxlength="80" />
            </div>
            <div class="col-6 col-md-3">
              <label class="form-label small fw-semibold" for="oc-orden">Orden</label>
              <input id="oc-orden" v-model.number="form.orden" type="number" step="1" class="form-control" />
            </div>
            <div class="col-6 col-md-3 d-flex align-items-end">
              <div class="form-check">
                <input id="oc-activo" v-model="form.activo" type="checkbox" class="form-check-input" />
                <label for="oc-activo" class="form-check-label small">Visible en el sitio</label>
              </div>
            </div>
            <div class="col-12">
              <label class="form-label small fw-semibold" for="oc-desc">Descripción corta</label>
              <input id="oc-desc" v-model="form.descripcion" class="form-control" maxlength="300" placeholder="Regalos únicos para festejar a alguien especial." />
            </div>
            <div class="col-12 col-md-7">
              <span class="form-label small fw-semibold d-block">Ícono (si no cargás imagen)</span>
              <div class="iconos" role="radiogroup" aria-label="Ícono de la ocasión">
                <button
                  v-for="ic in iconos"
                  :key="ic"
                  type="button"
                  class="icono"
                  :class="{ activo: form.icono === ic }"
                  role="radio"
                  :aria-checked="form.icono === ic"
                  :aria-label="ic"
                  @click="form.icono = ic"
                >
                  <i :class="['bi', ic]"></i>
                </button>
              </div>
            </div>
            <div class="col-12 col-md-5">
              <SubidaImagen v-model="form.imagenUrl" label="Imagen (opcional)" />
            </div>
            <div class="col-12 d-flex gap-2">
              <button type="submit" class="btn btn-alma" :disabled="guardando">
                {{ guardando ? 'Guardando...' : (editando ? 'Guardar cambios' : 'Crear ocasión') }}
              </button>
              <button v-if="editando" type="button" class="btn btn-alma-borde" @click="cancelar">Cancelar</button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <div class="table-responsive">
      <table class="table align-middle bg-white admin-table">
        <thead>
          <tr>
            <th></th>
            <th>Ocasión</th>
            <th>Productos</th>
            <th>Orden</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="o in ocasiones" :key="o.Id">
            <td>
              <img v-if="o.ImagenUrl" :src="o.ImagenUrl" alt="" class="thumb" />
              <span v-else class="thumb thumb-icono"><i :class="['bi', o.Icono || 'bi-gift']"></i></span>
            </td>
            <td>
              <span class="fw-semibold">{{ o.Nombre }}</span>
              <small class="d-block text-secondary">{{ o.Descripcion }}</small>
            </td>
            <td>{{ o.CantidadProductos }}</td>
            <td>{{ o.Orden }}</td>
            <td><span class="badge-estado" :class="o.Activo ? 'estado-activo' : 'estado-inactivo'">{{ o.Activo ? 'Visible' : 'Oculta' }}</span></td>
            <td class="text-nowrap">
              <button class="btn btn-sm btn-outline-secondary me-2" :aria-label="`Editar ${o.Nombre}`" @click="editar(o)">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm" :class="o.Activo ? 'btn-outline-danger' : 'btn-outline-success'" @click="alternar(o)">
                {{ o.Activo ? 'Ocultar' : 'Mostrar' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue'
import api from '../services/api'
import SubidaImagen from '../components/SubidaImagen.vue'

const mostrarToast = inject('mostrarToast')
const iconos = [
  'bi-gift', 'bi-cake2', 'bi-flower1', 'bi-emoji-sunglasses', 'bi-hearts', 'bi-mortarboard',
  'bi-balloon-heart', 'bi-stars', 'bi-tree', 'bi-camera', 'bi-airplane', 'bi-book', 'bi-music-note-beamed', 'bi-house-heart'
]

const ocasiones = ref([])
const editando = ref(null)
const guardando = ref(false)
const error = ref('')
const vacio = () => ({ nombre: '', descripcion: '', icono: 'bi-gift', imagenUrl: '', orden: 0, activo: true })
const form = ref(vacio())

onMounted(cargar)

async function cargar() {
  try {
    const { data } = await api.get('/ocasiones/admin/todas')
    ocasiones.value = data
  } catch (err) {
    console.error(err)
    error.value = 'No se pudieron cargar las ocasiones'
  }
}

function datosDe(o) {
  return { nombre: o.Nombre, descripcion: o.Descripcion || '', icono: o.Icono || 'bi-gift', imagenUrl: o.ImagenUrl || '', orden: o.Orden, activo: o.Activo }
}

async function guardar() {
  error.value = ''
  guardando.value = true
  try {
    if (editando.value) {
      await api.put(`/ocasiones/admin/${editando.value}`, form.value)
      mostrarToast('Ocasión actualizada')
    } else {
      await api.post('/ocasiones/admin', form.value)
      mostrarToast('Ocasión creada')
    }
    cancelar()
    await cargar()
  } catch (err) {
    error.value = err.response?.data?.error || 'No se pudo guardar la ocasión'
  } finally {
    guardando.value = false
  }
}

function editar(o) {
  editando.value = o.Id
  form.value = datosDe(o)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function cancelar() {
  editando.value = null
  form.value = vacio()
  error.value = ''
}

async function alternar(o) {
  try {
    await api.put(`/ocasiones/admin/${o.Id}`, { ...datosDe(o), activo: !o.Activo })
    await cargar()
  } catch (err) {
    mostrarToast(err.response?.data?.error || 'No se pudo actualizar')
  }
}
</script>

<style scoped>
.iconos {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.icono {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  border: 1px solid var(--rosa-polvo-medio);
  background: white;
  color: var(--ciruela);
  font-size: 1.1rem;
}
.icono.activo {
  border-color: var(--rosa-viejo);
  background: var(--rosa-polvo);
  color: var(--rosa-texto);
}
.thumb {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  object-fit: cover;
}
.thumb-icono {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--rosa-polvo);
  color: var(--rosa-texto);
  font-size: 1.3rem;
}
</style>
