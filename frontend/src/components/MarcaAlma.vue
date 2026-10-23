<template>
  <!-- Logo de la marca: siempre igual al del footer (Dancing Script, corazón rosa y subtítulo en Poppins) -->
  <span class="marca-alma" :class="`marca-${tamano}`">
    <span class="marca-nombre">Creaciones Alma <span class="marca-corazon" aria-hidden="true">♡</span></span>
    <span v-if="subtitulo" class="marca-sub">Papelería creativa</span>
  </span>
</template>

<script setup>
defineProps({
  // chico: navbar en celular · normal: navbar · grande: bloques destacados
  tamano: { type: String, default: 'normal' },
  subtitulo: { type: Boolean, default: true }
})
</script>

<style scoped>
.marca-alma {
  display: inline-flex;
  flex-direction: column;
  line-height: 1;
}
.marca-nombre {
  font-family: var(--fuente-marca);
  font-weight: 700;
  color: var(--bs-dark, #212529); /* mismo tono que el logo del footer (clase text-dark) */
  white-space: nowrap;
}
.marca-corazon {
  color: var(--rosa);
}
.marca-sub {
  font-family: 'Poppins', sans-serif;
  font-size: 0.62rem;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--rosa);
  font-weight: 600;
  margin-top: 2px;
}
.marca-normal .marca-nombre { font-size: 2rem; }
.marca-chico .marca-nombre { font-size: 1.6rem; }
.marca-chico .marca-sub { font-size: 0.52rem; letter-spacing: 1.5px; }
.marca-grande .marca-nombre { font-size: 2.6rem; }
</style>
