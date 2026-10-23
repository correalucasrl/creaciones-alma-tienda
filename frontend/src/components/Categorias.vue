<template>
  <section class="seccion-categorias">
    <div class="container">
      <span class="eyebrow">Explorá</span>
      <h2 class="section-title">Elegí qué querés <em class="acento">crear</em></h2>
      <p class="section-subtitle">Todo se hace a pedido, con tus fotos, tus nombres y tus colores.</p>

      <div class="categorias-wrapper">
        <button class="nav-arrow nav-arrow-left" type="button" aria-label="Ver categorías anteriores" @click="scroll(-1)" v-show="mostrarFlechaIzq">
          <i class="bi bi-chevron-left"></i>
        </button>

        <div class="categorias-scroll" ref="scrollContainer" @scroll="checkFlechas">
          <router-link
            v-for="(cat, index) in categorias"
            :key="cat.Id"
            :to="{ path: '/productos', query: { categoria: cat.Slug } }"
            class="categoria-item"
          >
            <div class="categoria-imagen" :style="{ backgroundColor: coloresFondo[index % coloresFondo.length] }">
              <img v-if="cat.IconoUrl" :src="cat.IconoUrl" :alt="cat.Nombre" loading="lazy" />
              <i v-else :class="iconosPorSlug[cat.Slug] || 'bi bi-stars'" aria-hidden="true"></i>
            </div>
            <div class="categoria-pie">
              <span class="categoria-nombre">{{ cat.Nombre }}</span>
              <i class="bi bi-arrow-right" aria-hidden="true"></i>
            </div>
          </router-link>
        </div>

        <button class="nav-arrow nav-arrow-right" type="button" aria-label="Ver más categorías" @click="scroll(1)" v-show="mostrarFlechaDer">
          <i class="bi bi-chevron-right"></i>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import api from '../services/api'

const categorias = ref([])
const scrollContainer = ref(null)
const mostrarFlechaIzq = ref(false)
const mostrarFlechaDer = ref(false)

const coloresFondo = ['#fce7f3', '#ede9fe', '#fdf2f8', '#f5f3ff', '#fae8ff']

const iconosPorSlug = {
  'fotos-polaroid': 'bi bi-camera',
  'albumes': 'bi bi-journal-bookmark',
  'stickers': 'bi bi-emoji-heart-eyes',
  'impresiones': 'bi bi-printer',
  'papeleria-personalizada': 'bi bi-envelope-heart'
}

function scroll(direccion) {
  scrollContainer.value.scrollBy({ left: direccion * 280, behavior: 'smooth' })
}

function checkFlechas() {
  const el = scrollContainer.value
  if (!el) return
  mostrarFlechaIzq.value = el.scrollLeft > 10
  mostrarFlechaDer.value = el.scrollLeft < el.scrollWidth - el.clientWidth - 10
}

onMounted(async () => {
  try {
    const { data } = await api.get('/categorias')
    categorias.value = data
    await nextTick()
    checkFlechas()
    window.addEventListener('resize', checkFlechas)
  } catch (err) {
    console.error('Error al traer categorías:', err)
  }
})
onBeforeUnmount(() => window.removeEventListener('resize', checkFlechas))
</script>

<style scoped>
.seccion-categorias {
  padding: 80px 0 40px;
}
.acento {
  color: var(--rosa-viejo);
  font-style: italic;
}
.categorias-wrapper {
  position: relative;
}
.categorias-scroll {
  display: flex;
  gap: 18px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding: 6px 4px 16px;
  scrollbar-width: none;
}
.categorias-scroll::-webkit-scrollbar {
  display: none;
}
.categoria-item {
  flex: 0 0 auto;
  width: 220px;
  scroll-snap-align: start;
  text-decoration: none;
  color: var(--ciruela);
  background: var(--blanco);
  border: 1px solid var(--borde);
  border-radius: var(--radio-grande);
  padding: 10px;
  transition: transform 0.25s, box-shadow 0.25s;
}
.categoria-item:hover {
  transform: translateY(-4px);
  box-shadow: var(--sombra-hover);
  color: var(--ciruela);
}
.categoria-imagen {
  aspect-ratio: 1;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.categoria-imagen img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s;
}
.categoria-item:hover .categoria-imagen img {
  transform: scale(1.05);
}
.categoria-imagen i {
  font-size: 2.6rem;
  color: var(--rosa-viejo);
}
.categoria-pie {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 6px 4px;
}
.categoria-nombre {
  font-family: var(--fuente-titulos);
  font-size: 1.1rem;
}
.categoria-pie i {
  color: var(--rosa-viejo);
  transition: transform 0.25s;
}
.categoria-item:hover .categoria-pie i {
  transform: translateX(4px);
}
.nav-arrow {
  position: absolute;
  top: 40%;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: var(--blanco);
  border: 1px solid var(--borde);
  box-shadow: var(--sombra-suave);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
  color: var(--ciruela);
  transition: background-color 0.2s, color 0.2s;
}
.nav-arrow:hover {
  background: var(--rosa-viejo);
  color: var(--blanco);
}
.nav-arrow-left { left: -12px; }
.nav-arrow-right { right: -12px; }
@media (max-width: 768px) {
  .nav-arrow { display: none; }
  .categoria-item { width: 170px; }
  .seccion-categorias { padding-top: 56px; }
}
</style>
