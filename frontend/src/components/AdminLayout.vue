<template>
  <div class="admin-shell" :class="{ 'menu-abierto': menuAbierto, colapsado }">
    <aside class="admin-lateral" aria-label="Menú de administración">
      <router-link to="/admin/dashboard" class="admin-marca" aria-label="Ir al dashboard">
        <MarcaAlma tamano="chico" />
        <span class="admin-etiqueta">Admin</span>
        <i class="bi bi-heart-fill admin-marca-mini" aria-hidden="true"></i>
      </router-link>

      <nav class="admin-nav">
        <div v-for="grupo in grupos" :key="grupo.titulo" class="admin-grupo">
          <p class="admin-grupo-titulo">{{ grupo.titulo }}</p>
          <router-link
            v-for="item in grupo.items"
            :key="item.ruta"
            :to="item.ruta"
            class="admin-link"
            active-class="activo"
            :title="colapsado ? item.nombre : null"
          >
            <i :class="['bi', item.icono]" aria-hidden="true"></i>
            <span>{{ item.nombre }}</span>
            <span v-if="contadores[item.contador]" class="admin-contador" :class="{ aviso: item.contador === 'stockBajo' }"
              :title="`${contadores[item.contador]} ${item.textoContador}`" :aria-label="`${contadores[item.contador]} ${item.textoContador}`">
              {{ contadores[item.contador] }}
            </span>
          </router-link>
        </div>
      </nav>

      <div class="admin-lateral-pie">
        <router-link to="/" class="admin-link" :title="colapsado ? 'Ver la tienda' : null">
          <i class="bi bi-shop" aria-hidden="true"></i><span>Ver la tienda</span>
        </router-link>
        <button type="button" class="admin-link" :title="colapsado ? 'Cerrar sesión' : null" @click="cerrarSesion">
          <i class="bi bi-box-arrow-left" aria-hidden="true"></i><span>Cerrar sesión</span>
        </button>
      </div>
    </aside>

    <div class="admin-fondo-menu" aria-hidden="true" @click="menuAbierto = false"></div>

    <div class="admin-principal">
      <header class="admin-barra">
        <button
          type="button"
          class="admin-boton-menu"
          :aria-label="colapsado ? 'Mostrar el menú' : 'Ocultar el menú'"
          :title="colapsado ? 'Mostrar el menú' : 'Ocultar el menú'"
          @click="alternarMenu"
        >
          <i class="bi bi-list" aria-hidden="true"></i>
        </button>
        <p class="admin-ubicacion">
          <span>{{ grupoActual }}</span>
          <i class="bi bi-chevron-right" aria-hidden="true"></i>
          <strong>{{ seccionActual }}</strong>
        </p>
        <router-link
          to="/admin/configuracion"
          class="admin-estado-tienda"
          :class="{ abierta: config.sitioAbierto }"
          :title="config.sitioAbierto ? 'La tienda está abierta al público' : 'La tienda está cerrada al público (modo próximamente)'"
        >
          <span class="punto" aria-hidden="true"></span>
          {{ config.sitioAbierto ? 'Tienda abierta' : 'Tienda cerrada' }}
        </router-link>
        <div class="admin-usuario">
          <span class="admin-avatar" aria-hidden="true">{{ inicial }}</span>
          <span class="admin-nombre">{{ auth.usuario?.Nombre }}</span>
        </div>
      </header>

      <main class="admin-contenido">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../services/api'
import { useAuthStore } from '../stores/auth'
import { useConfigStore } from '../stores/config'
import MarcaAlma from './MarcaAlma.vue'
import { tieneStockBajo } from '../utils/stock'
import '../assets/admin.css'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const config = useConfigStore()
const menuAbierto = ref(false)

// En compu, el menú lateral se puede plegar a solo íconos (se recuerda entre visitas).
// En el celular el mismo botón abre el menú deslizable
const CLAVE_COLAPSADO = 'admin-menu-colapsado'
const colapsado = ref((() => { try { return localStorage.getItem(CLAVE_COLAPSADO) === '1' } catch { return false } })())
watch(colapsado, valor => { try { localStorage.setItem(CLAVE_COLAPSADO, valor ? '1' : '0') } catch { /* sin almacenamiento */ } })

function alternarMenu() {
  if (window.matchMedia('(max-width: 991px)').matches) menuAbierto.value = true
  else colapsado.value = !colapsado.value
}
const contadores = ref({ pedidos: 0, arrepentimientos: 0, stockBajo: 0 })

const grupos = [
  {
    titulo: 'Ventas',
    items: [
      { nombre: 'Dashboard', ruta: '/admin/dashboard', icono: 'bi-grid-1x2' },
      { nombre: 'Pedidos', ruta: '/admin/pedidos', icono: 'bi-bag-check', contador: 'pedidos', textoContador: 'pendientes' },
      { nombre: 'Costos y facturación', ruta: '/admin/finanzas', icono: 'bi-cash-coin' }
    ]
  },
  {
    titulo: 'Catálogo',
    items: [
      { nombre: 'Productos y ofertas', ruta: '/admin/productos', icono: 'bi-box-seam', contador: 'stockBajo', textoContador: 'con stock bajo' },
      { nombre: 'Categorías', ruta: '/admin/categorias', icono: 'bi-tags' },
      { nombre: 'Ocasiones', ruta: '/admin/ocasiones', icono: 'bi-gift' },
      { nombre: 'Galería', ruta: '/admin/galeria', icono: 'bi-images' }
    ]
  },
  {
    titulo: 'Marketing',
    items: [
      { nombre: 'Cupones', ruta: '/admin/cupones', icono: 'bi-ticket-perforated' },
      { nombre: 'Newsletter', ruta: '/admin/suscriptores', icono: 'bi-envelope-heart' },
      { nombre: 'Testimonios', ruta: '/admin/testimonios', icono: 'bi-chat-quote' }
    ]
  },
  {
    titulo: 'Clientes',
    items: [
      { nombre: 'Usuarios', ruta: '/admin/usuarios', icono: 'bi-people' },
      { nombre: 'Arrepentimientos', ruta: '/admin/arrepentimientos', icono: 'bi-arrow-counterclockwise', contador: 'arrepentimientos', textoContador: 'sin resolver' }
    ]
  },
  {
    titulo: 'Ajustes',
    items: [
      { nombre: 'Configuración', ruta: '/admin/configuracion', icono: 'bi-gear' }
    ]
  }
]

const actual = computed(() => {
  for (const g of grupos) {
    const item = g.items.find(i => route.path.startsWith(i.ruta))
    if (item) return { grupo: g.titulo, item: item.nombre }
  }
  return { grupo: 'Admin', item: '' }
})
const grupoActual = computed(() => actual.value.grupo)
const seccionActual = computed(() => actual.value.item)
const inicial = computed(() => (auth.usuario?.Nombre || 'A').charAt(0).toUpperCase())

// Contadores de lo que necesita atención: pedidos pendientes, solicitudes de arrepentimiento
// sin resolver y productos con stock bajo. Si alguna consulta falla, ese contador no se muestra
async function cargarContadores() {
  const [pedidos, arrepentimientos, productos] = await Promise.allSettled([
    api.get('/ordenes/admin/todas'),
    api.get('/arrepentimiento/admin/todas'),
    api.get('/productos/admin/todos')
  ])
  contadores.value = {
    pedidos: pedidos.status === 'fulfilled' ? pedidos.value.data.filter(o => o.Estado === 'Pendiente').length : 0,
    arrepentimientos: arrepentimientos.status === 'fulfilled'
      ? arrepentimientos.value.data.filter(a => a.Estado === 'Pendiente' || a.Estado === 'En proceso').length : 0,
    stockBajo: productos.status === 'fulfilled' ? productos.value.data.filter(tieneStockBajo).length : 0
  }
}

onMounted(cargarContadores)
// Las vistas lo llaman después de cambiar un estado, para que el número del menú se actualice
provide('refrescarContadores', cargarContadores)

// Al cambiar de sección se cierra el menú del celular
watch(() => route.path, () => {
  menuAbierto.value = false
})

// Siempre lleva al login: con push('/') no pasaba nada si ya estabas en el inicio
async function cerrarSesion() {
  auth.logout()
  await router.replace('/login')
  config.recargar()
}
</script>

<style scoped>
.admin-shell {
  --ancho-lateral: 272px;
  display: flex;
  min-height: 100vh;
  background: #f7f5fc;
}

/* ---------- Barra lateral ---------- */
.admin-lateral {
  position: sticky;
  top: 0;
  height: 100vh;
  width: var(--ancho-lateral);
  flex: 0 0 var(--ancho-lateral);
  background: var(--blanco);
  border-right: 1px solid var(--borde);
  display: flex;
  flex-direction: column;
  padding: 20px 14px;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--rosa-polvo-medio) transparent;
  z-index: 1040;
}
.admin-marca {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 4px 6px 18px;
  text-decoration: none;
}
.admin-etiqueta {
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  background: var(--lila-suave);
  color: var(--lila-fuerte);
  border-radius: 999px;
  padding: 3px 9px;
}
.admin-nav {
  flex: 1;
}
.admin-grupo {
  margin-bottom: 14px;
}
.admin-grupo-titulo {
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ciruela-suave);
  margin: 0 0 6px;
  padding: 0 12px;
}
.admin-link {
  display: flex;
  align-items: center;
  gap: 11px;
  width: 100%;
  padding: 9px 12px;
  border-radius: 12px;
  border: none;
  background: none;
  color: var(--ciruela);
  font-size: 0.92rem;
  text-decoration: none;
  text-align: left;
  transition: background-color 0.15s, color 0.15s;
}
.admin-link i {
  font-size: 1.05rem;
  color: var(--ciruela-suave);
  width: 20px;
  text-align: center;
}
.admin-link:hover {
  background: var(--crema-oscura);
  color: var(--ciruela);
}
.admin-link.activo {
  background: var(--rosa-polvo);
  color: var(--rosa-texto);
  font-weight: 500;
}
.admin-link.activo i {
  color: var(--rosa-viejo);
}
.admin-contador {
  margin-left: auto;
  min-width: 22px;
  height: 22px;
  border-radius: 999px;
  background: var(--rosa-viejo);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
}
.admin-contador.aviso {
  background: #fef3c7;
  color: #b45309;
}
.admin-lateral-pie {
  border-top: 1px solid var(--borde);
  padding-top: 10px;
}

/* ---------- Barra superior ---------- */
.admin-principal {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.admin-barra {
  position: sticky;
  top: 0;
  z-index: 1020;
  display: flex;
  align-items: center;
  gap: 14px;
  height: 64px;
  padding: 0 28px;
  background: rgba(247, 245, 252, 0.9);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--borde);
}
.admin-boton-menu {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid var(--borde);
  background: var(--blanco);
  font-size: 1.3rem;
  color: var(--ciruela);
}
.admin-ubicacion {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--ciruela-suave);
  font-size: 0.9rem;
  min-width: 0;
}
.admin-ubicacion i {
  font-size: 0.7rem;
}
.admin-ubicacion strong {
  color: var(--ciruela);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.admin-estado-tienda {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  background: #fef3c7;
  color: #b45309;
}
.admin-estado-tienda.abierta {
  background: var(--salvia);
  color: var(--salvia-texto);
}
.admin-estado-tienda .punto {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}
.admin-usuario {
  display: flex;
  align-items: center;
  gap: 10px;
}
.admin-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--lila-fuerte);
  color: #fff;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}
.admin-nombre {
  font-weight: 500;
  font-size: 0.92rem;
}
.admin-contenido {
  flex: 1;
  min-width: 0;
}
.admin-fondo-menu {
  display: none;
}

.admin-boton-menu:hover {
  background: var(--crema-oscura);
}
.admin-marca-mini {
  display: none;
}

/* ---------- Compu: menú plegado a solo íconos ---------- */
@media (min-width: 992px) {
  .admin-lateral {
    transition: width 0.2s, flex-basis 0.2s;
  }
  .admin-shell.colapsado {
    --ancho-lateral: 76px;
  }
  .colapsado .admin-marca {
    justify-content: center;
    padding: 4px 0 18px;
  }
  .colapsado .admin-marca :deep(.marca-alma),
  .colapsado .admin-etiqueta {
    display: none;
  }
  .colapsado .admin-marca-mini {
    display: block;
    color: var(--rosa-viejo);
    font-size: 1.5rem;
    line-height: 1;
  }
  /* Los títulos de grupo se vuelven una línea separadora */
  .colapsado .admin-grupo-titulo {
    font-size: 0;
    height: 1px;
    padding: 0;
    margin: 4px 14px 8px;
    background: var(--borde);
  }
  .colapsado .admin-link {
    position: relative;
    justify-content: center;
    padding: 10px 0;
  }
  /* El texto queda para lectores de pantalla, pero no se ve */
  .colapsado .admin-link > span:not(.admin-contador) {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
  .colapsado .admin-contador {
    position: absolute;
    top: 3px;
    right: 10px;
    min-width: 17px;
    height: 17px;
    font-size: 0.62rem;
    padding: 0 4px;
  }
}

/* ---------- Celular y tablet: la barra lateral se vuelve un menú deslizable ---------- */
@media (max-width: 991px) {
  .admin-lateral {
    position: fixed;
    left: 0;
    top: 0;
    transform: translateX(-100%);
    transition: transform 0.25s;
    box-shadow: var(--sombra-hover);
  }
  .menu-abierto .admin-lateral {
    transform: none;
  }
  .menu-abierto .admin-fondo-menu {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(24, 12, 40, 0.4);
    z-index: 1030;
  }
  .admin-boton-menu {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .admin-barra {
    padding: 0 16px;
  }
  .admin-ubicacion span,
  .admin-ubicacion i,
  .admin-nombre {
    display: none;
  }
}
</style>
