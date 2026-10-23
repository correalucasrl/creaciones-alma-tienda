<template>
  <p v-if="estado === 'Cancelado'" class="cancelado">
    <i class="bi bi-x-circle me-2" aria-hidden="true"></i>Este pedido fue cancelado.
  </p>
  <ol v-else class="seguimiento" aria-label="Seguimiento del pedido">
    <li
      v-for="(paso, i) in pasos"
      :key="paso.estado"
      :class="{ hecho: i <= actual, actual: i === actual }"
      :aria-current="i === actual ? 'step' : undefined"
    >
      <span class="punto"><i :class="['bi', i < actual ? 'bi-check-lg' : paso.icono]" aria-hidden="true"></i></span>
      <span class="nombre">{{ paso.nombre }}</span>
    </li>
  </ol>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  estado: { type: String, required: true }
})

const pasos = [
  { estado: 'Pendiente', nombre: 'Recibido', icono: 'bi-receipt' },
  { estado: 'Pagado', nombre: 'Pagado', icono: 'bi-credit-card' },
  { estado: 'Enviado', nombre: 'En camino', icono: 'bi-truck' },
  { estado: 'Entregado', nombre: 'Entregado', icono: 'bi-gift' }
]

const actual = computed(() => Math.max(pasos.findIndex(p => p.estado === props.estado), 0))
</script>

<style scoped>
.seguimiento {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  position: relative;
}
.seguimiento li {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
}
.seguimiento li:not(:first-child)::before {
  content: '';
  position: absolute;
  top: 18px;
  right: 50%;
  width: 100%;
  height: 3px;
  background: var(--borde);
  z-index: 0;
}
.seguimiento li.hecho:not(:first-child)::before {
  background: var(--rosa-viejo);
}
.punto {
  position: relative;
  z-index: 1;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--blanco);
  border: 2px solid var(--borde);
  color: var(--ciruela-suave);
  display: flex;
  align-items: center;
  justify-content: center;
}
.hecho .punto {
  background: var(--rosa-viejo);
  border-color: var(--rosa-viejo);
  color: #fff;
}
.actual .punto {
  box-shadow: 0 0 0 5px var(--rosa-polvo);
}
.nombre {
  font-size: 0.82rem;
  color: var(--ciruela-suave);
}
.hecho .nombre {
  color: var(--ciruela);
  font-weight: 500;
}
.cancelado {
  background: #fee2e2;
  color: #991b1b;
  border-radius: 14px;
  padding: 12px 16px;
  margin: 0;
}
</style>
