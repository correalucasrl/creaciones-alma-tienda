<template>
  <LegalPagina titulo="Botón de arrepentimiento">
    <p>
      Si compraste en el sitio, podés <strong>revocar tu compra dentro de los 10 días corridos</strong> desde que recibiste
      el producto o desde la compra, lo último que ocurra, sin dar motivos y sin costo. No necesitás estar registrado.
      Completá el formulario y te mandamos un código de identificación de tu solicitud.
    </p>
    <p class="small">
      Los productos confeccionados según tus especificaciones o claramente personalizados están exceptuados (art. 1116 del
      Código Civil y Comercial). Más información en la
      <router-link to="/devoluciones">Política de cambios y devoluciones</router-link>.
    </p>

    <div v-if="codigo" class="alert alert-success mt-4">
      <p class="fw-bold mb-1">¡Recibimos tu solicitud!</p>
      <p class="mb-1">Tu código de identificación es:</p>
      <p class="fs-4 fw-bold mb-2 codigo">{{ codigo }}</p>
      <p class="small mb-0">
        También te lo mandamos por email. Guardalo: nos vamos a comunicar con vos para coordinar la devolución y el reintegro.
      </p>
    </div>

    <form v-else class="mt-4" @submit.prevent="enviar">
      <div class="row g-3">
        <div class="col-12 col-md-6">
          <label class="form-label small fw-semibold" for="arr-nombre">Nombre y apellido *</label>
          <input id="arr-nombre" v-model="form.nombre" class="form-control" required maxlength="100" autocomplete="name" />
        </div>
        <div class="col-12 col-md-6">
          <label class="form-label small fw-semibold" for="arr-email">Email *</label>
          <input id="arr-email" v-model="form.email" type="email" class="form-control" required maxlength="150" autocomplete="email" />
        </div>
        <div class="col-12 col-md-6">
          <label class="form-label small fw-semibold" for="arr-telefono">Teléfono</label>
          <input id="arr-telefono" v-model="form.telefono" class="form-control" maxlength="30" autocomplete="tel" />
        </div>
        <div class="col-12 col-md-6">
          <label class="form-label small fw-semibold" for="arr-pedido">Número de pedido</label>
          <input id="arr-pedido" v-model="form.numeroPedido" class="form-control" inputmode="numeric" placeholder="Ej: 125" />
        </div>
        <div class="col-12">
          <label class="form-label small fw-semibold" for="arr-motivo">Motivo (opcional)</label>
          <textarea id="arr-motivo" v-model="form.motivo" class="form-control" rows="3" maxlength="1000"></textarea>
        </div>
      </div>

      <div v-if="error" class="alert alert-danger py-2 small mt-3">{{ error }}</div>

      <button type="submit" class="btn btn-turquesa mt-3" :disabled="enviando">
        {{ enviando ? 'Enviando...' : 'Quiero revocar mi compra' }}
      </button>
    </form>
  </LegalPagina>
</template>

<script setup>
import { ref } from 'vue'
import LegalPagina from '../components/LegalPagina.vue'
import api from '../services/api'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()

const form = ref({
  nombre: auth.usuario?.Nombre || '',
  email: auth.usuario?.Email || '',
  telefono: '',
  numeroPedido: '',
  motivo: ''
})
const enviando = ref(false)
const error = ref('')
const codigo = ref('')

async function enviar() {
  error.value = ''
  enviando.value = true
  try {
    const { data } = await api.post('/arrepentimiento', form.value)
    codigo.value = data.codigo
  } catch (err) {
    error.value = err.response?.data?.error || 'No pudimos enviar tu solicitud. Escribinos por WhatsApp o email.'
  } finally {
    enviando.value = false
  }
}
</script>

<style scoped>
.codigo {
  letter-spacing: 2px;
}
</style>
