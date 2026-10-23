<template>
  <LegalPagina titulo="Política de privacidad">
    <p>
      En <strong>{{ nombreTienda }}</strong> cuidamos tus datos personales. Esta política explica qué datos juntamos, para
      qué los usamos y qué derechos tenés, según la Ley 25.326 de Protección de los Datos Personales.
    </p>

    <h2>1. Responsable de los datos</h2>
    <p>
      El responsable de la base de datos es {{ config.valores.legal_razon_social || nombreTienda }}. Sus datos de contacto
      están al pie de esta página.
    </p>

    <h2>2. Qué datos juntamos</h2>
    <ul>
      <li><strong>Cuando te registrás o comprás:</strong> nombre, email, teléfono y, si elegís envío, tu dirección.</li>
      <li><strong>De tus pedidos:</strong> productos, montos, medio de pago elegido y estado del pedido.</li>
      <li><strong>Para productos personalizados:</strong> las fotos, textos o diseños que nos mandes.</li>
      <li><strong>Si dejás una reseña:</strong> tu nombre, comentario y calificación.</li>
      <li><strong>Estadísticas de uso:</strong> contamos las visitas al sitio de forma agregada, sin identificarte.</li>
    </ul>
    <p>
      <strong>No guardamos los datos de tu tarjeta</strong>: los pagos con tarjeta los procesa Mercado Pago directamente.
      Tu contraseña se guarda cifrada y nadie del equipo puede verla.
    </p>

    <h2>3. Para qué los usamos</h2>
    <ul>
      <li>Procesar, producir y entregar tus pedidos.</li>
      <li>Comunicarnos con vos sobre tu compra (confirmaciones, coordinación de entrega, consultas).</li>
      <li>Gestionar tu cuenta, recuperar tu contraseña y atender pedidos de arrepentimiento o devoluciones.</li>
      <li>Cumplir obligaciones legales, contables e impositivas.</li>
      <li>Mejorar el sitio con estadísticas que no te identifican.</li>
    </ul>
    <p>No vendemos ni alquilamos tus datos, y no te mandamos publicidad sin tu consentimiento.</p>
    <p>
      <strong>Newsletter:</strong> si te suscribís, usamos tu email solo para mandarte novedades, promociones y tu cupón
      de bienvenida. Cada mail incluye un link para darte de baja en un clic, y también podés pedirla escribiéndonos.
    </p>

    <h2>4. Con quién los compartimos</h2>
    <p>Solo con los proveedores que necesitamos para funcionar, y solo los datos que cada uno necesita:</p>
    <ul>
      <li><strong>Mercado Pago:</strong> para procesar pagos.</li>
      <li><strong>Correo Argentino:</strong> nombre, dirección y teléfono para hacer el envío.</li>
      <li><strong>Resend:</strong> servicio que usamos para mandarte emails.</li>
      <li><strong>Cloudinary:</strong> almacenamiento de imágenes del sitio.</li>
      <li><strong>Proveedor de hosting:</strong> donde funciona el sitio y su base de datos.</li>
    </ul>
    <p>
      Algunos de estos proveedores pueden almacenar datos fuera de Argentina, con niveles de protección adecuados. También
      podemos compartir datos si lo exige una autoridad judicial o administrativa.
    </p>

    <h2>5. Cuánto tiempo los guardamos</h2>
    <p>
      Mientras tengas una cuenta activa o mientras sea necesario para las finalidades de arriba. Los datos de pedidos los
      conservamos el tiempo que exigen las normas contables e impositivas.
    </p>

    <h2>6. Tus derechos</h2>
    <p>
      Podés pedirnos en cualquier momento <strong>acceder</strong> a tus datos, <strong>rectificarlos</strong>,
      <strong>actualizarlos</strong> o <strong>suprimirlos</strong>, escribiéndonos al email de contacto. Respondemos el
      acceso dentro de los 10 días corridos y la rectificación o supresión dentro de los 5 días hábiles.
    </p>
    <p>
      El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma gratuita a
      intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al efecto, conforme lo establecido en el
      artículo 14, inciso 3 de la Ley N° 25.326.
    </p>
    <p>
      La AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, en su carácter de Órgano de Control de la Ley N° 25.326, tiene la
      atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por
      incumplimiento de las normas vigentes en materia de protección de datos personales. Más información en
      <a href="https://www.argentina.gob.ar/aaip/datospersonales" target="_blank" rel="noopener">argentina.gob.ar/aaip/datospersonales</a>.
    </p>

    <h2>7. Seguridad</h2>
    <p>
      Usamos conexiones cifradas, contraseñas protegidas y accesos restringidos para cuidar tu información. Ningún sistema
      es 100% infalible, pero si detectamos un problema que afecte tus datos, te vamos a avisar.
    </p>

    <h2>8. Almacenamiento en tu navegador</h2>
    <p>
      El sitio guarda en tu navegador el contenido del carrito y tu sesión iniciada, para que no los pierdas al recargar la
      página. Podés borrar estos datos desde la configuración de tu navegador.
    </p>
    <p v-if="analiticaActiva">
      Para saber cómo se usa el sitio y medir nuestras publicidades usamos herramientas de terceros
      ({{ herramientas }}), que pueden guardar cookies en tu navegador y registrar qué páginas visitás y si concretás una
      compra. No les compartimos tu nombre, email ni datos de pago. Podés bloquear estas cookies desde la configuración de
      tu navegador sin que eso afecte tus compras.
    </p>
    <p v-else>No usamos cookies de publicidad ni de seguimiento de terceros.</p>

    <h2>9. Menores de edad</h2>
    <p>Para comprar tenés que ser mayor de 18 años o contar con autorización de tu madre, padre o tutor.</p>

    <h2>10. Cambios en esta política</h2>
    <p>Si la modificamos, vas a ver la nueva fecha de actualización arriba de todo.</p>
  </LegalPagina>
</template>

<script setup>
import { computed } from 'vue'
import LegalPagina from '../components/LegalPagina.vue'
import { useConfigStore } from '../stores/config'
import { analiticaActiva } from '../analitica'

const config = useConfigStore()
const nombreTienda = computed(() => config.valores.legal_nombre_fantasia || 'Creaciones Alma')
const herramientas = [
  import.meta.env.VITE_GA_ID && 'Google Analytics',
  import.meta.env.VITE_META_PIXEL_ID && 'el píxel de Meta, de Facebook e Instagram'
].filter(Boolean).join(' y ')
</script>
