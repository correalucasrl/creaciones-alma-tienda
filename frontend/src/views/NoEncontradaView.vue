<template>
  <div class="container no-encontrada">
    <div class="polaroids" aria-hidden="true">
      <span class="polaroid p1"><span>4</span></span>
      <span class="polaroid p2"><span>0</span></span>
      <span class="polaroid p3"><span>4</span></span>
    </div>
    <h1>Esta página se perdió en el <em>álbum</em></h1>
    <p>Puede que el link esté mal escrito o que la página ya no exista.</p>
    <div class="d-flex gap-3 justify-content-center flex-wrap">
      <router-link to="/" class="btn btn-alma">Volver al inicio</router-link>
      <router-link to="/productos" class="btn btn-alma-borde">Ver productos</router-link>
    </div>
  </div>
</template>

<style scoped>
.no-encontrada {
  text-align: center;
  padding-top: 64px;
  padding-bottom: 96px;
}
.polaroids {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 36px;
}
.polaroid {
  width: 96px;
  background: var(--blanco);
  padding: 8px 8px 22px;
  border-radius: 4px;
  box-shadow: var(--sombra-hover);
}
.polaroid span {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  border-radius: 2px;
  font-family: var(--fuente-titulos);
  font-size: 2.8rem;
  color: var(--blanco);
}
.p1 { transform: rotate(-8deg); }
.p1 span { background: var(--rosa-viejo); }
.p2 { transform: translateY(-8px) rotate(3deg); }
.p2 span { background: var(--lila-fuerte); }
.p3 { transform: rotate(7deg); }
.p3 span { background: #f9a8d4; }
h1 {
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  margin-bottom: 10px;
}
h1 em {
  color: var(--rosa-viejo);
  font-style: italic;
}
p {
  color: var(--ciruela-suave);
  margin-bottom: 26px;
}
</style>
