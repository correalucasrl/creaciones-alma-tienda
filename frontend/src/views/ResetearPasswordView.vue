<template>
  <TarjetaAuth
    :panel="false"
    :icono="listo ? 'bi-check2-circle' : 'bi-shield-lock'"
    :titulo="listo ? '¡Contraseña actualizada!' : 'Elegí tu nueva contraseña'"
    :subtitulo="listo ? 'Ya podés iniciar sesión con tu nueva contraseña.' : 'Usá al menos 8 caracteres.'"
  >
    <router-link v-if="listo" to="/login" class="btn btn-alma w-100">Iniciar sesión</router-link>

    <form v-else class="text-start" @submit.prevent="guardar">
      <div v-if="error" class="alert alert-danger py-2 small">{{ error }}</div>
      <div class="mb-4">
        <label class="form-label" for="res-clave">Nueva contraseña</label>
        <div class="campo-clave">
          <input id="res-clave" v-model="password" :type="verPassword ? 'text' : 'password'" class="form-control" autocomplete="new-password" required minlength="8" />
          <button type="button" class="ver-clave" :aria-label="verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'" @click="verPassword = !verPassword">
            <i class="bi" :class="verPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
          </button>
        </div>
      </div>
      <button type="submit" class="btn btn-alma w-100" :disabled="cargando">
        {{ cargando ? 'Guardando...' : 'Guardar nueva contraseña' }}
      </button>
    </form>
  </TarjetaAuth>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import api from '../services/api'
import TarjetaAuth from '../components/TarjetaAuth.vue'

const route = useRoute()
const password = ref('')
const verPassword = ref(false)
const error = ref('')
const cargando = ref(false)
const listo = ref(false)

async function guardar() {
  error.value = ''
  cargando.value = true
  try {
    await api.post('/auth/resetear-password', {
      token: route.params.token,
      password: password.value
    })
    listo.value = true
  } catch (err) {
    error.value = err.response?.data?.error || 'Error al guardar la contraseña'
  } finally {
    cargando.value = false
  }
}
</script>
