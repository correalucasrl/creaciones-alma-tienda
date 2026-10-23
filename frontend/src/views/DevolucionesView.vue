<template>
  <LegalPagina titulo="Cambios, devoluciones y reembolsos">
    <p>
      Queremos que estés feliz con tu compra. Si algo no salió como esperabas, acá te contamos cómo lo resolvemos.
    </p>

    <h2>1. Derecho de arrepentimiento (10 días)</h2>
    <p>
      Por ser una compra a distancia, podés <strong>revocar la compra dentro de los 10 días corridos</strong> desde que
      recibiste el producto o desde la compra, lo último que ocurra, sin tener que explicar el motivo (art. 34 de la Ley
      24.240 y arts. 1110 a 1116 del Código Civil y Comercial).
    </p>
    <ul>
      <li>Lo pedís desde el <router-link to="/arrepentimiento">Botón de arrepentimiento</router-link>, sin necesidad de estar registrado.</li>
      <li>Dentro de las 24 horas te mandamos un <strong>código de identificación</strong> de tu solicitud.</li>
      <li>El producto tiene que volver en el mismo estado en que lo recibiste, sin uso.</li>
      <li><strong>No tiene costo para vos:</strong> el envío de la devolución corre por nuestra cuenta y te indicamos cómo hacerlo.</li>
      <li>Te devolvemos el <strong>100% de lo que pagaste</strong>, incluido el envío original.</li>
    </ul>

    <h2>2. Productos personalizados</h2>
    <p>
      Los productos <strong>confeccionados según tus especificaciones o claramente personalizados</strong> (por ejemplo,
      con tus fotos, nombres o diseños) <strong>no admiten arrepentimiento</strong>, porque no se pueden revender (art. 1116
      del Código Civil y Comercial). Antes de producirlos te mostramos o confirmamos el diseño, así nos aseguramos de que
      quede como querés.
    </p>
    <p>Esta excepción no aplica si el producto llega fallado o distinto de lo que pediste: en ese caso, mirá el punto 3.</p>

    <h2>3. Productos con fallas o errores</h2>
    <p>
      Si el producto llegó dañado, con una falla de fabricación o distinto de lo que pediste (personalizado o no),
      escribinos <strong>dentro de las 48 horas de recibido</strong> con fotos del producto y del paquete. Según el caso, te
      ofrecemos:
    </p>
    <ul>
      <li>rehacer o reemplazar el producto sin costo,</li>
      <li>cambiarlo por otro producto, o</li>
      <li>devolverte el dinero.</li>
    </ul>
    <p>Los gastos de envío de la reposición corren por nuestra cuenta. Esto no limita la garantía legal que te corresponde por la Ley 24.240.</p>

    <h2>4. Cambios</h2>
    <p>
      Los productos no personalizados se pueden cambiar por otro dentro de los 30 días de recibidos, siempre que estén sin
      uso y en su empaque original. En los cambios que no son por falla, el envío corre por tu cuenta.
    </p>

    <h2>5. Cómo y cuándo te devolvemos el dinero</h2>
    <ul>
      <li><strong>Mercado Pago:</strong> se reintegra por el mismo medio. Los plazos de acreditación dependen de Mercado Pago y de tu banco o tarjeta.</li>
      <li><strong>Transferencia o efectivo:</strong> te transferimos a la cuenta que nos indiques.</li>
    </ul>
    <p>Hacemos el reintegro dentro de los 10 días hábiles de recibido el producto devuelto (o de aprobada la solicitud, si no hay que devolver nada).</p>

    <h2>6. Cancelar un pedido antes del envío</h2>
    <p>
      Si todavía no despachamos tu pedido ni empezamos a producir un producto personalizado, podés cancelarlo escribiéndonos
      y te devolvemos todo lo que pagaste.
    </p>

    <h2>7. Contacto</h2>
    <p>
      Para cualquier cambio o devolución escribinos por WhatsApp o email (los datos están abajo) indicando tu número de pedido.
    </p>
  </LegalPagina>
</template>

<script setup>
import LegalPagina from '../components/LegalPagina.vue'
</script>
