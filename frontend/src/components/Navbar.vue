<template>
  <header class="encabezado" :class="{ 'con-sombra': scrolleado }">
    <nav class="navbar navbar-expand-lg py-2" aria-label="Navegación principal">
      <div class="container">
        <router-link class="navbar-brand marca" to="/" aria-label="Creaciones Alma, ir al inicio">
          <MarcaAlma :tamano="esCelular ? 'chico' : 'normal'" />
        </router-link>

        <div class="d-flex align-items-center gap-1 order-lg-3 acciones">
          <button class="icono-btn" type="button" aria-label="Buscar productos" @click="buscadorAbierto = !buscadorAbierto">
            <i class="bi bi-search"></i>
          </button>

          <router-link v-if="!auth.estaLogueado" to="/login" class="icono-btn" aria-label="Iniciar sesión">
            <i class="bi bi-person"></i>
          </router-link>
          <div v-else class="dropdown">
            <button class="icono-btn" type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Mi cuenta">
              <i class="bi bi-person-check"></i>
            </button>
            <ul class="dropdown-menu dropdown-menu-end menu-cuenta">
              <li><span class="dropdown-item-text saludo">Hola, {{ auth.usuario?.Nombre }}</span></li>
              <li><hr class="dropdown-divider" /></li>
              <li><router-link class="dropdown-item" to="/mis-pedidos">Mis pedidos</router-link></li>
              <template v-if="auth.esAdmin">
                <li><hr class="dropdown-divider" /></li>
                <li>
                  <router-link class="dropdown-item" to="/admin/dashboard">
                    <i class="bi bi-grid-1x2 me-2" aria-hidden="true"></i>Panel de administración
                  </router-link>
                </li>
              </template>
              <li><hr class="dropdown-divider" /></li>
              <li><a class="dropdown-item" href="#" @click.prevent="cerrarSesion">Cerrar sesión</a></li>
            </ul>
          </div>

          <button class="icono-btn position-relative" type="button" data-bs-toggle="offcanvas" data-bs-target="#carritoPanel"
            :aria-label="`Abrir carrito, ${cantidadCarrito} productos`">
            <i class="bi bi-bag"></i>
            <span v-if="cantidadCarrito > 0" class="contador">{{ cantidadCarrito }}</span>
          </button>

          <button class="navbar-toggler icono-btn ms-1" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu"
            aria-controls="navMenu" aria-expanded="false" aria-label="Abrir menú">
            <i class="bi bi-list"></i>
          </button>
        </div>

        <div class="collapse navbar-collapse order-lg-2" id="navMenu">
          <ul class="navbar-nav mx-auto gap-lg-2">
            <li class="nav-item"><router-link class="nav-link" exact-active-class="activo" to="/">Inicio</router-link></li>
            <li class="nav-item">
              <router-link class="nav-link" active-class="" exact-active-class="" :class="{ activo: enTienda }" to="/productos">Tienda</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" active-class="" exact-active-class="" :class="{ activo: enOfertas }" :to="{ path: '/productos', query: { ofertas: '1' } }">Ofertas</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" active-class="" exact-active-class="" :class="{ activo: enRegalos }" to="/regalos">Regalos</router-link>
            </li>
            <li class="nav-item"><a class="nav-link" href="#" @click.prevent="irASeccion('como-comprar')">Cómo comprar</a></li>
            <li class="nav-item"><router-link class="nav-link" active-class="activo" to="/galeria">Galería</router-link></li>
            <li class="nav-item"><router-link class="nav-link" active-class="activo" to="/nosotros">Nosotros</router-link></li>
            <li class="nav-item"><a class="nav-link" href="#" @click.prevent="irASeccion('footer-section')">Contacto</a></li>
          </ul>
        </div>
      </div>
    </nav>

    <Transition name="desplegar">
      <div v-if="buscadorAbierto" class="buscador">
        <form class="container py-3" role="search" @submit.prevent="buscar">
          <div class="buscador-campo">
            <i class="bi bi-search" aria-hidden="true"></i>
            <input
              ref="campoBusqueda"
              v-model="textoBusqueda"
              type="search"
              placeholder="Buscá polaroids, álbumes, stickers..."
              aria-label="Buscar productos"
            />
            <button type="submit" class="btn-alma btn-sm">Buscar</button>
          </div>
        </form>
      </div>
    </Transition>
  </header>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useConfigStore } from '../stores/config'
import { useRouter, useRoute } from 'vue-router'
import MarcaAlma from './MarcaAlma.vue'

defineProps({
  cantidadCarrito: { type: Number, default: 0 }
})

const auth = useAuthStore()
const config = useConfigStore()
const router = useRouter()
const route = useRoute()

// Links marcados según la ruta y los filtros de la tienda:
// "Ofertas" y "Regalos" son la tienda filtrada, así que se pintan junto con "Tienda"
const enTienda = computed(() => route.path === '/productos')
const enOfertas = computed(() => enTienda.value && route.query.ofertas === '1')
const enRegalos = computed(() => route.path === '/regalos' || (enTienda.value && !!route.query.ocasion))

const scrolleado = ref(false)
const buscadorAbierto = ref(false)
const textoBusqueda = ref('')
const campoBusqueda = ref(null)

const esCelular = ref(window.innerWidth <= 420)

function alScrollear() {
  scrolleado.value = window.scrollY > 8
}
function alRedimensionar() {
  esCelular.value = window.innerWidth <= 420
}
onMounted(() => {
  window.addEventListener('scroll', alScrollear, { passive: true })
  window.addEventListener('resize', alRedimensionar, { passive: true })
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', alScrollear)
  window.removeEventListener('resize', alRedimensionar)
})

watch(buscadorAbierto, async (abierto) => {
  if (abierto) {
    await nextTick()
    campoBusqueda.value?.focus()
  }
})

// Al cambiar de página se cierran el buscador y el menú del celular
watch(() => route.fullPath, () => {
  buscadorAbierto.value = false
  const menu = document.getElementById('navMenu')
  if (menu?.classList.contains('show')) window.bootstrap.Collapse.getOrCreateInstance(menu).hide()
})

function buscar() {
  const q = textoBusqueda.value.trim()
  router.push({ path: '/productos', query: q ? { buscar: q } : {} })
}

// Siempre lleva al login: con push('/') no pasaba nada si ya estabas en el inicio
async function cerrarSesion() {
  auth.logout()
  await router.replace('/login')
  config.recargar()
}

// "Cómo comprar" y "Contacto" apuntan a secciones que solo existen en el home
// (o en el footer, que siempre está presente). Si ya estamos en el home,
// hace scroll directo; si no, navega al home primero y después scrollea.
async function irASeccion(id) {
  if (route.path !== '/') {
    await router.push('/')
    await nextTick()
  }

  await esperarQueSeEstabiliceLaPagina(id)
  const seccion = document.getElementById(id)
  if (seccion) {
    seccion.scrollIntoView({ behavior: 'smooth' })
  }
}

// Espera a que el elemento deje de "moverse" (porque arriba todavía
// están cargando categorías/productos) antes de hacer el scroll,
// para que sea un solo movimiento directo al lugar correcto
function esperarQueSeEstabiliceLaPagina(id) {
  return new Promise(resolve => {
    let posicionAnterior = null
    let intentos = 0

    const intervalo = setInterval(() => {
      const el = document.getElementById(id)
      const posicionActual = el ? el.getBoundingClientRect().top : null
      intentos++

      const seEstabilizo = posicionActual !== null && posicionActual === posicionAnterior
      const seAcabaronLosIntentos = intentos > 20 // tope de ~2 segundos

      if (seEstabilizo || seAcabaronLosIntentos) {
        clearInterval(intervalo)
        resolve()
      }

      posicionAnterior = posicionActual
    }, 100)
  })
}
</script>

<style scoped>
.encabezado {
  position: sticky;
  top: 0;
  z-index: 1030;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: saturate(140%) blur(10px);
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.encabezado.con-sombra {
  border-bottom-color: var(--borde);
  box-shadow: 0 6px 20px rgba(76, 29, 149, 0.05);
}

.marca {
  text-decoration: none;
  padding: 0;
}

.nav-link {
  color: var(--ciruela) !important;
  font-weight: 500;
  font-size: 0.95rem;
  padding: 8px 12px !important;
  position: relative;
  white-space: nowrap;
}
/* El botón del menú es solo para celular: .icono-btn le pone display y pisaba el de Bootstrap */
@media (min-width: 992px) {
  .navbar-toggler.icono-btn { display: none; }
}
/* En pantallas medianas los links se achican un poco para entrar en una línea */
@media (min-width: 992px) and (max-width: 1299px) {
  .nav-link { font-size: 0.88rem; padding: 8px 8px !important; }
  .nav-link::after { left: 8px; right: 8px; }
  .navbar-nav { gap: 0 !important; }
}
@media (min-width: 992px) and (max-width: 1099px) {
  .nav-link { font-size: 0.84rem; padding: 8px 6px !important; }
  .nav-link::after { left: 6px; right: 6px; }
}
.nav-link::after {
  content: '';
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 2px;
  height: 1.5px;
  background: var(--rosa-viejo);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.25s;
}
.nav-link:hover::after,
.nav-link.activo::after {
  transform: scaleX(1);
}
.nav-link.activo {
  color: var(--rosa-texto) !important;
}

.icono-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--ciruela);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  transition: background-color 0.2s;
  text-decoration: none;
}
.icono-btn:hover {
  background: var(--rosa-polvo);
  color: var(--ciruela);
}
.navbar-toggler {
  padding: 0;
}
.navbar-toggler:focus {
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.25);
}
.contador {
  position: absolute;
  top: 2px;
  right: 0;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--rosa-viejo);
  color: var(--blanco);
  font-size: 0.66rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-cuenta {
  border: 1px solid var(--borde);
  border-radius: 16px;
  box-shadow: var(--sombra-hover);
  padding: 8px;
  max-height: 70vh;
  overflow-y: auto;
}
.menu-cuenta .dropdown-item {
  border-radius: 10px;
  font-size: 0.92rem;
  padding: 7px 12px;
}
.menu-cuenta .dropdown-item:hover {
  background: var(--rosa-polvo);
}
.saludo {
  font-family: var(--fuente-titulos);
  font-size: 1.05rem;
}

.buscador {
  border-top: 1px solid var(--borde);
  background: var(--crema);
}
.buscador-campo {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--blanco);
  border: 1px solid var(--rosa-polvo-medio);
  border-radius: 999px;
  padding: 6px 6px 6px 18px;
  max-width: 640px;
  margin: 0 auto;
}
.buscador-campo input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--ciruela);
  min-width: 0;
}
.buscador-campo .btn-alma {
  padding: 8px 18px;
}
.desplegar-enter-active, .desplegar-leave-active { transition: opacity 0.2s, transform 0.2s; }
.desplegar-enter-from, .desplegar-leave-to { opacity: 0; transform: translateY(-6px); }

@media (max-width: 991px) {
  .navbar-nav { padding: 12px 0; }
  .nav-link::after { display: none; }
}
@media (max-width: 420px) {
  .navbar > .container { flex-wrap: wrap; }
  .icono-btn { width: 36px; height: 36px; font-size: 1.05rem; }
  .acciones { gap: 0 !important; }
}
</style>
