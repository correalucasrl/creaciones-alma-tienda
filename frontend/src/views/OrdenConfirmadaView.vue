<template>
  <div class="container confirmada">
    <div class="tarjeta">
      <span class="icono-ok" aria-hidden="true"><i class="bi bi-check-lg"></i></span>
      <span class="eyebrow">Pedido #{{ $route.params.id }}</span>
      <h1>¡Gracias por tu <em>compra</em>!</h1>
      <p class="bajada">
        {{ esTransferencia
          ? 'Recibimos tu pedido. Lo confirmamos apenas veamos la transferencia.'
          : 'Recibimos tu pedido. Te mandamos un mail con el detalle y te avisamos cada vez que avance.' }}
      </p>

      <div v-if="esTransferencia" class="transferencia">
        <h2>Último paso: la transferencia</h2>
        <p class="mb-2">Transferí el total del pedido (te lo mandamos por mail) a:</p>
        <p class="mb-1">Alias: <strong>{{ config.valores.transferencia_alias || 'te lo pasamos por WhatsApp' }}</strong></p>
        <p v-if="config.valores.transferencia_titular" class="mb-3">Titular: {{ config.valores.transferencia_titular }}</p>
        <a v-if="linkWhatsapp" :href="linkWhatsapp" target="_blank" rel="noopener" class="btn btn-alma">
          <i class="bi bi-whatsapp me-2"></i>Mandar el comprobante por WhatsApp
        </a>
      </div>

      <ol class="pasos" aria-label="Qué sigue">
        <li><i class="bi bi-envelope-heart" aria-hidden="true"></i><span><strong>Te llega un mail</strong> con el detalle del pedido.</span></li>
        <li><i class="bi bi-brush" aria-hidden="true"></i><span><strong>Lo preparamos a mano.</strong> Si es personalizado, te escribimos para coordinar.</span></li>
        <li><i class="bi bi-truck" aria-hidden="true"></i><span><strong>Te avisamos</strong> cuando sale, con el número de seguimiento.</span></li>
      </ol>

      <div class="acciones">
        <router-link v-if="auth.estaLogueado" :to="`/mis-pedidos/${$route.params.id}`" class="btn btn-alma-borde">Ver mi pedido</router-link>
        <router-link to="/productos" class="btn btn-alma-borde">Seguir mirando</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useConfigStore } from '../stores/config'
import { useAuthStore } from '../stores/auth'
import { registrarCompra } from '../analitica'

const route = useRoute()
const config = useConfigStore()
const auth = useAuthStore()

const esTransferencia = computed(() => route.query.metodo === 'transferencia')

// Se mide la compra si es por transferencia o si Mercado Pago volvió con el pago aprobado
onMounted(() => {
  if (esTransferencia.value || route.query.status === 'approved') registrarCompra(route.params.id)
})

const linkWhatsapp = computed(() => {
  const numero = config.valores.whatsapp_numero
  if (!numero) return null
  const texto = encodeURIComponent('¡Hola! Te paso el comprobante de la transferencia del pedido #' + route.params.id)
  return 'https://wa.me/' + numero + '?text=' + texto
})
</script>

<style scoped>
.confirmada {
  padding-top: 48px;
  padding-bottom: 80px;
}
.tarjeta {
  max-width: 620px;
  margin: 0 auto;
  background: var(--blanco);
  border: 1px solid var(--borde);
  border-radius: 28px;
  padding: 44px 36px;
  text-align: center;
  box-shadow: var(--sombra-suave);
}
.icono-ok {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--rosa-viejo);
  color: #fff;
  font-size: 2.2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 10px var(--rosa-polvo);
  margin-bottom: 22px;
}
h1 {
  font-size: clamp(1.9rem, 4vw, 2.5rem);
  margin-bottom: 10px;
}
h1 em {
  color: var(--rosa-viejo);
  font-style: italic;
}
.bajada {
  color: var(--ciruela-suave);
  max-width: 460px;
  margin: 0 auto 26px;
}
.transferencia {
  background: var(--lila-suave);
  border-radius: 18px;
  padding: 22px;
  margin-bottom: 26px;
}
.transferencia h2 {
  font-size: 1.2rem;
  margin-bottom: 10px;
}
.pasos {
  list-style: none;
  padding: 0;
  margin: 0 0 28px;
  display: grid;
  gap: 12px;
  text-align: left;
}
.pasos li {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  color: var(--ciruela-suave);
}
.pasos i {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--rosa-polvo);
  color: var(--rosa-viejo);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}
.pasos strong {
  color: var(--ciruela);
  font-weight: 500;
}
.acciones {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}
@media (max-width: 575px) {
  .tarjeta { padding: 32px 20px; }
}
</style>
