<template>
  <div class="container auth">
    <div class="auth-caja" :class="{ 'sin-panel': !panel }">
      <aside v-if="panel" class="auth-panel" aria-hidden="true">
        <MarcaAlma tamano="normal" />
        <p class="panel-frase">Recuerdos hechos a mano, pensados para vos.</p>
        <ul class="panel-lista">
          <li><i class="bi bi-bag-check"></i> Seguí el estado de tus pedidos</li>
          <li><i class="bi bi-lightning"></i> Comprá más rápido la próxima vez</li>
          <li><i class="bi bi-chat-heart"></i> Dejá tu opinión sobre lo que recibiste</li>
        </ul>
        <span class="panel-circulo uno"></span>
        <span class="panel-circulo dos"></span>
      </aside>

      <section class="auth-form">
        <span v-if="icono" class="auth-icono" aria-hidden="true"><i :class="['bi', icono]"></i></span>
        <h1 class="auth-titulo">{{ titulo }}</h1>
        <p v-if="subtitulo" class="auth-subtitulo">{{ subtitulo }}</p>
        <slot />
        <div v-if="$slots.pie" class="auth-pie">
          <slot name="pie" />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import MarcaAlma from './MarcaAlma.vue'

defineProps({
  titulo: { type: String, required: true },
  subtitulo: { type: String, default: '' },
  icono: { type: String, default: '' },
  // Panel lila de la izquierda (en login y registro); en pantallas de un solo paso no hace falta
  panel: { type: Boolean, default: true }
})
</script>

<style scoped>
.auth {
  padding-top: 48px;
  padding-bottom: 80px;
}
.auth-caja {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  max-width: 920px;
  margin: 0 auto;
  background: var(--blanco);
  border: 1px solid var(--borde);
  border-radius: 28px;
  overflow: hidden;
  box-shadow: var(--sombra-suave);
}
.auth-caja.sin-panel {
  grid-template-columns: 1fr;
  max-width: 480px;
  text-align: center;
}
.auth-panel {
  position: relative;
  background: var(--lila-suave);
  padding: 48px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
}
.panel-frase {
  font-family: var(--fuente-titulos);
  font-size: 1.6rem;
  line-height: 1.25;
  margin: 24px 0;
  position: relative;
}
.panel-lista {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 12px;
  position: relative;
}
.panel-lista li {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--ciruela-suave);
}
.panel-lista i {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--blanco);
  color: var(--rosa-viejo);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}
.panel-circulo {
  position: absolute;
  border-radius: 50%;
}
.panel-circulo.uno {
  width: 220px;
  height: 220px;
  right: -90px;
  top: -70px;
  background: var(--rosa-polvo);
}
.panel-circulo.dos {
  width: 120px;
  height: 120px;
  left: -40px;
  bottom: -40px;
  background: var(--rosa-polvo-medio);
  opacity: 0.6;
}
.auth-form {
  padding: 44px 40px;
}
.auth-icono {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--rosa-polvo);
  color: var(--rosa-viejo);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-bottom: 14px;
}
.auth-titulo {
  font-size: 2rem;
  margin-bottom: 6px;
}
.auth-subtitulo {
  color: var(--ciruela-suave);
  margin-bottom: 24px;
}
.auth-pie {
  margin-top: 24px;
  padding-top: 18px;
  border-top: 1px solid var(--borde);
  text-align: center;
  font-size: 0.92rem;
  color: var(--ciruela-suave);
}
.auth-form :deep(.form-label) {
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 4px;
}
.auth-form :deep(.campo-clave) {
  position: relative;
}
.auth-form :deep(.campo-clave .form-control) {
  padding-right: 46px;
}
.auth-form :deep(.ver-clave) {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: none;
  color: var(--ciruela-suave);
  width: 36px;
  height: 36px;
  border-radius: 50%;
}
.auth-form :deep(.ver-clave:hover) {
  background: var(--crema-oscura);
}
.auth-form :deep(a) {
  color: var(--rosa-texto);
}
@media (max-width: 767px) {
  .auth-caja { grid-template-columns: 1fr; }
  .auth-panel { display: none; }
  .auth-form { padding: 32px 22px; }
}
</style>
