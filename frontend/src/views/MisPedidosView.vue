<template>
  <div class="container pedidos">
    <header class="pedidos-encabezado">
      <span class="eyebrow">Tu cuenta</span>
      <h1>Mis <em>pedidos</em></h1>
    </header>

    <div v-if="cargando" class="lista">
      <div v-for="n in 3" :key="n" class="esqueleto"></div>
    </div>

    <div v-else-if="ordenes.length === 0" class="vacio">
      <i class="bi bi-bag-heart" aria-hidden="true"></i>
      <p class="vacio-titulo">Todavía no hiciste ningún pedido</p>
      <p class="text-secondary">Cuando compres algo, lo vas a poder seguir desde acá.</p>
      <router-link to="/productos" class="btn btn-alma">Ver productos</router-link>
    </div>

    <ul v-else class="lista">
      <li v-for="orden in ordenes" :key="orden.Id">
        <router-link :to="`/mis-pedidos/${orden.Id}`" class="pedido">
          <span class="pedido-icono" aria-hidden="true">
            <i :class="['bi', orden.TipoEntrega === 'Envio' ? 'bi-truck' : 'bi-shop']"></i>
          </span>
          <span class="pedido-datos">
            <span class="pedido-numero">Pedido #{{ orden.Id }}</span>
            <span class="pedido-meta">
              {{ fecha(orden.FechaCreacion) }} · {{ orden.TipoEntrega === 'Envio' ? 'Envío a domicilio' : 'Retiro en Marcos Paz' }}
            </span>
          </span>
          <span class="pedido-derecha">
            <EstadoPedido :estado="orden.Estado" />
            <span class="pedido-total">${{ Number(orden.Total).toLocaleString('es-AR') }}</span>
          </span>
          <i class="bi bi-chevron-right flecha" aria-hidden="true"></i>
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../services/api'
import EstadoPedido from '../components/EstadoPedido.vue'

const ordenes = ref([])
const cargando = ref(true)

const fecha = f => new Date(f).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })

onMounted(async () => {
  try {
    const { data } = await api.get('/ordenes/mis-ordenes')
    ordenes.value = data
  } catch (err) {
    console.error(err)
  } finally {
    cargando.value = false
  }
})
</script>

<style scoped>
.pedidos {
  padding-top: 48px;
  padding-bottom: 80px;
  max-width: 860px;
}
.pedidos-encabezado {
  margin-bottom: 28px;
}
.pedidos-encabezado .eyebrow {
  text-align: left;
}
.pedidos-encabezado h1 {
  font-size: clamp(2rem, 4vw, 2.6rem);
}
.pedidos-encabezado em {
  color: var(--rosa-viejo);
  font-style: italic;
}
.lista {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 12px;
}
.pedido {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--blanco);
  border: 1px solid var(--borde);
  border-radius: var(--radio-grande);
  padding: 18px 20px;
  text-decoration: none;
  color: var(--ciruela);
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
}
.pedido:hover {
  transform: translateY(-2px);
  box-shadow: var(--sombra-hover);
  border-color: var(--rosa-polvo-medio);
  color: var(--ciruela);
}
.pedido-icono {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: var(--lila-suave);
  color: var(--lila-fuerte);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex: 0 0 auto;
}
.pedido-datos {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.pedido-numero {
  font-weight: 500;
}
.pedido-meta {
  font-size: 0.85rem;
  color: var(--ciruela-suave);
}
.pedido-derecha {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}
.pedido-total {
  font-family: var(--fuente-titulos);
  font-size: 1.15rem;
}
.flecha {
  color: var(--ciruela-suave);
}
.esqueleto {
  height: 84px;
  border-radius: var(--radio-grande);
  background: linear-gradient(90deg, var(--lila-suave) 25%, var(--crema-oscura) 50%, var(--lila-suave) 75%);
  background-size: 200% 100%;
  animation: brillo 1.4s infinite;
}
@keyframes brillo { to { background-position: -200% 0; } }
.vacio {
  text-align: center;
  padding: 60px 0;
}
.vacio i {
  font-size: 3rem;
  color: var(--rosa-viejo);
}
.vacio-titulo {
  font-family: var(--fuente-titulos);
  font-size: 1.5rem;
  margin: 12px 0 6px;
}
@media (max-width: 575px) {
  .pedido { flex-wrap: wrap; }
  .pedido-derecha { flex-direction: row; align-items: center; width: 100%; justify-content: space-between; padding-left: 62px; }
  .flecha { display: none; }
}
</style>
