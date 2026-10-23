<template>
  <div class="container legal">
    <header class="legal-encabezado">
      <span class="eyebrow">Información legal</span>
      <h1>{{ titulo }}</h1>
      <p class="actualizado">Última actualización: {{ actualizado }}</p>
    </header>

    <div class="legal-cuerpo">
      <nav class="legal-indice" aria-label="Otras páginas legales">
        <router-link to="/terminos">Términos y condiciones</router-link>
        <router-link to="/privacidad">Política de privacidad</router-link>
        <router-link to="/devoluciones">Cambios y devoluciones</router-link>
        <router-link to="/arrepentimiento">Botón de arrepentimiento</router-link>
      </nav>

      <div class="legal-contenido">
        <article class="legal-card">
          <slot />
        </article>

        <div class="legal-card vendedor">
          <DatosVendedor />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import DatosVendedor from './DatosVendedor.vue'

defineProps({
  titulo: { type: String, required: true },
  actualizado: { type: String, default: '21 de octubre de 2026' }
})
</script>

<style scoped>
.legal {
  padding-top: 48px;
  padding-bottom: 80px;
}
.legal-encabezado {
  text-align: center;
  margin-bottom: 36px;
}
.legal-encabezado h1 {
  font-size: clamp(2rem, 4vw, 2.7rem);
  margin-bottom: 6px;
}
.actualizado {
  color: var(--ciruela-suave);
  font-size: 0.88rem;
}
.legal-cuerpo {
  display: grid;
  grid-template-columns: 230px minmax(0, 1fr);
  gap: 32px;
  max-width: 1060px;
  margin: 0 auto;
}
.legal-indice {
  position: sticky;
  top: 100px;
  align-self: start;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.legal-indice a {
  color: var(--ciruela-suave);
  text-decoration: none;
  padding: 9px 14px;
  border-radius: 12px;
  font-size: 0.92rem;
  transition: background-color 0.2s, color 0.2s;
}
.legal-indice a:hover {
  background: var(--lila-suave);
  color: var(--ciruela);
}
.legal-indice a.router-link-active {
  background: var(--rosa-polvo);
  color: var(--rosa-texto);
  font-weight: 500;
}
.legal-card {
  background: var(--blanco);
  border: 1px solid var(--borde);
  border-radius: var(--radio-grande);
  padding: 36px 40px;
  line-height: 1.75;
}
.legal-card.vendedor {
  margin-top: 20px;
  padding: 24px 28px;
  background: var(--lila-suave);
  border-color: var(--lila-suave);
}
.legal-card :deep(h2) {
  font-size: 1.25rem;
  margin-top: 2rem;
  margin-bottom: 0.75rem;
}
.legal-card :deep(h2:first-child) {
  margin-top: 0;
}
.legal-card :deep(p),
.legal-card :deep(li) {
  color: var(--ciruela-suave);
}
.legal-card :deep(strong) {
  color: var(--ciruela);
  font-weight: 500;
}
.legal-card :deep(a) {
  color: var(--rosa-texto);
}
@media (max-width: 991px) {
  .legal-cuerpo { grid-template-columns: 1fr; }
  .legal-indice {
    position: static;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
  }
}
@media (max-width: 575px) {
  .legal-card { padding: 26px 20px; }
}
</style>
