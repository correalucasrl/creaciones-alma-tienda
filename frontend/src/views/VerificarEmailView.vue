<template>
  <TarjetaAuth
    :panel="false"
    :icono="cargando ? 'bi-hourglass-split' : (exito ? 'bi-patch-check' : 'bi-exclamation-circle')"
    :titulo="cargando ? 'Confirmando tu cuenta...' : (exito ? '¡Cuenta confirmada!' : 'No pudimos confirmar tu cuenta')"
    :subtitulo="cargando ? '' : (exito ? 'Ya podés usar todas las funciones de tu cuenta.' : error)"
  >
    <template v-if="!cargando">
      <router-link v-if="exito" to="/productos" class="btn btn-alma w-100">Ir a la tienda</router-link>
      <router-link v-else to="/" class="btn btn-alma-borde w-100">Ir al inicio</router-link>
    </template>
  </TarjetaAuth>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../services/api'
import TarjetaAuth from '../components/TarjetaAuth.vue'

const route = useRoute()
const cargando = ref(true)
const exito = ref(false)
const error = ref('')

onMounted(async () => {
  try {
    await api.get(`/auth/verificar/${route.params.token}`)
    exito.value = true
  } catch (err) {
    error.value = err.response?.data?.error || 'El link no es válido o ya venció'
  } finally {
    cargando.value = false
  }
})
</script>
