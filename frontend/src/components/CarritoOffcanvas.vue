<template>
  <div class="offcanvas offcanvas-end panel-carrito" tabindex="-1" id="carritoPanel" aria-labelledby="carritoTitulo">
    <div class="offcanvas-header">
      <h2 id="carritoTitulo" class="offcanvas-title">
        Tu carrito <span v-if="cart.cantidadItems" class="cantidad">({{ cart.cantidadItems }})</span>
      </h2>
      <button type="button" class="btn-close" aria-label="Cerrar carrito" @click="cerrarCarrito"></button>
    </div>

    <div v-if="envioGratisDesde > 0 && cart.items.length" class="envio-progreso">
      <p v-if="faltaParaEnvioGratis > 0" class="mb-2">
        Te faltan <strong>${{ formato(faltaParaEnvioGratis) }}</strong> para tener <strong>envío gratis</strong>
      </p>
      <p v-else class="mb-2 logrado"><i class="bi bi-check-circle me-1"></i>¡Tenés <strong>envío gratis</strong>!</p>
      <div class="barra" role="progressbar" :aria-valuenow="progreso" aria-valuemin="0" aria-valuemax="100" aria-label="Progreso hacia el envío gratis">
        <div class="barra-relleno" :style="{ width: progreso + '%' }"></div>
      </div>
    </div>

    <div class="offcanvas-body d-flex flex-column">
      <div v-if="cart.items.length === 0" class="vacio">
        <i class="bi bi-bag-heart" aria-hidden="true"></i>
        <p class="vacio-titulo">Tu carrito está esperando</p>
        <p class="vacio-texto">Mirá la tienda y elegí tu primer recuerdo.</p>
        <button class="btn btn-alma" @click="irA('/productos')">Ver productos</button>
      </div>

      <template v-else>
        <ul class="lista">
          <li v-for="item in cart.items" :key="item.productoId" class="item">
            <img :src="item.imagen || 'https://placehold.co/120x120/ede9fe/6d28d9?text=' + encodeURIComponent(item.nombre[0])" :alt="item.nombre" class="item-img" />
            <div class="flex-grow-1 min-w-0">
              <p class="item-nombre">{{ item.nombre }}</p>
              <p class="item-precio">
                <span :class="item.precioLista > item.precio ? 'precio-oferta' : ''">${{ formato(item.precio) }}</span>
                <span v-if="item.precioLista > item.precio" class="precio-tachado ms-1">${{ formato(item.precioLista) }}</span>
              </p>
              <div class="selector" role="group" :aria-label="`Cantidad de ${item.nombre}`">
                <button type="button" aria-label="Restar uno" @click="cart.cambiarCantidad(item.productoId, item.cantidad - 1)">−</button>
                <span>{{ item.cantidad }}</span>
                <button type="button" aria-label="Sumar uno" @click="cart.cambiarCantidad(item.productoId, item.cantidad + 1)">+</button>
              </div>
            </div>
            <button class="quitar" type="button" :aria-label="`Quitar ${item.nombre}`" @click="cart.quitarProducto(item.productoId)">
              <i class="bi bi-x-lg"></i>
            </button>
          </li>
        </ul>

        <div class="resumen mt-auto">
          <div v-if="cart.ahorroOfertas > 0" class="linea ahorro">
            <span>Ahorrás con ofertas</span>
            <span>−${{ formato(cart.ahorroOfertas) }}</span>
          </div>
          <div class="linea total">
            <span>Subtotal</span>
            <span>${{ formato(cart.total) }}</span>
          </div>
          <p class="nota">Cupones, envío y descuento por transferencia se calculan en el próximo paso.</p>
          <button class="btn btn-alma w-100" @click="irA('/checkout')">
            Finalizar compra <i class="bi bi-arrow-right ms-1"></i>
          </button>
          <button class="seguir" type="button" @click="cerrarCarrito">Seguir comprando</button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useCartStore } from '../stores/cart'
import { useConfigStore } from '../stores/config'
import { useRouter } from 'vue-router'

const cart = useCartStore()
const config = useConfigStore()
const router = useRouter()

const envioGratisDesde = computed(() => Number(config.valores.envio_gratis_desde) || 0)
const faltaParaEnvioGratis = computed(() => Math.max(envioGratisDesde.value - cart.total, 0))
const progreso = computed(() => envioGratisDesde.value ? Math.min(Math.round(cart.total / envioGratisDesde.value * 100), 100) : 0)

function formato(n) {
  return Number(n).toLocaleString('es-AR', { maximumFractionDigits: 2 })
}

function cerrarCarrito() {
  const panel = document.getElementById('carritoPanel')
  if (panel) window.bootstrap.Offcanvas.getOrCreateInstance(panel).hide()
}

function irA(ruta) {
  cerrarCarrito()
  router.push(ruta)
}
</script>

<style scoped>
.panel-carrito {
  background: var(--crema);
  width: min(420px, 100vw) !important;
  border-left: none !important;
}
.offcanvas-header {
  padding: 22px 24px 14px;
  border-bottom: 1px solid var(--borde);
}
.offcanvas-title {
  font-size: 1.5rem;
}
.cantidad {
  font-family: var(--fuente-texto);
  font-size: 1rem;
  color: var(--ciruela-suave);
}
.envio-progreso {
  padding: 14px 24px;
  background: var(--blanco);
  border-bottom: 1px solid var(--borde);
  font-size: 0.88rem;
}
.logrado { color: var(--salvia-texto); }
.barra {
  height: 6px;
  border-radius: 999px;
  background: var(--rosa-polvo);
  overflow: hidden;
}
.barra-relleno {
  height: 100%;
  background: var(--rosa-viejo);
  border-radius: 999px;
  transition: width 0.4s;
}
.offcanvas-body {
  padding: 18px 24px 24px;
}
.vacio {
  text-align: center;
  margin: auto 0;
  padding: 40px 0;
}
.vacio i {
  font-size: 3rem;
  color: var(--rosa-viejo);
}
.vacio-titulo {
  font-family: var(--fuente-titulos);
  font-size: 1.35rem;
  margin: 12px 0 4px;
}
.vacio-texto {
  color: var(--ciruela-suave);
  margin-bottom: 20px;
}
.lista {
  list-style: none;
  padding: 0;
  margin: 0 0 16px;
}
.item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 0;
  border-bottom: 1px solid var(--borde);
}
.item-img {
  width: 76px;
  height: 76px;
  border-radius: 14px;
  object-fit: cover;
  background: var(--rosa-polvo);
  flex: 0 0 auto;
}
.min-w-0 { min-width: 0; }
.item-nombre {
  margin: 0 0 2px;
  font-weight: 500;
}
.item-precio {
  margin: 0 0 8px;
  font-size: 0.92rem;
}
.selector {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--rosa-polvo-medio);
  border-radius: 999px;
  background: var(--blanco);
}
.selector button {
  width: 30px;
  height: 30px;
  border: none;
  background: none;
  color: var(--ciruela);
  font-size: 1rem;
}
.selector span {
  min-width: 22px;
  text-align: center;
  font-size: 0.9rem;
}
.quitar {
  border: none;
  background: none;
  color: var(--ciruela-suave);
  padding: 4px;
}
.quitar:hover { color: var(--oferta); }
.resumen {
  border-top: 1px solid var(--borde);
  padding-top: 16px;
}
.linea {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}
.ahorro { color: var(--salvia-texto); font-size: 0.92rem; }
.total {
  font-family: var(--fuente-titulos);
  font-size: 1.3rem;
}
.nota {
  font-size: 0.8rem;
  color: var(--ciruela-suave);
  margin: 4px 0 14px;
}
.seguir {
  display: block;
  width: 100%;
  margin-top: 10px;
  border: none;
  background: none;
  color: var(--ciruela-suave);
  font-size: 0.9rem;
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>
