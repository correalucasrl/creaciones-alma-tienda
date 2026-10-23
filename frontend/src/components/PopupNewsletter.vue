<template>
  <Transition name="popup">
    <div v-if="visible" class="popup-fondo" @click.self="cerrar">
      <div
        class="popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="popup-titulo"
        @keydown.esc="cerrar"
      >
        <button ref="botonCerrar" type="button" class="popup-cerrar" aria-label="Cerrar" @click="cerrar">
          <i class="bi bi-x-lg"></i>
        </button>
        <div class="popup-sello" aria-hidden="true">
          <span>{{ porcentaje }}%</span>
          <small>OFF</small>
        </div>
        <MarcaAlma tamano="chico" :subtitulo="false" />
        <h2 id="popup-titulo" class="popup-titulo">Un regalo para tu primera compra</h2>
        <p class="popup-texto">Sumate al newsletter y te mandamos un cupón de <strong>{{ porcentaje }}% OFF</strong> a tu email.</p>
        <FormNewsletter origen="popup" @suscripto="alSuscribirse" />
        <button type="button" class="popup-no" @click="cerrar">No, gracias</button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useConfigStore } from '../stores/config'
import FormNewsletter from './FormNewsletter.vue'
import MarcaAlma from './MarcaAlma.vue'

const SEGUNDOS_ESPERA = 25
const DIAS_SIN_MOSTRAR = 14
// Pantallas donde el popup molestaría
const RUTAS_SIN_POPUP = ['/checkout', '/login', '/registro', '/olvide-password', '/arrepentimiento', '/mis-pedidos', '/orden-confirmada', '/admin', '/newsletter', '/resetear-password', '/verificar-email']

const route = useRoute()
const config = useConfigStore()
const porcentaje = computed(() => Number(config.valores.newsletter_descuento_pct) || 10)
const visible = ref(false)
const botonCerrar = ref(null)
let temporizador = null

// localStorage puede no estar disponible (modo privado): en ese caso no se muestra, para no insistir
function leer(clave) {
  try { return localStorage.getItem(clave) } catch { return 'sin-almacenamiento' }
}
function guardar(clave, valor) {
  try { localStorage.setItem(clave, valor) } catch { /* sin almacenamiento */ }
}

function corresponde() {
  if (leer('newsletter_suscripto')) return false
  const pospuesto = Number(leer('newsletter_popup_hasta'))
  if (pospuesto && Date.now() < pospuesto) return false
  return !RUTAS_SIN_POPUP.some(r => route.path.startsWith(r))
}

function cerrar() {
  visible.value = false
  guardar('newsletter_popup_hasta', String(Date.now() + DIAS_SIN_MOSTRAR * 86400000))
}

function alSuscribirse() {
  // Se deja el mensaje de confirmación a la vista un momento y se cierra solo
  setTimeout(() => { visible.value = false }, 4000)
}

onMounted(() => {
  temporizador = setTimeout(() => {
    if (corresponde()) visible.value = true
  }, SEGUNDOS_ESPERA * 1000)
})
onBeforeUnmount(() => clearTimeout(temporizador))

// Si navega a una pantalla sin popup (por ejemplo, el checkout), se oculta sin posponer
watch(() => route.path, () => {
  if (visible.value && RUTAS_SIN_POPUP.some(r => route.path.startsWith(r))) visible.value = false
})

watch(visible, async v => {
  document.body.style.overflow = v ? 'hidden' : ''
  if (v) {
    await nextTick()
    botonCerrar.value?.focus()
  }
})
</script>

<style scoped>
.popup-fondo {
  position: fixed;
  inset: 0;
  z-index: 1900;
  background: rgba(24, 12, 40, 0.55);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.popup {
  position: relative;
  width: min(460px, 100%);
  background: var(--blanco);
  border-radius: 28px;
  padding: 40px 32px 26px;
  text-align: center;
  box-shadow: 0 30px 80px rgba(76, 29, 149, 0.3);
}
.popup :deep(.campo) {
  margin: 0 auto;
}
.popup :deep(.legal),
.popup :deep(.error) {
  margin-left: 0;
}
.popup-cerrar {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: none;
  background: var(--crema-oscura);
  color: var(--ciruela);
}
.popup-cerrar:hover {
  background: var(--rosa-polvo);
}
.popup-sello {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%) rotate(-8deg);
  width: 74px;
  height: 74px;
  border-radius: 50%;
  background: var(--rosa-viejo);
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  line-height: 1;
  box-shadow: 0 10px 24px rgba(236, 72, 153, 0.4);
}
.popup-sello span {
  font-family: var(--fuente-titulos);
  font-size: 1.4rem;
}
.popup-sello small {
  font-size: 0.7rem;
  letter-spacing: 1px;
}
.popup-titulo {
  font-size: 1.6rem;
  margin: 12px 0 8px;
}
.popup-texto {
  color: var(--ciruela-suave);
  margin-bottom: 20px;
}
.popup-no {
  border: none;
  background: none;
  color: var(--ciruela-suave);
  font-size: 0.85rem;
  text-decoration: underline;
  text-underline-offset: 3px;
  margin-top: 14px;
}
.popup-enter-active, .popup-leave-active { transition: opacity 0.3s; }
.popup-enter-active .popup, .popup-leave-active .popup { transition: transform 0.3s; }
.popup-enter-from, .popup-leave-to { opacity: 0; }
.popup-enter-from .popup, .popup-leave-to .popup { transform: translateY(16px) scale(0.98); }
</style>
