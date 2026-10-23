<template>
  <section id="como-comprar" class="como-comprar">
    <div class="container">
      <span class="eyebrow">Cómo comprar</span>
      <h2 class="section-title">Así de <em class="acento">fácil</em></h2>
      <p class="section-subtitle">Tres pasos y tu recuerdo está en camino.</p>

      <ol class="pasos">
        <li v-for="(paso, index) in pasos" :key="paso.titulo" class="paso">
          <span class="paso-numero">{{ String(index + 1).padStart(2, '0') }}</span>
          <span class="paso-icono"><i :class="paso.icono" aria-hidden="true"></i></span>
          <h3 class="paso-titulo">{{ paso.titulo }}</h3>
          <p class="paso-texto">{{ paso.descripcion }}</p>
        </li>
      </ol>
    </div>
  </section>
</template>

<script setup>
const pasos = [
  {
    titulo: 'Elegís',
    descripcion: 'Recorrés la tienda y sumás al carrito lo que más te guste.',
    icono: 'bi bi-bag-heart'
  },
  {
    titulo: 'Lo personalizamos',
    descripcion: 'Nos mandás tus fotos o tu idea y armamos tu pedido a mano.',
    icono: 'bi bi-brush'
  },
  {
    titulo: 'Lo recibís',
    descripcion: 'Te lo enviamos por Correo Argentino o lo retirás en Marcos Paz.',
    icono: 'bi bi-gift'
  }
]
</script>

<style scoped>
.como-comprar {
  padding: 88px 0;
  background: var(--blanco);
}
.acento {
  color: var(--rosa-viejo);
  font-style: italic;
}
.pasos {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  counter-reset: none;
}
.paso {
  position: relative;
  background: var(--crema);
  border-radius: var(--radio-grande);
  padding: 32px 28px;
  text-align: left;
}
.paso-numero {
  position: absolute;
  top: 22px;
  right: 26px;
  font-family: var(--fuente-titulos);
  font-size: 2.4rem;
  color: var(--rosa-polvo-medio);
  line-height: 1;
}
.paso-icono {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--blanco);
  color: var(--rosa-viejo);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-bottom: 20px;
  box-shadow: var(--sombra-suave);
}
.paso-titulo {
  font-size: 1.35rem;
  margin-bottom: 8px;
}
.paso-texto {
  color: var(--ciruela-suave);
  margin: 0;
}
@media (max-width: 767px) {
  .pasos { grid-template-columns: 1fr; }
  .como-comprar { padding: 64px 0; }
}
</style>
