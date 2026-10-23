<template>
  <div class="container baja">
    <div class="baja-caja">
      <template v-if="estado === 'cargando'">
        <div class="spinner-border text-secondary" role="status"><span class="visually-hidden">Procesando...</span></div>
      </template>
      <template v-else-if="estado === 'ok'">
        <i class="bi bi-envelope-x icono" aria-hidden="true"></i>
        <h1>Listo, te diste de baja</h1>
        <p>No vamos a mandarle más mails del newsletter a <strong>{{ email }}</strong>.</p>
        <p class="small">Los mails de tus pedidos (confirmación, envío) te siguen llegando igual.</p>
        <router-link to="/" class="btn btn-alma mt-2">Volver a la tienda</router-link>
      </template>
      <template v-else>
        <i class="bi bi-exclamation-circle icono" aria-hidden="true"></i>
        <h1>El link no es válido</h1>
        <p>Puede que ya te hayas dado de baja. Si seguís recibiendo mails, escribinos y lo resolvemos.</p>
        <router-link to="/" class="btn btn-alma-borde mt-2">Volver a la tienda</router-link>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../services/api'

const route = useRoute()
const estado = ref('cargando')
const email = ref('')

onMounted(async () => {
  try {
    const { data } = await api.post(`/newsletter/baja/${encodeURIComponent(route.params.token)}`)
    email.value = data.email
    estado.value = 'ok'
    try { localStorage.removeItem('newsletter_suscripto') } catch { /* sin almacenamiento */ }
  } catch {
    estado.value = 'error'
  }
})
</script>

<style scoped>
.baja {
  padding: 80px 16px;
}
.baja-caja {
  max-width: 520px;
  margin: 0 auto;
  text-align: center;
  background: var(--blanco);
  border: 1px solid var(--borde);
  border-radius: var(--radio-grande);
  padding: 40px 28px;
}
.icono {
  font-size: 2.6rem;
  color: var(--rosa-viejo);
}
h1 {
  font-size: 1.8rem;
  margin: 12px 0;
}
p {
  color: var(--ciruela-suave);
}
</style>
