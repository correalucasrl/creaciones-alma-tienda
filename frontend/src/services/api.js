import axios from 'axios'

const api = axios.create({
  // En producción definí VITE_API_URL en frontend/.env.production (ej: https://api.creacionesalma.com.ar/api)
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Si una sesión guardada deja de valer (token vencido o cuenta deshabilitada por el admin),
// se cierra la sesión y se manda al login. El login con contraseña incorrecta también
// devuelve 401, pero ese pedido no lleva token, así que no entra acá
api.interceptors.response.use(
  respuesta => respuesta,
  async error => {
    const llevabaToken = !!error.config?.headers?.Authorization
    if (error.response?.status === 401 && llevabaToken) {
      const { useAuthStore } = await import('../stores/auth')
      useAuthStore().logout()
      if (window.location.pathname !== '/login') {
        window.location.assign('/login?sesion=expirada')
      }
    }
    return Promise.reject(error)
  }
)

export default api