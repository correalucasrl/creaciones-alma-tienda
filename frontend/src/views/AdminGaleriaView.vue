<template>
  <div class="admin-pagina">
    <header class="admin-encabezado">
      <div>
        <h1 class="admin-titulo">Galería</h1>
        <p class="admin-descripcion">Fotos de trabajos que se muestran en la galería pública.</p>
      </div>
    </header>

    <div class="row mb-4">
      <div class="col-12 col-lg-9">
        <div class="form-card p-4">
          <h6 class="fw-bold mb-3">{{ editando ? 'Editar trabajo' : 'Nuevo trabajo' }}</h6>

          <div v-if="error" class="alert alert-danger py-2 small">{{ error }}</div>

          <form @submit.prevent="guardar">
            <label class="form-label small fw-semibold">Título</label>
            <input v-model="form.titulo" class="form-control mb-3" placeholder="Ej: Cuaderno personalizado para Sofía" />

            <label class="form-label small fw-semibold">Orden</label>
            <input v-model.number="form.orden" type="number" class="form-control mb-3" style="max-width: 120px;" />

            <label class="form-label small fw-semibold d-block mb-2">Fotos de este trabajo</label>
            <div class="d-flex flex-wrap gap-2 mb-2">
              <div v-for="(img, idx) in form.imagenes" :key="idx" class="foto-thumb">
                <img :src="img" />
                <button type="button" class="btn-quitar-foto" @click="quitarImagen(idx)">
                  <i class="bi bi-x-lg"></i>
                </button>
              </div>
            </div>

            <div style="max-width: 220px;">
              <SubidaImagen :model-value="''" label="Agregar otra foto" @update:model-value="agregarImagen" />
            </div>

            <button type="submit" class="btn btn-turquesa mt-3">
              {{ editando ? 'Guardar cambios' : 'Agregar a la galería' }}
            </button>
            <button v-if="editando" type="button" class="btn btn-outline-secondary mt-3 ms-2" @click="cancelarEdicion">
              Cancelar
            </button>
          </form>
        </div>
      </div>
    </div>

    <div class="table-responsive">
      <table class="table align-middle bg-white admin-table">
        <thead>
          <tr>
            <th>Fotos</th>
            <th>Título</th>
            <th>Orden</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="trabajo in trabajos" :key="trabajo.Id">
            <td>
              <div class="d-flex gap-1">
                <img v-for="(img, i) in trabajo.Imagenes.slice(0, 3)" :key="i" :src="img" class="thumb" />
                <span v-if="trabajo.Imagenes.length > 3" class="text-secondary small align-self-center">
                  +{{ trabajo.Imagenes.length - 3 }}
                </span>
              </div>
            </td>
            <td class="fw-semibold">{{ trabajo.Titulo || '—' }}</td>
            <td>{{ trabajo.Orden }}</td>
            <td>
              <span class="badge-estado" :class="trabajo.Activo ? 'estado-activo' : 'estado-inactivo'">
                {{ trabajo.Activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td>
              <button class="btn btn-sm btn-outline-secondary me-2" @click="editar(trabajo)">
                <i class="bi bi-pencil"></i>
              </button>
              <button v-if="trabajo.Activo" class="btn btn-sm btn-outline-danger" @click="eliminar(trabajo)">
                <i class="bi bi-trash"></i>
              </button>
              <button v-else class="btn btn-sm btn-outline-success" @click="reactivar(trabajo)">
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
import { ref, onMounted, inject } from 'vue'
import api from '../services/api'
import SubidaImagen from '../components/SubidaImagen.vue'

const trabajos = ref([])
const editando = ref(null)
const error = ref('')
const mostrarToast = inject('mostrarToast')
const mostrarConfirm = inject('mostrarConfirm')

const formVacio = { titulo: '', orden: 0, imagenes: [] }
const form = ref({ ...formVacio, imagenes: [] })

onMounted(async () => {
  await cargarTrabajos()
})

async function cargarTrabajos() {
  const { data } = await api.get('/galeria/admin/todos')
  trabajos.value = data
}

function agregarImagen(url) {
  if (url) form.value.imagenes.push(url)
}

function quitarImagen(idx) {
  form.value.imagenes.splice(idx, 1)
}

async function guardar() {
  error.value = ''

  if (form.value.imagenes.length === 0) {
    error.value = 'Agregá al menos una foto'
    return
  }

  try {
    if (editando.value) {
      await api.put(`/galeria/${editando.value}`, { ...form.value, activo: true })
      mostrarToast('Trabajo actualizado ✅')
    } else {
      await api.post('/galeria', form.value)
      mostrarToast('Trabajo agregado a la galería 🎉')
    }
    form.value = { ...formVacio, imagenes: [] }
    editando.value = null
    await cargarTrabajos()
  } catch (err) {
    error.value = err.response?.data?.error || 'Error al guardar'
  }
}

function editar(trabajo) {
  form.value = {
    titulo: trabajo.Titulo || '',
    orden: trabajo.Orden,
    imagenes: [...trabajo.Imagenes]
  }
  editando.value = trabajo.Id
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function cancelarEdicion() {
  form.value = { ...formVacio, imagenes: [] }
  editando.value = null
}

async function eliminar(trabajo) {
  const ok = await mostrarConfirm({
    titulo: '¿Sacar este trabajo de la galería?',
    mensaje: 'Esta acción se puede revertir después.',
    esError: false
  })

  if (!ok) return

  try {
    await api.delete(`/galeria/${trabajo.Id}`)
    mostrarToast('Trabajo eliminado')
    await cargarTrabajos()
  } catch (err) {
    alert(err.response?.data?.error || 'Error al eliminar')
  }
}

async function reactivar(trabajo) {
  try {
    await api.put(`/galeria/admin/${trabajo.Id}/reactivar`)
    mostrarToast('Trabajo reactivado ✅')
    await cargarTrabajos()
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
.foto-thumb {
  position: relative;
  width: 70px;
  height: 70px;
}
.foto-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}
.btn-quitar-foto {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(0,0,0,0.7);
  color: white;
  border: none;
  font-size: 0.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>