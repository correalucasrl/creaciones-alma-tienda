<template>
  <div class="admin-pagina">
    <header class="admin-encabezado">
      <div>
        <h1 class="admin-titulo">Cupones de descuento</h1>
        <p class="admin-descripcion">Creá códigos para promociones, Instagram o clientes frecuentes. Se aplican en el checkout.</p>
      </div>
    </header>

    <div class="row mb-4">
      <div class="col-12 col-lg-9">
        <form class="form-card p-4" @submit.prevent="guardar">
          <h6 class="fw-bold mb-3">{{ editando ? `Editar cupón ${form.codigo}` : 'Nuevo cupón' }}</h6>
          <div v-if="error" class="alert alert-danger py-2 small">{{ error }}</div>

          <div class="row g-3">
            <div class="col-12 col-md-4">
              <label class="form-label small fw-semibold" for="cu-codigo">Código</label>
              <input id="cu-codigo" v-model="form.codigo" class="form-control text-uppercase" placeholder="BIENVENIDA10" required maxlength="40" />
            </div>
            <div class="col-12 col-md-8">
              <label class="form-label small fw-semibold" for="cu-desc">Descripción interna (opcional)</label>
              <input id="cu-desc" v-model="form.descripcion" class="form-control" placeholder="Promo de Instagram de octubre" maxlength="200" />
            </div>

            <div class="col-6 col-md-3">
              <label class="form-label small fw-semibold" for="cu-tipo">Tipo</label>
              <select id="cu-tipo" v-model="form.tipo" class="form-select">
                <option value="porcentaje">Porcentaje (%)</option>
                <option value="monto">Monto fijo ($)</option>
              </select>
            </div>
            <div class="col-6 col-md-3">
              <label class="form-label small fw-semibold" for="cu-valor">{{ form.tipo === 'porcentaje' ? 'Descuento %' : 'Descuento $' }}</label>
              <input id="cu-valor" v-model.number="form.valor" type="number" min="0" step="0.01" class="form-control" required />
            </div>
            <div class="col-6 col-md-3">
              <label class="form-label small fw-semibold" for="cu-min">Compra mínima (opcional)</label>
              <input id="cu-min" v-model.number="form.minimoCompra" type="number" min="0" step="0.01" class="form-control" placeholder="Sin mínimo" />
            </div>
            <div class="col-6 col-md-3">
              <label class="form-label small fw-semibold" for="cu-usos">Límite de usos (opcional)</label>
              <input id="cu-usos" v-model.number="form.usosMaximos" type="number" min="1" step="1" class="form-control" placeholder="Sin límite" />
            </div>

            <div class="col-6 col-md-3">
              <label class="form-label small fw-semibold" for="cu-desde">Válido desde</label>
              <input id="cu-desde" v-model="form.fechaInicio" type="date" class="form-control" />
            </div>
            <div class="col-6 col-md-3">
              <label class="form-label small fw-semibold" for="cu-hasta">Válido hasta</label>
              <input id="cu-hasta" v-model="form.fechaFin" type="date" class="form-control" />
            </div>
            <div class="col-12 col-md-6 d-flex align-items-end">
              <div class="form-check">
                <input id="cu-activo" v-model="form.activo" type="checkbox" class="form-check-input" />
                <label for="cu-activo" class="form-check-label small">Activo (se puede usar en el checkout)</label>
              </div>
            </div>

            <div class="col-12 d-flex gap-2">
              <button type="submit" class="btn btn-alma" :disabled="guardando">
                {{ guardando ? 'Guardando...' : (editando ? 'Guardar cambios' : 'Crear cupón') }}
              </button>
              <button v-if="editando" type="button" class="btn btn-alma-borde" @click="cancelar">Cancelar</button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <div v-if="!cupones.length && !cargando" class="admin-vacio"><i class="bi bi-ticket-perforated" aria-hidden="true"></i>Todavía no creaste cupones.</div>

    <div v-else class="table-responsive">
      <table class="table align-middle bg-white admin-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Descuento</th>
            <th>Condiciones</th>
            <th>Usos</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in cupones" :key="c.Id">
            <td>
              <span class="codigo">{{ c.Codigo }}</span>
              <small v-if="c.Descripcion" class="d-block text-secondary">{{ c.Descripcion }}</small>
            </td>
            <td>{{ c.Tipo === 'porcentaje' ? `${Number(c.Valor)}%` : `$${Number(c.Valor).toLocaleString('es-AR')}` }}</td>
            <td class="small">
              <span v-if="c.MinimoCompra" class="d-block">Desde ${{ Number(c.MinimoCompra).toLocaleString('es-AR') }}</span>
              <span v-if="c.FechaInicio || c.FechaFin" class="d-block">
                {{ c.FechaInicio ? fechaCorta(c.FechaInicio) : '—' }} → {{ c.FechaFin ? fechaCorta(c.FechaFin) : 'sin fin' }}
              </span>
              <span v-if="!c.MinimoCompra && !c.FechaInicio && !c.FechaFin" class="text-secondary">Sin condiciones</span>
            </td>
            <td>{{ c.Usos }}{{ c.UsosMaximos ? ` / ${c.UsosMaximos}` : '' }}</td>
            <td><span class="badge-estado" :class="claseEstado(c)">{{ estado(c) }}</span></td>
            <td class="text-nowrap">
              <button class="btn btn-sm btn-outline-secondary me-2" :aria-label="`Editar ${c.Codigo}`" @click="editar(c)">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm" :class="c.Activo ? 'btn-outline-danger' : 'btn-outline-success'" @click="alternarActivo(c)">
                {{ c.Activo ? 'Pausar' : 'Activar' }}
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

const mostrarToast = inject('mostrarToast')
const ZONA = 'America/Argentina/Buenos_Aires'

const cupones = ref([])
const cargando = ref(true)
const guardando = ref(false)
const editando = ref(null)
const error = ref('')

const vacio = () => ({
  codigo: '', descripcion: '', tipo: 'porcentaje', valor: null, minimoCompra: null,
  usosMaximos: null, fechaInicio: '', fechaFin: '', activo: true
})
const form = ref(vacio())

const diaArgentina = f => new Intl.DateTimeFormat('en-CA', { timeZone: ZONA }).format(new Date(f))
const fechaCorta = f => new Date(f).toLocaleDateString('es-AR', { timeZone: ZONA })

onMounted(cargar)

async function cargar() {
  try {
    const { data } = await api.get('/cupones/admin/todos')
    cupones.value = data
  } catch (err) {
    console.error(err)
    error.value = 'No se pudieron cargar los cupones'
  } finally {
    cargando.value = false
  }
}

function estado(c) {
  const ahora = new Date()
  if (!c.Activo) return 'Pausado'
  if (c.FechaFin && new Date(c.FechaFin) < ahora) return 'Vencido'
  if (c.FechaInicio && new Date(c.FechaInicio) > ahora) return 'Programado'
  if (c.UsosMaximos && c.Usos >= c.UsosMaximos) return 'Agotado'
  return 'Activo'
}

function claseEstado(c) {
  return estado(c) === 'Activo' ? 'estado-activo' : estado(c) === 'Programado' ? 'estado-programado' : 'estado-inactivo'
}

function payload(datos) {
  return { ...datos, codigo: datos.codigo.trim().toUpperCase() }
}

async function guardar() {
  error.value = ''
  guardando.value = true
  try {
    if (editando.value) {
      await api.put(`/cupones/admin/${editando.value}`, payload(form.value))
      mostrarToast('Cupón actualizado')
    } else {
      await api.post('/cupones/admin', payload(form.value))
      mostrarToast('Cupón creado')
    }
    cancelar()
    await cargar()
  } catch (err) {
    error.value = err.response?.data?.error || 'No se pudo guardar el cupón'
  } finally {
    guardando.value = false
  }
}

function editar(c) {
  editando.value = c.Id
  form.value = {
    codigo: c.Codigo,
    descripcion: c.Descripcion || '',
    tipo: c.Tipo,
    valor: Number(c.Valor),
    minimoCompra: c.MinimoCompra !== null ? Number(c.MinimoCompra) : null,
    usosMaximos: c.UsosMaximos,
    fechaInicio: c.FechaInicio ? diaArgentina(c.FechaInicio) : '',
    fechaFin: c.FechaFin ? diaArgentina(c.FechaFin) : '',
    activo: c.Activo
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function cancelar() {
  editando.value = null
  form.value = vacio()
  error.value = ''
}

async function alternarActivo(c) {
  try {
    await api.put(`/cupones/admin/${c.Id}`, payload({
      codigo: c.Codigo,
      descripcion: c.Descripcion,
      tipo: c.Tipo,
      valor: Number(c.Valor),
      minimoCompra: c.MinimoCompra,
      usosMaximos: c.UsosMaximos,
      fechaInicio: c.FechaInicio ? diaArgentina(c.FechaInicio) : '',
      fechaFin: c.FechaFin ? diaArgentina(c.FechaFin) : '',
      activo: !c.Activo
    }))
    mostrarToast(c.Activo ? `Cupón ${c.Codigo} pausado` : `Cupón ${c.Codigo} activado`)
    await cargar()
  } catch (err) {
    mostrarToast(err.response?.data?.error || 'No se pudo actualizar el cupón')
  }
}
</script>

<style scoped>
.codigo {
  font-family: ui-monospace, monospace;
  font-weight: 600;
  letter-spacing: 1px;
}
</style>
