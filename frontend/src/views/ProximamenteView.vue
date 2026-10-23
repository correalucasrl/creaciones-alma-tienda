<template>
  <main class="proximamente">
    <div class="tarjeta">
      <MarcaAlma tamano="grande" />

      <p class="eyebrow mt-4">Muy pronto</p>
      <h1>Estamos preparando la tienda</h1>
      <p class="bajada">
        Fotos Polaroid, stickers, álbumes e impresiones personalizadas, hechos a mano en Marcos Paz.
        Dejanos tu email y te avisamos cuando abramos, con un cupón de bienvenida.
      </p>

      <FormNewsletter origen="proximamente" class="mx-auto" />

      <div v-if="linkInstagram || linkWhatsapp" class="redes">
        <p>Mientras tanto, encontranos en</p>
        <div class="d-flex justify-content-center flex-wrap gap-2">
          <a v-if="linkInstagram" :href="linkInstagram" target="_blank" rel="noopener" class="btn btn-alma-borde">
            <i class="bi bi-instagram me-2" aria-hidden="true"></i>{{ config.valores.instagram_usuario || 'Instagram' }}
          </a>
          <a v-if="linkWhatsapp" :href="linkWhatsapp" target="_blank" rel="noopener" class="btn btn-alma-borde">
            <i class="bi bi-whatsapp me-2" aria-hidden="true"></i>WhatsApp
          </a>
        </div>
      </div>
    </div>

    <nav class="pie" aria-label="Enlaces">
      <router-link to="/terminos">Términos</router-link>
      <router-link to="/privacidad">Privacidad</router-link>
      <router-link to="/devoluciones">Devoluciones</router-link>
      <router-link to="/login">Ingresar</router-link>
    </nav>
  </main>
</template>

<script setup>
import { computed } from 'vue'
import { useConfigStore } from '../stores/config'
import MarcaAlma from '../components/MarcaAlma.vue'
import FormNewsletter from '../components/FormNewsletter.vue'

const config = useConfigStore()

const linkInstagram = computed(() => config.valores.instagram_url || null)
const linkWhatsapp = computed(() => {
  const numero = config.valores.whatsapp_numero
  return numero ? `https://wa.me/${numero}` : null
})
</script>

<style scoped>
.proximamente {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 28px;
  padding: 40px 16px;
  background:
    radial-gradient(circle at 15% 20%, var(--rosa-polvo) 0, transparent 45%),
    radial-gradient(circle at 85% 80%, var(--lila-suave) 0, transparent 45%),
    var(--crema);
}
.tarjeta {
  width: 100%;
  max-width: 600px;
  text-align: center;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid var(--borde);
  border-radius: 28px;
  padding: 48px 32px 40px;
  box-shadow: var(--sombra-hover);
}
h1 {
  font-family: var(--fuente-titulos);
  font-size: clamp(1.8rem, 5vw, 2.4rem);
  font-weight: 600;
  color: var(--ciruela);
  margin: 6px 0 14px;
}
.bajada {
  color: var(--ciruela-suave);
  max-width: 460px;
  margin: 0 auto 26px;
}
.redes {
  margin-top: 30px;
  padding-top: 24px;
  border-top: 1px solid var(--borde);
}
.redes p {
  font-size: 0.9rem;
  color: var(--ciruela-suave);
  margin-bottom: 12px;
}
.pie {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px 20px;
  font-size: 0.85rem;
}
.pie a {
  color: var(--ciruela-suave);
  text-decoration: none;
}
.pie a:hover {
  color: var(--rosa-texto);
}

@media (max-width: 575px) {
  .tarjeta {
    padding: 36px 20px 30px;
  }
}
</style>
