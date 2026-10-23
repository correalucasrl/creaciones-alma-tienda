<template>
  <div class="admin-pagina">
    <header class="admin-encabezado">
      <div>
        <h1 class="admin-titulo">Usuarios</h1>
        <p class="admin-descripcion">Cuentas registradas en la tienda.</p>
      </div>
    </header>

    <div class="table-responsive">
      <table class="table align-middle bg-white admin-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Cuenta</th>
            <th>Comentarios</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in usuarios" :key="u.Id">
            <td class="fw-semibold">{{ u.Nombre }}</td>
            <td>{{ u.Email }}</td>
            <td>
              <span class="badge-estado" :class="u.Rol === 'Admin' ? 'estado-entregado' : 'estado-inactivo'">
                {{ u.Rol === 'Admin' ? 'Administrador' : 'Cliente' }}
              </span>
            </td>
            <td>
              <span class="badge-estado" :class="u.Activo ? 'estado-activo' : 'estado-inactivo'">
                {{ u.Activo ? 'Activa' : 'Bloqueada' }}
              </span>
            </td>
            <td>
              <span class="badge-estado" :class="u.PuedeComentar ? 'estado-activo' : 'estado-inactivo'">
                {{ u.PuedeComentar ? 'Permitidos' : 'Bloqueados' }}
              </span>
            </td>
            <td>
              <div class="d-flex flex-wrap gap-2">
              <button
                class="btn btn-sm"
                :class="u.Activo ? 'btn-outline-danger' : 'btn-outline-success'"
                @click="toggleActivo(u)"
              >
                {{ u.Activo ? 'Bloquear cuenta' : 'Desbloquear cuenta' }}
              </button>
              <button
                class="btn btn-sm"
                :class="u.PuedeComentar ? 'btn-outline-secondary' : 'btn-outline-success'"
                @click="toggleComentarios(u)"
              >
                {{ u.PuedeComentar ? 'Bloquear comentarios' : 'Permitir comentarios' }}
              </button>
              <button
                v-if="u.Id !== auth.usuario?.Id"
                class="btn btn-sm btn-outline-secondary"
                @click="cambiarRol(u)"
              >
                {{ u.Rol === 'Admin' ? 'Quitar admin' : 'Hacer admin' }}
              </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue'
import api from '../services/api'
import { useAuthStore } from '../stores/auth'

const usuarios = ref([])
const mostrarToast = inject('mostrarToast')
const mostrarConfirm = inject('mostrarConfirm')
const auth = useAuthStore()

onMounted(async () => {
  await cargar()
})

async function cargar() {
  const { data } = await api.get('/usuarios/admin/todos')
  usuarios.value = data
}

async function toggleActivo(u) {
  try {
    await api.put(`/usuarios/admin/${u.Id}/activo`, { activo: !u.Activo })
    mostrarToast(u.Activo ? 'Cuenta bloqueada' : 'Cuenta desbloqueada ✅')
    await cargar()
  } catch (err) {
    mostrarToast(err.response?.data?.error || 'Error al actualizar')
  }
}

async function toggleComentarios(u) {
  try {
    await api.put(`/usuarios/admin/${u.Id}/comentarios`, { puedeComentar: !u.PuedeComentar })
    mostrarToast(u.PuedeComentar ? 'Comentarios bloqueados' : 'Comentarios permitidos ✅')
    await cargar()
  } catch (err) {
    mostrarToast(err.response?.data?.error || 'Error al actualizar')
  }
}

async function cambiarRol(u) {
  const hacerAdmin = u.Rol !== 'Admin'
  const ok = await mostrarConfirm(hacerAdmin
    ? {
        titulo: `¿Hacer administrador a ${u.Nombre}?`,
        mensaje: 'Va a poder entrar al panel y cambiar productos, precios, pedidos, cupones y la configuración del sitio. Tiene que volver a iniciar sesión para ver el panel.',
        textoConfirmar: 'Sí, hacer admin'
      }
    : {
        titulo: `¿Quitarle el rol de administrador a ${u.Nombre}?`,
        mensaje: 'Va a quedar como cliente y ya no va a poder entrar al panel.',
        textoConfirmar: 'Sí, quitar admin'
      })
  if (!ok) return
  try {
    await api.put(`/usuarios/admin/${u.Id}/rol`, { admin: hacerAdmin })
    mostrarToast(hacerAdmin ? `${u.Nombre} ahora es administrador ✅` : `${u.Nombre} ya no es administrador`)
    await cargar()
  } catch (err) {
    mostrarToast(err.response?.data?.error || 'Error al actualizar')
  }
}
</script>
