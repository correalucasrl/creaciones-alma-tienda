<template>
  <div class="admin-pagina">
    <header class="admin-encabezado">
      <div>
        <h1 class="admin-titulo">Pedidos</h1>
        <p class="admin-descripcion">Actualizá el estado y el número de seguimiento de cada pedido.</p>
      </div>
    </header>

    <div v-if="cargando" class="admin-vacio">Cargando pedidos...</div>

    <template v-else>
      <div class="admin-filtros" role="group" aria-label="Filtrar por estado">
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

      <div v-if="!ordenesFiltradas.length" class="admin-vacio">
        <i class="bi bi-bag" aria-hidden="true"></i>
        {{ ordenes.length ? 'No hay pedidos con este estado.' : 'Todavía no hay pedidos.' }}
      </div>

      <div v-else class="table-responsive">
        <table class="table align-middle admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Total</th>
              <th>Entrega</th>
              <th>Estado</th>
              <th>Seguimiento</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="orden in ordenesFiltradas" :key="orden.Id">
              <td class="fw-semibold">{{ orden.Id }}</td>
              <td>
                <p class="mb-0 small fw-semibold">{{ orden.UsuarioNombre }}</p>
                <p class="mb-0 small text-secondary">{{ orden.UsuarioEmail }}</p>
              </td>
              <td class="small text-nowrap">{{ fecha(orden.FechaCreacion) }}</td>
              <td class="fw-semibold text-nowrap">${{ orden.Total.toLocaleString('es-AR') }}</td>
              <td class="small">{{ orden.TipoEntrega === 'Envio' ? 'Envío' : orden.TipoEntrega }}</td>
              <td>
                <select
                  v-model="orden.Estado"
                  class="form-select form-select-sm estado-select"
                  :class="claseEstado(orden.Estado)"
                  :aria-label="`Estado del pedido ${orden.Id}`"
                  @change="actualizar(orden)"
                >
                  <option v-for="e in ESTADOS" :key="e">{{ e }}</option>
                </select>
              </td>
              <td>
                <input
                  v-model="orden.NumeroSeguimiento"
                  type="text"
                  class="form-control form-control-sm"
                  placeholder="N° tracking"
                  :aria-label="`Número de seguimiento del pedido ${orden.Id}`"
                  @blur="actualizar(orden)"
                />
              </td>
              <td>
                <router-link :to="`/mis-pedidos/${orden.Id}`" class="btn btn-sm btn-outline-secondary">Ver</router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import api from '../services/api'

const ordenes = ref([])
const cargando = ref(true)
const mostrarToast = inject('mostrarToast')
const refrescarContadores = inject('refrescarContadores', () => {})

const ESTADOS = ['Pendiente', 'Pagado', 'Enviado', 'Entregado', 'Cancelado']
const filtro = ref('')

const filtros = computed(() => [
  { valor: '', nombre: 'Todos', cantidad: ordenes.value.length },
  ...ESTADOS.map(e => ({ valor: e, nombre: e, cantidad: ordenes.value.filter(o => o.Estado === e).length }))
])
const ordenesFiltradas = computed(() =>
  filtro.value ? ordenes.value.filter(o => o.Estado === filtro.value) : ordenes.value
)

const fecha = f => new Date(f).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })

onMounted(async () => {
  try {
    const { data } = await api.get('/ordenes/admin/todas')
    ordenes.value = data
  } catch (err) {
    console.error(err)
  } finally {
    cargando.value = false
  }
})

function claseEstado(estado) {
  const clases = {
    'Pendiente': 'estado-pendiente',
    'Pagado': 'estado-pagado',
    'Enviado': 'estado-enviado',
    'Entregado': 'estado-entregado',
    'Cancelado': 'estado-cancelado'
  }
  return clases[estado] || ''
}

async function actualizar(orden) {
  try {
    await api.put(`/ordenes/admin/${orden.Id}`, {
      estado: orden.Estado,
      numeroSeguimiento: orden.NumeroSeguimiento
    })
    mostrarToast(`Pedido #${orden.Id} actualizado ✅`)
    refrescarContadores()
  } catch (err) {
    console.error(err)
    // Ej: reactivar un pedido cancelado cuando ya no hay stock. Se recarga la lista
    // para que el selector vuelva al estado real guardado en la base
    mostrarToast(err.response?.data?.error || `No se pudo actualizar el pedido #${orden.Id}`)
    const { data } = await api.get('/ordenes/admin/todas')
    ordenes.value = data
  }
}
</script>

<style scoped>
.estado-select {
  width: auto;
  min-width: 128px;
  font-weight: 600;
  border: none;
  border-radius: 999px;
}
</style>