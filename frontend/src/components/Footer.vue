<template>
  <footer id="footer-section" class="footer-section pt-5 pb-3">
    <div class="container">
      <div class="row g-4">
        <div class="col-12 col-md-3">
          <h3 class="font-script text-dark mb-0">Creaciones Alma <span class="text-pink">♡</span></h3>
          <p class="subtitulo mb-3">PAPELERÍA CREATIVA</p>
          <p class="text-secondary small">Ideas que se hacen recuerdos 💗</p>
          <div class="d-flex gap-2 mt-3">
            <a :href="config.valores.instagram_url || '#'" target="_blank" class="social-icon"><i class="bi bi-instagram"></i></a>
            <a :href="'https://wa.me/' + config.valores.whatsapp_numero" target="_blank" class="social-icon"><i class="bi bi-whatsapp"></i></a>
          </div>
        </div>

        <div class="col-6 col-md-3">
          <h6 class="fw-bold mb-3">Contacto</h6>
          <p class="small mb-2"><i class="bi bi-whatsapp me-2"></i>{{ config.valores.whatsapp_numero }}</p>
          <p class="small mb-2"><i class="bi bi-instagram me-2"></i>{{ config.valores.instagram_usuario }}</p>
          <p class="small mb-2"><i class="bi bi-envelope me-2"></i>{{ config.valores.email_contacto }}</p>
        </div>

        <div class="col-6 col-md-3">
          <h6 class="fw-bold mb-3">Envíos y retiros</h6>
          <p class="small mb-2"><i class="bi bi-truck me-2"></i>{{ config.valores.texto_envios }}</p>
          <p class="small mb-2"><i class="bi bi-geo-alt me-2"></i>{{ config.valores.texto_retiro }}</p>
        </div>

        <div class="col-12 col-md-3">
          <h6 class="fw-bold mb-3">Medios de pago</h6>
          <p class="small mb-2">Transferencia • Mercado Pago • Efectivo</p>
          <div class="d-flex gap-2 mt-2">
            <span class="badge-pago">Mercado Pago</span>
          </div>
        </div>
      </div>

      <hr class="my-4" />

      <div class="row g-3 align-items-center">
        <div class="col-12 col-lg-8">
          <nav class="legal-links small" aria-label="Información legal">
            <router-link to="/terminos">Términos y condiciones</router-link>
            <router-link to="/privacidad">Política de privacidad</router-link>
            <router-link to="/devoluciones">Cambios y devoluciones</router-link>
            <a href="https://www.argentina.gob.ar/economia/industria-y-comercio/defensadelconsumidor" target="_blank" rel="noopener">
              Defensa de las y los consumidores
            </a>
          </nav>
          <p class="small text-secondary mb-0 mt-2">
            {{ config.valores.legal_razon_social || 'Creaciones Alma' }}
            <template v-if="config.valores.legal_cuit"> · CUIT {{ config.valores.legal_cuit }}</template>
            <template v-if="config.valores.legal_domicilio"> · {{ config.valores.legal_domicilio }}</template>
          </p>
        </div>
        <!-- pe-lg-5: deja lugar a los botones flotantes de carrito y WhatsApp -->
        <div class="col-12 col-lg-4 d-flex gap-3 align-items-center justify-content-lg-end pe-lg-5">
          <router-link to="/arrepentimiento" class="btn-arrepentimiento">
            <i class="bi bi-arrow-counterclockwise me-1"></i>Botón de arrepentimiento
          </router-link>
          <a v-if="config.valores.data_fiscal_url" :href="config.valores.data_fiscal_url" target="_blank" rel="noopener">
            <img src="https://www.afip.gob.ar/images/f960/DATAWEB.jpg" alt="Data Fiscal" width="48" height="66" loading="lazy" />
          </a>
        </div>
      </div>

      <p class="text-center small text-secondary mb-0 mt-4">
        © {{ new Date().getFullYear() }} {{ config.valores.legal_razon_social || 'Creaciones Alma' }} | Todos los derechos reservados
      </p>
    </div>

    <a :href="'https://wa.me/' + config.valores.whatsapp_numero" target="_blank" class="whatsapp-float">
      <i class="bi bi-whatsapp"></i>
    </a>
  </footer>
</template>

<script setup>
import { useConfigStore } from '../stores/config'

const config = useConfigStore()
</script>

<style scoped>
.footer-section {
  background-color: var(--lila-claro);
  position: relative;
}
.subtitulo {
  font-size: 0.65rem;
  letter-spacing: 2px;
  color: var(--rosa);
  font-weight: 600;
}
.text-pink {
  color: var(--rosa);
}
.social-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: white;
  color: var(--texto-oscuro);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.2s;
}
.social-icon:hover {
  background: var(--rosa);
  color: white;
}
.badge-pago {
  background: white;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
}
.legal-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
}
.legal-links a {
  color: var(--texto-oscuro);
  text-decoration: none;
}
.legal-links a:hover {
  color: var(--rosa);
  text-decoration: underline;
}
.btn-arrepentimiento {
  background: white;
  border: 2px solid var(--rosa);
  color: var(--rosa);
  border-radius: 30px;
  padding: 8px 16px;
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
}
.btn-arrepentimiento:hover {
  background: var(--rosa);
  color: white;
}
.whatsapp-float {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 55px;
  height: 55px;
  background: #25d366;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.6rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  z-index: 1000;
}
</style>