import { defineStore } from 'pinia'
import api from '../services/api'

// Carga en curso: la usan App.vue y el router, así la configuración se pide una sola vez
let cargaEnCurso = null

// La última configuración recibida se guarda en el navegador: así la página arranca al instante
// (sin esperar al backend) y sin mostrar por un momento algo equivocado, como la navbar con la
// tienda cerrada. Después se confirma con el backend en segundo plano
const CLAVE_GUARDADA = 'configuracion'

function leerGuardada() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_GUARDADA)) || null
  } catch {
    return null
  }
}

export const useConfigStore = defineStore('config', {
  state: () => {
    const guardada = leerGuardada()
    return {
      valores: guardada || {},
      // true cuando ya llegó la respuesta del backend en esta visita
      cargado: false,
      // true cuando hay algún dato para mostrar (guardado de una visita anterior o recién llegado)
      conocido: Boolean(guardada)
    }
  },

  getters: {
    // "Modo próximamente": con '0' solo los admin ven la tienda. Sin la clave, el sitio está abierto
    sitioAbierto: (state) => state.valores.sitio_abierto !== '0'
  },

  actions: {
    cargar() {
      cargaEnCurso ??= api.get('/configuracion')
        .then(({ data }) => {
          this.valores = data
          this.cargado = true
          this.conocido = true
          try { localStorage.setItem(CLAVE_GUARDADA, JSON.stringify(data)) } catch { /* sin almacenamiento, no pasa nada */ }
        })
        .catch(err => {
          console.error('No se pudo cargar la configuración:', err)
          cargaEnCurso = null
        })
      return cargaEnCurso
    },

    // Al iniciar o cerrar sesión: con el sitio cerrado, un admin recibe la configuración completa
    recargar() {
      cargaEnCurso = null
      return this.cargar()
    },

    async guardar(nuevosValores) {
      await api.put('/configuracion', nuevosValores)
      this.valores = { ...this.valores, ...nuevosValores }
      // En el navegador solo quedan las claves públicas (el formulario del panel trae también las privadas)
      try {
        const publicas = Object.keys(leerGuardada() || {})
        const aGuardar = Object.fromEntries(Object.entries(this.valores).filter(([clave]) => publicas.includes(clave)))
        localStorage.setItem(CLAVE_GUARDADA, JSON.stringify(aGuardar))
      } catch { /* idem */ }
    }
  }
})
