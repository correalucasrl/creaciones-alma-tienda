<template>
  <TarjetaAuth titulo="Hola de nuevo" subtitulo="Ingresá para seguir tus pedidos y comprar más rápido.">
    <div v-if="sesionExpirada && !error" class="alert alert-warning py-2 small">
      Tu sesión terminó. Volvé a iniciar sesión para continuar.
    </div>
    <div v-if="error" class="alert alert-danger py-2 small">{{ error }}</div>

    <form @submit.prevent="handleLogin">
      <div class="mb-3">
        <label class="form-label" for="login-email">Email</label>
        <input id="login-email" v-model="email" type="email" class="form-control" autocomplete="email" required />
      </div>
      <div class="mb-2">
        <label class="form-label" for="login-clave">Contraseña</label>
        <div class="campo-clave">
          <input id="login-clave" v-model="password" :type="verPassword ? 'text' : 'password'" class="form-control" autocomplete="current-password" required />
          <button type="button" class="ver-clave" :aria-label="verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'" @click="verPassword = !verPassword">
            <i class="bi" :class="verPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
          </button>
        </div>
      </div>
      <p class="text-end mb-4">
        <router-link to="/olvide-password" class="small">¿Olvidaste tu contraseña?</router-link>
      </p>
      <button type="submit" class="btn btn-alma w-100" :disabled="cargando">
        {{ cargando ? 'Ingresando...' : 'Ingresar' }}
      </button>
    </form>

    <template #pie>
      ¿No tenés cuenta? <router-link to="/registro" class="fw-semibold">Creala en un minuto</router-link>
    </template>
  </TarjetaAuth>
</template>

<script setup>
import { ref, inject } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import TarjetaAuth from '../components/TarjetaAuth.vue'

const router = useRouter()
const route = useRoute()
const sesionExpirada = route.query.sesion === 'expirada'

// Adónde volver después del login (ej: ?volver=/checkout). Solo rutas internas,
// para que nadie pueda armar un link que redirija a otro sitio
const volver = typeof route.query.volver === 'string' && /^\/(?!\/)/.test(route.query.volver) ? route.query.volver : '/'
const auth = useAuthStore()
const mostrarToast = inject('mostrarToast')

const email = ref('')
const password = ref('')
const verPassword = ref(false)
const error = ref('')
const cargando = ref(false)

async function handleLogin() {
  error.value = ''
  cargando.value = true
  try {
    const data = await auth.login(email.value, password.value)
    mostrarToast(`¡Bienvenida/o, ${data.usuario.Nombre}! 💗`)
    router.push(volver)
  } catch (err) {
    error.value = err.response?.data?.error || 'Error al iniciar sesión'
  } finally {
    cargando.value = false
  }
}
</script>
