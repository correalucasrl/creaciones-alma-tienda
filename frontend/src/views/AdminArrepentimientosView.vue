<template>
  <div class="admin-pagina">
    <header class="admin-encabezado">
      <div>
        <h1 class="admin-titulo">Arrepentimientos</h1>
        <p class="admin-descripcion">Pedidos que el cliente pidió revocar con el botón de arrepentimiento. Respondé dentro de los plazos de la ley.</p>
      </div>
    </header>

    <div class="admin-filtros" role="group" aria-label="Filtrar por estado">
      <button
        v-for="f in filtros"
        :key="f"
        type="button"
        class="admin-filtro"
        :class="{ activo: filtro === f }"
        :aria-pressed="filtro === f"
        @click="filtro = f"
      >
        {{ f }}<small>{{ f === 'Todas' ? solicitudes.length : solicitudes.filter(s => s.Estado === f).length }}</small>
      </button>
    </div>

    <div v-if="cargando" class="admin-vacio">Cargando solicitudes...</div>
    <p v-else-if="error" class="alert alert-danger">{{ error }}</p>
    <div v-else-if="visibles.length === 0" class="admin-vacio">
      <i class="bi bi-inbox" aria-hidden="true"></i>
      {{ solicitudes.length === 0 ? 'Todavía no hay solicitudes.' : 'No hay solicitudes con este estado.' }}
    </div>

    <div class="row g-4">
      <div v-for="s in visibles" :key="s.Id" class="col-12 col-lg-6">
        <div class="solicitud-card p-4 h-100">
          <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
            <div>
              <p class="codigo mb-0">{{ s.Codigo }}</p>
              <p class="small text-secondary mb-0">
                {{ new Date(s.FechaCreacion).toLocaleString('es-AR') }} · hace {{ diasDesde(s.FechaCreacion) }}
              </p>
            </div>
            <span class="badge-estado" :class="claseEstado(s.Estado)">{{ s.Estado }}</span>
          </div>

          <p class="mb-1"><strong>{{ s.Nombre }}</strong></p>
          <p class="small mb-1"><i class="bi bi-envelope me-1"></i><a :href="`mailto:${s.Email}?subject=Solicitud ${s.Codigo}`">{{ s.Email }}</a></p>
          <p v-if="s.Telefono" class="small mb-1"><i class="bi bi-telephone me-1"></i>{{ s.Telefono }}</p>

          <div class="pedido small my-3 p-2">
            <template v-if="s.OrdenId && s.PedidoEstado">
              <router-link :to="`/mis-pedidos/${s.OrdenId}`" class="fw-semibold">Pedido #{{ s.OrdenId }}</router-link>
              · {{ s.PedidoEstado }} · ${{ Number(s.PedidoTotal).toLocaleString('es-AR') }}
              · {{ new Date(s.PedidoFecha).toLocaleDateString('es-AR') }}
              <span v-if="s.PedidoEmail && s.PedidoEmail.toLowerCase() !== s.Email.toLowerCase()" class="d-block text-danger mt-1">
                <i class="bi bi-exclamation-triangle me-1"></i>El pedido es de otro email ({{ s.PedidoEmail }})
              </span>
            </template>
            <span v-else-if="s.OrdenId" class="text-danger">
              <i class="bi bi-exclamation-triangle me-1"></i>El pedido #{{ s.OrdenId }} no existe
            </span>
            <span v-else class="text-secondary">No indicó número de pedido</span>
          </div>

          <p v-if="s.Motivo" class="small motivo mb-3">“{{ s.Motivo }}”</p>

          <div class="row g-2 align-items-end">
            <div class="col-12 col-sm-5">
              <label class="form-label small fw-semibold mb-1" :for="`estado-${s.Id}`">Estado</label>
              <select :id="`estado-${s.Id}`" v-model="edicion[s.Id].estado" class="form-select form-select-sm">
                <option v-for="e in estados" :key="e">{{ e }}</option>
              </select>
            </div>
            <div class="col-12">
              <label class="form-label small fw-semibold mb-1" :for="`notas-${s.Id}`">Notas internas</label>
              <textarea
                :id="`notas-${s.Id}`"
                v-model="edicion[s.Id].notas"
                class="form-control form-control-sm"
                rows="2"
                maxlength="1000"
                placeholder="Ej: coordinado retiro por Correo, reintegro hecho el 25/10"
              ></textarea>
            </div>
            <div class="col-12">
              <button
                type="button"
                class="btn btn-sm btn-turquesa"
                :disabled="guardando === s.Id || !cambio(s)"
                @click="guardar(s)"
              >
                {{ guardando === s.Id ? 'Guardando...' : 'Guardar' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import api from '../services/api'

const estados = ['Pendiente', 'En proceso', 'Resuelto', 'Rechazado']
const filtros = ['Todas', ...estados]

const solicitudes = ref([])
const edicion = ref({})
const filtro = ref('Todas')
const cargando = ref(true)
const guardando = ref(null)
const error = ref('')
const mostrarToast = inject('mostrarToast')
const refrescarContadores = inject('refrescarContadores', () => {})

const visibles = computed(() =>
  filtro.value === 'Todas' ? solicitudes.value : solicitudes.value.filter(s => s.Estado === filtro.value)
)

onMounted(cargar)

async function cargar() {
  try {
    const { data } = await api.get('/arrepentimiento/admin/todas')
    solicitudes.value = data
    edicion.value = Object.fromEntries(data.map(s => [s.Id, { estado: s.Estado, notas: s.NotasAdmin || '' }]))
  } catch (err) {
    console.error(err)
    error.value = 'No se pudieron cargar las solicitudes'
  } finally {
    cargando.value = false
  }
}

function cambio(s) {
  const e = edicion.value[s.Id]
  return e.estado !== s.Estado || e.notas !== (s.NotasAdmin || '')
}

async function guardar(s) {
  guardando.value = s.Id
  try {
    const { estado, notas } = edicion.value[s.Id]
    await api.put(`/arrepentimiento/admin/${s.Id}`, { estado, notas })
    s.Estado = estado
    s.NotasAdmin = notas
    mostrarToast(`Solicitud ${s.Codigo} actualizada ✅`)
    refrescarContadores()
  } catch (err) {
    mostrarToast(err.response?.data?.error || 'No se pudo guardar')
  } finally {
    guardando.value = null
  }
}

function diasDesde(fecha) {
  const dias = Math.floor((Date.now() - new Date(fecha).getTime()) / 86400000)
  if (dias === 0) return 'menos de un día'
  return dias === 1 ? '1 día' : `${dias} días`
}

function claseEstado(estado) {
  return {
    'Pendiente': 'estado-pendiente',
    'En proceso': 'estado-proceso',
    'Resuelto': 'estado-resuelto',
    'Rechazado': 'estado-rechazado'
  }[estado] || ''
}
</script>

<style scoped>
.codigo {
  font-weight: 700;
  letter-spacing: 1px;
}
.pedido {
  background: var(--crema-oscura);
  border-radius: 12px;
}
.pedido a,
.solicitud-card a {
  color: var(--rosa-texto);
}
.motivo {
  color: var(--ciruela-suave);
  font-style: italic;
  white-space: pre-line;
}
</style>
