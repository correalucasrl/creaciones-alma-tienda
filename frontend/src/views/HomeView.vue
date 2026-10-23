<template>
  <Hero />
  <Beneficios />
  <Categorias />
  <SeccionOcasiones />

  <section v-if="ofertas.length" class="seccion-productos">
    <div class="container">
      <div class="encabezado-seccion">
        <div>
          <span class="eyebrow text-start">Por tiempo limitado</span>
          <h2 class="titulo-seccion">Ofertas <em>del momento</em></h2>
        </div>
        <router-link :to="{ path: '/productos', query: { ofertas: '1' } }" class="ver-todo">
          Ver todas <i class="bi bi-arrow-right"></i>
        </router-link>
      </div>
      <div class="row g-3 g-md-4">
        <div class="col-6 col-md-4 col-lg-3" v-for="producto in ofertas.slice(0, 4)" :key="producto.Id">
          <ProductoCard :producto="producto" @agregar="agregarAlCarrito" />
        </div>
      </div>
    </div>
  </section>

  <section id="productos-destacados" class="seccion-productos">
    <div class="container">
      <div class="encabezado-seccion">
        <div>
          <span class="eyebrow text-start">Los favoritos</span>
          <h2 class="titulo-seccion">Más <em>elegidos</em></h2>
        </div>
        <router-link to="/productos" class="ver-todo">Ver la tienda <i class="bi bi-arrow-right"></i></router-link>
      </div>
      <div class="row g-3 g-md-4">
        <div class="col-6 col-md-4 col-lg-3" v-for="(producto, index) in destacados" :key="producto.Id">
          <ProductoCard :producto="producto" :destacadoTop="index === 0" @agregar="agregarAlCarrito" />
        </div>
      </div>
    </div>
  </section>

  <ComoFunciona />
  <Galeria />
  <Testimonios />
  <SeccionNewsletter />
  <PedidoPersonalizado />
</template>

<script setup>
import { ref, onMounted, inject } from 'vue'
import api from '../services/api'
import { useCartStore } from '../stores/cart'

import Hero from '../components/Hero.vue'
import Beneficios from '../components/Beneficios.vue'
import Categorias from '../components/Categorias.vue'
import ProductoCard from '../components/ProductoCard.vue'
import ComoFunciona from '../components/ComoFunciona.vue'
import Galeria from '../components/Galeria.vue'
import Testimonios from '../components/Testimonios.vue'
import PedidoPersonalizado from '../components/PedidoPersonalizado.vue'
import SeccionOcasiones from '../components/SeccionOcasiones.vue'
import SeccionNewsletter from '../components/SeccionNewsletter.vue'

const cart = useCartStore()
const mostrarToast = inject('mostrarToast')
const destacados = ref([])
const ofertas = ref([])

onMounted(async () => {
  try {
    const [resDestacados, resTodos] = await Promise.all([api.get('/productos/destacados'), api.get('/productos')])
    destacados.value = resDestacados.data
    ofertas.value = resTodos.data
      .filter(p => p.EnOferta && p.Stock > 0)
      .sort((a, b) => b.DescuentoPct - a.DescuentoPct)
  } catch (err) {
    console.error('Error al traer productos:', err)
  }
})

function agregarAlCarrito(producto) {
  cart.agregarProducto(producto)
  mostrarToast(`${producto.Nombre} se sumó a tu carrito`)
}
</script>

<style scoped>
.seccion-productos {
  padding: 56px 0;
}
.encabezado-seccion {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 28px;
}
.titulo-seccion {
  font-size: clamp(1.7rem, 3vw, 2.3rem);
  margin: 0;
}
.titulo-seccion em {
  color: var(--rosa-viejo);
  font-style: italic;
}
.ver-todo {
  color: var(--ciruela);
  text-decoration: none;
  font-weight: 500;
  white-space: nowrap;
  border-bottom: 1px solid var(--rosa-viejo);
  padding-bottom: 2px;
}
.ver-todo i {
  transition: transform 0.2s;
}
.ver-todo:hover i {
  transform: translateX(3px);
}
</style>
