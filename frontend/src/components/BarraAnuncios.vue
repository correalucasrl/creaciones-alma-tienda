<template>
  <div v-if="mensajes.length" class="barra-anuncios" role="region" aria-label="Novedades y promociones">
    <div class="container d-flex align-items-center justify-content-center gap-2">
      <Transition name="fade" mode="out-in">
        <p :key="indice" class="mb-0">
          <i :class="mensajes[indice].icono" class="me-2" aria-hidden="true"></i>{{ mensajes[indice].texto }}
        </p>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useConfigStore } from '../stores/config'

const config = useConfigStore()
const indice = ref(0)
let intervalo = null

// Los mensajes salen de Configuración: un texto libre del admin, el envío gratis y el descuento por transferencia
const mensajes = computed(() => {
  const v = config.valores
  const lista = []
  if (v.anuncio_barra) lista.push({ icono: 'bi bi-stars', texto: v.anuncio_barra })
  if (Number(v.envio_gratis_desde) > 0) {
    lista.push({ icono: 'bi bi-truck', texto: `Envío gratis en compras desde $${Number(v.envio_gratis_desde).toLocaleString('es-AR')}` })
  }
  if (Number(v.descuento_transferencia_pct) > 0) {
    lista.push({ icono: 'bi bi-bank', texto: `${Number(v.descuento_transferencia_pct)}% OFF pagando con transferencia` })
  }
  return lista
})

onMounted(() => {
  intervalo = setInterval(() => {
    if (mensajes.value.length > 1) indice.value = (indice.value + 1) % mensajes.value.length
  }, 4500)
})
onBeforeUnmount(() => clearInterval(intervalo))
</script>

<style scoped>
.barra-anuncios {
  background: var(--lila-fuerte);
  color: var(--crema);
  font-size: 0.82rem;
  letter-spacing: 0.02em;
  padding: 9px 0;
  text-align: center;
  min-height: 38px;
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.35s, transform 0.35s; }
.fade-enter-from { opacity: 0; transform: translateY(4px); }
.fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
