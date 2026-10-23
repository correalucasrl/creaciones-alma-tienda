<template>
  <div class="form-newsletter" :class="`variante-${variante}`">
    <p v-if="mensaje" class="mensaje-ok" role="status">
      <i class="bi bi-envelope-heart me-2" aria-hidden="true"></i>{{ mensaje }}
    </p>
    <form v-else novalidate @submit.prevent="suscribirse">
      <div class="campo">
        <label :for="idCampo" class="visually-hidden">Tu email</label>
        <input
          :id="idCampo"
          v-model="email"
          type="email"
          placeholder="tu@email.com"
          autocomplete="email"
          :aria-invalid="!!error"
          :aria-describedby="error ? `${idCampo}-error` : undefined"
          @input="error = ''"
        />
        <button type="submit" class="btn btn-alma" :disabled="enviando">
          {{ enviando ? 'Enviando...' : `Quiero mi ${porcentaje}% OFF` }}
        </button>
      </div>
      <p v-if="error" :id="`${idCampo}-error`" class="error">{{ error }}</p>
      <p class="legal">
        Te mandamos el cupón por mail. Podés darte de baja cuando quieras.
        <router-link to="/privacidad">Política de privacidad</router-link>
      </p>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import api from '../services/api'
import { useConfigStore } from '../stores/config'

const props = defineProps({
  origen: { type: String, default: 'inicio' },
  variante: { type: String, default: 'clara' } // clara | oscura
})
const emit = defineEmits(['suscripto'])

const config = useConfigStore()
const porcentaje = computed(() => Number(config.valores.newsletter_descuento_pct) || 10)
const idCampo = `newsletter-${props.origen}`

const email = ref('')
const error = ref('')
const mensaje = ref('')
const enviando = ref(false)

const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function suscribirse() {
  if (!regexEmail.test(email.value.trim())) {
    error.value = 'Ingresá un email válido'
    return
  }
  enviando.value = true
  try {
    const { data } = await api.post('/newsletter', { email: email.value.trim(), origen: props.origen })
    mensaje.value = data.mensaje
    try { localStorage.setItem('newsletter_suscripto', '1') } catch { /* sin almacenamiento */ }
    emit('suscripto')
  } catch (err) {
    error.value = err.response?.data?.error || 'No pudimos suscribirte. Probá de nuevo.'
  } finally {
    enviando.value = false
  }
}
</script>

<style scoped>
.campo {
  display: flex;
  gap: 8px;
  background: var(--blanco);
  border: 1px solid var(--rosa-polvo-medio);
  border-radius: 999px;
  padding: 6px;
  max-width: 480px;
}
.campo:focus-within {
  border-color: var(--rosa-viejo);
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.18);
}
.campo input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  padding: 0 14px;
  color: var(--ciruela);
}
.campo .btn-alma {
  padding: 10px 20px;
  white-space: nowrap;
}
.error {
  color: var(--oferta);
  font-size: 0.85rem;
  margin: 8px 0 0 14px;
}
.legal {
  font-size: 0.78rem;
  color: var(--ciruela-suave);
  margin: 10px 0 0 14px;
}
.legal a {
  color: inherit;
}
.mensaje-ok {
  background: var(--salvia);
  color: var(--salvia-texto);
  border-radius: 16px;
  padding: 14px 18px;
  margin: 0;
  max-width: 480px;
}
@media (max-width: 480px) {
  .campo {
    flex-direction: column;
    border-radius: 20px;
  }
  .campo input { padding: 10px 12px; }
}
</style>
