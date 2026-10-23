const { Resend } = require('resend')

const resend = new Resend(process.env.RESEND_API_KEY)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

// Remitente y respuesta configurables. Hasta verificar el dominio en Resend, el remitente
// tiene que ser onboarding@resend.dev (y solo se puede enviar al email de la cuenta de Resend)
const EMAIL_FROM = process.env.EMAIL_FROM || 'Creaciones Alma <onboarding@resend.dev>'
const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || undefined

const URL_SEGUIMIENTO_CORREO = 'https://www.correoargentino.com.ar/seguimiento-de-envios'

// Escapa texto que escribió un usuario antes de meterlo en el HTML de un mail,
// para que nadie pueda inyectar links o etiquetas (ej: un "nombre" con <a href=...>)
function escapar(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function pesos(monto) {
  return '$' + Number(monto || 0).toLocaleString('es-AR')
}

function boton(texto, url) {
  return `
    <p style="margin: 24px 0;">
      <a href="${url}" style="display: inline-block; background: #ec4899; color: #ffffff; padding: 12px 24px; border-radius: 30px; text-decoration: none; font-weight: bold;">
        ${texto}
      </a>
    </p>`
}

// Plantilla común: encabezado con la marca y pie con links legales
function plantilla(contenido) {
  return `
  <div style="background: #fdf2f8; padding: 24px 12px; font-family: Arial, Helvetica, sans-serif; color: #1f2937;">
    <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden;">
      <div style="background: #ede9fe; padding: 18px 24px;">
        <a href="${FRONTEND_URL}" style="color: #1f2937; text-decoration: none; font-family: 'Dancing Script', 'Brush Script MT', 'Segoe Script', cursive; font-size: 30px; font-weight: bold;">Creaciones Alma <span style="color: #ec4899;">♡</span></a>
        <div style="color: #ec4899; font-family: Poppins, Arial, sans-serif; font-size: 10px; font-weight: 600; letter-spacing: 2px;">PAPELERÍA CREATIVA</div>
      </div>
      <div style="padding: 24px; font-size: 15px; line-height: 1.6;">
        ${contenido}
      </div>
      <div style="padding: 16px 24px; background: #f9fafb; color: #6b7280; font-size: 12px; line-height: 1.6;">
        <a href="${FRONTEND_URL}" style="color: #6b7280;">creacionesalma.com.ar</a> ·
        <a href="${FRONTEND_URL}/terminos" style="color: #6b7280;">Términos</a> ·
        <a href="${FRONTEND_URL}/devoluciones" style="color: #6b7280;">Cambios y devoluciones</a> ·
        <a href="${FRONTEND_URL}/arrepentimiento" style="color: #6b7280;">Botón de arrepentimiento</a>
        <br/>Si tenés alguna consulta, respondé este mail.
      </div>
    </div>
  </div>`
}

// Envía un mail con la plantilla común y una versión en texto plano.
// El SDK de Resend NO lanza error cuando el envío falla (devuelve { error }), así que se
// convierte en excepción para que quien llama se entere y lo loguee
async function enviar({ para, asunto, html, texto }) {
  const { data, error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: para,
    replyTo: EMAIL_REPLY_TO,
    subject: asunto,
    html: plantilla(html),
    text: `${texto}\n\n—\nCreaciones Alma · ${FRONTEND_URL}`
  })

  if (error) {
    throw new Error(`Resend rechazó el mail "${asunto}" a ${para}: ${error.message}`)
  }
  return data
}

// Lista de productos de un pedido, en HTML y en texto
function detalleItems(items) {
  const html = items
    .map(d => `<tr>
      <td style="padding: 4px 0;">${escapar(d.nombre)} x${d.cantidad}</td>
      <td style="padding: 4px 0; text-align: right;">${pesos(d.precioUnitario * d.cantidad)}</td>
    </tr>`)
    .join('')
  const texto = items.map(d => `- ${d.nombre} x${d.cantidad}: ${pesos(d.precioUnitario * d.cantidad)}`).join('\n')
  return { html, texto }
}

// ---------- Cuenta ----------

async function enviarEmailVerificacion(destino, nombre, token) {
  const link = `${FRONTEND_URL}/verificar-email/${token}`

  await enviar({
    para: destino,
    asunto: 'Confirmá tu cuenta en Creaciones Alma 💗',
    html: `
      <h2 style="margin-top: 0;">¡Hola, ${escapar(nombre)}!</h2>
      <p>Gracias por crear tu cuenta en Creaciones Alma. Confirmá tu email para activarla del todo:</p>
      ${boton('Confirmar mi cuenta', link)}
      <p style="color: #6b7280; font-size: 13px;">Si no creaste esta cuenta, podés ignorar este mail.</p>`,
    texto: `¡Hola, ${nombre}!\n\nGracias por crear tu cuenta en Creaciones Alma. Confirmá tu email entrando a:\n${link}\n\nSi no creaste esta cuenta, podés ignorar este mail.`
  })
}

async function enviarEmailRecuperacion(destino, nombre, token) {
  const link = `${FRONTEND_URL}/resetear-password/${token}`

  await enviar({
    para: destino,
    asunto: 'Recuperá tu contraseña - Creaciones Alma',
    html: `
      <h2 style="margin-top: 0;">¡Hola, ${escapar(nombre)}!</h2>
      <p>Pediste restablecer tu contraseña. Hacé clic acá para elegir una nueva (el link vence en 1 hora):</p>
      ${boton('Restablecer contraseña', link)}
      <p style="color: #6b7280; font-size: 13px;">Si no pediste esto, podés ignorar este mail tranquilamente.</p>`,
    texto: `¡Hola, ${nombre}!\n\nPediste restablecer tu contraseña. Elegí una nueva entrando a (vence en 1 hora):\n${link}\n\nSi no pediste esto, podés ignorar este mail.`
  })
}

// ---------- Pedidos: aviso al admin ----------

async function enviarNotificacionPedido({ ordenId, comprador, tipoEntrega, items, total, metodoPago, adminEmail }) {
  const { html: filas, texto: lista } = detalleItems(items)
  const link = `${FRONTEND_URL}/mis-pedidos/${ordenId}`
  const entrega = tipoEntrega === 'Envio' ? 'Envío por Correo Argentino' : 'Retiro en zona oeste (Marcos Paz)'
  const pago = metodoPago === 'transferencia' ? 'Transferencia (pendiente de confirmar)' : 'Mercado Pago'

  await enviar({
    para: adminEmail,
    asunto: `🛍 Nuevo pedido #${ordenId} - ${pesos(total)}`,
    html: `
      <h2 style="margin-top: 0;">🛍 Nuevo pedido #${ordenId}</h2>
      <p><strong>${escapar(comprador.Nombre)}</strong><br/>
      ${escapar(comprador.Email)}<br/>
      ${comprador.Telefono ? escapar(comprador.Telefono) + '<br/>' : ''}
      ${entrega}<br/>
      Pago: ${pago}</p>
      <table style="width: 100%; border-collapse: collapse;">${filas}</table>
      <p style="font-size: 18px;"><strong>Total: ${pesos(total)}</strong></p>
      ${boton('Ver pedido completo', link)}`,
    texto: `Nuevo pedido #${ordenId}\n\n${comprador.Nombre}\n${comprador.Email}\n${comprador.Telefono || ''}\n${entrega}\nPago: ${pago}\n\n${lista}\n\nTotal: ${pesos(total)}\n\nVer pedido: ${link}`
  })
}

// ---------- Pedidos: mails al cliente ----------

async function enviarConfirmacionPedido({
  destino, nombre, ordenId, items, total, costoEnvio, descuentoCupon, cuponCodigo, descuentoTransferencia, tipoEntrega, metodoPago, transferencia
}) {
  const { html: filas, texto: lista } = detalleItems(items)
  const fila = (texto, monto) => `<tr><td style="padding: 4px 0;">${texto}</td><td style="padding: 4px 0; text-align: right;">${monto}</td></tr>`
  const extrasHtml = [
    descuentoCupon ? fila(`Cupón ${escapar(cuponCodigo)}`, '-' + pesos(descuentoCupon)) : '',
    descuentoTransferencia ? fila('Descuento por transferencia', '-' + pesos(descuentoTransferencia)) : '',
    tipoEntrega === 'Envio' ? fila('Envío', costoEnvio ? pesos(costoEnvio) : 'Gratis') : ''
  ].join('')
  const extrasTexto = [
    descuentoCupon ? `Cupón ${cuponCodigo}: -${pesos(descuentoCupon)}` : '',
    descuentoTransferencia ? `Descuento por transferencia: -${pesos(descuentoTransferencia)}` : '',
    tipoEntrega === 'Envio' ? `Envío: ${costoEnvio ? pesos(costoEnvio) : 'Gratis'}` : ''
  ].filter(Boolean).join('\n')
  const link = `${FRONTEND_URL}/mis-pedidos/${ordenId}`
  const entrega = tipoEntrega === 'Envio'
    ? 'Te lo enviamos por Correo Argentino. Cuando lo despachemos te mandamos el número de seguimiento.'
    : 'Retiro en zona oeste (Marcos Paz). Te escribimos para coordinar día y horario.'

  let pagoHtml = '<p>Apenas Mercado Pago confirme el pago te avisamos por mail.</p>'
  let pagoTexto = 'Apenas Mercado Pago confirme el pago te avisamos por mail.'

  if (metodoPago === 'transferencia') {
    const alias = transferencia?.alias || 'te lo pasamos por WhatsApp'
    const titular = transferencia?.titular || ''
    pagoHtml = `
      <div style="background: #ede9fe; border-radius: 12px; padding: 12px 16px; margin: 16px 0;">
        <strong>Datos para transferir ${pesos(total)}:</strong><br/>
        Alias: <strong>${escapar(alias)}</strong><br/>
        ${titular ? `Titular: ${escapar(titular)}<br/>` : ''}
        <span style="font-size: 13px;">Cuando transfieras, respondé este mail con el comprobante. Confirmamos el pedido al verificar el pago.</span>
      </div>`
    pagoTexto = `Datos para transferir ${pesos(total)}:\nAlias: ${alias}\n${titular ? `Titular: ${titular}\n` : ''}Cuando transfieras, respondé este mail con el comprobante.`
  }

  await enviar({
    para: destino,
    asunto: `Recibimos tu pedido #${ordenId} 💗`,
    html: `
      <h2 style="margin-top: 0;">¡Gracias, ${escapar(nombre)}!</h2>
      <p>Recibimos tu pedido <strong>#${ordenId}</strong>.</p>
      <table style="width: 100%; border-collapse: collapse;">
        ${filas}
        ${extrasHtml}
        <tr><td style="padding: 8px 0; border-top: 1px solid #e5e7eb;"><strong>Total</strong></td>
            <td style="padding: 8px 0; border-top: 1px solid #e5e7eb; text-align: right;"><strong>${pesos(total)}</strong></td></tr>
      </table>
      ${pagoHtml}
      <p>${entrega}</p>
      ${boton('Ver mi pedido', link)}`,
    texto: `¡Gracias, ${nombre}!\n\nRecibimos tu pedido #${ordenId}.\n\n${lista}\n${extrasTexto ? extrasTexto + '\n' : ''}Total: ${pesos(total)}\n\n${pagoTexto}\n\n${entrega}\n\nVer tu pedido: ${link}`
  })
}

async function enviarPagoAprobado({ destino, nombre, ordenId, total }) {
  const link = `${FRONTEND_URL}/mis-pedidos/${ordenId}`

  await enviar({
    para: destino,
    asunto: `¡Pago confirmado! Pedido #${ordenId}`,
    html: `
      <h2 style="margin-top: 0;">¡Listo, ${escapar(nombre)}!</h2>
      <p>Confirmamos el pago de ${pesos(total)} de tu pedido <strong>#${ordenId}</strong>. Ya nos ponemos a prepararlo 💗</p>
      ${boton('Ver mi pedido', link)}`,
    texto: `¡Listo, ${nombre}!\n\nConfirmamos el pago de ${pesos(total)} de tu pedido #${ordenId}. Ya nos ponemos a prepararlo.\n\nVer tu pedido: ${link}`
  })
}

async function enviarPedidoEnviado({ destino, nombre, ordenId, numeroSeguimiento }) {
  const link = `${FRONTEND_URL}/mis-pedidos/${ordenId}`

  await enviar({
    para: destino,
    asunto: `Tu pedido #${ordenId} está en camino 🚚`,
    html: `
      <h2 style="margin-top: 0;">¡Hola, ${escapar(nombre)}!</h2>
      <p>Despachamos tu pedido <strong>#${ordenId}</strong> por Correo Argentino.</p>
      ${numeroSeguimiento
        ? `<p>Número de seguimiento: <strong>${escapar(numeroSeguimiento)}</strong><br/>
           Podés seguirlo en <a href="${URL_SEGUIMIENTO_CORREO}" style="color: #ec4899;">la web de Correo Argentino</a>.</p>`
        : ''}
      ${boton('Ver mi pedido', link)}`,
    texto: `¡Hola, ${nombre}!\n\nDespachamos tu pedido #${ordenId} por Correo Argentino.\n${numeroSeguimiento ? `Número de seguimiento: ${numeroSeguimiento}\nSeguilo en ${URL_SEGUIMIENTO_CORREO}\n` : ''}\nVer tu pedido: ${link}`
  })
}

async function enviarPedidoCancelado({ destino, nombre, ordenId }) {
  const link = `${FRONTEND_URL}/mis-pedidos/${ordenId}`

  await enviar({
    para: destino,
    asunto: `Tu pedido #${ordenId} fue cancelado`,
    html: `
      <h2 style="margin-top: 0;">Hola, ${escapar(nombre)}</h2>
      <p>Tu pedido <strong>#${ordenId}</strong> fue cancelado. Si ya habías pagado, te contactamos para devolverte el dinero.</p>
      <p>Si creés que es un error o querés hacer el pedido de nuevo, respondé este mail.</p>
      ${boton('Ver mi pedido', link)}`,
    texto: `Hola, ${nombre}\n\nTu pedido #${ordenId} fue cancelado. Si ya habías pagado, te contactamos para devolverte el dinero.\nSi creés que es un error, respondé este mail.\n\nVer tu pedido: ${link}`
  })
}

// ---------- Newsletter ----------

async function enviarBienvenidaNewsletter({ destino, codigo, porcentaje, vence, linkBaja }) {
  const fechaVence = new Date(vence).toLocaleDateString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires', day: 'numeric', month: 'long'
  })

  await enviar({
    para: destino,
    asunto: `Tu ${porcentaje}% OFF de bienvenida 💗`,
    html: `
      <h2 style="margin-top: 0;">¡Bienvenida/o a Creaciones Alma!</h2>
      <p>Gracias por sumarte. Te vamos a escribir con novedades, lanzamientos y promos (sin llenarte la casilla, prometido).</p>
      <p>Para tu primera compra, acá tenés tu cupón:</p>
      <div style="background: #fce7f3; border: 2px dashed #ec4899; border-radius: 14px; padding: 18px; text-align: center; margin: 18px 0;">
        <div style="font-size: 26px; font-weight: bold; letter-spacing: 2px; color: #be185d;">${escapar(codigo)}</div>
        <div style="margin-top: 6px; color: #1f2937;">${porcentaje}% OFF · válido hasta el ${fechaVence} · un solo uso</div>
      </div>
      <p>Ingresalo en el checkout, en el campo "Código de descuento".</p>
      ${boton('Ir a la tienda', `${FRONTEND_URL}/productos`)}
      <p style="color: #6b7280; font-size: 12px;">¿No querés recibir más mails? <a href="${linkBaja}" style="color: #6b7280;">Darme de baja</a>.</p>`,
    texto: `¡Bienvenida/o a Creaciones Alma!\n\nTu cupón de bienvenida: ${codigo}\n${porcentaje}% OFF, válido hasta el ${fechaVence}, un solo uso.\nIngresalo en el checkout en "Código de descuento".\n\nTienda: ${FRONTEND_URL}/productos\n\nDarte de baja: ${linkBaja}`
  })
}

// ---------- Botón de arrepentimiento ----------

// Constancia al cliente de que recibimos su solicitud de arrepentimiento (Res. 424/2020:
// hay que mandarle un código de identificación dentro de las 24 horas)
async function enviarConstanciaArrepentimiento({ destino, nombre, codigo, ordenId }) {
  await enviar({
    para: destino,
    asunto: `Recibimos tu solicitud de arrepentimiento - Código ${codigo}`,
    html: `
      <h2 style="margin-top: 0;">¡Hola, ${escapar(nombre)}!</h2>
      <p>Recibimos tu solicitud para revocar la compra${ordenId ? ` del pedido <strong>#${escapar(ordenId)}</strong>` : ''}.</p>
      <p>Tu código de identificación es:</p>
      <p style="font-size: 22px; font-weight: bold; letter-spacing: 2px;">${escapar(codigo)}</p>
      <p>Guardalo: te lo vamos a pedir para coordinar la devolución del producto y el reintegro del dinero.
      Nos vamos a comunicar con vos a la brevedad.</p>`,
    texto: `¡Hola, ${nombre}!\n\nRecibimos tu solicitud para revocar la compra${ordenId ? ` del pedido #${ordenId}` : ''}.\nTu código de identificación es: ${codigo}\n\nGuardalo: te lo vamos a pedir para coordinar la devolución y el reintegro.`
  })
}

async function enviarAvisoArrepentimiento({ adminEmail, codigo, nombre, email, telefono, ordenId, motivo }) {
  await enviar({
    para: adminEmail,
    asunto: `↩️ Solicitud de arrepentimiento ${codigo}${ordenId ? ` - pedido #${ordenId}` : ''}`,
    html: `
      <h2 style="margin-top: 0;">↩️ Solicitud de arrepentimiento</h2>
      <p><strong>Código:</strong> ${escapar(codigo)}<br/>
      <strong>Pedido:</strong> ${ordenId ? '#' + escapar(ordenId) : 'no indicado'}<br/>
      <strong>Nombre:</strong> ${escapar(nombre)}<br/>
      <strong>Email:</strong> ${escapar(email)}<br/>
      ${telefono ? `<strong>Teléfono:</strong> ${escapar(telefono)}<br/>` : ''}</p>
      ${motivo ? `<p><strong>Motivo:</strong><br/>${escapar(motivo)}</p>` : ''}
      <p style="color: #6b7280; font-size: 13px;">El cliente ya recibió su código por mail. Tenés que contactarlo para coordinar la devolución y el reintegro.</p>`,
    texto: `Solicitud de arrepentimiento ${codigo}\nPedido: ${ordenId ? '#' + ordenId : 'no indicado'}\nNombre: ${nombre}\nEmail: ${email}\n${telefono ? `Teléfono: ${telefono}\n` : ''}${motivo ? `Motivo: ${motivo}\n` : ''}`
  })
}

module.exports = {
  enviarEmailVerificacion,
  enviarEmailRecuperacion,
  enviarNotificacionPedido,
  enviarConfirmacionPedido,
  enviarPagoAprobado,
  enviarPedidoEnviado,
  enviarPedidoCancelado,
  enviarBienvenidaNewsletter,
  enviarConstanciaArrepentimiento,
  enviarAvisoArrepentimiento
}
