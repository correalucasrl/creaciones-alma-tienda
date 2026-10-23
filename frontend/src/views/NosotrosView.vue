<template>
  <div>
    <section class="container nosotros-hero">
      <div class="row align-items-center g-4 g-lg-5">
        <div class="col-12 col-lg-6">
          <span class="eyebrow text-start">Nosotros</span>
          <h1>Nuestra <em>historia</em></h1>
          <p>
            Creaciones Alma nació de las ganas de convertir momentos simples en recuerdos que se puedan tocar,
            guardar y regalar. Cada cuaderno, cada foto y cada sticker que armamos está pensado a mano,
            con dedicación, para que tenga un pedacito de la historia de quien lo recibe.
          </p>
          <p>
            Empezamos como un proyecto chico entre amigas y hoy seguimos con la misma idea de siempre:
            la papelería creativa como una forma de decir "te quiero", "te extraño" o "gracias" de una
            manera que dura en el tiempo.
          </p>
          <p class="firma">Gracias por elegirnos en cada pedido: para nosotras, cada uno es especial.</p>
        </div>

        <div class="col-12 col-lg-6">
          <figure class="polaroid">
            <img
              :src="imagen"
              alt="El equipo de Creaciones Alma"
              loading="lazy"
            />
            <figcaption>Hecho con amor en Marcos Paz ♡</figcaption>
          </figure>
        </div>
      </div>
    </section>

    <section class="valores">
      <div class="container">
        <ul class="valores-lista">
          <li>
            <span class="valor-icono"><i class="bi bi-brush" aria-hidden="true"></i></span>
            <h2>Hecho a mano</h2>
            <p>Cada pieza se arma una por una, cuidando los detalles.</p>
          </li>
          <li>
            <span class="valor-icono"><i class="bi bi-stars" aria-hidden="true"></i></span>
            <h2>Único como vos</h2>
            <p>Tus fotos, tus nombres y tus colores: nada sale igual a otro.</p>
          </li>
          <li>
            <span class="valor-icono"><i class="bi bi-chat-heart" aria-hidden="true"></i></span>
            <h2>Cerca tuyo</h2>
            <p>Te acompañamos por WhatsApp desde la idea hasta la entrega.</p>
          </li>
        </ul>
      </div>
    </section>

    <section class="container cierre">
      <h2>¿Armamos algo <em>juntas</em>?</h2>
      <p>Mirá la tienda o escribinos con tu idea.</p>
      <div class="d-flex gap-3 justify-content-center flex-wrap">
        <router-link to="/productos" class="btn btn-alma">Ver la tienda</router-link>
        <a v-if="linkWhatsapp" :href="linkWhatsapp" target="_blank" rel="noopener" class="btn btn-alma-borde">
          <i class="bi bi-whatsapp me-1"></i> Escribinos
        </a>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useConfigStore } from '../stores/config'

const config = useConfigStore()

// Hasta que haya una foto propia del equipo, se usa una del banner del inicio
const imagen = computed(() =>
  config.valores.hero_imagen_1 || 'https://placehold.co/600x700/ede9fe/6d28d9?text=Creaciones+Alma'
)

const linkWhatsapp = computed(() => {
  const numero = config.valores.whatsapp_numero
  return numero ? `https://wa.me/${numero}?text=${encodeURIComponent('¡Hola! Tengo una idea para un pedido 💗')}` : null
})
</script>

<style scoped>
.nosotros-hero {
  padding-top: 56px;
  padding-bottom: 64px;
}
.nosotros-hero h1 {
  font-size: clamp(2.2rem, 5vw, 3.2rem);
  margin-bottom: 20px;
}
.nosotros-hero h1 em,
.cierre em {
  color: var(--rosa-viejo);
  font-style: italic;
}
.nosotros-hero p {
  font-size: 1.08rem;
  line-height: 1.75;
  color: var(--ciruela-suave);
}
.nosotros-hero .firma {
  font-family: var(--fuente-marca);
  font-size: 1.6rem;
  line-height: 1.3;
  color: var(--rosa-texto);
  margin-top: 20px;
}
.polaroid {
  max-width: 420px;
  margin: 0 auto;
  background: var(--blanco);
  padding: 14px 14px 18px;
  border-radius: 6px;
  box-shadow: var(--sombra-hover);
  transform: rotate(2.5deg);
}
.polaroid img {
  width: 100%;
  aspect-ratio: 6 / 7;
  object-fit: cover;
  border-radius: 3px;
  background: var(--lila-suave);
}
.polaroid figcaption {
  font-family: var(--fuente-marca);
  font-size: 1.35rem;
  text-align: center;
  margin-top: 12px;
  color: var(--ciruela);
}
.valores {
  background: var(--blanco);
  border-top: 1px solid var(--borde);
  border-bottom: 1px solid var(--borde);
  padding: 56px 0;
}
.valores-lista {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  text-align: center;
}
.valor-icono {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--lila-suave);
  color: var(--lila-fuerte);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-bottom: 14px;
}
.valores h2 {
  font-size: 1.3rem;
  margin-bottom: 6px;
}
.valores p {
  color: var(--ciruela-suave);
  margin: 0;
}
.cierre {
  text-align: center;
  padding-top: 64px;
  padding-bottom: 88px;
}
.cierre h2 {
  font-size: clamp(1.8rem, 3.5vw, 2.4rem);
}
.cierre p {
  color: var(--ciruela-suave);
  margin-bottom: 22px;
}
@media (max-width: 767px) {
  .valores-lista { grid-template-columns: 1fr; }
  .polaroid { transform: none; }
}
</style>
