<template>
  <LegalPagina titulo="Términos y condiciones">
    <p>
      Estos términos regulan el uso del sitio y las compras que hagas en <strong>{{ nombreTienda }}</strong>.
      Al navegar el sitio, crear una cuenta o hacer un pedido, aceptás estas condiciones. Se aplican junto con nuestra
      <router-link to="/privacidad">Política de privacidad</router-link> y nuestra
      <router-link to="/devoluciones">Política de cambios, devoluciones y reembolsos</router-link>.
    </p>

    <h2>1. Quiénes somos</h2>
    <p>
      {{ nombreTienda }} es un emprendimiento de papelería creativa con base en Marcos Paz, provincia de Buenos Aires,
      Argentina. Al pie de esta página encontrás nuestros datos de contacto e identificación.
    </p>

    <h2>2. Productos</h2>
    <p>
      Vendemos productos de papelería, fotos Polaroid, stickers, álbumes e impresiones, muchos de ellos
      <strong>hechos a mano y personalizados</strong>. Por eso pueden existir pequeñas diferencias de color, textura o
      terminación respecto de las fotos del sitio: no se consideran fallas. Las imágenes son ilustrativas.
    </p>
    <p>
      En los productos personalizados, sos responsable de que las fotos, textos y diseños que nos envíes te pertenezcan
      o tengas permiso para usarlos, y de que no infrinjan derechos de terceros. Podemos rechazar pedidos con contenido
      ofensivo, ilegal o que vulnere derechos de autor.
    </p>

    <h2>3. Precios</h2>
    <p>
      Los precios están expresados en pesos argentinos (ARS) e incluyen impuestos. El costo de envío se calcula según el
      código postal de destino y se muestra antes de confirmar la compra. Podemos modificar precios en cualquier momento,
      pero el precio que vale es el que figuraba al momento de confirmar tu pedido.
    </p>

    <h2>4. Cómo comprar</h2>
    <ol>
      <li>Agregás los productos al carrito.</li>
      <li>Elegís retiro o envío y completás tus datos (podés comprar sin registrarte).</li>
      <li>Elegís el medio de pago y confirmás el pedido.</li>
      <li>Te confirmamos el pedido y, en productos personalizados, coordinamos los detalles con vos.</li>
    </ol>
    <p>
      El pedido queda confirmado cuando se acredita el pago. Si un producto se queda sin stock después de tu compra, te
      avisamos y te devolvemos el dinero completo o te ofrecemos un reemplazo, lo que prefieras.
    </p>

    <h2>5. Medios de pago</h2>
    <ul>
      <li><strong>Mercado Pago:</strong> tarjetas de crédito, débito y dinero en cuenta, según las condiciones de Mercado Pago.
        Nosotros no vemos ni guardamos los datos de tu tarjeta.</li>
      <li><strong>Transferencia bancaria:</strong> el pedido queda pendiente hasta que verifiquemos la acreditación.</li>
      <li><strong>Efectivo:</strong> solo para retiros, a coordinar.</li>
    </ul>

    <h2>6. Producción, envíos y retiros</h2>
    <p>
      Los productos personalizados tienen un tiempo de producción que te informamos al confirmar el pedido. Los envíos se
      hacen por Correo Argentino al domicilio que indiques; desde el despacho, los plazos de entrega dependen del correo.
      También podés retirar sin cargo en zona oeste (Marcos Paz), coordinando día y horario.
    </p>
    <p>
      Revisá que la dirección sea correcta: si el paquete vuelve por un error en los datos, el nuevo envío corre por tu cuenta.
      Si el producto llega dañado, avisanos dentro de las 48 horas con fotos y lo resolvemos.
    </p>

    <h2>7. Derecho de arrepentimiento</h2>
    <p>
      Podés revocar tu compra dentro de los <strong>10 días corridos</strong> desde que recibiste el producto o desde la
      compra, lo último que ocurra, sin dar motivos y sin costo (art. 34 de la Ley 24.240 y art. 1110 del Código Civil y
      Comercial). Lo podés pedir desde el
      <router-link to="/arrepentimiento">Botón de arrepentimiento</router-link>. Los productos confeccionados según tus
      especificaciones o claramente personalizados están exceptuados (art. 1116 del Código Civil y Comercial). Más detalles en la
      <router-link to="/devoluciones">Política de cambios y devoluciones</router-link>.
    </p>

    <h2>8. Cuenta de usuario</h2>
    <p>
      Sos responsable de mantener tu contraseña en secreto y de la actividad de tu cuenta. Podemos suspender cuentas que
      hagan un uso fraudulento o abusivo del sitio.
    </p>

    <h2>9. Propiedad intelectual</h2>
    <p>
      Los diseños, fotos, textos y la marca {{ nombreTienda }} son de nuestra propiedad o los usamos con permiso. No se
      pueden copiar ni usar con fines comerciales sin autorización.
    </p>

    <h2>10. Responsabilidad</h2>
    <p>
      Hacemos lo posible para que el sitio funcione sin interrupciones y la información sea correcta, pero puede haber
      errores o cortes. Nada de lo dispuesto en estos términos limita los derechos que te da la Ley de Defensa del Consumidor.
    </p>

    <h2>11. Cambios en estos términos</h2>
    <p>
      Podemos actualizar estos términos. La versión vigente es la que está publicada en esta página, con su fecha de
      actualización. Los cambios no afectan pedidos ya confirmados.
    </p>

    <h2>12. Ley aplicable y reclamos</h2>
    <p>
      Estos términos se rigen por las leyes de la República Argentina. Ante cualquier problema, escribinos primero: casi
      siempre lo resolvemos rápido. También podés acudir a la
      <a href="https://www.argentina.gob.ar/economia/industria-y-comercio/defensadelconsumidor" target="_blank" rel="noopener">Dirección Nacional de Defensa del Consumidor</a>
      o iniciar un reclamo en la
      <a href="https://autogestion.produccion.gob.ar/consumidores" target="_blank" rel="noopener">ventanilla federal de reclamos</a>.
    </p>
  </LegalPagina>
</template>

<script setup>
import { computed } from 'vue'
import LegalPagina from '../components/LegalPagina.vue'
import { useConfigStore } from '../stores/config'

const config = useConfigStore()
const nombreTienda = computed(() => config.valores.legal_nombre_fantasia || 'Creaciones Alma')
</script>
