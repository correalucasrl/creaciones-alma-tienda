<template>
  <article class="producto-card" :class="{ agotado: sinStock }">
    <router-link :to="url" class="producto-imagen" :aria-label="`Ver ${producto.Nombre}`">
      <img
        :src="producto.ImagenPrincipalUrl || 'https://placehold.co/400x400/ede9fe/6d28d9?text=' + encodeURIComponent(producto.Nombre)"
        :alt="producto.Nombre"
        loading="lazy"
      />
      <div class="badges">
        <span v-if="sinStock" class="badge-alma badge-agotado">Sin stock</span>
        <span v-else-if="producto.EnOferta" class="badge-alma badge-oferta">{{ producto.DescuentoPct }}% OFF</span>
        <span v-if="!sinStock && esNuevo" class="badge-alma badge-nuevo">Nuevo</span>
        <span v-else-if="!sinStock && destacadoTop" class="badge-alma badge-destacado">Más elegido</span>
      </div>
    </router-link>

    <div class="producto-info">
      <h3 class="producto-nombre">
        <router-link :to="url">{{ producto.Nombre }}</router-link>
      </h3>
      <div class="producto-precios">
        <template v-if="producto.EnOferta">
          <span class="precio-oferta">${{ formato(producto.PrecioFinal) }}</span>
          <span class="precio-tachado">${{ formato(producto.Precio) }}</span>
        </template>
        <span v-else class="precio-actual">${{ formato(producto.PrecioFinal ?? producto.Precio) }}</span>
      </div>
      <p v-if="precioTransferencia" class="producto-transferencia">
        ${{ formato(precioTransferencia) }} con transferencia
      </p>
    </div>

    <button
      class="btn-carrito"
      type="button"
      :disabled="sinStock"
      :aria-label="sinStock ? `${producto.Nombre} sin stock` : `Agregar ${producto.Nombre} al carrito`"
      @click="$emit('agregar', producto)"
    >
      <i class="bi bi-plus-lg" aria-hidden="true"></i>
    </button>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { urlProducto } from '../utils/producto'
import { useConfigStore } from '../stores/config'

const props = defineProps({
  producto: { type: Object, required: true },
  destacadoTop: { type: Boolean, default: false }
})

defineEmits(['agregar'])

const config = useConfigStore()
const DIAS_NUEVO = 30

const url = computed(() => urlProducto(props.producto))
const sinStock = computed(() => props.producto.Stock !== undefined && props.producto.Stock <= 0)
const esNuevo = computed(() => {
  const fecha = props.producto.FechaCreacion
  return fecha && Date.now() - new Date(fecha).getTime() < DIAS_NUEVO * 86400000
})
const precioTransferencia = computed(() => {
  const pct = Number(config.valores.descuento_transferencia_pct)
  if (!(pct > 0)) return null
  return Math.round((props.producto.PrecioFinal ?? props.producto.Precio) * (1 - pct / 100))
})

function formato(n) {
  return Number(n).toLocaleString('es-AR', { maximumFractionDigits: 2 })
}
</script>

<style scoped>
.producto-card {
  position: relative;
  height: 100%;
  background: var(--blanco);
  border: 1px solid var(--borde);
  border-radius: var(--radio-grande);
  padding: 10px;
  display: flex;
  flex-direction: column;
  transition: transform 0.25s, box-shadow 0.25s;
}
.producto-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--sombra-hover);
}
.producto-imagen {
  position: relative;
  display: block;
  aspect-ratio: 1;
  border-radius: 16px;
  overflow: hidden;
  background: var(--rosa-polvo);
}
.producto-imagen img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s;
}
.producto-card:hover .producto-imagen img {
  transform: scale(1.05);
}
.agotado .producto-imagen img {
  filter: grayscale(0.4);
  opacity: 0.75;
}
.badges {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}
.producto-info {
  padding: 14px 6px 8px;
  flex: 1;
}
.producto-nombre {
  font-family: var(--fuente-texto);
  font-size: 0.98rem;
  font-weight: 500;
  margin-bottom: 6px;
  padding-right: 44px;
  letter-spacing: 0;
}
.producto-nombre a {
  color: var(--ciruela);
  text-decoration: none;
}
.producto-nombre a:hover {
  color: var(--rosa-texto);
}
.producto-precios {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 1.05rem;
}
.producto-transferencia {
  margin: 4px 0 0;
  font-size: 0.78rem;
  color: var(--salvia-texto);
}
.btn-carrito {
  position: absolute;
  right: 16px;
  bottom: 18px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: var(--rosa-polvo);
  color: var(--ciruela);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  transition: background-color 0.2s, color 0.2s, transform 0.2s;
}
.btn-carrito:hover:not(:disabled) {
  background: var(--rosa-viejo);
  color: var(--blanco);
  transform: rotate(90deg);
}
.btn-carrito:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
