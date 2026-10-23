<template>
  <div class="admin-pagina">
    <header class="admin-encabezado">
      <div>
        <h1 class="admin-titulo">Testimonios</h1>
        <p class="admin-descripcion">Opiniones de clientes que aparecen en el inicio. Podés editarlas u ocultarlas.</p>
      </div>
    </header>

    <div class="table-responsive">
      <table class="table align-middle bg-white admin-table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Comentario</th>
            <th>Calificación</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in testimonios" :key="t.Id">
            <template v-if="editando === t.Id">
              <td class="fw-semibold">{{ t.Nombre }}<br /><span class="text-secondary small">{{ t.Email }}</span></td>
              <td>
                <textarea v-model="formEdicion.comentario" class="form-control form-control-sm" rows="2" maxlength="100"></textarea>
              </td>
              <td>
                <select v-model.number="formEdicion.calificacion" class="form-select form-select-sm" style="width: 70px;">
                  <option v-for="n in 5" :key="n" :value="n">{{ n }} ★</option>
                </select>
              </td>
              <td>
                <span class="badge-estado" :class="t.Activo ? 'estado-activo' : 'estado-inactivo'">
                  {{ t.Activo ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td>
                <button class="btn btn-sm btn-turquesa me-2" @click="guardar(t.Id)">Guardar</button>
                <button class="btn btn-sm btn-outline-secondary" @click="editando = null">Cancelar</button>
              </td>
            </template>

            <template v-else>
              <td class="fw-semibold">{{ t.Nombre }}<br /><span class="text-secondary small">{{ t.Email }}</span></td>
              <td>{{ t.Comentario }}</td>
              <td>{{ t.Calificacion }} ★</td>
              <td>
                <span class="badge-estado" :class="t.Activo ? 'estado-activo' : 'estado-inactivo'">
                  {{ t.Activo ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td>
                <button class="btn btn-sm btn-outline-secondary me-2" @click="editar(t)">
                  <i class="bi bi-pencil"></i>
                </button>
                <button v-if="t.Activo" class="btn btn-sm btn-outline-danger" @click="eliminar(t)">
                  <i class="bi bi-trash"></i>
                </button>
                <button v-else class="btn btn-sm btn-outline-success" @click="reactivar(t)">
                  <i class="bi bi-arrow-counterclockwise"></i>
                </button>
              </td>
            </template>
          </tr>
        </tbody>
      </table>

      <p v-if="!testimonios.length" class="text-secondary text-center py-4">Todavía no hay testimonios.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue'
import api from '../services/api'

const testimonios = ref([])
const editando = ref(null)
const formEdicion = ref({ comentario: '', calificacion: 5 })
const mostrarToast = inject('mostrarToast')
const mostrarConfirm = inject('mostrarConfirm')

onMounted(async () => {
  await cargar()
})

async function cargar() {
  const { data } = await api.get('/testimonios/admin/todos')
  testimonios.value = data
}

function editar(t) {
  editando.value = t.Id
  formEdicion.value = { comentario: t.Comentario, calificacion: t.Calificacion }
}

async function guardar(id) {
  try {
    await api.put(`/testimonios/${id}`, { ...formEdicion.value, activo: true })
    mostrarToast('Testimonio actualizado ✅')
    editando.value = null
    await cargar()
  } catch (err) {
    alert(err.response?.data?.error || 'Error al guardar')
  }
}

async function eliminar(t) {
  const ok = await mostrarConfirm({
    titulo: '¿Ocultar este testimonio?',
    mensaje: 'Dejará de verse en la web. Podés reactivarlo cuando quieras.',
    esError: false
  })

  if (!ok) return

  try {
    await api.delete(`/testimonios/${t.Id}`)
    mostrarToast('Testimonio ocultado')
    await cargar()
  } catch (err) {
    alert(err.response?.data?.error || 'Error al eliminar')
  }
}

async function reactivar(t) {
  try {
    await api.put(`/testimonios/${t.Id}`, { comentario: t.Comentario, calificacion: t.Calificacion, activo: true })
    mostrarToast('Testimonio reactivado ✅')
    await cargar()
  } catch (err) {
    alert(err.response?.data?.error || 'Error al reactivar')
  }
}
</script>
