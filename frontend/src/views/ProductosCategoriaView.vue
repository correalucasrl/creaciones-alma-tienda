<template>
  <div class="container py-5">
    <h2 class="section-title text-capitalize">{{ nombreCategoria }}</h2>

    <div v-if="cargando" class="text-center py-5">Cargando...</div>

    <div v-else-if="productos.length === 0" class="text-center py-5">
      <p class="text-secondary">Todavía no hay productos en esta categoría.</p>
    </div>

    <div v-else class="row g-4">
      <div class="col-6 col-md-3" v-for="producto in productos" :key="producto.Id">
        <ProductoCard :producto="producto" @agregar="agregarAlCarrito" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, inject } from 'vue'
import { useRoute } from 'vue-router'
import api from '../services/api'
import { useCartStore } from '../stores/cart'
import ProductoCard from '../components/ProductoCard.vue'

const route = useRoute()
const cart = useCartStore()
const mostrarToast = inject('mostrarToast')

const productos = ref([])
const cargando = ref(true)
const nombreCategoria = ref(route.params.slug.replace(/-/g, ' '))

async function cargarProductos() {
  cargando.value = true
  try {
    const { data } = await api.get(`/productos/categoria/${route.params.slug}`)
    productos.value = data
  } catch (err) {
    console.error(err)
  } finally {
    cargando.value = false
  }
}

onMounted(cargarProductos)

watch(() => route.params.slug, (nuevoSlug) => {
  nombreCategoria.value = nuevoSlug.replace(/-/g, ' ')
  cargarProductos()
})

function agregarAlCarrito(producto) {
  cart.agregarProducto(producto)
  mostrarToast(`${producto.Nombre} agregado exitosamente 🛍`)
}
</script>