<template>
  <div class="admin-pagina">
    <header class="admin-encabezado">
      <div>
        <h1 class="admin-titulo">Costos y facturación</h1>
        <p class="admin-descripcion">Ingresos, costos y ganancia de cada período.</p>
      </div>
    </header>

    <!-- KPIs -->
    <div class="row g-3 mb-4">
      <div class="col-6 col-md-3">
        <div class="kpi-card p-3">
          <p class="kpi-label mb-1">Facturado</p>
          <p class="kpi-valor mb-0 text-verde">${{ (resumen.totalFacturado || 0).toLocaleString('es-AR') }}</p>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="kpi-card p-3">
          <p class="kpi-label mb-1">Pendiente de cobro</p>
          <p class="kpi-valor mb-0 text-amarillo">${{ (resumen.totalPendiente || 0).toLocaleString('es-AR') }}</p>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="kpi-card p-3">
          <p class="kpi-label mb-1">Cancelado</p>
          <p class="kpi-valor mb-0 text-rojo">${{ (resumen.totalCancelado || 0).toLocaleString('es-AR') }}</p>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="kpi-card p-3">
          <p class="kpi-label mb-1">Envío acumulado</p>
          <p class="kpi-valor mb-0 text-secondary">${{ (resumen.costoEnvioAcumulado || 0).toLocaleString('es-AR') }}</p>
        </div>
      </div>
      <div class="col-12">
        <div class="kpi-card p-3 kpi-neto">
          <p class="kpi-label mb-1">Ingreso neto (facturado − envío)</p>
          <p class="kpi-valor mb-0 text-neto">${{ (resumen.ingresoNeto || 0).toLocaleString('es-AR') }}</p>
        </div>
      </div>
    </div>

    <!-- Meta mensual -->
    <div class="dashboard-card p-4 mb-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
        <h6 class="fw-bold mb-0">Meta del mes</h6>
        <div class="d-flex align-items-center gap-2">
          <input
            v-model.number="metaEditable"
            type="number"
            class="form-control form-control-sm"
            style="width: 140px;"
            placeholder="Meta $"
          />
          <button class="btn btn-sm btn-turquesa" @click="guardarMeta">Guardar</button>
        </div>
      </div>
      <p class="small text-secondary mb-2">
        ${{ meta.facturadoMesActual.toLocaleString('es-AR') }} de ${{ meta.meta.toLocaleString('es-AR') }}
        <span v-if="meta.meta > 0">({{ porcentajeMeta }}%)</span>
      </p>
      <div class="progress barra-meta">
        <div
          class="progress-bar"
          :style="{ width: Math.min(porcentajeMeta, 100) + '%' }"
        ></div>
      </div>
    </div>

    <!-- Top clientes (tabla) -->
    <div class="dashboard-card p-4 mb-4">
      <h6 class="fw-bold mb-3">Top clientes</h6>
      <div class="table-responsive">
        <table class="table table-sm align-middle">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Email</th>
              <th class="text-end">Pedidos</th>
              <th class="text-end">Total gastado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in topClientes" :key="c.email">
              <td class="fw-semibold">{{ c.nombre }}</td>
              <td class="text-secondary small">{{ c.email }}</td>
              <td class="text-end">{{ c.cantidadPedidos }}</td>
              <td class="text-end fw-semibold">${{ c.totalGastado.toLocaleString('es-AR') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Detalle de ventas (tabla) -->
    <div class="dashboard-card p-4 mb-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h6 class="fw-bold mb-0">Detalle de ventas</h6>
        <div class="d-flex gap-2 align-items-center flex-wrap">
          <input v-model="desde" type="date" class="form-control form-control-sm" style="width: 150px;" />
          <span class="small text-secondary">a</span>
          <input v-model="hasta" type="date" class="form-control form-control-sm" style="width: 150px;" />
          <button class="btn btn-sm btn-outline-secondary" @click="cargarDetalle">Filtrar</button>
          <button class="btn btn-sm btn-turquesa" @click="exportarCsv">
            <i class="bi bi-download me-1"></i>Exportar CSV
          </button>
        </div>
      </div>

      <div class="table-responsive">
        <table class="table table-sm align-middle text-start">
          <thead>
            <tr>
              <th class="text-start">#</th>
              <th class="text-start">Fecha</th>
              <th class="text-start">Cliente</th>
              <th class="text-start">Producto</th>
              <th class="text-start">Cant.</th>
              <th class="text-start">Precio unit.</th>
              <th class="text-start">Subtotal</th>
              <th class="text-start">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(v, i) in detallePaginado" :key="i">
              <td class="text-secondary small text-start">#{{ v.ordenId }}</td>
              <td class="small text-start">{{ new Date(v.fecha).toLocaleDateString('es-AR') }}</td>
              <td class="text-start">
                <p class="mb-0 small fw-semibold">{{ v.cliente }}</p>
                <p class="mb-0 small text-secondary">{{ v.email }}</p>
              </td>
              <td class="small text-start">{{ v.producto }}</td>
              <td class="small text-start">{{ v.cantidad }}</td>
              <td class="small text-start">${{ v.precioUnitario.toLocaleString('es-AR') }}</td>
              <td class="small fw-semibold text-start">${{ v.subtotal.toLocaleString('es-AR') }}</td>
              <td class="text-start">
                <span class="badge-estado" :class="claseEstado(v.estado)">{{ v.estado }}</span>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="detalle.length === 0" class="text-secondary text-center py-4 small">
          No hay ventas para ese rango de fechas.
        </p>
      </div>

      <div v-if="detalle.length > 0" class="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-3">
        <div class="d-flex align-items-center gap-2">
          <span class="small text-secondary">Mostrar:</span>
          <select v-model="tamanoPagina" class="form-select form-select-sm" style="width: auto;" @change="paginaActual = 1">
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="'todas'">Todas</option>
          </select>
        </div>

        <div v-if="tamanoPagina !== 'todas'" class="d-flex align-items-center gap-2">
          <button class="btn btn-sm btn-outline-secondary" :disabled="paginaActual === 1" @click="paginaActual--">
            Anterior
          </button>
          <span class="small text-secondary">Página {{ paginaActual }} de {{ totalPaginas }}</span>
          <button class="btn btn-sm btn-outline-secondary" :disabled="paginaActual === totalPaginas" @click="paginaActual++">
            Siguiente
          </button>
        </div>
      </div>
    </div>

    <!-- Gráfico 1: Top clientes -->
    <div class="dashboard-card p-4 mb-4">
      <h6 class="fw-bold mb-3">Gráfico: Top clientes</h6>
      <v-chart class="chart-mediano" :option="opcionTopClientes" autoresize />
    </div>

    <!-- Gráfico 2: Plata facturada por mes -->
    <div class="dashboard-card p-4 mb-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h6 class="fw-bold mb-0">Gráfico: Plata facturada por mes</h6>
        <div class="d-flex gap-2">
          <select v-model.number="anioVentasMes" class="form-select form-select-sm" style="width: auto;" @change="cargarVentasPorMes">
            <option v-for="a in aniosDisponibles" :key="a" :value="a">{{ a }}</option>
          </select>
          <select v-model="estadoVentasMes" class="form-select form-select-sm" style="width: auto;" @change="cargarVentasPorMes">
            <option value="Todos">Todos los estados</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Pagado">Pagado</option>
            <option value="Enviado">Enviado</option>
            <option value="Entregado">Entregado</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </div>
      </div>
      <v-chart class="chart-mediano" :option="opcionVentasPorMes" autoresize />
    </div>

    <!-- Gráfico 3: Cantidad de pedidos -->
    <div class="dashboard-card p-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h6 class="fw-bold mb-0">Gráfico: Cantidad de pedidos</h6>
        <div class="btn-group btn-group-sm">
          <button
            v-for="opcion in periodosPedidos"
            :key="opcion.valor"
            class="btn"
            :class="periodoPedidos === opcion.valor ? 'btn-turquesa' : 'btn-outline-secondary'"
            @click="cambiarPeriodoPedidos(opcion.valor)"
          >
            {{ opcion.label }}
          </button>
        </div>
      </div>

      <div class="d-flex gap-2 flex-wrap mb-3">
        <select v-model="categoriaFiltroPedidos" class="form-select form-select-sm" style="width: auto;" @change="productoFiltroPedidos = ''; cargarPedidosPorPeriodo()">
          <option value="">Todas las categorías</option>
          <option v-for="c in categoriasLista" :key="c.Id" :value="c.Id">{{ c.Nombre }}</option>
        </select>
        <select v-model="productoFiltroPedidos" class="form-select form-select-sm" style="width: auto;" @change="cargarPedidosPorPeriodo">
          <option value="">Todos los productos</option>
          <option v-for="p in productosLista" :key="p.Id" :value="p.Id">{{ p.Nombre }}</option>
        </select>
      </div>

      <v-chart class="chart-mediano" :option="opcionPedidosPorPeriodo" autoresize />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, provide } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart } from 'echarts/charts'
import { TooltipComponent, GridComponent } from 'echarts/components'
import VChart, { THEME_KEY } from 'vue-echarts'
import api from '../services/api'
import { ROSA, LILA, areaDegradada } from '../utils/graficos'

use([CanvasRenderer, LineChart, BarChart, TooltipComponent, GridComponent])
provide(THEME_KEY, 'alma')

const resumen = ref({})
const meta = ref({ meta: 0, facturadoMesActual: 0 })
const metaEditable = ref(0)
const topClientes = ref([])
const detalle = ref([])
const desde = ref('')
const hasta = ref('')
const paginaActual = ref(1)
const tamanoPagina = ref(10)

const totalPaginas = computed(() => {
  if (tamanoPagina.value === 'todas') return 1
  return Math.max(1, Math.ceil(detalle.value.length / tamanoPagina.value))
})

const detallePaginado = computed(() => {
  if (tamanoPagina.value === 'todas') return detalle.value
  const inicio = (paginaActual.value - 1) * tamanoPagina.value
  return detalle.value.slice(inicio, inicio + tamanoPagina.value)
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


const porcentajeMeta = computed(() => {
  if (!meta.value.meta) return 0
  return Math.round((meta.value.facturadoMesActual / meta.value.meta) * 100)
})

async function cargarResumen() {
  const { data } = await api.get('/finanzas/resumen')
  resumen.value = data
}

async function cargarMeta() {
  const { data } = await api.get('/finanzas/meta')
  meta.value = data
  metaEditable.value = data.meta
}

async function guardarMeta() {
  await api.put('/configuracion', { meta_mensual: metaEditable.value.toString() })
  await cargarMeta()
}

async function cargarTopClientes() {
  const { data } = await api.get('/finanzas/top-clientes')
  topClientes.value = data
}

async function cargarDetalle() {
  const { data } = await api.get('/finanzas/detalle-ventas', {
    params: { desde: desde.value || undefined, hasta: hasta.value || undefined }
  })
  detalle.value = data
  paginaActual.value = 1
}

async function exportarCsv() {
  const { data } = await api.get('/finanzas/detalle-ventas/exportar', {
    params: { desde: desde.value || undefined, hasta: hasta.value || undefined },
    responseType: 'blob'
  })
  const url = window.URL.createObjectURL(new Blob([data]))
  const link = document.createElement('a')
  link.href = url
  link.download = 'detalle-ventas.csv'
  link.click()
  window.URL.revokeObjectURL(url)
}

const opcionTopClientes = computed(() => {
  const ordenados = [...topClientes.value].reverse()
  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const idx = ordenados.length - 1 - params[0].dataIndex
        const c = topClientes.value[idx]
        return `<strong>${c.nombre}</strong><br/>Total gastado: $${c.totalGastado.toLocaleString('es-AR')}<br/>Pedidos: ${c.cantidadPedidos}`
      }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value' },
    yAxis: {
      type: 'category',
      data: ordenados.map(c => c.nombre),
      axisLabel: { fontSize: 10 }
    },
    series: [{
      data: ordenados.map(c => c.totalGastado),
      type: 'bar',
      barMaxWidth: 22,
      itemStyle: { color: ROSA },
      label: {
        show: true,
        position: 'right',
        formatter: (params) => {
          const idx = ordenados.length - 1 - params.dataIndex
          return `${topClientes.value[idx].cantidadPedidos} ped.`
        },
        fontSize: 10,
        color: '#6b7280'
      }
    }]
  }
})

const anioActual2 = new Date().getFullYear()
const aniosDisponibles = [anioActual2, anioActual2 - 1, anioActual2 - 2]
const anioVentasMes = ref(anioActual2)
const estadoVentasMes = ref('Pagado')
const ventasPorMes = ref(Array(12).fill(0))

async function cargarVentasPorMes() {
  const { data } = await api.get('/finanzas/ventas-por-mes', {
    params: { anio: anioVentasMes.value, estado: estadoVentasMes.value }
  })
  ventasPorMes.value = data
}

const mesesLabel = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const opcionVentasPorMes = computed(() => ({
  tooltip: { trigger: 'axis', valueFormatter: v => '$' + v.toLocaleString('es-AR') },
  xAxis: { type: 'category', data: mesesLabel, axisLabel: { fontSize: 10 } },
  yAxis: { type: 'value' },
  series: [{
    data: ventasPorMes.value,
    type: 'line',
    smooth: true,
    areaStyle: areaDegradada(ROSA),
    itemStyle: { color: ROSA }
  }]
}))

const periodosPedidos = [
  { valor: 'diario', label: 'Día' },
  { valor: 'semanal', label: 'Semana' },
  { valor: 'mensual', label: 'Mes' },
  { valor: 'anual', label: 'Año' }
]
const periodoPedidos = ref('mensual')
const pedidosPorPeriodo = ref([])
const categoriaFiltroPedidos = ref('')
const productoFiltroPedidos = ref('')
const categoriasLista = ref([])
const productosLista = ref([])

async function cargarCategoriasYProductos() {
  const [resCat, resProd] = await Promise.all([
    api.get('/categorias'),
    api.get('/productos')
  ])
  categoriasLista.value = resCat.data
  productosLista.value = resProd.data
}

async function cargarPedidosPorPeriodo() {
  const { data } = await api.get('/finanzas/pedidos-por-periodo', {
    params: {
      periodo: periodoPedidos.value,
      categoriaId: categoriaFiltroPedidos.value || undefined,
      productoId: productoFiltroPedidos.value || undefined
    }
  })
  pedidosPorPeriodo.value = data
}

function cambiarPeriodoPedidos(nuevo) {
  periodoPedidos.value = nuevo
  cargarPedidosPorPeriodo()
}

const opcionPedidosPorPeriodo = computed(() => ({
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: pedidosPorPeriodo.value.map(p => p.periodo), axisLabel: { fontSize: 9, rotate: 30 } },
  yAxis: { type: 'value' },
  series: [{
    data: pedidosPorPeriodo.value.map(p => p.cantidad),
    type: 'line',
    smooth: true,
    areaStyle: areaDegradada(LILA),
    itemStyle: { color: LILA }
  }]
}))

onMounted(async () => {
  await Promise.all([
    cargarResumen(),
    cargarMeta(),
    cargarTopClientes(),
    cargarDetalle(),
    cargarVentasPorMes(),
    cargarPedidosPorPeriodo(),
    cargarCategoriasYProductos()
  ])
})
</script>

<style scoped>
.kpi-neto {
  background: linear-gradient(120deg, var(--rosa-polvo), var(--lila-suave));
  border-color: transparent;
}
.kpi-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--ciruela-suave);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.kpi-valor {
  font-family: var(--fuente-titulos);
  font-size: 1.55rem;
  font-weight: 600;
}
.text-verde { color: var(--salvia-texto); }
.text-amarillo { color: #b45309; }
.text-rojo { color: #9ca3af; }
.text-neto { color: var(--lila-fuerte); }
.barra-meta {
  height: 10px;
  border-radius: 999px;
  background: var(--crema-oscura);
}
.barra-meta .progress-bar {
  border-radius: 999px;
  background: linear-gradient(90deg, var(--rosa-viejo), var(--lila-fuerte));
}
.chart-mediano {
  height: 260px;
  width: 100%;
}
</style>