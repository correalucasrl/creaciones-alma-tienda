<template>
  <div class="container galeria-pagina">
    <header class="galeria-encabezado">
      <span class="eyebrow">Galería</span>
      <h1 class="galeria-titulo">Todos nuestros <em>trabajos</em></h1>
      <p class="section-subtitle mb-0">Pedidos reales que armamos para nuestros clientes. Tocá cada uno para ver todas sus fotos.</p>
    </header>

    <div v-if="cargando" class="grilla">
      <div v-for="n in 8" :key="n" class="esqueleto"></div>
    </div>

    <div v-else-if="trabajos.length === 0" class="vacio">
      <i class="bi bi-images" aria-hidden="true"></i>
      <p>Todavía no cargamos trabajos en la galería.</p>
    </div>

    <div v-else class="grilla">
      <button
        v-for="trabajo in trabajos"
        :key="trabajo.Id"
        type="button"
        class="trabajo"
        :aria-label="`Ver fotos de ${trabajo.Titulo || 'este trabajo'}`"
        @click="abrirLightbox(trabajo)"
      >
        <span class="trabajo-imagen">
          <img :src="trabajo.Imagenes[0]" :alt="trabajo.Titulo || 'Trabajo de Creaciones Alma'" loading="lazy" />
          <span class="trabajo-capa" aria-hidden="true">
            <i class="bi bi-arrows-angle-expand"></i>
            Ver {{ trabajo.Imagenes.length > 1 ? `las ${trabajo.Imagenes.length} fotos` : 'foto' }}
          </span>
          <span v-if="trabajo.Imagenes.length > 1" class="trabajo-cantidad">
            <i class="bi bi-images me-1"></i>{{ trabajo.Imagenes.length }}
          </span>
        </span>
        <span v-if="trabajo.Titulo" class="trabajo-titulo">{{ trabajo.Titulo }}</span>
      </button>
    </div>

    <LightboxGaleria
      :visible="lightboxAbierto"
      :imagenes="imagenesActivas"
      :titulo="tituloActivo"
      :indice-inicial="0"
      @cerrar="lightboxAbierto = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../services/api'
import LightboxGaleria from '../components/LightboxGaleria.vue'

const trabajos = ref([])
const cargando = ref(true)
const lightboxAbierto = ref(false)
const imagenesActivas = ref([])
const tituloActivo = ref('')

onMounted(async () => {
  try {
    const { data } = await api.get('/galeria')
    trabajos.value = data.filter(t => t.Imagenes.length > 0)
  } catch (err) {
    console.error('No se pudo cargar la galería:', err)
  } finally {
    cargando.value = false
  }
})

function abrirLightbox(trabajo) {
  imagenesActivas.value = trabajo.Imagenes
  tituloActivo.value = trabajo.Titulo
  lightboxAbierto.value = true
}
</script>

<style scoped>
.galeria-pagina {
  padding-top: 56px;
  padding-bottom: 88px;
}
.galeria-encabezado {
  text-align: center;
  margin-bottom: 40px;
}
.galeria-titulo {
  font-size: clamp(2rem, 4vw, 3rem);
  margin-bottom: 0.6rem;
}
.galeria-titulo em {
  color: var(--rosa-viejo);
  font-style: italic;
}
.grilla {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 24px;
}
.trabajo {
  border: none;
  background: none;
  padding: 0;
  text-align: left;
  color: var(--ciruela);
}
.trabajo-imagen {
  position: relative;
  display: block;
  aspect-ratio: 4 / 5;
  border-radius: var(--radio-grande);
  overflow: hidden;
  background: var(--lila-suave);
  box-shadow: var(--sombra-suave);
}
.trabajo-imagen img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s;
}
.trabajo-capa {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(124, 58, 237, 0.55);
  color: #fff;
  font-weight: 500;
  opacity: 0;
  transition: opacity 0.3s;
}
.trabajo-capa i {
  font-size: 1.5rem;
}
.trabajo:hover .trabajo-imagen img,
.trabajo:focus-visible .trabajo-imagen img {
  transform: scale(1.06);
}
.trabajo:hover .trabajo-capa,
.trabajo:focus-visible .trabajo-capa {
  opacity: 1;
}
.trabajo:focus-visible {
  outline: none;
}
.trabajo:focus-visible .trabajo-imagen {
  outline: 3px solid var(--rosa-viejo);
  outline-offset: 3px;
}
.trabajo-cantidad {
  position: absolute;
  bottom: 12px;
  right: 12px;
  background: rgba(255, 255, 255, 0.92);
  color: var(--ciruela);
  font-size: 0.78rem;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 999px;
}
.trabajo-titulo {
  display: block;
  font-family: var(--fuente-titulos);
  font-size: 1.1rem;
  margin-top: 12px;
}
.esqueleto {
  aspect-ratio: 4 / 5;
  border-radius: var(--radio-grande);
  background: linear-gradient(90deg, var(--lila-suave) 25%, var(--crema-oscura) 50%, var(--lila-suave) 75%);
  background-size: 200% 100%;
  animation: brillo 1.4s infinite;
}
@keyframes brillo { to { background-position: -200% 0; } }
.vacio {
  text-align: center;
  padding: 60px 0;
  color: var(--ciruela-suave);
}
.vacio i {
  font-size: 2.8rem;
  color: var(--rosa-viejo);
}
@media (max-width: 991px) {
  .grilla { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 575px) {
  .grilla { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
  .trabajo-capa { display: none; }
}
</style>
