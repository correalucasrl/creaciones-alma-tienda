<template>
  <div>
    <header class="container regalos-encabezado">
      <span class="eyebrow">Regalos</span>
      <h1>Regalá algo <em>único</em></h1>
      <p class="section-subtitle mb-0">
        Elegí la ocasión y te mostramos las ideas que mejor quedan. ¿Buscás otra cosa? Lo armamos a medida.
      </p>
    </header>

    <SeccionOcasiones todas :con-encabezado="false" />

    <PedidoPersonalizado />
  </div>
</template>

<script setup>
import SeccionOcasiones from '../components/SeccionOcasiones.vue'
import PedidoPersonalizado from '../components/PedidoPersonalizado.vue'
</script>

<style scoped>
.regalos-encabezado {
  text-align: center;
  padding-top: 56px;
  padding-bottom: 36px;
}
.regalos-encabezado h1 {
  font-size: clamp(2.2rem, 5vw, 3.2rem);
  margin-bottom: 0.6rem;
}
.regalos-encabezado em {
  color: var(--rosa-viejo);
  font-style: italic;
}
</style>
