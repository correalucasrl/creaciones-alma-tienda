<template>
  <TarjetaAuth
    :panel="false"
    :icono="enviado ? 'bi-envelope-check' : 'bi-key'"
    :titulo="enviado ? 'Revisá tu email' : 'Recuperá tu contraseña'"
    :subtitulo="enviado
      ? 'Si ese email está registrado, te mandamos un link para elegir una nueva contraseña. Fijate también en spam.'
      : 'Ingresá tu email y te mandamos un link para elegir una nueva. Sirve también si compraste como invitado y nunca creaste una.'"
  >
    <router-link v-if="enviado" to="/login" class="btn btn-alma w-100">Volver a iniciar sesión</router-link>

    <form v-else class="text-start" @submit.prevent="enviar">
      <div v-if="error" class="alert alert-danger py-2 small">{{ error }}</div>
      <div class="mb-4">
        <label class="form-label" for="olv-email">Email</label>
        <input id="olv-email" v-model="email" type="email" class="form-control" autocomplete="email" required />
      </div>
      <button type="submit" class="btn btn-alma w-100" :disabled="cargando">
        {{ cargando ? 'Enviando...' : 'Enviar link' }}
      </button>
    </form>

    <template v-if="!enviado" #pie>
      <router-link to="/login" class="fw-semibold">Volver a iniciar sesión</router-link>
    </template>
  </TarjetaAuth>
</template>

<script setup>
import { ref } from 'vue'
import api from '../services/api'
import TarjetaAuth from '../components/TarjetaAuth.vue'

const email = ref('')
const error = ref('')
const cargando = ref(false)
const enviado = ref(false)

async function enviar() {
  error.value = ''
  cargando.value = true
  try {
    await api.post('/auth/olvide-password', { email: email.value })
    enviado.value = true
  } catch (err) {
    error.value = err.response?.data?.error || 'Error al enviar el mail'
  } finally {
    cargando.value = false
  }
}
</script>
