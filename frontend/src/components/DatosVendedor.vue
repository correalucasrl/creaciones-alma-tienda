<template>
  <div class="small">
    <h2 class="h6 fw-bold mb-2">Datos del vendedor</h2>
    <p class="mb-1"><strong>Nombre / Razón social:</strong> {{ v.legal_razon_social || 'Creaciones Alma' }}</p>
    <p v-if="v.legal_cuit" class="mb-1"><strong>CUIT:</strong> {{ v.legal_cuit }}</p>
    <p v-if="v.legal_domicilio" class="mb-1"><strong>Domicilio:</strong> {{ v.legal_domicilio }}</p>
    <p v-if="v.email_contacto" class="mb-1"><strong>Email:</strong> {{ v.email_contacto }}</p>
    <p v-if="v.whatsapp_numero" class="mb-0"><strong>WhatsApp:</strong> +{{ v.whatsapp_numero }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useConfigStore } from '../stores/config'

const config = useConfigStore()
const v = computed(() => config.valores)
</script>
