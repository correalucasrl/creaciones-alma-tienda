<template>
  <div class="container checkout">
    <div class="checkout-encabezado">
      <h1>Finalizar <em>compra</em></h1>
      <p class="seguro"><i class="bi bi-lock"></i> Compra segura · Tus datos están protegidos</p>
    </div>

    <div v-if="cart.items.length === 0" class="vacio">
      <i class="bi bi-bag-heart" aria-hidden="true"></i>
      <p class="vacio-titulo">Tu carrito está vacío</p>
      <router-link to="/productos" class="btn btn-alma">Ver productos</router-link>
    </div>

    <div v-else class="row g-4 g-lg-5">
      <div class="col-12 col-lg-7">
        <!-- 1. Datos -->
        <section v-if="!auth.estaLogueado" class="paso-card">
          <h2 class="paso-titulo"><span class="paso-num">1</span> Tus datos</h2>
          <p class="paso-ayuda">
            Podés comprar sin crear una cuenta. ¿Ya tenés una?
            <router-link :to="{ path: '/login', query: { volver: '/checkout' } }">Iniciá sesión</router-link>
          </p>
          <div class="row g-3">
            <div class="col-12">
              <label class="form-label" for="co-nombre">Nombre y apellido</label>
              <input id="co-nombre" v-model="invitado.nombre" class="form-control" autocomplete="name" required />
            </div>
            <div class="col-12 col-md-7">
              <label class="form-label" for="co-email">Email</label>
              <input id="co-email" v-model="invitado.email" type="email" class="form-control" autocomplete="email" placeholder="nombre@email.com" required />
            </div>
            <div class="col-12 col-md-5">
              <label class="form-label" for="co-tel">Teléfono</label>
              <input id="co-tel" v-model="invitado.telefono" class="form-control" autocomplete="tel" placeholder="11 2345 6789" required />
            </div>
          </div>
        </section>
        <section v-else class="paso-card logueado">
          <i class="bi bi-person-check"></i>
          Comprás como <strong>{{ auth.usuario?.Nombre }}</strong> ({{ auth.usuario?.Email }})
        </section>

        <!-- 2. Entrega -->
        <section class="paso-card">
          <h2 class="paso-titulo"><span class="paso-num">{{ auth.estaLogueado ? 1 : 2 }}</span> Entrega</h2>
          <div class="opciones">
            <label class="opcion" :class="{ activa: tipoEntrega === 'Retiro' }">
              <input v-model="tipoEntrega" type="radio" value="Retiro" class="form-check-input" />
              <span class="opcion-texto">
                <strong>Retiro</strong>
                <small>{{ config.valores.texto_retiro || 'Retirás en zona oeste (Marcos Paz)' }}</small>
              </span>
              <span class="opcion-precio">Gratis</span>
            </label>
            <label class="opcion" :class="{ activa: tipoEntrega === 'Envio' }">
              <input v-model="tipoEntrega" type="radio" value="Envio" class="form-check-input" />
              <span class="opcion-texto">
                <strong>Envío a domicilio</strong>
                <small>{{ config.valores.texto_envios || 'Por Correo Argentino a todo el país' }}</small>
              </span>
              <span class="opcion-precio">{{ envioGratis ? 'Gratis' : (costoEnvio !== null ? '$' + formato(costoEnvio) : 'A calcular') }}</span>
            </label>
          </div>

          <div v-if="tipoEntrega === 'Envio'" class="direccion">
            <div class="row g-2">
              <div class="col-8">
                <label class="form-label" for="co-calle">Calle</label>
                <input id="co-calle" v-model="direccion.calle" class="form-control" autocomplete="address-line1" />
              </div>
              <div class="col-4">
                <label class="form-label" for="co-num">Número</label>
                <input id="co-num" v-model="direccion.numero" class="form-control" />
              </div>
              <div class="col-6">
                <label class="form-label" for="co-loc">Localidad</label>
                <input id="co-loc" v-model="direccion.localidad" class="form-control" autocomplete="address-level2" />
              </div>
              <div class="col-6">
                <label class="form-label" for="co-prov">Provincia</label>
                <input id="co-prov" v-model="direccion.provincia" class="form-control" autocomplete="address-level1" />
              </div>
              <div class="col-6">
                <label class="form-label" for="co-cp">Código postal</label>
                <input id="co-cp" v-model="direccion.codigoPostal" class="form-control" autocomplete="postal-code" inputmode="numeric" @blur="cotizarEnvio" />
              </div>
            </div>
            <p v-if="envioGratis" class="aviso ok mt-3 mb-0"><i class="bi bi-gift me-1"></i>Tu compra tiene envío gratis</p>
            <p v-else-if="cotizandoEnvio" class="aviso mt-3 mb-0">Calculando envío...</p>
            <p v-else-if="errorEnvio" class="aviso error mt-3 mb-0">{{ errorEnvio }}</p>
            <p v-else-if="costoEnvio !== null" class="aviso mt-3 mb-0">Envío a ese código postal: <strong>${{ formato(costoEnvio) }}</strong></p>
            <p v-if="!envioGratis && envioGratisDesde > 0" class="aviso mt-2 mb-0">
              Sumá ${{ formato(envioGratisDesde - baseProductos) }} más y el envío es gratis.
            </p>
          </div>
        </section>

        <!-- 3. Pago -->
        <section class="paso-card">
          <h2 class="paso-titulo"><span class="paso-num">{{ auth.estaLogueado ? 2 : 3 }}</span> Pago</h2>
          <div class="opciones">
            <label class="opcion" :class="{ activa: metodoPago === 'mercadopago' }">
              <input v-model="metodoPago" type="radio" value="mercadopago" class="form-check-input" />
              <span class="opcion-texto">
                <strong>Mercado Pago</strong>
                <small>Tarjeta de crédito, débito o dinero en cuenta</small>
              </span>
              <i class="bi bi-credit-card opcion-icono"></i>
            </label>
            <label class="opcion" :class="{ activa: metodoPago === 'transferencia' }">
              <input v-model="metodoPago" type="radio" value="transferencia" class="form-check-input" />
              <span class="opcion-texto">
                <strong>Transferencia bancaria</strong>
                <small>Confirmamos el pedido al recibir el pago</small>
              </span>
              <span v-if="pctTransferencia > 0" class="badge-alma badge-oferta">{{ pctTransferencia }}% OFF</span>
              <i v-else class="bi bi-bank opcion-icono"></i>
            </label>
          </div>
          <div v-if="metodoPago === 'transferencia'" class="datos-transferencia">
            <p class="mb-1">Al confirmar, transferí <strong>${{ formato(total) }}</strong> a:</p>
            <p class="mb-1">Alias: <strong>{{ config.valores.transferencia_alias || 'te lo pasamos por WhatsApp' }}</strong></p>
            <p v-if="config.valores.transferencia_titular" class="mb-0">Titular: {{ config.valores.transferencia_titular }}</p>
            <p class="mb-0 mt-2 small">También te mandamos estos datos por mail.</p>
          </div>
        </section>
      </div>

      <!-- Resumen -->
      <div class="col-12 col-lg-5">
        <aside class="resumen">
          <h2 class="resumen-titulo">Tu pedido</h2>

          <ul class="resumen-items">
            <li v-for="item in cart.items" :key="item.productoId">
              <span class="miniatura">
                <img :src="item.imagen || 'https://placehold.co/96x96/ede9fe/6d28d9?text=' + encodeURIComponent(item.nombre[0])" :alt="item.nombre" />
                <span class="cant">{{ item.cantidad }}</span>
              </span>
              <span class="nombre">{{ item.nombre }}</span>
              <span class="importe">
                ${{ formato(item.precio * item.cantidad) }}
                <small v-if="item.precioLista > item.precio" class="precio-tachado d-block">${{ formato(item.precioLista * item.cantidad) }}</small>
              </span>
            </li>
          </ul>

          <!-- Cupón -->
          <div class="cupon">
            <div v-if="cupon" class="cupon-aplicado">
              <span><i class="bi bi-ticket-perforated me-1"></i><strong>{{ cupon.codigo }}</strong> aplicado</span>
              <button type="button" class="quitar" @click="quitarCupon">Quitar</button>
            </div>
            <form v-else class="cupon-form" @submit.prevent="aplicarCupon()">
              <label class="visually-hidden" for="co-cupon">Código de descuento</label>
              <input id="co-cupon" v-model="codigoCupon" class="form-control" placeholder="Código de descuento" autocomplete="off" />
              <button type="submit" class="btn btn-alma-borde" :disabled="validandoCupon || !codigoCupon.trim()">
                {{ validandoCupon ? '...' : 'Aplicar' }}
              </button>
            </form>
            <p v-if="errorCupon" class="aviso error mt-2 mb-0">{{ errorCupon }}</p>
          </div>

          <dl class="totales">
            <div><dt>Subtotal</dt><dd>${{ formato(cart.total) }}</dd></div>
            <div v-if="cart.ahorroOfertas > 0" class="ahorro"><dt>Ahorrás con ofertas</dt><dd>incluido</dd></div>
            <div v-if="cupon" class="ahorro"><dt>Cupón {{ cupon.codigo }}</dt><dd>−${{ formato(descuentoCupon) }}</dd></div>
            <div v-if="descuentoTransferencia > 0" class="ahorro"><dt>Descuento transferencia</dt><dd>−${{ formato(descuentoTransferencia) }}</dd></div>
            <div v-if="tipoEntrega === 'Envio'">
              <dt>Envío</dt>
              <dd>{{ envioGratis ? 'Gratis' : (costoEnvio !== null ? '$' + formato(costoEnvio) : 'A calcular') }}</dd>
            </div>
            <div class="total"><dt>Total</dt><dd>${{ formato(total) }}</dd></div>
          </dl>

          <div class="form-check terminos">
            <input id="checkout-terminos" v-model="aceptaTerminos" class="form-check-input" type="checkbox" />
            <label class="form-check-label" for="checkout-terminos">
              Leí y acepto los <router-link to="/terminos" target="_blank">términos y condiciones</router-link>,
              la <router-link to="/devoluciones" target="_blank">política de devoluciones</router-link>
              y la <router-link to="/privacidad" target="_blank">política de privacidad</router-link>
            </label>
          </div>

          <div v-if="error" class="alert alert-danger py-2 small mt-3 mb-0">
            {{ error }}
            <div v-if="emailRegistrado" class="mt-2">
              <router-link :to="{ path: '/login', query: { volver: '/checkout' } }" class="fw-semibold">Iniciar sesión</router-link>
              · <router-link to="/olvide-password">Olvidé mi contraseña</router-link>
              <p class="mb-0 mt-1 text-secondary">
                Si compraste antes como invitado, usá "Olvidé mi contraseña" para crear una. Tu carrito queda guardado.
              </p>
            </div>
          </div>

          <button class="btn btn-alma w-100 mt-3 btn-pagar" :disabled="!!cargando || bloqueado" @click="confirmar">
            <template v-if="cargando">Procesando...</template>
            <template v-else-if="metodoPago === 'mercadopago'"><i class="bi bi-lock me-1"></i>Pagar ${{ formato(total) }} con Mercado Pago</template>
            <template v-else>Confirmar pedido por ${{ formato(total) }}</template>
          </button>
          <p v-if="bloqueado" class="aviso mt-2 mb-0 text-center">Completá el código postal para calcular el envío.</p>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart'
import { useAuthStore } from '../stores/auth'
import { useConfigStore } from '../stores/config'
import api from '../services/api'
import { registrarInicioCheckout, anotarCompra } from '../analitica'

const cart = useCartStore()
const auth = useAuthStore()
const config = useConfigStore()
const router = useRouter()

const tipoEntrega = ref('Retiro')
const metodoPago = ref('mercadopago')
const direccion = ref({ calle: '', numero: '', localidad: '', provincia: '', codigoPostal: '' })
const invitado = ref({ nombre: '', email: '', telefono: '' })
const error = ref('')
const emailRegistrado = ref(false)
const aceptaTerminos = ref(false)
const cargando = ref(false)

const costoEnvio = ref(null)
const cotizandoEnvio = ref(false)
const errorEnvio = ref('')

const codigoCupon = ref('')
const cupon = ref(null)
const errorCupon = ref('')
const validandoCupon = ref(false)

const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const regexTelefono = /^[0-9+\-\s()]{8,20}$/

const redondear = n => Math.round(n * 100) / 100
const formato = n => Number(n).toLocaleString('es-AR', { maximumFractionDigits: 2 })

// Mismo cálculo que hace el servidor (el total final siempre lo calcula el servidor)
const envioGratisDesde = computed(() => Number(config.valores.envio_gratis_desde) || 0)
const pctTransferencia = computed(() => Number(config.valores.descuento_transferencia_pct) || 0)
const descuentoCupon = computed(() => cupon.value?.descuento || 0)
const baseProductos = computed(() => redondear(cart.total - descuentoCupon.value))
const envioGratis = computed(() => tipoEntrega.value === 'Envio' && envioGratisDesde.value > 0 && baseProductos.value >= envioGratisDesde.value)
const costoEnvioFinal = computed(() => tipoEntrega.value !== 'Envio' || envioGratis.value ? 0 : (costoEnvio.value || 0))
const descuentoTransferencia = computed(() =>
  metodoPago.value === 'transferencia' && pctTransferencia.value > 0 ? redondear(baseProductos.value * pctTransferencia.value / 100) : 0
)
const total = computed(() => redondear(baseProductos.value - descuentoTransferencia.value + costoEnvioFinal.value))

// Con envío pago, no se puede confirmar hasta tener una cotización válida
const bloqueado = computed(() => tipoEntrega.value === 'Envio' && !envioGratis.value && (costoEnvio.value === null || cotizandoEnvio.value))

// Precios al día: una oferta pudo empezar o terminar desde que se armó el carrito
onMounted(async () => {
  if (cart.items.length) registrarInicioCheckout(cart.items, cart.total)
  try {
    const { data } = await api.get('/productos')
    cart.actualizarDesdeCatalogo(data)
  } catch (err) {
    console.error('No se pudieron actualizar los precios del carrito:', err)
  }
})

async function cotizarEnvio() {
  costoEnvio.value = null
  errorEnvio.value = ''
  if (envioGratis.value) return
  if (!direccion.value.codigoPostal || direccion.value.codigoPostal.trim().length < 4) return

  cotizandoEnvio.value = true
  try {
    const { data } = await api.get('/envio/cotizar', { params: { codigoPostal: direccion.value.codigoPostal } })
    costoEnvio.value = data.costo
  } catch (err) {
    errorEnvio.value = err.response?.data?.error || 'No pudimos calcular el envío a ese código postal'
  } finally {
    cotizandoEnvio.value = false
  }
}

// Si deja de alcanzar el envío gratis (por ejemplo, al quitar un cupón), se cotiza
watch(envioGratis, gratis => {
  if (!gratis && tipoEntrega.value === 'Envio' && costoEnvio.value === null) cotizarEnvio()
})

async function aplicarCupon(codigo = codigoCupon.value) {
  errorCupon.value = ''
  validandoCupon.value = true
  try {
    const { data } = await api.post('/cupones/validar', { codigo, subtotal: cart.total })
    cupon.value = data
    codigoCupon.value = ''
  } catch (err) {
    cupon.value = null
    errorCupon.value = err.response?.data?.error || 'No pudimos validar el cupón'
  } finally {
    validandoCupon.value = false
  }
}

function quitarCupon() {
  cupon.value = null
  errorCupon.value = ''
}

// Si cambia el carrito con un cupón aplicado, se recalcula (puede dejar de cumplir el mínimo)
watch(() => cart.total, () => {
  if (cupon.value) aplicarCupon(cupon.value.codigo)
})

function validarAntesDeConfirmar() {
  if (!aceptaTerminos.value) {
    error.value = 'Tenés que aceptar los términos y condiciones para continuar'
    return false
  }
  if (auth.estaLogueado) return true
  if (!invitado.value.nombre || !invitado.value.email || !invitado.value.telefono) {
    error.value = 'Completá tu nombre, email y teléfono para continuar'
    return false
  }
  if (!regexEmail.test(invitado.value.email)) {
    error.value = 'Ingresá un email válido'
    return false
  }
  if (!regexTelefono.test(invitado.value.telefono)) {
    error.value = 'Ingresá un teléfono válido (solo números, al menos 8 dígitos)'
    return false
  }
  return true
}

async function confirmar() {
  error.value = ''
  emailRegistrado.value = false
  if (!validarAntesDeConfirmar()) return

  cargando.value = true
  try {
    const { data } = await api.post('/ordenes/checkout', {
      items: cart.items.map(i => ({ productoId: i.productoId, cantidad: i.cantidad })),
      tipoEntrega: tipoEntrega.value,
      direccion: tipoEntrega.value === 'Envio' ? direccion.value : null,
      invitado: auth.estaLogueado ? null : invitado.value,
      metodoPago: metodoPago.value,
      aceptaTerminos: aceptaTerminos.value,
      codigoCupon: cupon.value?.codigo || null
    })
    anotarCompra(data.ordenId, data.total, cart.items)
    cart.vaciar()
    if (metodoPago.value === 'mercadopago') {
      window.location.href = data.initPoint
    } else {
      router.push(`/orden-confirmada/${data.ordenId}?metodo=transferencia`)
    }
  } catch (err) {
    const datos = err.response?.data
    emailRegistrado.value = datos?.codigo === 'EMAIL_REGISTRADO'
    if (datos?.codigo === 'CUPON_INVALIDO') {
      cupon.value = null
      errorCupon.value = datos.error
    }
    error.value = datos?.error || 'No pudimos procesar tu pedido'
  } finally {
    cargando.value = false
  }
}
</script>

<style scoped>
.checkout {
  padding-top: 48px;
  padding-bottom: 80px;
}
.checkout-encabezado {
  margin-bottom: 32px;
}
.checkout-encabezado h1 {
  font-size: clamp(2rem, 4vw, 2.8rem);
  margin-bottom: 6px;
}
.checkout-encabezado em {
  color: var(--rosa-viejo);
  font-style: italic;
}
.seguro {
  color: var(--ciruela-suave);
  font-size: 0.9rem;
  margin: 0;
}
.seguro i { color: var(--salvia-texto); }
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
  margin: 12px 0 20px;
}
.paso-card {
  background: var(--blanco);
  border: 1px solid var(--borde);
  border-radius: var(--radio-grande);
  padding: 28px;
  margin-bottom: 20px;
}
.paso-card.logueado {
  padding: 18px 24px;
  color: var(--ciruela-suave);
}
.paso-card.logueado i {
  color: var(--salvia-texto);
  margin-right: 6px;
}
.paso-titulo {
  font-size: 1.35rem;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.paso-num {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--lila-fuerte);
  color: var(--crema);
  font-family: var(--fuente-texto);
  font-size: 0.85rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.paso-ayuda {
  color: var(--ciruela-suave);
  font-size: 0.9rem;
  margin-top: -6px;
}
.form-label {
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 4px;
}
.opciones {
  display: grid;
  gap: 10px;
}
.opcion {
  display: flex;
  align-items: center;
  gap: 14px;
  border: 1px solid var(--rosa-polvo-medio);
  border-radius: 16px;
  padding: 16px 18px;
  cursor: pointer;
  transition: border-color 0.2s, background-color 0.2s;
  margin: 0;
}
.opcion:hover { border-color: var(--rosa-viejo); }
.opcion.activa {
  border-color: var(--rosa-viejo);
  background: var(--rosa-polvo);
}
.opcion .form-check-input { margin: 0; flex: 0 0 auto; }
.opcion-texto {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.opcion-texto strong { font-weight: 500; }
.opcion-texto small { color: var(--ciruela-suave); }
.opcion-precio { font-weight: 500; white-space: nowrap; }
.opcion-icono { font-size: 1.3rem; color: var(--rosa-viejo); }
.direccion {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px dashed var(--rosa-polvo-medio);
}
.aviso {
  font-size: 0.88rem;
  color: var(--ciruela-suave);
}
.aviso.ok { color: var(--salvia-texto); font-weight: 500; }
.aviso.error { color: var(--oferta); }
.datos-transferencia {
  margin-top: 14px;
  background: var(--crema);
  border-radius: 14px;
  padding: 16px 18px;
  font-size: 0.93rem;
}
.resumen {
  position: sticky;
  top: 96px;
  background: var(--blanco);
  border: 1px solid var(--borde);
  border-radius: var(--radio-grande);
  padding: 28px;
  box-shadow: var(--sombra-suave);
}
.resumen-titulo {
  font-size: 1.4rem;
  margin-bottom: 16px;
}
.resumen-items {
  list-style: none;
  padding: 0;
  margin: 0 0 18px;
  display: grid;
  gap: 14px;
}
.resumen-items li {
  display: flex;
  align-items: center;
  gap: 12px;
}
.miniatura {
  position: relative;
  flex: 0 0 auto;
}
.miniatura img {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  object-fit: cover;
  background: var(--rosa-polvo);
}
.cant {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 20px;
  height: 20px;
  border-radius: 999px;
  background: var(--lila-fuerte);
  color: var(--crema);
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
}
.resumen-items .nombre {
  flex: 1;
  font-size: 0.93rem;
}
.importe {
  text-align: right;
  font-weight: 500;
  white-space: nowrap;
}
.cupon {
  border-top: 1px solid var(--borde);
  border-bottom: 1px solid var(--borde);
  padding: 16px 0;
  margin-bottom: 14px;
}
.cupon-form {
  display: flex;
  gap: 8px;
}
.cupon-form .form-control {
  text-transform: uppercase;
}
.cupon-form .btn-alma-borde {
  padding: 8px 18px;
  white-space: nowrap;
}
.cupon-aplicado {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--salvia);
  color: var(--salvia-texto);
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 0.92rem;
}
.cupon-aplicado .quitar {
  border: none;
  background: none;
  color: var(--salvia-texto);
  text-decoration: underline;
  font-size: 0.85rem;
}
.totales {
  margin: 0;
}
.totales div {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}
.totales dt { font-weight: 400; color: var(--ciruela-suave); }
.totales dd { margin: 0; }
.totales .ahorro dt, .totales .ahorro dd { color: var(--salvia-texto); }
.totales .total {
  border-top: 1px solid var(--borde);
  padding-top: 12px;
  margin-top: 6px;
  font-family: var(--fuente-titulos);
  font-size: 1.45rem;
}
.totales .total dt { color: var(--ciruela); }
.terminos {
  margin-top: 16px;
  font-size: 0.85rem;
  color: var(--ciruela-suave);
}
.btn-pagar {
  padding: 15px;
  font-size: 1rem;
}
@media (max-width: 991px) {
  .resumen { position: static; }
}
</style>
