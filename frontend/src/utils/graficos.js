import { registerTheme } from 'echarts/core'

// Paleta de los gráficos del admin: la misma del sitio (rosa fuerte + lila)
export const ROSA = '#ec4899'
export const LILA = '#8b5cf6'
export const ROSA_CLARO = '#f9a8d4'
export const LILA_CLARO = '#c4b5fd'

// Mismos colores que las etiquetas de estado del panel (admin.css)
export const COLORES_ESTADO = {
  Pendiente: '#f59e0b',
  Pagado: '#22c55e',
  Enviado: '#0ea5e9',
  Entregado: '#7c3aed',
  Cancelado: '#d1d5db'
}

// Relleno degradado debajo de una línea (del color con transparencia a nada)
export function areaDegradada(hex) {
  return {
    color: {
      type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
      colorStops: [{ offset: 0, color: hex + '40' }, { offset: 1, color: hex + '00' }]
    }
  }
}

const TEXTO = '#6b7280'
const LINEAS = '#ede9fe'

registerTheme('alma', {
  color: [ROSA, LILA, ROSA_CLARO, LILA_CLARO, '#be185d', '#5b21b6'],
  textStyle: { fontFamily: "'DM Sans', sans-serif", color: TEXTO },
  legend: { textStyle: { color: TEXTO }, icon: 'circle', itemWidth: 9, itemHeight: 9 },
  tooltip: {
    backgroundColor: '#ffffff',
    borderColor: LINEAS,
    borderWidth: 1,
    textStyle: { color: '#1f2937' },
    extraCssText: 'border-radius:12px;box-shadow:0 8px 24px rgba(76,29,149,.12);'
  },
  categoryAxis: {
    axisLine: { lineStyle: { color: LINEAS } },
    axisTick: { show: false },
    axisLabel: { color: TEXTO },
    splitLine: { show: false }
  },
  valueAxis: {
    axisLine: { show: false },
    axisLabel: { color: TEXTO },
    splitLine: { lineStyle: { color: '#f3f0fb' } },
    nameTextStyle: { color: TEXTO }
  },
  line: { symbol: 'circle', symbolSize: 6, lineStyle: { width: 3 } },
  bar: { itemStyle: { borderRadius: [0, 6, 6, 0] } },
  pie: { itemStyle: { borderColor: '#ffffff', borderWidth: 2 } }
})
