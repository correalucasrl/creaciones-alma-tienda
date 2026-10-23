<template>
  <section class="beneficios" aria-label="Beneficios de comprar en Creaciones Alma">
    <div class="container">
      <ul class="beneficios-lista">
        <li v-for="b in beneficios" :key="b.titulo">
          <span class="beneficio-icono"><i :class="b.icono" aria-hidden="true"></i></span>
          <span>
            <strong>{{ b.titulo }}</strong>
            <small>{{ b.texto }}</small>
          </span>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useConfigStore } from '../stores/config'

const config = useConfigStore()

const beneficios = computed(() => {
  const v = config.valores
  const envioGratis = Number(v.envio_gratis_desde)
  const transferencia = Number(v.descuento_transferencia_pct)
  return [
    {
      icono: 'bi bi-truck',
      titulo: envioGratis > 0 ? `Envío gratis desde $${envioGratis.toLocaleString('es-AR')}` : 'Envíos a todo el país',
      texto: 'Por Correo Argentino, o retirás en Marcos Paz'
    },
    {
      icono: 'bi bi-bank',
      titulo: transferencia > 0 ? `${transferencia}% OFF con transferencia` : 'Pagás como prefieras',
      texto: 'Mercado Pago, transferencia o efectivo'
    },
    {
      icono: 'bi bi-brush',
      titulo: 'Hecho a mano',
      texto: 'Cada pieza se arma especialmente para vos'
    },
    {
      icono: 'bi bi-arrow-counterclockwise',
      titulo: 'Compra protegida',
      texto: 'Cambios y botón de arrepentimiento'
    }
  ]
})
</script>

<style scoped>
.beneficios {
  background: var(--blanco);
  border-top: 1px solid var(--borde);
  border-bottom: 1px solid var(--borde);
}
.beneficios-lista {
  list-style: none;
  margin: 0;
  padding: 22px 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}
.beneficios-lista li {
  display: flex;
  align-items: center;
  gap: 12px;
}
.beneficio-icono {
  flex: 0 0 auto;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--rosa-polvo);
  color: var(--rosa-texto);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
}
.beneficios-lista strong {
  display: block;
  font-weight: 500;
  font-size: 0.93rem;
  color: var(--ciruela);
}
.beneficios-lista small {
  color: var(--ciruela-suave);
  font-size: 0.8rem;
}
@media (max-width: 991px) {
  .beneficios-lista { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 480px) {
  .beneficios-lista { grid-template-columns: 1fr; }
}
</style>
