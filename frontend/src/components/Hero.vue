<template>
  <section class="hero">
    <div class="container">
      <div class="row align-items-center g-4 g-lg-5">
        <div class="col-lg-6 order-2 order-lg-1">
          <span class="hero-eyebrow">Hecho a mano en Marcos Paz</span>
          <h1 class="hero-titulo">
            Convertimos tus ideas en <em>recuerdos</em> que se pueden tocar
          </h1>
          <p class="hero-texto">
            {{ config.valores.hero_subtitulo || 'Fotos Polaroid, álbumes, stickers e impresiones personalizadas, pensadas una por una para regalar y guardar.' }}
          </p>
          <div class="d-flex flex-wrap gap-3 mb-4">
            <router-link to="/productos" class="btn btn-alma">
              Ver la tienda <i class="bi bi-arrow-right ms-1"></i>
            </router-link>
            <a :href="linkWhatsapp" target="_blank" rel="noopener" class="btn btn-alma-borde">
              <i class="bi bi-whatsapp me-1"></i> Pedido personalizado
            </a>
          </div>
          <ul class="hero-confianza">
            <li><i class="bi bi-heart"></i> Hecho a mano</li>
            <li><i class="bi bi-truck"></i> Envíos a todo el país</li>
            <li><i class="bi bi-shield-check"></i> Pago seguro con Mercado Pago</li>
          </ul>
        </div>

        <div class="col-lg-6 order-1 order-lg-2">
          <div class="hero-visual">
            <div class="hero-arco">
              <Transition name="foto" mode="out-in">
                <img
                  v-if="imagenes.length"
                  :key="imagenes[indice]"
                  :src="imagenes[indice]"
                  alt="Trabajos de Creaciones Alma"
                  class="hero-img"
                  fetchpriority="high"
                />
                <div v-else class="hero-img hero-placeholder">
                  <MarcaAlma tamano="grande" />
                </div>
              </Transition>
            </div>
            <div class="hero-polaroid" aria-hidden="true">
              <div class="hero-polaroid-foto" :style="imagenes[1] ? { backgroundImage: `url(${imagenes[1]})` } : {}"></div>
              <span>con amor ♡</span>
            </div>
            <div class="hero-sello" aria-hidden="true">
              <span>Regalos<br />únicos</span>
            </div>
          </div>

          <div v-if="imagenes.length > 1" class="hero-puntos" role="tablist" aria-label="Fotos destacadas">
            <button
              v-for="(img, i) in imagenes"
              :key="img"
              type="button"
              class="punto"
              :class="{ activo: i === indice }"
              :aria-label="`Ver foto ${i + 1}`"
              :aria-selected="i === indice"
              role="tab"
              @click="irA(i)"
            ></button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useConfigStore } from '../stores/config'
import MarcaAlma from './MarcaAlma.vue'

const config = useConfigStore()
const indice = ref(0)
let intervalo = null

const imagenes = computed(() =>
  [config.valores.hero_imagen_1, config.valores.hero_imagen_2, config.valores.hero_imagen_3]
    .filter(url => url && url.trim() !== '')
)

const linkWhatsapp = computed(() => {
  const numero = config.valores.whatsapp_numero
  const texto = encodeURIComponent('¡Hola! Quiero hacer un pedido personalizado 💗')
  return numero ? `https://wa.me/${numero}?text=${texto}` : '/productos'
})

function irA(i) {
  indice.value = i
  reiniciar()
}

function reiniciar() {
  clearInterval(intervalo)
  intervalo = setInterval(() => {
    if (imagenes.value.length > 1) indice.value = (indice.value + 1) % imagenes.value.length
  }, 4500)
}

onMounted(reiniciar)
onBeforeUnmount(() => clearInterval(intervalo))
</script>

<style scoped>
.hero {
  padding: 56px 0 72px;
  overflow: hidden;
}
.hero-eyebrow {
  display: inline-block;
  font-size: 0.75rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--rosa-texto);
  background: var(--rosa-polvo);
  padding: 6px 14px;
  border-radius: 999px;
  margin-bottom: 20px;
}
.hero-titulo {
  font-size: clamp(2.3rem, 5vw, 3.7rem);
  line-height: 1.05;
  margin-bottom: 20px;
  letter-spacing: -0.03em;
}
.hero-titulo em {
  color: var(--rosa-viejo);
  font-style: italic;
}
.hero-texto {
  font-size: 1.1rem;
  color: var(--ciruela-suave);
  max-width: 500px;
  margin-bottom: 28px;
  line-height: 1.6;
}
.hero-confianza {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 10px 22px;
  font-size: 0.88rem;
  color: var(--ciruela-suave);
}
.hero-confianza i {
  color: var(--rosa-viejo);
  margin-right: 4px;
}

.hero-visual {
  position: relative;
  max-width: 470px;
  margin: 0 auto;
}
.hero-arco {
  border-radius: 240px 240px 28px 28px;
  overflow: hidden;
  aspect-ratio: 4 / 5;
  background: var(--rosa-polvo);
  box-shadow: var(--sombra-hover);
}
.hero-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.hero-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--fuente-titulos);
  font-size: 2rem;
  color: var(--ciruela-suave);
}

.hero-polaroid {
  position: absolute;
  left: -34px;
  bottom: 38px;
  width: 132px;
  background: var(--blanco);
  padding: 8px 8px 10px;
  border-radius: 4px;
  box-shadow: var(--sombra-hover);
  transform: rotate(-7deg);
  text-align: center;
}
.hero-polaroid-foto {
  aspect-ratio: 1;
  background: var(--rosa-polvo-medio) center / cover;
  border-radius: 2px;
}
.hero-polaroid span {
  display: block;
  margin-top: 6px;
  font-family: 'Dancing Script', cursive;
  font-size: 1rem;
  color: var(--ciruela-suave);
}
.hero-sello {
  position: absolute;
  right: -16px;
  top: 34px;
  width: 92px;
  height: 92px;
  border-radius: 50%;
  background: var(--lila-fuerte);
  color: var(--crema);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-family: var(--fuente-titulos);
  font-style: italic;
  font-size: 0.95rem;
  line-height: 1.1;
  transform: rotate(10deg);
}
.hero-puntos {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 22px;
}
.punto {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  border: none;
  padding: 0;
  background: var(--rosa-polvo-medio);
  transition: width 0.25s, background-color 0.25s;
}
.punto.activo {
  width: 24px;
  background: var(--rosa-viejo);
}
.foto-enter-active, .foto-leave-active { transition: opacity 0.5s; }
.foto-enter-from, .foto-leave-to { opacity: 0; }

@media (max-width: 575px) {
  .hero { padding: 28px 0 48px; }
  .hero-polaroid { left: -6px; width: 104px; bottom: 20px; }
  .hero-sello { right: -4px; width: 78px; height: 78px; font-size: 0.8rem; }
}
</style>
