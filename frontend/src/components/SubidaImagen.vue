<template>
  <div>
    <label class="form-label small fw-semibold">{{ label }}</label>

    <div class="upload-zone" :class="{ 'has-image': preview }" @click="triggerInput">
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="d-none"
        @change="handleFile"
      />

      <div v-if="!preview && !subiendo" class="upload-placeholder">
        <i class="bi bi-cloud-upload fs-2"></i>
        <p class="small mb-0 mt-2">Click para subir una imagen</p>
      </div>

      <div v-if="subiendo" class="upload-placeholder">
        <div class="spinner-border spinner-border-sm text-secondary" role="status"></div>
        <p class="small mb-0 mt-2">Subiendo...</p>
      </div>

      <img v-if="preview && !subiendo" :src="preview" class="preview-img" />

      <button v-if="preview && !subiendo" class="btn-quitar" @click.stop="quitar">
        <i class="bi bi-x-lg"></i>
      </button>
    </div>

    <p v-if="error" class="text-danger small mt-1">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import api from '../services/api'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: 'Imagen' }
})

const emit = defineEmits(['update:modelValue'])

const MAX_MB = 10

const fileInput = ref(null)
const preview = ref(props.modelValue || '')
const subiendo = ref(false)
const error = ref('')

watch(() => props.modelValue, (nuevo) => {
  preview.value = nuevo || ''
})

function triggerInput() {
  if (!subiendo.value) fileInput.value.click()
}

// Subida firmada: el backend (solo para admins) firma los parámetros con el API secret
// y el navegador sube la imagen directo a Cloudinary con esa firma
async function handleFile(e) {
  const file = e.target.files[0]
  e.target.value = '' // permite volver a elegir el mismo archivo si falló
  if (!file) return

  error.value = ''

  if (!file.type.startsWith('image/')) {
    error.value = 'El archivo tiene que ser una imagen'
    return
  }
  if (file.size > MAX_MB * 1024 * 1024) {
    error.value = `La imagen pesa más de ${MAX_MB} MB`
    return
  }

  subiendo.value = true

  try {
    const { data: firma } = await api.post('/uploads/firma')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('api_key', firma.apiKey)
    formData.append('signature', firma.signature)
    for (const [clave, valor] of Object.entries(firma.parametros)) {
      formData.append(clave, valor)
    }

    const res = await fetch(`https://api.cloudinary.com/v1_1/${firma.cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    })
    const data = await res.json()

    if (data.secure_url) {
      preview.value = data.secure_url
      emit('update:modelValue', data.secure_url)
    } else {
      console.error('Cloudinary rechazó la subida:', data.error)
      error.value = data.error?.message?.includes('format')
        ? 'Formato no permitido. Usá JPG, PNG, WEBP, GIF o AVIF'
        : 'No se pudo subir la imagen'
    }
  } catch (err) {
    console.error('Error al subir la imagen:', err)
    error.value = err.response?.data?.error || 'Error de conexión al subir la imagen'
  } finally {
    subiendo.value = false
  }
}
function quitar() {
  preview.value = ''
  emit('update:modelValue', '')
}
</script>

<style scoped>
.upload-zone {
  position: relative;
  border: 2px dashed #e5e7eb;
  border-radius: 12px;
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: 0.2s;
  overflow: hidden;
  background: #fafafa;
}
.upload-zone:hover {
  border-color: var(--turquesa);
  background: var(--turquesa-claro);
}
.upload-zone.has-image {
  border-style: solid;
  border-color: #e5e7eb;
}
.upload-placeholder {
  text-align: center;
  color: #9ca3af;
}
.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.btn-quitar {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(0,0,0,0.6);
  color: white;
  border: none;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>