<template>
  <section v-if="ocasiones.length" id="ocasiones" class="ocasiones" :class="{ 'sin-encabezado': !conEncabezado }" aria-label="Comprá por ocasión">
    <div class="container">
      <template v-if="conEncabezado">
        <span class="eyebrow">Regalos</span>
        <h2 class="section-title">Comprá por <em class="acento">ocasión</em></h2>
        <p class="section-subtitle">¿Tenés un festejo en puerta? Elegí la ocasión y te mostramos las ideas que mejor quedan.</p>
      </template>

      <div class="grilla">
        <router-link
          v-for="(o, i) in ocasiones"
          :key="o.Id"
          :to="{ path: '/productos', query: { ocasion: o.Slug } }"
          class="ocasion"
          :style="!o.ImagenUrl ? { backgroundColor: fondos[i % fondos.length] } : {}"
        >
          <img v-if="o.ImagenUrl" :src="o.ImagenUrl" alt="" class="ocasion-img" loading="lazy" />
          <span class="ocasion-velo" :class="{ 'con-imagen': o.ImagenUrl }"></span>
          <span class="ocasion-contenido">
            <i v-if="!o.ImagenUrl" :class="['bi', o.Icono || 'bi-gift']" class="ocasion-icono" aria-hidden="true"></i>
            <span class="ocasion-nombre">{{ o.Nombre }}</span>
            <span class="ocasion-desc">{{ o.Descripcion }}</span>
            <span v-if="o.CantidadProductos > 0" class="ocasion-ver">
              Ver {{ o.CantidadProductos === 1 ? '1 idea' : `${o.CantidadProductos} ideas` }} <i class="bi bi-arrow-right" aria-hidden="true"></i>
            </span>
            <span v-else class="ocasion-ver">Próximamente · pedilo a medida <i class="bi bi-arrow-right" aria-hidden="true"></i></span>
          </span>
        </router-link>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../services/api'

const props = defineProps({
  // En el inicio solo se muestran las ocasiones con productos; en /regalos, todas
  todas: { type: Boolean, default: false },
  conEncabezado: { type: Boolean, default: true }
})

const ocasiones = ref([])
const fondos = ['#fce7f3', '#ede9fe', '#fdf2f8', '#f5f3ff', '#fae8ff', '#fce7f3']

onMounted(async () => {
  try {
    const { data } = await api.get('/ocasiones')
    // En el inicio, solo las que tienen productos: una ocasión vacía llevaría a una página sin nada
    ocasiones.value = props.todas ? data : data.filter(o => o.CantidadProductos > 0)
  } catch (err) {
    console.error('No se pudieron cargar las ocasiones:', err)
  }
})
</script>

<style scoped>
.ocasiones.sin-encabezado {
  padding-top: 0;
}
.ocasiones {
  padding: 80px 0 40px;
}
.acento {
  color: var(--rosa-viejo);
  font-style: italic;
}
.grilla {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}
.ocasion {
  position: relative;
  min-height: 190px;
  border-radius: var(--radio-grande);
  overflow: hidden;
  text-decoration: none;
  color: var(--ciruela);
  display: flex;
  align-items: flex-end;
  border: 1px solid var(--borde);
  transition: transform 0.25s, box-shadow 0.25s;
}
.ocasion:hover {
  transform: translateY(-4px);
  box-shadow: var(--sombra-hover);
  color: var(--ciruela);
}
.ocasion-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s;
}
.ocasion:hover .ocasion-img {
  transform: scale(1.06);
}
.ocasion-velo.con-imagen {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(31, 17, 51, 0.75), rgba(31, 17, 51, 0.05) 65%);
}
.ocasion-contenido {
  position: relative;
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.con-imagen + .ocasion-contenido {
  color: #fff;
}
.ocasion-icono {
  font-size: 1.8rem;
  color: var(--rosa-viejo);
  margin-bottom: 6px;
}
.ocasion-nombre {
  font-family: var(--fuente-titulos);
  font-size: 1.45rem;
}
.ocasion-desc {
  font-size: 0.88rem;
  opacity: 0.85;
}
.ocasion-ver {
  margin-top: 8px;
  font-size: 0.88rem;
  font-weight: 500;
  color: var(--rosa-texto);
}
.con-imagen + .ocasion-contenido .ocasion-ver {
  color: #fff;
}
.ocasion-ver i {
  transition: transform 0.2s;
}
.ocasion:hover .ocasion-ver i {
  transform: translateX(4px);
}
@media (max-width: 991px) {
  .grilla { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 480px) {
  .grilla { grid-template-columns: 1fr; }
  .ocasion { min-height: 150px; }
}
</style>
