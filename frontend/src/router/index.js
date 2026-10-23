import { createRouter, createWebHistory } from 'vue-router'
// El inicio va en el archivo principal; el resto de las páginas se descarga recién al visitarlas
import HomeView from '../views/HomeView.vue'
const LoginView = () => import('../views/LoginView.vue')
const RegistroView = () => import('../views/RegistroView.vue')
const CheckoutView = () => import('../views/CheckoutView.vue')
const OrdenConfirmadaView = () => import('../views/OrdenConfirmadaView.vue')
const MisPedidosView = () => import('../views/MisPedidosView.vue')
const DetallePedidoView = () => import('../views/DetallePedidoView.vue')
// Las vistas de admin se cargan solo cuando se usan (ECharts pesa mucho y no lo necesita el público)
const AdminLayout = () => import('../components/AdminLayout.vue')
const AdminPedidosView = () => import('../views/AdminPedidosView.vue')
import { useAuthStore } from '../stores/auth'
import { useConfigStore } from '../stores/config'
const AdminCategoriasView = () => import('../views/AdminCategoriasView.vue')
const ProductosView = () => import('../views/ProductosView.vue')
const AdminProductosView = () => import('../views/AdminProductosView.vue')
const AdminGaleriaView = () => import('../views/AdminGaleriaView.vue')
const GaleriaView = () => import('../views/GaleriaView.vue')
const NosotrosView = () => import('../views/NosotrosView.vue')
const AdminConfiguracionView = () => import('../views/AdminConfiguracionView.vue')
const AdminTestimoniosView = () => import('../views/AdminTestimoniosView.vue')
const AdminUsuariosView = () => import('../views/AdminUsuariosView.vue')
const OlvidePasswordView = () => import('../views/OlvidePasswordView.vue')
const ResetearPasswordView = () => import('../views/ResetearPasswordView.vue')
const VerificarEmailView = () => import('../views/VerificarEmailView.vue')
const AdminDashboardView = () => import('../views/AdminDashboardView.vue')
const AdminFinanzasView = () => import('../views/AdminFinanzasView.vue')
const AdminArrepentimientosView = () => import('../views/AdminArrepentimientosView.vue')
const AdminCuponesView = () => import('../views/AdminCuponesView.vue')
const AdminSuscriptoresView = () => import('../views/AdminSuscriptoresView.vue')
const AdminOcasionesView = () => import('../views/AdminOcasionesView.vue')
const TerminosView = () => import('../views/TerminosView.vue')
const PrivacidadView = () => import('../views/PrivacidadView.vue')
const DevolucionesView = () => import('../views/DevolucionesView.vue')
const ArrepentimientoView = () => import('../views/ArrepentimientoView.vue')
const NoEncontradaView = () => import('../views/NoEncontradaView.vue')
const ProximamenteView = () => import('../views/ProximamenteView.vue')
const ProductoDetalleView = () => import('../views/ProductoDetalleView.vue')
const NewsletterBajaView = () => import('../views/NewsletterBajaView.vue')
const RegalosView = () => import('../views/RegalosView.vue')
import { aplicarSeo } from '../seo'
import { registrarPagina } from '../analitica'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, posicionGuardada) {
    if (posicionGuardada) return posicionGuardada
    if (to.hash) return { el: to.hash }
    return { top: 0 }
  },
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/login', name: 'login', component: LoginView, meta: { titulo: 'Iniciar sesión', noindex: true } },
    { path: '/registro', name: 'registro', component: RegistroView, meta: { titulo: 'Crear cuenta', noindex: true } },
    { path: '/checkout', name: 'checkout', component: CheckoutView, meta: { titulo: 'Finalizar compra', noindex: true } },
    { path: '/orden-confirmada/:id', name: 'orden-confirmada', component: OrdenConfirmadaView, meta: { titulo: 'Pedido confirmado', noindex: true } },
    { path: '/mis-pedidos', name: 'mis-pedidos', component: MisPedidosView, meta: { requiereAuth: true, titulo: 'Mis pedidos' } },
    { path: '/mis-pedidos/:id', name: 'detalle-pedido', component: DetallePedidoView, meta: { requiereAuth: true, titulo: 'Detalle del pedido' } },
    {
      path: '/productos', name: 'productos', component: ProductosView,
      meta: { titulo: 'Productos', descripcion: 'Fotos Polaroid, stickers, álbumes, impresiones y papelería personalizada hecha a mano. Elegí tu producto y te lo enviamos a todo el país.' }
    },
    // Título, descripción, imagen y datos estructurados los pone la vista cuando carga el producto
    { path: '/producto/:slug', name: 'producto', component: ProductoDetalleView, meta: { titulo: 'Producto' } },
    {
      path: '/regalos', name: 'regalos', component: RegalosView,
      meta: { titulo: 'Regalos por ocasión', descripcion: 'Ideas de regalos personalizados para cumpleaños, Día de la Madre, Día del Padre, aniversarios, egresados y souvenirs.' }
    },
    {
      path: '/galeria', name: 'galeria', component: GaleriaView,
      meta: { titulo: 'Galería de trabajos', descripcion: 'Mirá algunos de los trabajos personalizados que hicimos: álbumes, Polaroids, stickers y más.' }
    },
    {
      path: '/nosotros', name: 'nosotros', component: NosotrosView,
      meta: { titulo: 'Nosotros', descripcion: 'Conocé la historia de Creaciones Alma, un emprendimiento de papelería creativa de Marcos Paz.' }
    },
    {
      path: '/terminos', name: 'terminos', component: TerminosView,
      meta: { titulo: 'Términos y condiciones', descripcion: 'Condiciones de compra, precios, envíos y medios de pago de Creaciones Alma.' }
    },
    {
      path: '/privacidad', name: 'privacidad', component: PrivacidadView,
      meta: { titulo: 'Política de privacidad', descripcion: 'Qué datos personales juntamos, para qué los usamos y cómo ejercer tus derechos (Ley 25.326).' }
    },
    {
      path: '/devoluciones', name: 'devoluciones', component: DevolucionesView,
      meta: { titulo: 'Cambios, devoluciones y reembolsos', descripcion: 'Cómo hacer cambios, devoluciones y pedir reembolsos en Creaciones Alma.' }
    },
    {
      path: '/arrepentimiento', name: 'arrepentimiento', component: ArrepentimientoView,
      meta: { titulo: 'Botón de arrepentimiento', descripcion: 'Revocá tu compra dentro de los 10 días, sin costo y sin necesidad de estar registrado.' }
    },
    { path: '/olvide-password', name: 'olvide-password', component: OlvidePasswordView, meta: { titulo: 'Recuperar contraseña', noindex: true } },
    { path: '/resetear-password/:token', name: 'resetear-password', component: ResetearPasswordView, meta: { titulo: 'Nueva contraseña', noindex: true } },
    { path: '/verificar-email/:token', name: 'verificar-email', component: VerificarEmailView, meta: { titulo: 'Verificar email', noindex: true } },
    { path: '/newsletter/baja/:token', name: 'newsletter-baja', component: NewsletterBajaView, meta: { titulo: 'Baja del newsletter', noindex: true } },
    {
      path: '/admin',
      component: AdminLayout,
      meta: { requiereAdmin: true },
      children: [
        { path: '', redirect: '/admin/dashboard' },
        { path: 'pedidos', name: 'admin-pedidos', component: AdminPedidosView },
        { path: 'categorias', name: 'admin-categorias', component: AdminCategoriasView },
        { path: 'productos', name: 'admin-productos', component: AdminProductosView },
        { path: 'galeria', name: 'admin-galeria', component: AdminGaleriaView },
        { path: 'configuracion', name: 'admin-configuracion', component: AdminConfiguracionView },
        { path: 'testimonios', name: 'admin-testimonios', component: AdminTestimoniosView },
        { path: 'usuarios', name: 'admin-usuarios', component: AdminUsuariosView },
        { path: 'dashboard', name: 'admin-dashboard', component: AdminDashboardView },
        { path: 'finanzas', name: 'admin-finanzas', component: AdminFinanzasView },
        { path: 'arrepentimientos', name: 'admin-arrepentimientos', component: AdminArrepentimientosView },
        { path: 'cupones', name: 'admin-cupones', component: AdminCuponesView },
        { path: 'suscriptores', name: 'admin-suscriptores', component: AdminSuscriptoresView },
        { path: 'ocasiones', name: 'admin-ocasiones', component: AdminOcasionesView }
      ]
    },
    {
      path: '/proximamente', name: 'proximamente', component: ProximamenteView,
      meta: { titulo: 'Muy pronto', descripcion: 'La tienda de Creaciones Alma abre muy pronto.', noindex: true }
    },
    { path: '/:pathMatch(.*)*', name: 'no-encontrada', component: NoEncontradaView, meta: { titulo: 'Página no encontrada', noindex: true } }
  ]
})

// Páginas que se pueden ver aunque el sitio esté cerrado al público: el login (lo usa el admin),
// lo relacionado con la cuenta, la baja del newsletter y las páginas legales
const RUTAS_CON_SITIO_CERRADO = [
  'proximamente', 'login', 'olvide-password', 'resetear-password', 'verificar-email', 'newsletter-baja',
  'terminos', 'privacidad', 'devoluciones'
]

router.afterEach((to) => {
  const config = useConfigStore()
  aplicarSeo({
    path: to.path,
    meta: {
      ...to.meta,
      titulo: to.meta.titulo || (to.meta.requiereAdmin ? 'Administración' : undefined),
      // Con el sitio cerrado no se indexa nada: Google no tiene que guardar la tienda a medio cargar
      noindex: to.meta.noindex || to.meta.requiereAdmin || to.meta.requiereAuth || !config.sitioAbierto
    }
  })
  registrarPagina(to.fullPath, document.title)
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  const config = useConfigStore()
  // Si hay una configuración guardada de otra visita, se usa al instante y se confirma en segundo
  // plano (App.vue vuelve a evaluar la ruta si cambió). Si no hay, se espera la del backend
  const cargaConfig = config.cargar()
  await Promise.all([config.conocido ? null : cargaConfig, auth.verificarSesion()])

  if (!config.sitioAbierto && !auth.esAdmin && !RUTAS_CON_SITIO_CERRADO.includes(to.name)) {
    return { name: 'proximamente' }
  }
  if (config.sitioAbierto && to.name === 'proximamente') {
    return '/'
  }

  if (to.meta.requiereAuth && !auth.estaLogueado) {
    return '/login'
  }
  if (to.meta.requiereAdmin && !auth.esAdmin) {
    return '/'
  }
  return true
})

export default router
