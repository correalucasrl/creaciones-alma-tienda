<template>
  <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 1100">
    <div
      class="toast align-items-center border-0 toast-personalizado"
      :class="{ show: visible }"
      role="alert"
    >
      <div class="d-flex">
        <div class="toast-body">
          <i class="bi bi-check-circle-fill me-2"></i>
          {{ mensaje }}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" @click="cerrar"></button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const visible = ref(false)
const mensaje = ref('')
let timeoutId = null

function mostrar(msg) {
  mensaje.value = msg
  visible.value = true

  if (timeoutId) clearTimeout(timeoutId)
  timeoutId = setTimeout(() => {
    visible.value = false
  }, 2500)
}

function cerrar() {
  visible.value = false
}

defineExpose({ mostrar })
</script>

<style scoped>
.toast-container {
  pointer-events: none;
}
.toast-personalizado {
  background-color: var(--turquesa);
  color: white;
  font-weight: 500;
  border-radius: 12px;
  min-width: 280px;
  opacity: 0;
  transform: translateY(-20px);
  transition: all 0.3s ease;
  display: block;
  pointer-events: none;
}
.toast-personalizado.show {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}
</style>