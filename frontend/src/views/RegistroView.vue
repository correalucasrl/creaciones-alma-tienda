<template>
  <TarjetaAuth titulo="Creá tu cuenta" subtitulo="Seguí tus pedidos y guardá tus datos para la próxima compra.">
    <div v-if="error" class="alert alert-danger py-2 small">{{ error }}</div>

    <form @submit.prevent="handleRegistro">
      <div class="mb-3">
        <label class="form-label" for="reg-nombre">Nombre y apellido</label>
        <input id="reg-nombre" v-model="nombre" type="text" class="form-control" autocomplete="name" required />
      </div>
      <div class="row g-3 mb-3">
        <div class="col-12 col-sm-7">
          <label class="form-label" for="reg-email">Email</label>
          <input id="reg-email" v-model="email" type="email" class="form-control" autocomplete="email" required />
        </div>
        <div class="col-12 col-sm-5">
          <label class="form-label" for="reg-tel">Teléfono <span class="text-secondary">(opcional)</span></label>
          <input id="reg-tel" v-model="telefono" type="tel" class="form-control" autocomplete="tel" />
        </div>
      </div>
      <div class="mb-3">
        <label class="form-label" for="reg-clave">Contraseña</label>
        <div class="campo-clave">
          <input
            id="reg-clave"
            v-model="password"
            :type="verPassword ? 'text' : 'password'"
            class="form-control"
            autocomplete="new-password"
            required
            minlength="8"
            aria-describedby="reg-clave-ayuda"
          />
          <button type="button" class="ver-clave" :aria-label="verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'" @click="verPassword = !verPassword">
            <i class="bi" :class="verPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
          </button>
        </div>
        <p id="reg-clave-ayuda" class="small text-secondary mt-1 mb-0">Mínimo 8 caracteres.</p>
      </div>
      <div class="form-check mb-4 small">
        <input id="acepta-terminos" v-model="aceptaTerminos" class="form-check-input" type="checkbox" required />
        <label class="form-check-label" for="acepta-terminos">
          Acepto los <router-link to="/terminos" target="_blank">términos y condiciones</router-link>
          y la <router-link to="/privacidad" target="_blank">política de privacidad</router-link>
        </label>
      </div>
      <button type="submit" class="btn btn-alma w-100" :disabled="cargando">
        {{ cargando ? 'Creando cuenta...' : 'Crear cuenta' }}
      </button>
    </form>

    <template #pie>
      ¿Ya tenés cuenta? <router-link to="/login" class="fw-semibold">Iniciá sesión</router-link>
    </template>
  </TarjetaAuth>
</template>

<script setup>
import { ref, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import TarjetaAuth from '../components/TarjetaAuth.vue'

const router = useRouter()
const auth = useAuthStore()
const mostrarToast = inject('mostrarToast')

const nombre = ref('')
const email = ref('')
const telefono = ref('')
const password = ref('')
const verPassword = ref(false)
const aceptaTerminos = ref(false)
const error = ref('')
const cargando = ref(false)

async function handleRegistro() {
  error.value = ''
  cargando.value = true
  try {
    const data = await auth.registro(nombre.value, email.value, password.value, telefono.value, aceptaTerminos.value)
    mostrarToast(`¡Cuenta creada! Bienvenida/o, ${data.usuario.Nombre} 💗`)
    router.push('/')
  } catch (err) {
    error.value = err.response?.data?.error || 'Error al crear la cuenta'
  } finally {
    cargando.value = false
  }
}
</script>
