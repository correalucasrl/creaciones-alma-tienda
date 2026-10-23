<template>
  <section class="seccion-galeria" v-if="trabajos.length">
    <div class="container">
      <span class="eyebrow">Galería</span>
      <h2 class="section-title">Trabajos que <em class="acento">enamoran</em></h2>
      <p class="section-subtitle">Algunos de los pedidos que armamos para nuestros clientes.</p>

      <div class="carrusel-wrapper position-relative">
        <button
          v-if="grupos.length > 1"
          class="btn-flecha-galeria flecha-lateral flecha-izq"
          type="button"
          data-bs-target="#carruselGaleria"
          data-bs-slide="prev"
        >
          <i class="bi bi-chevron-left"></i>
        </button>

        <div id="carruselGaleria" class="carousel slide" data-bs-ride="carousel" data-bs-interval="4000">
          <div class="carousel-inner">
            <div
              v-for="(grupo, index) in grupos"
              :key="index"
              class="carousel-item"
              :class="{ active: index === 0 }"
            >
              <div class="row g-4 justify-content-center">
                <div class="col-6 col-md-5" v-for="trabajo in grupo" :key="trabajo.Id">
                  <img
                    :src="trabajo.Imagenes[0]"
                    class="img-fluid carrusel-img"
                    :alt="trabajo.Titulo"
                    role="button"
                    @click="abrirLightbox(trabajo)"
                  />
                  <p v-if="trabajo.Titulo" class="trabajo-titulo">{{ trabajo.Titulo }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          v-if="grupos.length > 1"
          class="btn-flecha-galeria flecha-lateral flecha-der"
          type="button"
          data-bs-target="#carruselGaleria"
          data-bs-slide="next"
        >
          <i class="bi bi-chevron-right"></i>
        </button>
      </div>

      <div v-if="grupos.length > 1" class="d-flex justify-content-center gap-2 mt-3">
        <span
          v-for="(g, i) in grupos"
          :key="i"
          class="dot-galeria"
          :class="{ activo: i === indiceActual }"
        ></span>
      </div>
    </div>

    <LightboxGaleria
      :visible="lightboxAbierto"
      :imagenes="imagenesActivas"
      :titulo="tituloActivo"
      :indice-inicial="0"
      @cerrar="lightboxAbierto = false"
    />
  </section>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import api from '../services/api'
import LightboxGaleria from './LightboxGaleria.vue'

const trabajos = ref([])
const lightboxAbierto = ref(false)
const imagenesActivas = ref([])
const tituloActivo = ref('')
const indiceActual = ref(0)

onMounted(async () => {
  try {
    const { data } = await api.get('/galeria')
    trabajos.value = data.filter(t => t.Imagenes.length > 0)
  } catch (err) {
    console.error('No se pudo cargar la galería:', err)
  }

  await nextTick()
  const carrusel = document.getElementById('carruselGaleria')
  if (carrusel) {
    window.bootstrap.Carousel.getOrCreateInstance(carrusel, { interval: 4000, ride: true, wrap: true })
    carrusel.addEventListener('slid.bs.carousel', (e) => {
      indiceActual.value = e.to
    })
  }
})

// Agrupa los trabajos de a 2 para que el carrusel avance de 2 en 2
const grupos = computed(() => {
  const resultado = []
  for (let i = 0; i < trabajos.value.length; i += 2) {
    resultado.push(trabajos.value.slice(i, i + 2))
  }
  return resultado
})

function abrirLightbox(trabajo) {
  imagenesActivas.value = trabajo.Imagenes
  tituloActivo.value = trabajo.Titulo
  lightboxAbierto.value = true
}
</script>

<style scoped>
.seccion-galeria {
  padding: 88px 0;
}
.acento {
  color: var(--rosa-viejo);
  font-style: italic;
}
.carrusel-img {
  height: 340px;
  width: 100%;
  object-fit: cover;
  cursor: zoom-in;
  border-radius: var(--radio-grande);
  transition: transform 0.4s;
}
.carrusel-img:hover {
  transform: scale(1.02);
}
.trabajo-titulo {
  text-align: center;
  font-family: var(--fuente-titulos);
  font-size: 1.1rem;
  margin: 12px 0 0;
}
.flecha-lateral {
  position: absolute;
  top: 160px;
  transform: translateY(-50%);
  z-index: 5;
}
.flecha-izq {
  left: -10px;
}
.flecha-der {
  right: -10px;
}
.btn-flecha-galeria {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 1px solid var(--borde);
  background: white;
  color: var(--ciruela);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  transition: 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.btn-flecha-galeria:hover {
  background: var(--rosa-viejo);
  color: white;
  border-color: var(--rosa-viejo);
}
.dot-galeria {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--rosa-polvo-medio);
  transition: 0.2s;
}
.dot-galeria.activo {
  background: var(--rosa-viejo);
  width: 20px;
  border-radius: 4px;
}
@media (max-width: 768px) {
  .carrusel-img {
    height: 200px;
  }
  .flecha-lateral {
    top: 100px;
  }
  .flecha-izq {
    left: -6px;
  }
  .flecha-der {
    right: -6px;
  }
}
</style>