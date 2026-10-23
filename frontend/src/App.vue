<template>
  <!-- Sitio cerrado al público: el admin lo recorre normalmente, con este aviso arriba -->
  <div v-if="avisoSitioCerrado" class="aviso-sitio-cerrado" role="status">
    <i class="bi bi-eye-slash" aria-hidden="true"></i>
    <span><strong>Sitio cerrado al público.</strong> Solo los administradores ven la tienda.</span>
    <router-link to="/admin/configuracion">Abrir el sitio</router-link>
  </div>

  <!-- El panel de admin tiene su propio menú y la página "Próximamente" va sola:
       en esos casos no se muestran la navbar, el footer ni el carrito -->
  <template v-if="conTienda">
    <BarraAnuncios />
    <Navbar :cantidadCarrito="cart.cantidadItems" />
    <CarritoOffcanvas />
  </template>

  <router-view />

  <Footer v-if="conTienda" />
  <ToastNotificacion ref="toast" />
  <ConfirmModal ref="confirmModal" />
  <PopupNewsletter v-if="conTienda" />

  <button
    v-if="conTienda"
    class="carrito-flotante"
    data-bs-toggle="offcanvas"
    data-bs-target="#carritoPanel"
    :aria-label="`Abrir carrito, ${cart.cantidadItems} productos`"
  >
    <i class="bi bi-bag"></i>
    <span v-if="cart.cantidadItems > 0" class="carrito-flotante-badge">{{ cart.cantidadItems }}</span>
  </button>
</template>

<script setup>
import { ref, computed, provide, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCartStore } from './stores/cart'
import { useConfigStore } from './stores/config'
import { useAuthStore } from './stores/auth'

import BarraAnuncios from './components/BarraAnuncios.vue'
import Navbar from './components/Navbar.vue'
import Footer from './components/Footer.vue'
import CarritoOffcanvas from './components/CarritoOffcanvas.vue'
import ToastNotificacion from './components/ToastNotificacion.vue'
import ConfirmModal from './components/ConfirmModal.vue'
import PopupNewsletter from './components/PopupNewsletter.vue'
import api from './services/api'

const route = useRoute()
const router = useRouter()
const enAdmin = computed(() => route.path.startsWith('/admin'))
const cart = useCartStore()
const config = useConfigStore()
const auth = useAuthStore()
config.cargar()

// La página arranca con la configuración guardada de la visita anterior. Si la del backend dice
// otra cosa (ej: la tienda se abrió o se cerró desde entonces), se vuelve a evaluar la página actual
// (Solo después de que cargó la primera página: antes, la "página actual" todavía figura como el inicio)
watch(() => config.sitioAbierto, () => {
  if (config.cargado && route.matched.length) {
    router.replace({ path: route.path, query: route.query, hash: route.hash, force: true })
  }
})

// Con el sitio cerrado, quien no es admin solo ve "Próximamente", el login y las páginas legales
// Mientras no se sabe si la tienda está abierta (primera visita, esperando al backend) no se muestra
// la navbar ni el footer, para no mostrarlos por un instante con la tienda cerrada
const conTienda = computed(() => !enAdmin.value && config.conocido && (config.sitioAbierto || auth.esAdmin))
const avisoSitioCerrado = computed(() => !enAdmin.value && config.cargado && !config.sitioAbierto && auth.esAdmin)

// Si se entra directo al panel no se registra la visita (el backend además ignora las del admin)
if (!window.location.pathname.startsWith('/admin')) {
  api.post('/visitas').catch(() => {})
}

const toast = ref(null)
const confirmModal = ref(null)

function mostrarToast(mensaje) {
  toast.value.mostrar(mensaje)
}

function mostrarConfirm(opciones) {
  return confirmModal.value.abrir(opciones)
}

provide('mostrarToast', mostrarToast)
provide('mostrarConfirm', mostrarConfirm)
</script>

<style>
.aviso-sitio-cerrado {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 6px 12px;
  padding: 9px 16px;
  background: var(--ciruela);
  color: #fff;
  font-size: 0.88rem;
  text-align: center;
}
.aviso-sitio-cerrado a {
  color: #fbcfe8;
  font-weight: 600;
}
.carrito-flotante {
  position: fixed;
  bottom: 92px;
  right: 24px;
  width: 55px;
  height: 55px;
  background: var(--rosa-viejo);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.4rem;
  border: none;
  box-shadow: 0 8px 20px rgba(236, 72, 153, 0.35);
  z-index: 999;
  transition: transform 0.2s, background-color 0.2s;
}
.carrito-flotante:hover {
  background: var(--rosa-viejo-hover);
  transform: translateY(-2px);
}
.carrito-flotante-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: var(--lila-fuerte);
  color: white;
  border-radius: 50%;
  font-size: 0.7rem;
  font-weight: 700;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>