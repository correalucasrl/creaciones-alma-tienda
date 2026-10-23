<template>
  <div class="admin-pagina">
    <header class="admin-encabezado">
      <div>
        <h1 class="admin-titulo">Suscriptores del newsletter</h1>
        <p class="admin-descripcion">Cada persona que se suscribe recibe un cupón personal de un solo uso. Exportá la lista para mandar novedades desde tu herramienta de mails.</p>
      </div>
    </header>

    <div class="d-flex flex-wrap gap-3 justify-content-center mb-4">
      <div class="dato"><span>{{ activos }}</span>activos</div>
      <div class="dato"><span>{{ suscriptores.length - activos }}</span>dados de baja</div>
      <div class="dato"><span>{{ cuponesUsados }}</span>usaron su cupón</div>
    </div>

    <div class="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
      <input v-model="busqueda" type="search" class="form-control buscador" placeholder="Buscar email..." aria-label="Buscar suscriptor" />
      <button type="button" class="btn btn-alma" :disabled="exportando || !activos" @click="exportar">
        <i class="bi bi-download me-1"></i>{{ exportando ? 'Exportando...' : 'Exportar activos (CSV)' }}
      </button>
    </div>

    <p v-if="error" class="alert alert-danger">{{ error }}</p>
    <div v-else-if="!cargando && !suscriptores.length" class="admin-vacio"><i class="bi bi-envelope-heart" aria-hidden="true"></i>Todavía no hay suscriptores.</div>

    <div v-else class="table-responsive">
      <table class="table align-middle bg-white admin-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Alta</th>
            <th>Desde</th>
            <th>Cupón</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in filtrados" :key="s.Id">
            <td>{{ s.Email }}</td>
            <td class="small">{{ fecha(s.FechaAlta) }}</td>
            <td class="small text-secondary">{{ s.Origen || '—' }}</td>
            <td class="small">
              <span class="codigo">{{ s.CuponCodigo || '—' }}</span>
              <span v-if="s.CuponCodigo" class="d-block" :class="s.CuponUsos ? 'text-success' : 'text-secondary'">
                {{ s.CuponUsos ? 'Usado' : (new Date(s.CuponVence) < new Date() ? 'Vencido' : 'Sin usar') }}
              </span>
            </td>
            <td>
              <span class="badge-estado" :class="s.Activo ? 'estado-activo' : 'estado-inactivo'">
                {{ s.Activo ? 'Activo' : 'Baja' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../services/api'

const suscriptores = ref([])
const cargando = ref(true)
const exportando = ref(false)
const error = ref('')
const busqueda = ref('')

const activos = computed(() => suscriptores.value.filter(s => s.Activo).length)
const cuponesUsados = computed(() => suscriptores.value.filter(s => s.CuponUsos > 0).length)
const filtrados = computed(() => {
  const t = busqueda.value.trim().toLowerCase()
  return t ? suscriptores.value.filter(s => s.Email.includes(t)) : suscriptores.value
})

const fecha = f => new Date(f).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })

onMounted(async () => {
  try {
    const { data } = await api.get('/newsletter/admin/todos')
    suscriptores.value = data
  } catch (err) {
    console.error(err)
    error.value = 'No se pudieron cargar los suscriptores'
  } finally {
    cargando.value = false
  }
})

// El CSV se pide con el token de admin y se descarga como archivo
async function exportar() {
  exportando.value = true
  try {
    const { data } = await api.get('/newsletter/admin/exportar', { responseType: 'blob' })
    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = 'suscriptores.csv'
    a.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error(err)
    error.value = 'No se pudo exportar la lista'
  } finally {
    exportando.value = false
  }
}
</script>

<style scoped>
.dato {
  background: white;
  border: 1px solid var(--borde);
  border-radius: 16px;
  padding: 12px 22px;
  text-align: center;
  color: var(--ciruela-suave);
  font-size: 0.85rem;
}
.dato span {
  display: block;
  font-family: var(--fuente-titulos);
  font-size: 1.6rem;
  color: var(--ciruela);
}
.buscador {
  max-width: 300px;
}
.codigo {
  font-family: ui-monospace, monospace;
  font-weight: 600;
}
</style>
