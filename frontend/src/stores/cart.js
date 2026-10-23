import { defineStore } from 'pinia'
import { registrarAgregadoAlCarrito } from '../analitica'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: JSON.parse(localStorage.getItem('cart')) || []
  }),

  getters: {
    total: (state) => state.items.reduce((acc, i) => acc + i.precio * i.cantidad, 0),
    // Lo que se ahorra por ofertas (precio de lista - precio cobrado)
    ahorroOfertas: (state) => state.items.reduce((acc, i) => acc + Math.max((i.precioLista ?? i.precio) - i.precio, 0) * i.cantidad, 0),
    cantidadItems: (state) => state.items.reduce((acc, i) => acc + i.cantidad, 0)
  },

  actions: {
    agregarProducto(producto, cantidad = 1) {
      const existente = this.items.find(i => i.productoId === producto.Id)
      if (existente) {
        existente.cantidad += cantidad
      } else {
        this.items.push({
          productoId: producto.Id,
          nombre: producto.Nombre,
          // Se guarda el precio vigente (con oferta) y el de lista para mostrar el ahorro
          precio: producto.PrecioFinal ?? producto.Precio,
          precioLista: producto.Precio,
          imagen: producto.ImagenPrincipalUrl,
          cantidad
        })
      }
      this._persistir()
      registrarAgregadoAlCarrito({
        productoId: producto.Id, nombre: producto.Nombre, precio: producto.PrecioFinal ?? producto.Precio, cantidad
      })
    },

    // Actualiza precios y nombres con los datos actuales del catálogo (una oferta pudo empezar o
    // terminar desde que se agregó al carrito). El total real igual lo calcula el servidor
    actualizarDesdeCatalogo(productos) {
      const porId = new Map(productos.map(p => [p.Id, p]))
      this.items = this.items
        .filter(i => porId.has(i.productoId))
        .map(i => {
          const p = porId.get(i.productoId)
          return { ...i, nombre: p.Nombre, precio: p.PrecioFinal ?? p.Precio, precioLista: p.Precio, imagen: p.ImagenPrincipalUrl }
        })
      this._persistir()
    },

    cambiarCantidad(productoId, cantidad) {
      const item = this.items.find(i => i.productoId === productoId)
      if (item) {
        item.cantidad = cantidad
        if (item.cantidad <= 0) this.quitarProducto(productoId)
      }
      this._persistir()
    },

    quitarProducto(productoId) {
      this.items = this.items.filter(i => i.productoId !== productoId)
      this._persistir()
    },

    vaciar() {
      this.items = []
      this._persistir()
    },

    _persistir() {
      localStorage.setItem('cart', JSON.stringify(this.items))
    }
  }
})