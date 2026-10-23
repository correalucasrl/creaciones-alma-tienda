<template>
  <Teleport to="body">
    <Transition name="visor">
      <div
        v-if="visible"
        class="visor"
        role="dialog"
        aria-modal="true"
        :aria-label="titulo ? `Fotos de ${titulo}` : 'Visor de fotos'"
        @click.self="cerrar"
        @touchstart.passive="inicioToque"
        @touchend.passive="finToque"
      >
        <header class="visor-barra">
          <div class="visor-info">
            <p v-if="titulo" class="visor-titulo">{{ titulo }}</p>
            <p v-if="imagenes.length > 1" class="visor-contador">{{ indice + 1 }} de {{ imagenes.length }}</p>
          </div>
          <button ref="botonCerrar" type="button" class="visor-boton" aria-label="Cerrar visor" @click="cerrar">
            <i class="bi bi-x-lg"></i>
          </button>
        </header>

        <div class="visor-escenario" @click.self="cerrar">
          <button
            v-if="imagenes.length > 1"
            type="button"
            class="visor-boton visor-flecha izquierda"
            aria-label="Foto anterior"
            @click="anterior"
          >
            <i class="bi bi-chevron-left"></i>
          </button>

          <Transition :name="direccion === 1 ? 'deslizar-izq' : 'deslizar-der'" mode="out-in">
            <figure :key="imagenes[indice]" class="visor-figura" @click.self="cerrar">
              <div v-if="cargando" class="visor-cargando" aria-hidden="true"></div>
              <img
                :src="imagenes[indice]"
                :alt="titulo ? `${titulo} - foto ${indice + 1}` : `Foto ${indice + 1}`"
                class="visor-img"
                :class="{ oculta: cargando }"
                @load="cargando = false"
                @error="cargando = false"
              />
            </figure>
          </Transition>

          <button
            v-if="imagenes.length > 1"
            type="button"
            class="visor-boton visor-flecha derecha"
            aria-label="Foto siguiente"
            @click="siguiente"
          >
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>

        <nav v-if="imagenes.length > 1" class="visor-miniaturas" aria-label="Elegir foto">
          <button
            v-for="(img, i) in imagenes"
            :key="img"
            :ref="el => { if (i === indice) miniaturaActiva = el }"
            type="button"
            class="visor-miniatura"
            :class="{ activa: i === indice }"
            :aria-label="`Ver foto ${i + 1}`"
            :aria-current="i === indice"
            @click="irA(i)"
          >
            <img :src="img" alt="" loading="lazy" />
          </button>
        </nav>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  imagenes: { type: Array, default: () => [] },
  titulo: { type: String, default: '' },
  indiceInicial: { type: Number, default: 0 }
})

const emit = defineEmits(['cerrar'])

const indice = ref(props.indiceInicial)
const direccion = ref(1)
const cargando = ref(true)
const botonCerrar = ref(null)
let miniaturaActiva = null
let focoAnterior = null
let toqueX = null

function cerrar() {
  emit('cerrar')
}

function irA(i) {
  if (i === indice.value) return
  direccion.value = i > indice.value ? 1 : -1
  cargando.value = true
  indice.value = i
}

function siguiente() {
  direccion.value = 1
  cargando.value = true
  indice.value = (indice.value + 1) % props.imagenes.length
}

function anterior() {
  direccion.value = -1
  cargando.value = true
  indice.value = (indice.value - 1 + props.imagenes.length) % props.imagenes.length
}

function alPresionarTecla(e) {
  if (e.key === 'Escape') cerrar()
  else if (e.key === 'ArrowRight' && props.imagenes.length > 1) siguiente()
  else if (e.key === 'ArrowLeft' && props.imagenes.length > 1) anterior()
}

// Deslizar con el dedo en el celular: más de 50px hacia un lado cambia de foto
function inicioToque(e) {
  toqueX = e.touches[0].clientX
}
function finToque(e) {
  if (toqueX === null || props.imagenes.length < 2) return
  const delta = e.changedTouches[0].clientX - toqueX
  if (delta < -50) siguiente()
  else if (delta > 50) anterior()
  toqueX = null
}

// Al abrir: se traba el scroll de la página, se escucha el teclado y el foco va al botón cerrar.
// Al cerrar: se restaura todo y el foco vuelve a la foto que se había tocado
watch(() => props.visible, async (abierto) => {
  if (abierto) {
    indice.value = props.indiceInicial
    cargando.value = true
    focoAnterior = document.activeElement
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', alPresionarTecla)
    await nextTick()
    botonCerrar.value?.focus()
  } else {
    document.body.style.overflow = ''
    window.removeEventListener('keydown', alPresionarTecla)
    focoAnterior?.focus?.()
  }
})

// La miniatura activa siempre queda a la vista en la tira de abajo
watch(indice, async () => {
  await nextTick()
  miniaturaActiva?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', alPresionarTecla)
})
</script>

<style scoped>
.visor {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  background: rgba(24, 12, 40, 0.94);
  backdrop-filter: blur(6px);
  color: #fff;
}

.visor-barra {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  flex: 0 0 auto;
}
.visor-info {
  min-width: 0;
}
.visor-titulo {
  font-family: var(--fuente-titulos, Georgia, serif);
  font-size: 1.25rem;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.visor-contador {
  margin: 2px 0 0;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
}

.visor-boton {
  flex: 0 0 auto;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  transition: background-color 0.2s, transform 0.2s;
}
.visor-boton:hover,
.visor-boton:focus-visible {
  background: var(--rosa, #ec4899);
  border-color: var(--rosa, #ec4899);
}
.visor-boton:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}

.visor-escenario {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 84px;
}
.visor-figura {
  position: relative;
  margin: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.visor-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
  transition: opacity 0.25s;
  user-select: none;
}
.visor-img.oculta {
  opacity: 0;
}
.visor-cargando {
  position: absolute;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top-color: var(--rosa, #ec4899);
  animation: girar 0.8s linear infinite;
}
@keyframes girar { to { transform: rotate(360deg); } }

.visor-flecha {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 54px;
  height: 54px;
  font-size: 1.4rem;
  z-index: 1;
}
.visor-flecha:hover {
  transform: translateY(-50%) scale(1.05);
}
.visor-flecha.izquierda { left: 18px; }
.visor-flecha.derecha { right: 18px; }

.visor-miniaturas {
  flex: 0 0 auto;
  display: flex;
  gap: 10px;
  justify-content: center;
  overflow-x: auto;
  padding: 16px 20px 20px;
  scrollbar-width: none;
}
.visor-miniaturas::-webkit-scrollbar { display: none; }
.visor-miniatura {
  flex: 0 0 auto;
  width: 64px;
  height: 64px;
  padding: 0;
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid transparent;
  background: none;
  opacity: 0.55;
  transition: opacity 0.2s, border-color 0.2s, transform 0.2s;
}
.visor-miniatura:hover { opacity: 0.9; }
.visor-miniatura.activa {
  opacity: 1;
  border-color: var(--rosa, #ec4899);
  transform: translateY(-2px);
}
.visor-miniatura img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Animaciones: aparición del visor y cambio de foto */
.visor-enter-active, .visor-leave-active { transition: opacity 0.25s; }
.visor-enter-from, .visor-leave-to { opacity: 0; }
.deslizar-izq-enter-active, .deslizar-izq-leave-active,
.deslizar-der-enter-active, .deslizar-der-leave-active { transition: opacity 0.2s, transform 0.2s; }
.deslizar-izq-enter-from { opacity: 0; transform: translateX(30px); }
.deslizar-izq-leave-to { opacity: 0; transform: translateX(-30px); }
.deslizar-der-enter-from { opacity: 0; transform: translateX(-30px); }
.deslizar-der-leave-to { opacity: 0; transform: translateX(30px); }

@media (max-width: 576px) {
  .visor-escenario { padding: 0 8px; }
  .visor-flecha {
    width: 42px;
    height: 42px;
    font-size: 1.1rem;
    top: auto;
    bottom: 8px;
    transform: none;
  }
  .visor-flecha:hover { transform: none; }
  .visor-flecha.izquierda { left: calc(50% - 52px); }
  .visor-flecha.derecha { right: calc(50% - 52px); }
  .visor-escenario { padding-bottom: 60px; }
  .visor-miniatura { width: 52px; height: 52px; }
}

@media (prefers-reduced-motion: reduce) {
  .visor-cargando { animation: none; }
}
</style>
