import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './assets/main.css'
// Solo los componentes de Bootstrap que usa el sitio (el paquete completo pesa bastante más)
import { Carousel, Collapse, Dropdown, Offcanvas } from 'bootstrap'

window.bootstrap = { Carousel, Collapse, Dropdown, Offcanvas }

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { iniciarAnalitica } from './analitica'

iniciarAnalitica()

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')