<template>
  <div class="admin-pagina">
    <header class="admin-encabezado">
      <div>
        <h1 class="admin-titulo">Dashboard</h1>
        <p class="admin-descripcion">Cómo vienen las ventas, los pedidos y las visitas.</p>
      </div>
    </header>

    <div class="dashboard-card p-4 mb-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
        <h5 class="fw-bold mb-0">Visitas a la página</h5>
        <select v-model.number="anioVisitas" class="form-select form-select-sm" style="width: auto;" @change="cargarVisitas">
          <option v-for="a in aniosDisponibles" :key="a" :value="a">{{ a }}</option>
        </select>
      </div>
      <v-chart class="chart-grande" :option="opcionVisitas" autoresize />
    </div>

    <div class="row g-4 mb-4">
      <div class="col-12 col-md-6">
        <div class="dashboard-card p-4">
          <h6 class="fw-bold mb-3">Productos más vendidos</h6>
          <v-chart class="chart-mediano" :option="opcionProductos" autoresize />
        </div>
      </div>
      <div class="col-12 col-md-6">
        <div class="dashboard-card p-4">
          <h6 class="fw-bold mb-3">Productos menos vendidos</h6>
          <v-chart class="chart-mediano" :option="opcionProductosMenos" autoresize />
        </div>
      </div>
    </div>

    <div class="dashboard-card p-4 mb-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
        <h5 class="fw-bold mb-0">Clientes nuevos</h5>
        <select v-model.number="anioClientes" class="form-select form-select-sm" style="width: auto;" @change="cargarClientesNuevos">
          <option v-for="a in aniosDisponibles" :key="a" :value="a">{{ a }}</option>
        </select>
      </div>
      <v-chart class="chart-grande" :option="opcionClientesNuevos" autoresize />
    </div>

    <div class="row g-4 mb-4">
      <div class="col-12 col-md-6">
        <div class="dashboard-card p-4">
          <h6 class="fw-bold mb-3">Pedidos por estado</h6>
          <v-chart class="chart-chico" :option="opcionEstados" autoresize />
        </div>
      </div>
      <div class="col-12 col-md-6">
        <div class="dashboard-card p-4">
          <h6 class="fw-bold mb-3">Tipo de entrega</h6>
          <v-chart class="chart-chico" :option="opcionEntrega" autoresize />
        </div>
      </div>
    </div>

    <div class="row g-4 mb-4">
      <div class="col-12 col-md-6">
        <div class="dashboard-card p-4">
          <h6 class="fw-bold mb-3">Métodos de pago</h6>
          <v-chart class="chart-chico" :option="opcionMetodosPago" autoresize />
        </div>
      </div>
      <div class="col-12 col-md-6">
        <div class="dashboard-card p-4">
          <h6 class="fw-bold mb-3">Ventas por categoría</h6>
          <v-chart class="chart-chico" :option="opcionCategorias" autoresize />
        </div>
      </div>
    </div>

    <div class="dashboard-card p-4">
      <h6 class="fw-bold mb-1">Calificación de testimonios</h6>
      <p class="text-secondary small mb-3" v-if="promedioCalificacion !== null">
        Promedio: <strong>{{ promedioCalificacion.toFixed(1) }} ★</strong>
      </p>
      <v-chart class="chart-mediano" :option="opcionCalificaciones" autoresize />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, provide } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart, BarChart } from 'echarts/charts'
import {
  TitleComponent, TooltipComponent, LegendComponent, GridComponent
} from 'echarts/components'
import VChart, { THEME_KEY } from 'vue-echarts'
import api from '../services/api'
import { ROSA, LILA, ROSA_CLARO, LILA_CLARO, COLORES_ESTADO, areaDegradada } from '../utils/graficos'

use([CanvasRenderer, LineChart, PieChart, BarChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent])
provide(THEME_KEY, 'alma')

const anioActual = new Date().getFullYear()
const anioVisitas = ref(anioActual)
const anioClientes = ref(anioActual)
const aniosDisponibles = [anioActual, anioActual - 1, anioActual - 2]
const visitas = ref(Array(12).fill(0))
const clientesNuevos = ref(Array(12).fill(0))

async function cargarVisitas() {
  const { data } = await api.get('/dashboard/visitas', { params: { anio: anioVisitas.value } })
  visitas.value = data
}

async function cargarClientesNuevos() {
  const { data } = await api.get('/dashboard/clientes-nuevos-anio', { params: { anio: anioClientes.value } })
  clientesNuevos.value = data
}

const estados = ref([])
const entrega = ref([])
const metodosPago = ref([])
const productos = ref([])
const productosMenos = ref([])
const categorias = ref([])
const calificaciones = ref([])
const promedioCalificacion = ref(null)


onMounted(async () => {
  await cargarClientesNuevos()
  await cargarVisitas()

  const [resEstados, resEntrega, resMetodos, resProductos, resProductosMenos, resCategorias, resCalif] = await Promise.all([
    api.get('/dashboard/estados'),
    api.get('/dashboard/entrega'),
    api.get('/dashboard/metodos-pago'),
    api.get('/dashboard/productos-top'),
    api.get('/dashboard/productos-menos-vendidos'),
    api.get('/dashboard/categorias'),
    api.get('/dashboard/calificaciones')
  ])

  estados.value = resEstados.data
  entrega.value = resEntrega.data
  metodosPago.value = resMetodos.data
  productos.value = resProductos.data
  productosMenos.value = resProductosMenos.data
  categorias.value = resCategorias.data
  calificaciones.value = resCalif.data.distribucion
  promedioCalificacion.value = resCalif.data.promedio
})

const mesesLabel = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const opcionVisitas = computed(() => ({
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: mesesLabel },
  yAxis: { type: 'value', name: 'Visitas' },
  series: [{
    data: visitas.value,
    type: 'line',
    smooth: true,
    areaStyle: areaDegradada(ROSA),
    itemStyle: { color: ROSA }
  }]
}))

const opcionClientesNuevos = computed(() => ({
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: mesesLabel },
  yAxis: { type: 'value', name: 'Clientes' },
  series: [{
    data: clientesNuevos.value,
    type: 'line',
    smooth: true,
    areaStyle: areaDegradada(LILA),
    itemStyle: { color: LILA }
  }]
}))

const opcionEstados = computed(() => ({
  tooltip: { trigger: 'item' },
  legend: { bottom: 0, textStyle: { fontSize: 11 } },
  series: [{
    type: 'pie',
    radius: ['48%', '72%'],
    data: estados.value.map(e => ({
      name: e.Estado,
      value: e.cantidad,
      itemStyle: { color: COLORES_ESTADO[e.Estado] || '#ccc' }
    }))
  }]
}))

const opcionEntrega = computed(() => ({
  tooltip: { trigger: 'item' },
  legend: { bottom: 0, textStyle: { fontSize: 11 } },
  series: [{
    type: 'pie',
    radius: ['48%', '72%'],
    data: entrega.value.map(e => ({
      name: e.TipoEntrega === 'Envio' ? 'Envío' : 'Retiro',
      value: e.cantidad
    })),
    color: [ROSA, LILA_CLARO]
  }]
}))

const opcionMetodosPago = computed(() => ({
  tooltip: { trigger: 'item' },
  legend: { bottom: 0, textStyle: { fontSize: 11 } },
  series: [{
    type: 'pie',
    radius: ['48%', '72%'],
    data: metodosPago.value.map(m => ({ name: m.metodo, value: m.cantidad })),
    color: [LILA, ROSA_CLARO]
  }]
}))

const opcionProductos = computed(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'value' },
  yAxis: { type: 'category', data: productos.value.map(p => p.Nombre).reverse(), axisLabel: { fontSize: 10 } },
  series: [{ data: productos.value.map(p => p.cantidad).reverse(), type: 'bar', barMaxWidth: 22, itemStyle: { color: ROSA } }]
}))

const opcionProductosMenos = computed(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'value' },
  yAxis: { type: 'category', data: productosMenos.value.map(p => p.Nombre).reverse(), axisLabel: { fontSize: 10 } },
  series: [{ data: productosMenos.value.map(p => p.cantidad).reverse(), type: 'bar', barMaxWidth: 22, itemStyle: { color: LILA_CLARO } }]
}))

const opcionCategorias = computed(() => ({
  tooltip: { trigger: 'item', valueFormatter: v => '$' + v.toLocaleString('es-AR') },
  legend: { bottom: 0, textStyle: { fontSize: 11 } },
  series: [{
    type: 'pie',
    radius: ['48%', '72%'],
    data: categorias.value.map(c => ({ name: c.categoria, value: c.total }))
  }]
}))

const opcionCalificaciones = computed(() => {
  const porEstrella = [1, 2, 3, 4, 5].map(n => {
    const encontrado = calificaciones.value.find(c => c.Calificacion === n)
    return encontrado ? encontrado.cantidad : 0
  })
  return {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['1 ★', '2 ★', '3 ★', '4 ★', '5 ★'] },
    yAxis: { type: 'value' },
    series: [{ data: porEstrella, type: 'bar', barMaxWidth: 40, itemStyle: { color: ROSA_CLARO, borderRadius: [6, 6, 0, 0] } }]
  }
})
</script>

<style scoped>
.chart-grande {
  height: 300px;
  width: 100%;
}
.chart-mediano {
  height: 280px;
  width: 100%;
}
.chart-chico {
  height: 260px;
  width: 100%;
}
</style>