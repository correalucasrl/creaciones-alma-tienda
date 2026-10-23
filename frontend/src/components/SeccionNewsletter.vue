<template>
  <section class="newsletter" aria-labelledby="newsletter-titulo">
    <div class="container">
      <div class="newsletter-caja">
        <div class="newsletter-texto">
          <span class="eyebrow text-start">Newsletter</span>
          <h2 id="newsletter-titulo">Sumate y llevate <em>{{ porcentaje }}% OFF</em> en tu primera compra</h2>
          <p>Novedades, lanzamientos y promos exclusivas. Pocos mails, todos lindos.</p>
        </div>
        <FormNewsletter origen="inicio" />
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useConfigStore } from '../stores/config'
import FormNewsletter from './FormNewsletter.vue'

const config = useConfigStore()
const porcentaje = computed(() => Number(config.valores.newsletter_descuento_pct) || 10)
</script>

<style scoped>
.newsletter {
  padding: 0 0 88px;
}
.newsletter-caja {
  background: var(--blanco);
  border: 1px solid var(--borde);
  border-radius: 32px;
  padding: 48px 56px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 32px;
  align-items: center;
  box-shadow: var(--sombra-suave);
  position: relative;
  overflow: hidden;
}
.newsletter-caja::before {
  content: '';
  position: absolute;
  left: -60px;
  bottom: -60px;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: var(--rosa-polvo);
}
.newsletter-texto {
  position: relative;
}
.newsletter-texto h2 {
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  margin-bottom: 10px;
}
.newsletter-texto em {
  color: var(--rosa-viejo);
  font-style: italic;
}
.newsletter-texto p {
  color: var(--ciruela-suave);
  margin: 0;
}
@media (max-width: 767px) {
  .newsletter-caja {
    grid-template-columns: 1fr;
    padding: 32px 22px;
  }
}
</style>
