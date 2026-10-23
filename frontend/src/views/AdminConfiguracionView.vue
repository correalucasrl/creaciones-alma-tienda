<template>
  <div class="admin-pagina">
    <header class="admin-encabezado">
      <div>
        <h1 class="admin-titulo">Configuración</h1>
        <p class="admin-descripcion">Datos de contacto y textos que se muestran en la tienda.</p>
      </div>
    </header>

    <div class="row">
      <div class="col-12 col-lg-8">
        <section class="config-card estado-tienda p-4 mb-4" :class="{ abierta: config.sitioAbierto }" aria-labelledby="estado-tienda-titulo">
          <div class="d-flex align-items-start justify-content-between flex-wrap gap-3">
            <div>
              <h6 id="estado-tienda-titulo" class="fw-bold mb-1">Estado de la tienda</h6>
              <span class="badge-estado" :class="config.sitioAbierto ? 'estado-activo' : 'estado-pendiente'">
                {{ config.sitioAbierto ? 'Abierta al público' : 'Cerrada: modo próximamente' }}
              </span>
              <p class="small text-secondary mt-2 mb-0">
                <template v-if="config.sitioAbierto">Cualquiera puede ver la tienda, registrarse y comprar.</template>
                <template v-else>
                  El público ve una página de "Próximamente" donde puede dejar su email. Solo los administradores
                  ven la tienda y pueden probar compras. Google no la indexa hasta que la abras.
                </template>
              </p>
            </div>
            <button
              type="button"
              class="btn"
              :class="config.sitioAbierto ? 'btn-alma-borde' : 'btn-alma'"
              :disabled="cambiandoEstado"
              @click="cambiarEstadoTienda"
            >
              {{ config.sitioAbierto ? 'Cerrar la tienda' : 'Abrir la tienda al público' }}
            </button>
          </div>
        </section>

        <div v-if="guardado" class="alert alert-success py-2 small">Cambios guardados ✅</div>
        <div v-if="error" class="alert alert-danger py-2 small">{{ error }}</div>

        <form @submit.prevent="guardar">
          <div class="config-card p-4 mb-4">
            <h6 class="fw-bold mb-3">Contacto</h6>

            <label class="form-label small fw-semibold">WhatsApp (con código de país, sin espacios ni +)</label>
            <input v-model="form.whatsapp_numero" class="form-control mb-3" placeholder="5491112345678" />

            <label class="form-label small fw-semibold">Usuario de Instagram (como se muestra)</label>
            <input v-model="form.instagram_usuario" class="form-control mb-3" placeholder="@creacionesalma23_" />

            <label class="form-label small fw-semibold">Link de Instagram</label>
            <input v-model="form.instagram_url" class="form-control mb-3" placeholder="https://instagram.com/..." />

            <label class="form-label small fw-semibold">Email de contacto</label>
            <input v-model="form.email_contacto" class="form-control mb-3" placeholder="hola@creaciones.com.ar" />

            <label class="form-label small fw-semibold">Email donde recibís las notificaciones de pedidos</label>
            <input v-model="form.admin_email" class="form-control" placeholder="tu-mail@gmail.com" />
          </div>

<div class="config-card p-4 mb-4">
  <h6 class="fw-bold mb-3">Envíos y retiros</h6>

  <label class="form-label small fw-semibold">Texto de envíos</label>
  <input v-model="form.texto_envios" class="form-control mb-3" />

  <label class="form-label small fw-semibold">Texto de retiro</label>
  <input v-model="form.texto_retiro" class="form-control" />
</div>

<div class="config-card p-4 mb-4">
  <h6 class="fw-bold mb-3">Correo Argentino (cotización real)</h6>

  <label class="form-label small fw-semibold">Customer ID de MiCorreo</label>
  <input v-model="form.correo_customer_id" class="form-control mb-3" placeholder="0090000024" />

  <label class="form-label small fw-semibold">Código postal de origen (desde donde despachás)</label>
  <input v-model="form.correo_cp_origen" class="form-control mb-3" placeholder="1704" />

  <label class="form-label small fw-semibold d-block mb-2">Paquete tipo (usado para cotizar todos los envíos)</label>
  <div class="row g-2">
    <div class="col-3">
      <input v-model="form.paquete_peso_gramos" class="form-control form-control-sm" placeholder="Gramos" />
    </div>
    <div class="col-3">
      <input v-model="form.paquete_alto_cm" class="form-control form-control-sm" placeholder="Alto cm" />
    </div>
    <div class="col-3">
      <input v-model="form.paquete_ancho_cm" class="form-control form-control-sm" placeholder="Ancho cm" />
    </div>
    <div class="col-3">
      <input v-model="form.paquete_largo_cm" class="form-control form-control-sm" placeholder="Largo cm" />
    </div>
  </div>
</div>

<div class="config-card p-4 mb-4">
  <h6 class="fw-bold mb-3">Transferencia bancaria</h6>

  <label class="form-label small fw-semibold">Alias</label>
  <input v-model="form.transferencia_alias" class="form-control mb-3" placeholder="creaciones.alma.mp" />

  <label class="form-label small fw-semibold">Titular de la cuenta</label>
  <input v-model="form.transferencia_titular" class="form-control" placeholder="Nombre Apellido" />
</div>

<div class="config-card p-4 mb-4">
  <h6 class="fw-bold mb-3">Banner principal (inicio)</h6>

  <label class="form-label small fw-semibold">Subtítulo</label>
  <textarea v-model="form.hero_subtitulo" class="form-control mb-3" rows="2"></textarea>

  <label class="form-label small fw-semibold d-block mb-2">Fotos del banner (carrusel automático, hasta 3)</label>
  <div class="row g-3">
    <div class="col-4">
      <SubidaImagen v-model="form.hero_imagen_1" label="Foto 1" />
    </div>
    <div class="col-4">
      <SubidaImagen v-model="form.hero_imagen_2" label="Foto 2" />
    </div>
    <div class="col-4">
      <SubidaImagen v-model="form.hero_imagen_3" label="Foto 3" />
    </div>
  </div>
</div>

<div class="config-card p-4 mb-4">
  <h6 class="fw-bold mb-1">Promociones</h6>
  <p class="small text-secondary mb-3">
    Se muestran en la barra de arriba del sitio, en el carrito y en cada producto. Dejá vacío lo que no quieras usar.
  </p>

  <label class="form-label small fw-semibold">Mensaje de la barra de anuncios (opcional)</label>
  <input v-model="form.anuncio_barra" class="form-control mb-3" maxlength="120" placeholder="Nueva colección de stickers 💗" />

  <div class="row g-3">
    <div class="col-6">
      <label class="form-label small fw-semibold">Envío gratis desde ($)</label>
      <input v-model="form.envio_gratis_desde" type="number" min="0" step="1" class="form-control" placeholder="Sin envío gratis" />
    </div>
    <div class="col-6">
      <label class="form-label small fw-semibold">Descuento por transferencia (%)</label>
      <input v-model="form.descuento_transferencia_pct" type="number" min="0" max="50" step="1" class="form-control" placeholder="Sin descuento" />
    </div>
    <div class="col-6">
      <label class="form-label small fw-semibold">Cupón de bienvenida del newsletter (%)</label>
      <input v-model="form.newsletter_descuento_pct" type="number" min="1" max="50" step="1" class="form-control" placeholder="10" />
    </div>
    <div class="col-6">
      <label class="form-label small fw-semibold">Días de validez del cupón de bienvenida</label>
      <input v-model="form.newsletter_cupon_dias" type="number" min="1" max="365" step="1" class="form-control" placeholder="30" />
    </div>
  </div>
  <p class="small text-secondary mt-2 mb-0">
    El descuento por transferencia se aplica sobre los productos (no sobre el envío). Los cupones se crean en
    <router-link to="/admin/cupones">Cupones</router-link> y las ofertas de cada producto en
    <router-link to="/admin/productos">Productos</router-link>.
  </p>
</div>

<div class="config-card p-4 mb-4">
  <h6 class="fw-bold mb-1">Datos legales del vendedor</h6>
  <p class="small text-secondary mb-3">
    Se muestran en el footer y en las páginas legales. La ley de Defensa del Consumidor exige informar quién vende.
  </p>

  <label class="form-label small fw-semibold">Nombre o razón social (como figura en ARCA/AFIP)</label>
  <input v-model="form.legal_razon_social" class="form-control mb-3" placeholder="Nombre Apellido" />

  <label class="form-label small fw-semibold">Nombre de la tienda</label>
  <input v-model="form.legal_nombre_fantasia" class="form-control mb-3" placeholder="Creaciones Alma" />

  <label class="form-label small fw-semibold">CUIT / CUIL</label>
  <input v-model="form.legal_cuit" class="form-control mb-3" placeholder="20-12345678-9" />

  <label class="form-label small fw-semibold">Domicilio</label>
  <input v-model="form.legal_domicilio" class="form-control mb-3" placeholder="Calle 123, Marcos Paz, Buenos Aires" />

  <label class="form-label small fw-semibold">Link del QR de Data Fiscal (ARCA/AFIP, formulario 960)</label>
  <input v-model="form.data_fiscal_url" class="form-control" placeholder="http://qr.afip.gob.ar/?qr=..." />
</div>

          <button type="submit" class="btn btn-turquesa" :disabled="guardando">
            {{ guardando ? 'Guardando...' : 'Guardar cambios' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue'
import { useConfigStore } from '../stores/config'
import SubidaImagen from '../components/SubidaImagen.vue'
import api from '../services/api'

const config = useConfigStore()
const form = ref({})
const guardando = ref(false)
const guardado = ref(false)
const error = ref('')
const cambiandoEstado = ref(false)
const mostrarConfirm = inject('mostrarConfirm')
const mostrarToast = inject('mostrarToast')

// Abrir o cerrar la tienda se guarda al instante, aparte del resto del formulario
async function cambiarEstadoTienda() {
  const abrir = !config.sitioAbierto
  const ok = await mostrarConfirm(abrir
    ? {
        titulo: '¿Abrir la tienda al público?',
        mensaje: 'Cualquiera va a poder ver los productos, registrarse y comprar. Revisá antes que los productos, precios y datos legales estén completos.',
        textoConfirmar: 'Sí, abrir la tienda'
      }
    : {
        titulo: '¿Cerrar la tienda?',
        mensaje: 'El público va a ver la página de "Próximamente" y nadie va a poder comprar hasta que la vuelvas a abrir.',
        textoConfirmar: 'Sí, cerrarla'
      })
  if (!ok) return

  cambiandoEstado.value = true
  try {
    await config.guardar({ sitio_abierto: abrir ? '1' : '0' })
    form.value.sitio_abierto = abrir ? '1' : '0'
    mostrarToast(abrir ? '¡La tienda está abierta al público! 🎉' : 'La tienda quedó cerrada al público')
  } catch (err) {
    mostrarToast(err.response?.data?.error || 'No se pudo cambiar el estado de la tienda')
  } finally {
    cambiandoEstado.value = false
  }
}

// La configuración pública no trae las claves privadas (email de admin, Correo Argentino...),
// así que el formulario se carga desde el endpoint de admin
onMounted(async () => {
  try {
    const { data } = await api.get('/configuracion/admin')
    form.value = data
  } catch (err) {
    console.error(err)
    error.value = 'No se pudo cargar la configuración'
  }
})

async function guardar() {
  guardando.value = true
  guardado.value = false
  error.value = ''

  try {
    await config.guardar(form.value)
    guardado.value = true
    setTimeout(() => { guardado.value = false }, 3000)
  } catch (err) {
    error.value = err.response?.data?.error || 'Error al guardar'
  } finally {
    guardando.value = false
  }
}
</script>

<style scoped>
.estado-tienda {
  border-left: 4px solid #f59e0b;
}
.estado-tienda.abierta {
  border-left-color: var(--salvia-texto);
}
</style>
