<template>
  <div class="modal-overlay" v-if="visible" @click.self="cancelar">
    <div class="modal-card">
      <div class="modal-icon" :class="esError ? 'icon-error' : 'icon-warning'">
        <i :class="esError ? 'bi bi-x-circle-fill' : 'bi bi-exclamation-triangle-fill'"></i>
      </div>

      <h5 class="text-center fw-bold mb-2">{{ titulo }}</h5>
      <p class="text-center text-secondary mb-3">{{ mensaje }}</p>

      <div v-if="items.length > 0" class="items-lista mb-3">
        <div class="item-fila d-flex justify-content-between" v-for="(item, i) in items" :key="i">
          <span>{{ item.nombre }}</span>
          <span class="fw-semibold" v-if="item.precio !== undefined">${{ item.precio.toLocaleString('es-AR') }}</span>
        </div>
      </div>

      <div class="d-flex gap-2 justify-content-center mt-3">
        <button class="btn btn-outline-secondary" @click="cancelar" v-if="mostrarCancelar">
          Cancelar
        </button>
        <button class="btn" :class="esError ? 'btn-danger' : 'btn-turquesa'" @click="confirmar">
          {{ textoConfirmar }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const visible = ref(false)
const titulo = ref('')
const mensaje = ref('')
const items = ref([])
const esError = ref(false)
const mostrarCancelar = ref(true)
const textoConfirmar = ref('Confirmar')

let resolvePromise = null

function abrir({ titulo: t, mensaje: m, items: i = [], esError: err = false, soloInfo = false, textoConfirmar: tc = 'Confirmar' }) {
  titulo.value = t
  mensaje.value = m
  items.value = i
  esError.value = err
  mostrarCancelar.value = !soloInfo
  textoConfirmar.value = soloInfo ? 'Entendido' : tc
  visible.value = true

  return new Promise((resolve) => {
    resolvePromise = resolve
  })
}

function confirmar() {
  visible.value = false
  if (resolvePromise) resolvePromise(true)
}

function cancelar() {
  visible.value = false
  if (resolvePromise) resolvePromise(false)
}

defineExpose({ abrir })
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
  padding: 1rem;
}

.modal-card {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  max-width: 420px;
  width: 100%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  animation: pop 0.2s ease;
}

@keyframes pop {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.modal-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  margin: 0 auto 1rem;
}
.icon-warning {
  background: #fef3c7;
  color: #d97706;
}
.icon-error {
  background: #fee2e2;
  color: #dc2626;
}

.items-lista {
  background: #f9fafb;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  max-height: 180px;
  overflow-y: auto;
}
.item-fila {
  padding: 0.35rem 0;
  font-size: 0.9rem;
  border-bottom: 1px solid #eee;
}
.item-fila:last-child {
  border-bottom: none;
}
</style>