<template>
  <div class="admin-pagina">
    <header class="admin-encabezado">
      <div>
        <h1 class="admin-titulo">Categorías</h1>
        <p class="admin-descripcion">Organizan la tienda y sus filtros.</p>
      </div>
    </header>

    <div class="row mb-4">
      <div class="col-12 col-md-8">
        <div class="form-card p-4">
          <h6 class="fw-bold mb-3">{{ editando ? 'Editar categoría' : 'Nueva categoría' }}</h6>

          <div v-if="error" class="alert alert-danger py-2 small">{{ error }}</div>

          <form @submit.prevent="guardar">
            <div class="row g-2">
              <div class="col-12 col-md-3">
                <label class="form-label small fw-semibold">Nombre</label>
                <input v-model="form.nombre" @input="autoSlug" class="form-control" required />
              </div>
              <div class="col-12 col-md-3">
                <label class="form-label small fw-semibold">Slug (url)</label>
                <input v-model="form.slug" class="form-control" required />
              </div>
              <div class="col-12 col-md-4">
                <SubidaImagen v-model="form.iconoUrl" label="Ícono/imagen (opcional)" />
              </div>
              <div class="col-12 col-md-2 d-flex align-items-end">
                <button type="submit" class="btn btn-turquesa w-100">
                  {{ editando ? 'Guardar' : 'Crear' }}
                </button>
              </div>
            </div>
            <button v-if="editando" type="button" class="btn btn-link btn-sm text-secondary mt-2 p-0" @click="cancelarEdicion">
              Cancelar edición
            </button>
          </form>
        </div>
      </div>
    </div>

    <div class="table-responsive">
      <table class="table align-middle bg-white admin-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Nombre</th>
            <th>Slug</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cat in categorias" :key="cat.Id">
            <td>{{ cat.Id }}</td>
            <td class="fw-semibold">{{ cat.Nombre }}</td>
            <td class="text-secondary small">{{ cat.Slug }}</td>
            <td>
              <span class="badge-estado" :class="cat.Activo ? 'estado-activo' : 'estado-inactivo'">
                {{ cat.Activo ? 'Activa' : 'Inactiva' }}
              </span>
            </td>
            <td>
            <button class="btn btn-sm btn-outline-secondary me-2" @click="editar(cat)">
                <i class="bi bi-pencil"></i>
            </button>
            <button v-if="cat.Activo" class="btn btn-sm btn-outline-danger" @click="eliminar(cat)">
                <i class="bi bi-trash"></i>
            </button>
            <button v-else class="btn btn-sm btn-outline-success" @click="reactivar(cat)">
                <i class="bi bi-arrow-counterclockwise"></i>
            </button>
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
import SubidaImagen from '../components/SubidaImagen.vue'

const categorias = ref([])
const form = ref({ nombre: '', slug: '', iconoUrl: '' })
const editando = ref(null)
const error = ref('')
const mostrarToast = inject('mostrarToast')
const mostrarConfirm = inject('mostrarConfirm')

onMounted(cargarCategorias)

async function cargarCategorias() {
  const { data } = await api.get('/categorias/admin/todas')
  categorias.value = data
}

async function reactivar(cat) {
  try {
    await api.put(`/categorias/admin/${cat.Id}/reactivar`)
    mostrarToast('Categoría reactivada ✅')
    await cargarCategorias()
  } catch (err) {
    alert(err.response?.data?.error || 'Error al reactivar')
  }
}

function autoSlug() {
  if (!editando.value) {
    form.value.slug = form.value.nombre
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // saca acentos
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }
}

async function guardar() {
  error.value = ''
  try {
    if (editando.value) {
      await api.put(`/categorias/${editando.value}`, { ...form.value, activo: true })
      mostrarToast('Categoría actualizada ✅')
    } else {
      await api.post('/categorias', form.value)
      mostrarToast('Categoría creada 🎉')
    }
    form.value = { nombre: '', slug: '', iconoUrl: '' }
    editando.value = null
    await cargarCategorias()
  } catch (err) {
    error.value = err.response?.data?.error || 'Error al guardar'
  }
}

function editar(cat) {
  form.value = { nombre: cat.Nombre, slug: cat.Slug, iconoUrl: cat.IconoUrl || '' }
  editando.value = cat.Id
}

function cancelarEdicion() {
  form.value = { nombre: '', slug: '', iconoUrl: '' }
  editando.value = null
}

async function eliminar(cat) {
  const ok = await mostrarConfirm({
    titulo: '¿Eliminar categoría?',
    mensaje: `Estás por eliminar "${cat.Nombre}". Esta acción se puede revertir después.`,
    esError: false
  })

  if (!ok) return

  try {
    await api.delete(`/categorias/${cat.Id}`)
    mostrarToast('Categoría eliminada')
    await cargarCategorias()
  } catch (err) {
    const data = err.response?.data
    if (data?.productos) {
      await mostrarConfirm({
        titulo: 'No se puede eliminar',
        mensaje: `"${cat.Nombre}" tiene ${data.productos.length} producto(s) asociado(s):`,
        items: data.productos.map(p => ({ nombre: p.Nombre, precio: p.Precio })),
        esError: true,
        soloInfo: true
      })
    } else {
      await mostrarConfirm({
        titulo: 'Error',
        mensaje: data?.error || 'Error al eliminar',
        esError: true,
        soloInfo: true
      })
    }
  }
}
</script>
