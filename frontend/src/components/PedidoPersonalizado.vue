<template>
  <section class="personalizado">
    <div class="container">
      <div class="personalizado-caja">
        <div class="personalizado-texto">
          <span class="eyebrow text-start">A tu medida</span>
          <h2>¿Tenés una idea que no ves en la tienda?</h2>
          <p>
            Cumpleaños, aniversarios, recuerdos de viaje, souvenirs para eventos: contanos qué imaginás
            y lo diseñamos con vos. Respondemos por WhatsApp.
          </p>
          <a :href="linkWhatsapp" target="_blank" rel="noopener" class="btn btn-alma">
            <i class="bi bi-whatsapp me-2"></i>Contanos tu idea
          </a>
        </div>
        <ul class="personalizado-ideas" aria-label="Ideas de pedidos personalizados">
          <li><i class="bi bi-camera" aria-hidden="true"></i> Polaroids con tus fotos</li>
          <li><i class="bi bi-journal-bookmark" aria-hidden="true"></i> Álbumes para regalar</li>
          <li><i class="bi bi-emoji-heart-eyes" aria-hidden="true"></i> Stickers con tu diseño</li>
          <li><i class="bi bi-balloon-heart" aria-hidden="true"></i> Souvenirs para eventos</li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useConfigStore } from '../stores/config'

const config = useConfigStore()

const linkWhatsapp = computed(() => {
  const numero = config.valores.whatsapp_numero
  const texto = encodeURIComponent('¡Hola! Tengo una idea para un pedido personalizado 💗')
  return numero ? `https://wa.me/${numero}?text=${texto}` : '#footer-section'
})
</script>

<style scoped>
.personalizado {
  padding: 24px 0 88px;
}
.personalizado-caja {
  background: var(--lila-suave);
  border-radius: 32px;
  padding: 56px;
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
  gap: 40px;
  align-items: center;
  position: relative;
  overflow: hidden;
}
.personalizado-caja::after {
  content: '';
  position: absolute;
  right: -80px;
  top: -80px;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  background: var(--rosa-polvo-medio);
  opacity: 0.6;
}
.personalizado-texto {
  position: relative;
  z-index: 1;
}
.personalizado-texto h2 {
  font-size: clamp(1.7rem, 3vw, 2.4rem);
  margin-bottom: 14px;
}
.personalizado-texto p {
  color: var(--ciruela-suave);
  max-width: 480px;
  margin-bottom: 24px;
}
.personalizado-ideas {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 12px;
  position: relative;
  z-index: 1;
}
.personalizado-ideas li {
  background: var(--blanco);
  border-radius: 999px;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: var(--sombra-suave);
}
.personalizado-ideas i {
  color: var(--rosa-viejo);
  font-size: 1.15rem;
}
@media (max-width: 767px) {
  .personalizado-caja {
    grid-template-columns: 1fr;
    padding: 36px 24px;
  }
}
</style>
