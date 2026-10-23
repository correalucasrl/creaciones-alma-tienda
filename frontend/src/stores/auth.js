import { defineStore } from 'pinia'
import api from '../services/api'
import { useConfigStore } from './config'

// Verificación en curso de la sesión guardada (se hace una vez por carga de la página)
let verificacion = null

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    usuario: JSON.parse(localStorage.getItem('usuario')) || null
  }),

  getters: {
    estaLogueado: (state) => !!state.token,
    esAdmin: (state) => state.usuario?.Rol === 'Admin'
  },

  actions: {
    // Lo guardado en el navegador se puede editar a mano: el rol real se le pregunta al backend.
    // Si el token no vale, el interceptor de la API cierra la sesión
    verificarSesion() {
      if (!this.token) return Promise.resolve()
      verificacion ??= api.get('/auth/yo')
        .then(({ data }) => {
          this.usuario = data.usuario
          localStorage.setItem('usuario', JSON.stringify(data.usuario))
        })
        .catch(() => {})
      return verificacion
    },

    async login(email, password) {
      const { data } = await api.post('/auth/login', { email, password })
      this._guardarSesion(data)
      await useConfigStore().recargar()
      return data
    },

    async registro(nombre, email, password, telefono, aceptaTerminos) {
      const { data } = await api.post('/auth/registro', { nombre, email, password, telefono, aceptaTerminos })
      this._guardarSesion(data)
      return data
    },

    logout() {
      verificacion = null
      this.token = null
      this.usuario = null
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
    },

    _guardarSesion(data) {
      // La sesión recién iniciada ya viene confirmada por el backend
      verificacion = Promise.resolve()
      this.token = data.token
      this.usuario = data.usuario
      localStorage.setItem('token', data.token)
      localStorage.setItem('usuario', JSON.stringify(data.usuario))
    }
  }
})