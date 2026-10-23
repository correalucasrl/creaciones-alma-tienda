<template>
  <div class="container detalle">
    <router-link :to="auth.esAdmin ? '/admin/pedidos' : '/mis-pedidos'" class="volver">
      <i class="bi bi-arrow-left" aria-hidden="true"></i> {{ auth.esAdmin ? 'Panel de pedidos' : 'Mis pedidos' }}
    </router-link>

    <div v-if="cargando" class="text-center py-5">
      <div class="spinner-border text-secondary" role="status"><span class="visually-hidden">Cargando...</span></div>
    </div>

    <div v-else-if="!data" class="vacio">
      <i class="bi bi-exclamation-circle" aria-hidden="true"></i>
      <p class="vacio-titulo">No encontramos este pedido</p>
      <router-link to="/mis-pedidos" class="btn btn-alma-borde">Ver mis pedidos</router-link>
    </div>

    <template v-else>
      <header class="detalle-encabezado">
        <div>
          <h1>Pedido <em>#{{ data.orden.Id }}</em></h1>
          <p class="fecha">Hecho el {{ fechaLarga(data.orden.FechaCreacion) }}</p>
        </div>
        <EstadoPedido :estado="data.orden.Estado" />
      </header>

      <section class="tarjeta">
        <SeguimientoPedido :estado="data.orden.Estado" />
        <div v-if="data.orden.NumeroSeguimiento" class="tracking">
          <i class="bi bi-truck" aria-hidden="true"></i>
          <span>
            Número de seguimiento: <strong>{{ data.orden.NumeroSeguimiento }}</strong>
            <a href="https://www.correoargentino.com.ar/seguimiento-de-envios" target="_blank" rel="noopener">Seguirlo en Correo Argentino</a>
          </span>
        </div>
      </section>

      <div class="row g-4">
        <div class="col-12 col-lg-7">
          <section class="tarjeta">
            <h2 class="tarjeta-titulo">Productos</h2>
            <ul class="items">
              <li v-for="item in data.detalles" :key="item.Id">
                <img
                  :src="item.ImagenPrincipalUrl || 'https://placehold.co/120x120/ede9fe/6d28d9?text=' + encodeURIComponent(item.ProductoNombre[0])"
                  :alt="item.ProductoNombre"
                />
                <span class="item-datos">
                  <span class="item-nombre">{{ item.ProductoNombre }}</span>
                  <span class="item-meta">{{ item.Cantidad }} × ${{ moneda(item.PrecioUnitario) }}</span>
                </span>
                <span class="item-total">${{ moneda(item.Cantidad * item.PrecioUnitario) }}</span>
              </li>
            </ul>
            <dl class="totales">
              <div v-if="data.orden.Subtotal"><dt>Subtotal</dt><dd>${{ moneda(data.orden.Subtotal) }}</dd></div>
              <div v-if="data.orden.DescuentoCupon" class="descuento">
                <dt>Cupón {{ data.orden.CuponCodigo }}</dt><dd>−${{ moneda(data.orden.DescuentoCupon) }}</dd>
              </div>
              <div v-if="data.orden.DescuentoTransferencia" class="descuento">
                <dt>Descuento transferencia</dt><dd>−${{ moneda(data.orden.DescuentoTransferencia) }}</dd>
              </div>
              <div v-if="data.orden.TipoEntrega === 'Envio'">
                <dt>Envío</dt><dd>{{ Number(data.orden.CostoEnvio) ? '$' + moneda(data.orden.CostoEnvio) : 'Gratis' }}</dd>
              </div>
              <div class="total"><dt>Total</dt><dd>${{ moneda(data.orden.Total) }}</dd></div>
            </dl>
          </section>
        </div>

        <div class="col-12 col-lg-5">
          <section class="tarjeta">
            <h2 class="tarjeta-titulo">Entrega</h2>
            <p class="dato">
              <i :class="['bi', data.orden.TipoEntrega === 'Envio' ? 'bi-truck' : 'bi-shop']" aria-hidden="true"></i>
              {{ data.orden.TipoEntrega === 'Envio' ? 'Envío por Correo Argentino' : 'Retiro en zona oeste (Marcos Paz)' }}
            </p>
            <p v-if="data.direccion" class="dato">
              <i class="bi bi-geo-alt" aria-hidden="true"></i>
              {{ data.direccion.Calle }} {{ data.direccion.Numero }}, {{ data.direccion.Localidad }},
              {{ data.direccion.Provincia }} (CP {{ data.direccion.CodigoPostal }})
            </p>
          </section>

          <section class="tarjeta">
            <h2 class="tarjeta-titulo">Comprador</h2>
            <p class="dato"><i class="bi bi-person" aria-hidden="true"></i>{{ data.orden.CompradorNombre }}</p>
            <p class="dato"><i class="bi bi-envelope" aria-hidden="true"></i>{{ data.orden.CompradorEmail }}</p>
            <p v-if="data.orden.CompradorTelefono" class="dato"><i class="bi bi-telephone" aria-hidden="true"></i>{{ data.orden.CompradorTelefono }}</p>
          </section>

          <section v-if="!auth.esAdmin" class="tarjeta ayuda">
            <h2 class="tarjeta-titulo">¿Necesitás ayuda?</h2>
            <a v-if="linkWhatsapp" :href="linkWhatsapp" target="_blank" rel="noopener" class="btn btn-alma-borde w-100 mb-2">
              <i class="bi bi-whatsapp me-1"></i> Escribinos por este pedido
            </a>
            <router-link to="/arrepentimiento" class="link-chico">Botón de arrepentimiento</router-link>
            ·
            <router-link to="/devoluciones" class="link-chico">Cambios y devoluciones</router-link>
          </section>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../services/api'
import { useConfigStore } from '../stores/config'
import { useAuthStore } from '../stores/auth'
import EstadoPedido from '../components/EstadoPedido.vue'
import SeguimientoPedido from '../components/SeguimientoPedido.vue'

const route = useRoute()
const config = useConfigStore()
const auth = useAuthStore()
const data = ref(null)
const cargando = ref(true)

const moneda = n => Number(n).toLocaleString('es-AR', { maximumFractionDigits: 2 })
const fechaLarga = f => new Date(f).toLocaleString('es-AR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const linkWhatsapp = computed(() => {
  const numero = config.valores.whatsapp_numero
  if (!numero || !data.value) return null
  return `https://wa.me/${numero}?text=${encodeURIComponent(`¡Hola! Te escribo por mi pedido #${data.value.orden.Id}`)}`
})

onMounted(async () => {
  try {
    const { data: res } = await api.get(`/ordenes/${route.params.id}`)
    data.value = res
  } catch (err) {
    console.error(err)
  } finally {
    cargando.value = false
  }
})
</script>

<style scoped>
.detalle {
  padding-top: 32px;
  padding-bottom: 80px;
  max-width: 1040px;
}
.volver {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--ciruela-suave);
  text-decoration: none;
  font-size: 0.9rem;
  margin-bottom: 18px;
}
.volver:hover {
  color: var(--rosa-texto);
}
.detalle-encabezado {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}
.detalle-encabezado h1 {
  font-size: clamp(1.9rem, 4vw, 2.5rem);
  margin: 0;
}
.detalle-encabezado em {
  color: var(--rosa-viejo);
  font-style: italic;
}
.fecha {
  color: var(--ciruela-suave);
  margin: 4px 0 0;
}
.tarjeta {
  background: var(--blanco);
  border: 1px solid var(--borde);
  border-radius: var(--radio-grande);
  padding: 24px;
  margin-bottom: 20px;
}
.tarjeta-titulo {
  font-size: 1.2rem;
  margin-bottom: 14px;
}
.tracking {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  background: var(--lila-suave);
  border-radius: 14px;
  padding: 12px 16px;
  margin-top: 20px;
  font-size: 0.92rem;
}
.tracking i {
  color: var(--lila-fuerte);
  font-size: 1.2rem;
}
.tracking a {
  display: block;
  color: var(--lila-fuerte);
}
.items {
  list-style: none;
  padding: 0;
  margin: 0 0 16px;
  display: grid;
  gap: 14px;
}
.items li {
  display: flex;
  align-items: center;
  gap: 14px;
}
.items img {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  object-fit: cover;
  background: var(--lila-suave);
}
.item-datos {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.item-nombre { font-weight: 500; }
.item-meta { font-size: 0.85rem; color: var(--ciruela-suave); }
.item-total { font-weight: 500; }
.totales {
  margin: 0;
  border-top: 1px solid var(--borde);
  padding-top: 12px;
}
.totales div {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}
.totales dt { font-weight: 400; color: var(--ciruela-suave); }
.totales dd { margin: 0; }
.totales .descuento dt, .totales .descuento dd { color: var(--salvia-texto); }
.totales .total {
  font-family: var(--fuente-titulos);
  font-size: 1.35rem;
  margin-top: 8px;
}
.totales .total dt { color: var(--ciruela); }
.dato {
  display: flex;
  gap: 10px;
  margin-bottom: 8px;
  color: var(--ciruela);
}
.dato i {
  color: var(--rosa-viejo);
}
.ayuda {
  background: var(--lila-suave);
  border-color: var(--lila-suave);
}
.link-chico {
  font-size: 0.85rem;
  color: var(--ciruela-suave);
}
.vacio {
  text-align: center;
  padding: 60px 0;
}
.vacio i {
  font-size: 2.8rem;
  color: var(--rosa-viejo);
}
.vacio-titulo {
  font-family: var(--fuente-titulos);
  font-size: 1.4rem;
  margin: 12px 0 18px;
}
</style>
