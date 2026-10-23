# Cómo publicar Creaciones Alma

Guía paso a paso para poner el sitio online. Se hace **una sola vez**: después, cada vez que se mergea algo a `main`, el backend (GitHub Actions → Azure) y el frontend (Cloudflare Pages) se actualizan solos.

## Cómo queda armado

Todo lo que necesita estar cerca de las clientas (Argentina) está en **San Pablo, Brasil**: desde Buenos Aires hay ~40 ms de ida y vuelta, contra ~170 ms a EE.UU.

| Parte | Dónde | Dirección | Costo aprox. |
|---|---|---|---|
| Tienda (frontend) | Cloudflare Pages (sale desde Buenos Aires) | `https://creacionesalma.com.ar` | Gratis |
| API (backend) | Azure App Service, plan B1 (Brazil South) | `https://api.creacionesalma.com.ar` | USD 14,60/mes |
| Base de datos | Azure SQL Database, plan Basic (Brazil South) | (privada) | USD 5,93/mes |
| Imágenes / mails / pagos | Cloudinary / Resend / Mercado Pago | — | lo de siempre |

Los precios son de la lista oficial de Azure (octubre 2026): confirmalos en cada pantalla antes de crear algo. Los nombres de los menús pueden variar un poco según el idioma del portal.

**El sitio arranca cerrado al público** (modo próximamente): solo los administradores ven la tienda. Se abre desde el panel → Configuración, cuando esté todo cargado.

### Antes de empezar

- [ ] Tenés a mano un gestor de contraseñas (o un lugar seguro) para guardar las claves que vas a crear.
- [ ] Nunca pegues contraseñas ni claves en el chat, en el código ni en archivos del repo.

---

## Paso 1 — Base de datos en Azure

1. Creá una cuenta en [azure.microsoft.com](https://azure.microsoft.com) (pide tarjeta).
2. En el portal buscá **SQL databases** → **+ Crear**. Si aparece el cartel de la oferta gratuita (*Apply offer*), **no lo apliques**: esa base se duerme y la tienda tarda hasta un minuto en responder.
3. Pestaña **Básico**:
   - **Grupo de recursos**: *Crear nuevo* → `rg-creaciones-alma`
   - **Nombre de la base de datos**: `CreacionesAlmaDB`
   - **Servidor**: *Crear nuevo*
     - **Nombre del servidor**: `creaciones-alma-sql-br` (si está tomado, probá otro y anotá el que quede)
     - **Ubicación**: **(South America) Brazil South**
     - **Método de autenticación**: *Usar autenticación de SQL*
     - **Inicio de sesión del administrador**: `almaadmin`
     - **Contraseña**: una larga. **Guardala**: es la llave maestra de la base.
   - **¿Grupo elástico de SQL?**: No · **Entorno de carga de trabajo**: Producción
   - **Proceso y almacenamiento**: *Configurar base de datos* → **Nivel de servicio: Básico** (5 DTU, 2 GB) → Aplicar. Tiene que decir ~USD 5,93/mes.
   - **Redundancia de copias de seguridad**: *redundancia local* (la más barata, alcanza)
4. Pestaña **Redes**: *Punto de conexión público* · *Permitir que los servicios y recursos de Azure accedan*: **No** · *Agregar dirección IP del cliente actual*: **Sí** · Directiva de conexión: *Predeterminado* · TLS mínima: 1.2
5. Pestaña **Seguridad**: Microsoft Defender para SQL → **Ahora no** (cuesta USD 15/mes después de la prueba).
6. Pestaña **Configuración adicional**: Usar datos existentes **Ninguno** · **Intercalación: `Modern_Spanish_CI_AS`** (no se puede cambiar después).
7. **Revisar y crear** → **Crear**. Si la pantalla de implementación se queda trabada, mirá el servidor → **Registro de actividad**: a veces la base ya está creada y la pantalla no se actualizó.

### Usuario de la app (con menos permisos que el admin de la base)

El backend no tiene que usar la llave maestra. En el portal, entrá a la base **CreacionesAlmaDB** → **Editor de consultas (versión preliminar)** → iniciá sesión con `almaadmin`. Pegá esto, **cambiando la contraseña** por otra nueva y larga (sin comillas simples), y apretá **Ejecutar**:

```sql
CREATE USER creaciones_app WITH PASSWORD = 'PONÉ-ACÁ-UNA-CONTRASEÑA-LARGA';
ALTER ROLE db_datareader ADD MEMBER creaciones_app;
ALTER ROLE db_datawriter ADD MEMBER creaciones_app;
```

Guardá esa contraseña: es la que va a usar el backend (`DB_PASSWORD`).

Las copias de seguridad son automáticas: Azure guarda 7 días y permite volver a cualquier momento de esa semana (*Restaurar* en la base).

---

## Paso 2 — Crear las tablas y el primer administrador

Desde tu compu, en una terminal **PowerShell**, dentro de la carpeta `backend` del proyecto. Estas variables valen solo para esa ventana y tienen prioridad sobre tu `.env` local, que no se toca:

```powershell
$env:DB_SERVER = "creaciones-alma-sql-br.database.windows.net"
$env:DB_DATABASE = "CreacionesAlmaDB"
$env:DB_USER = "almaadmin"
$env:DB_ENCRYPT = "true"
$env:DB_TRUST_CERT = "false"
```

Y esta línea, **copiada tal cual** (no cambies el texto entre comillas: es la pregunta, no la contraseña). Cuando la ejecutes, te pide la contraseña maestra y la escribís ahí, sin que se vea en pantalla ni quede en el historial:

```powershell
$s = Read-Host "Contraseña de almaadmin" -AsSecureString; $env:DB_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s))
```

Después:

```powershell
node scripts/preparar-base.js
```

Tiene que terminar con algo como: `Listo: 18 tablas, 5 categorías, 6 ocasiones, 0 administradores. Tienda CERRADA al público.`

Y para crear tu usuario administrador (te pide email, nombre y contraseña; la contraseña se ve como asteriscos):

```powershell
node scripts/crear-admin.js
```

Repetilo para la cuenta de tu cliente. También se puede hacer después desde el panel: Usuarios → *Hacer admin*, pero con la tienda cerrada nadie puede registrarse, así que el primero tiene que salir de acá.

Al terminar, cerrá esa ventana de PowerShell (así se borran las variables).

---

## Paso 3 — Backend en Azure App Service

### 3.1 Crear la aplicación web

En el portal buscá **App Services** → **+ Crear** → **Aplicación web**:

- **Básico**:
  - **Grupo de recursos**: `rg-creaciones-alma`
  - **Nombre**: `creaciones-alma-api`. Azure le agrega un código a la dirección (algo como `creaciones-alma-api-xxxx.brazilsouth-01.azurewebsites.net`): es normal, anotá la dirección completa. Si el nombre está tomado, elegí otro **y cambiá `AZURE_WEBAPP_NAME` en `.github/workflows/deploy-backend.yml`**.
  - **Publicar**: Código · **Pila del entorno en tiempo de ejecución**: **Node 22 LTS** · **Sistema operativo**: Linux
  - **Región**: **Brazil South** (la misma que la base)
  - **Plan de Linux**: *Crear nuevo* → `plan-creaciones-alma` · **Plan de precios**: **Básico B1** (~USD 14,60/mes). No uses el gratis (F1): se duerme y tiene un límite de uso diario.
    - Si al crear sale **"Operation cannot be completed without additional quota"**, la suscripción tiene un límite de servidores en esa región. Dos salidas: pedir más cuota (Ayuda y soporte → *Límites de servicio y suscripción (cuotas)* → App Service, Brazil South), o usar un plan **B1 que ya tengas** en Brazil South: un mismo plan puede tener varias aplicaciones sin costo extra. *(Hoy la tienda usa el plan `plan-gondola`, en B1, compartido con otro proyecto.)*
  - Redundancia de zona: deshabilitada
- **Implementación**: Implementación continua **Deshabilitada** (la publica GitHub con el workflow del repo) · **Autenticación básica**: **Habilitada** (la necesita el perfil de publicación del paso 3.5)
- **Base de datos**: no crear ninguna (ya está la del paso 1)
- **Redes**: acceso público **Activado**
- **Supervisión**: Application Insights **No** (tiene costo aparte)
- **Revisar y crear** → **Crear**.

### 3.2 Configuración general

En la aplicación web → **Configuración** → **Configuración general** (o *Configuración → General*):

- **Siempre activado (Always On)**: **Activado** (si no, se duerme)
- **Solo HTTPS**: **Activado** · **Versión mínima de TLS**: 1.2
- **Comando de inicio**: vacío (usa `npm start`)
- **Credenciales de autenticación básica de SCM**: activadas (las usa GitHub) · **de FTP**: desactivadas · **Estado FTP**: Deshabilitado
- **Guardar**

Y en **Supervisión** → **Comprobación de estado**: **Habilitar** · Ruta: `/api/health` → Guardar.

### 3.3 Variables de entorno

En la aplicación web → **Configuración** → **Variables de entorno** → pestaña **Configuración de la aplicación** → **Edición avanzada**. Reemplazá todo el contenido por esto y completá **solo** los valores que dicen `COMPLETAR` (con los datos reales, sin dejar espacios ni comillas extra):

```json
[
  { "name": "NODE_ENV", "value": "production", "slotSetting": false },
  { "name": "TRUST_PROXY", "value": "1", "slotSetting": false },
  { "name": "SCM_DO_BUILD_DURING_DEPLOYMENT", "value": "true", "slotSetting": false },
  { "name": "DB_SERVER", "value": "creaciones-alma-sql-br.database.windows.net", "slotSetting": false },
  { "name": "DB_DATABASE", "value": "CreacionesAlmaDB", "slotSetting": false },
  { "name": "DB_USER", "value": "creaciones_app", "slotSetting": false },
  { "name": "DB_PASSWORD", "value": "COMPLETAR (contraseña de creaciones_app)", "slotSetting": false },
  { "name": "DB_ENCRYPT", "value": "true", "slotSetting": false },
  { "name": "DB_TRUST_CERT", "value": "false", "slotSetting": false },
  { "name": "JWT_SECRET", "value": "COMPLETAR (clave aleatoria, ver abajo)", "slotSetting": false },
  { "name": "FRONTEND_URL", "value": "https://creacionesalma.com.ar", "slotSetting": false },
  { "name": "BACKEND_URL", "value": "https://api.creacionesalma.com.ar", "slotSetting": false },
  { "name": "CORS_ORIGINS", "value": "https://creacionesalma.com.ar,https://www.creacionesalma.com.ar", "slotSetting": false },
  { "name": "RESEND_API_KEY", "value": "COMPLETAR (la de tu backend/.env)", "slotSetting": false },
  { "name": "EMAIL_FROM", "value": "Creaciones Alma <hola@creacionesalma.com.ar>", "slotSetting": false },
  { "name": "EMAIL_REPLY_TO", "value": "hola@creacionesalma.com.ar", "slotSetting": false },
  { "name": "ADMIN_EMAIL", "value": "COMPLETAR (donde llegan los avisos de pedidos)", "slotSetting": false },
  { "name": "CLOUDINARY_CLOUD_NAME", "value": "COMPLETAR (la de tu backend/.env)", "slotSetting": false },
  { "name": "CLOUDINARY_API_KEY", "value": "COMPLETAR (la de tu backend/.env)", "slotSetting": false },
  { "name": "CLOUDINARY_API_SECRET", "value": "COMPLETAR (la de tu backend/.env)", "slotSetting": false },
  { "name": "CLOUDINARY_FOLDER", "value": "creaciones-alma", "slotSetting": false },
  { "name": "CORREOARGENTINO_BASE_URL", "value": "https://api.correoargentino.com.ar/micorreo/v1", "slotSetting": false }
]
```

- **`JWT_SECRET`**: una clave larga y aleatoria. Para generarla, en PowerShell corré esto: la copia al portapapeles sin mostrarla, y la pegás en el valor.
  ```powershell
  $b = New-Object byte[] 48; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b) | Set-Clipboard
  ```
- **Mercado Pago** (`MERCADOPAGO_ACCESS_TOKEN`) y **Correo Argentino** (`CORREOARGENTINO_API_USER` / `CORREOARGENTINO_API_PASSWORD`) se agregan más adelante (paso 5 y *Pendientes*). Sin ellas el backend funciona; solo no anda pagar con Mercado Pago ni cotizar envíos.
- **Aceptar** → arriba **Aplicar** → confirmar. La aplicación se reinicia.

### 3.4 Dejar entrar al backend en la base

El App Service sale a internet desde un grupo de direcciones IP propias, y el firewall de la base tiene que permitirlas. Lo más simple es cargarlas todas de una con **Cloud Shell** (el ícono `>_` arriba a la derecha del portal → **Bash**; si pregunta por almacenamiento, elegí *No se requiere cuenta de almacenamiento*). Pegá esto:

```bash
APP=creaciones-alma-api; RG=rg-creaciones-alma; SQL=creaciones-alma-sql-br
for ip in $(az webapp show -g $RG -n $APP --query possibleOutboundIpAddresses -o tsv | tr ',' ' '); do
  az sql server firewall-rule create -g $RG -s $SQL -n "app-${ip//./-}" --start-ip-address $ip --end-ip-address $ip -o none && echo "✔ $ip"
done
```

Tiene que listar varias IP con ✔. Si cambiaste el nombre de la aplicación o del servidor, ajustá la primera línea.

### 3.5 Publicar el backend desde GitHub

1. En la aplicación web → **Información general** → arriba **Descargar perfil de publicación**. Se baja un archivo `.PublishSettings`. **Es secreto**: no lo subas al repo ni lo compartas.
2. En GitHub → el repositorio → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:
   - **Name**: `AZURE_WEBAPP_PUBLISH_PROFILE`
   - **Secret**: abrí el archivo con el Bloc de notas y pegá **todo** el contenido.
   - **Add secret**. Después borrá el archivo de tu compu.
3. GitHub → **Actions** → **Deploy backend a Azure** → **Run workflow** → *main* → Run. Tarda unos minutos (Azure instala las dependencias).
4. Probá en el navegador `https://<la dirección completa de la app>/api/health` (está en *Información general* → *Dominio predeterminado*): tiene que decir `"status":"ok"`. La primera vez puede tardar un minuto en arrancar.

Desde ahora, **cada merge a `main` que toque `backend/` se publica solo**.

### 3.6 Dirección propia: api.creacionesalma.com.ar

1. En la aplicación web → **Configuración** → **Dominios personalizados** → **+ Agregar dominio personalizado**:
   - **Proveedor de dominio**: *Todos los demás servicios de dominio*
   - **Certificado TLS/SSL**: *Certificado administrado de App Service* (gratis)
   - **Dominio**: `api.creacionesalma.com.ar`
   - Azure muestra dos registros para crear: un **CNAME** (`api` → la dirección completa de la app, con el código) y un **TXT** (`asuid.api` → un código).
2. En Cloudflare → tu dominio → **DNS** → **Records**:
   - Si ya existe el CNAME `api`, **editalo**; si no, creálo: Name `api` · Target: la dirección completa de la app · **Proxy status: DNS only** (nube gris).
   - Agregá el TXT: Name `asuid.api` · Content: el código que mostró Azure.
3. Volvé a Azure → **Validar** → **Agregar**. El certificado tarda unos minutos.
4. Probá `https://api.creacionesalma.com.ar/api/health`.

---

## Paso 4 — Tienda en Cloudflare Pages

1. En Cloudflare: **Workers & Pages** → **Create** → pestaña **Pages** → **Connect to Git** → elegí el repositorio.
   Si te ofrece crear un *Worker*, buscá la opción de **Pages**: es la que usa esta guía.
2. Configuración del build:
   - **Production branch**: `main`
   - **Framework preset**: *Vite* (o *None*)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory (advanced)**: `frontend`
3. **Environment variables** (Production):

   | Variable | Valor |
   |---|---|
   | `VITE_API_URL` | `https://api.creacionesalma.com.ar/api` |
   | `VITE_SITE_URL` | `https://creacionesalma.com.ar` |
   | `NODE_VERSION` | `22.18.0` |

   Opcionales, solo si querés medir visitas y campañas: `VITE_GA_ID` (Google Analytics) y `VITE_META_PIXEL_ID` (píxel de Meta).
4. **Save and Deploy**. Cuando termine te da una dirección `*.pages.dev` para probar.
5. **Custom domains** → *Set up a domain* → `creacionesalma.com.ar` → Cloudflare crea el registro DNS solo. Repetí con `www.creacionesalma.com.ar`.
6. Para que `www` lleve al dominio principal: Cloudflare → tu dominio → **Rules** → **Redirect Rules** → *Create rule* → plantilla **"Redirect from WWW to root"** → Deploy.

---

## Paso 5 — Mercado Pago en producción

1. Entrá a [mercadopago.com.ar/developers](https://www.mercadopago.com.ar/developers) → **Tus integraciones** → tu aplicación.
2. **Credenciales de producción** → activalas (te pide completar algunos datos del negocio y aceptar condiciones).
3. Copiá el **Access Token de producción** y agregalo en Azure → la aplicación web → **Configuración** → **Variables de entorno** → **+ Agregar**: nombre `MERCADOPAGO_ACCESS_TOKEN`, valor el token → Aplicar. La aplicación se reinicia sola.

Los avisos de pago (webhook) no hay que configurarlos en el panel de Mercado Pago: el backend le indica la dirección en cada compra.

**La cuenta de Mercado Pago tiene que ser la de quien cobra** (tu cliente). Si las credenciales son de otra cuenta, la plata va a esa cuenta.

---

## Paso 6 — Comprobar que todo anda

Con la tienda todavía cerrada:

- [ ] `https://creacionesalma.com.ar` muestra la página **"Próximamente"**.
- [ ] `https://www.creacionesalma.com.ar` redirige al dominio sin `www`.
- [ ] **Ingresar** con el admin del paso 2 → se ve la tienda con la franja *"Sitio cerrado al público"*.
- [ ] Panel → **Configuración**: completar los datos de transferencia (alias y titular **de tu cliente**), datos legales (razón social, CUIT, domicilio), textos y redes.
- [ ] Panel → Productos: crear uno de prueba **con foto** (prueba Cloudinary).
- [ ] Suscribirse al newsletter desde la página de Próximamente con un email tuyo → tiene que llegar el mail con el cupón (prueba Resend).
- [ ] Compra de prueba **real y chiquita** con Mercado Pago, logueado como admin → el pedido aparece pagado en el panel y llega el mail.
- [ ] Borrar el producto de prueba.

## Paso 7 — Abrir la tienda

1. Tu cliente carga productos, fotos, precios y ocasiones (con la tienda cerrada).
2. Panel → Configuración → **Abrir la tienda al público**.
3. Cloudflare → Workers & Pages → tu proyecto → **Deployments** → en el último, **Retry deployment**. Así el `sitemap.xml` se genera de nuevo, ahora con los productos: con la tienda cerrada sale sin ellos.
4. [Google Search Console](https://search.google.com/search-console) → *Agregar propiedad* → tipo **Dominio** → `creacionesalma.com.ar` → te da un registro **TXT** → cargalo en Cloudflare → DNS → Verificar → **Sitemaps** → enviar `https://creacionesalma.com.ar/sitemap.xml`.

---

## Pendientes conocidos

- **Correo Argentino**: la cotización de envíos necesita una cuenta de **MiCorreo** (usuario y contraseña de la API) y, en el panel → Configuración, el *customer id* y el código postal de origen. Sin eso, el checkout no puede calcular envíos a domicilio.
- **Base de datos local**: tu SQL Server local sigue siendo solo para desarrollo. Producción arranca vacía (sin los productos ni pedidos de prueba).

## Si algo falla

- **El backend no responde**: Azure → la aplicación web → **Supervisión** → **Secuencia de registro** (log stream). Si dice `No se pudo conectar a SQL Server`, revisá las reglas de firewall de la base (paso 3.4) y las variables `DB_*` (paso 3.3). Si GitHub Actions falla al publicar, revisá el secreto `AZURE_WEBAPP_PUBLISH_PROFILE` y que la *Autenticación básica* esté habilitada (Configuración → Configuración general).
- **La tienda carga pero no muestra datos / errores de red**: revisá que `VITE_API_URL` en Cloudflare Pages sea `https://api.creacionesalma.com.ar/api` y volvé a desplegar (las variables de Vite se aplican al construir, no en vivo).
- **Errores de CORS en la consola del navegador**: la dirección desde la que entrás tiene que estar en `CORS_ORIGINS` (Azure → Variables de entorno).
- **Cambiaste una variable en Azure**: la aplicación se reinicia sola al aplicar. **En Cloudflare Pages** hay que hacer *Retry deployment* para que tome el cambio.
