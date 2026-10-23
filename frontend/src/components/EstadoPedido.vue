<template>
  <span class="estado" :class="`estado-${clase}`"><i :class="['bi', icono]" aria-hidden="true"></i>{{ texto }}</span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  estado: { type: String, required: true }
})

const ESTADOS = {
  Pendiente: { clase: 'pendiente', icono: 'bi-hourglass-split', texto: 'Pendiente de pago' },
  Pagado: { clase: 'pagado', icono: 'bi-check-circle', texto: 'Pagado' },
  Enviado: { clase: 'enviado', icono: 'bi-truck', texto: 'En camino' },
  Entregado: { clase: 'entregado', icono: 'bi-gift', texto: 'Entregado' },
  Cancelado: { clase: 'cancelado', icono: 'bi-x-circle', texto: 'Cancelado' }
}

const datos = computed(() => ESTADOS[props.estado] || { clase: 'pendiente', icono: 'bi-circle', texto: props.estado })
const clase = computed(() => datos.value.clase)
const icono = computed(() => datos.value.icono)
const texto = computed(() => datos.value.texto)
</script>

<style scoped>
.estado {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
}
.estado-pendiente { background: #fef3c7; color: #92400e; }
.estado-pagado { background: #dcfce7; color: #166534; }
.estado-enviado { background: var(--lila-suave); color: var(--lila-fuerte); }
.estado-entregado { background: var(--rosa-polvo); color: var(--rosa-texto); }
.estado-cancelado { background: #fee2e2; color: #991b1b; }
</style>
