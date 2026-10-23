const express = require('express')
const router = express.Router()
const { sql, poolPromise } = require('../db')
const { manejarError } = require('../utils/errores')
const { decorarProducto } = require('../utils/precios')
const { finDiaArgentina } = require('../utils/fechas')
const { verificarToken, verificarAdmin } = require('../middleware/authMiddleware')

// Público: todos los productos activos
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise
    const result = await pool.request()
      .query('SELECT * FROM Productos WHERE Activo = 1')
    res.json(result.recordset.map(p => decorarProducto(p)))
  } catch (err) {
    manejarError(res, err)
  }
})

// Público: solo destacados
router.get('/destacados', async (req, res) => {
  try {
    const pool = await poolPromise
    const result = await pool.request()
      .query('SELECT * FROM Productos WHERE Destacado = 1 AND Activo = 1')
    res.json(result.recordset.map(p => decorarProducto(p)))
  } catch (err) {
    manejarError(res, err)
  }
})

// Público: productos de una categoría
router.get('/categoria/:slug', async (req, res) => {
  try {
    const pool = await poolPromise
    const result = await pool.request()
      .input('slug', sql.NVarChar, req.params.slug)
      .query(`
        SELECT p.* FROM Productos p
        JOIN Categorias c ON c.Id = p.CategoriaId
        WHERE c.Slug = @slug AND p.Activo = 1
      `)
    res.json(result.recordset.map(p => decorarProducto(p)))
  } catch (err) {
    manejarError(res, err)
  }
})

// Público: productos para una ocasión (cumpleaños, Día de la Madre...)
router.get('/ocasion/:slug', async (req, res) => {
  try {
    const pool = await poolPromise
    const result = await pool.request()
      .input('slug', sql.NVarChar, req.params.slug)
      .query(`
        SELECT p.* FROM Productos p
        JOIN ProductoOcasiones po ON po.ProductoId = p.Id
        JOIN Ocasiones o ON o.Id = po.OcasionId
        WHERE o.Slug = @slug AND o.Activo = 1 AND p.Activo = 1
      `)
    res.json(result.recordset.map(p => decorarProducto(p)))
  } catch (err) {
    manejarError(res, err)
  }
})

// Valida la lista de ocasiones (ids) que manda el admin. null = no vino, no se tocan las que había
function validarOcasiones(ocasiones) {
  if (ocasiones === undefined) return null
  if (!Array.isArray(ocasiones)) throw new Error('Las ocasiones tienen que ser una lista')
  const ids = [...new Set(ocasiones.map(Number))]
  if (ids.some(id => !Number.isInteger(id) || id <= 0)) throw new Error('Alguna ocasión no es válida')
  return ids
}

async function guardarOcasiones(transaction, productoId, ids) {
  await new sql.Request(transaction)
    .input('id', sql.Int, productoId)
    .query('DELETE FROM ProductoOcasiones WHERE ProductoId = @id')
  for (const ocasionId of ids) {
    await new sql.Request(transaction)
      .input('id', sql.Int, productoId)
      .input('ocasionId', sql.Int, ocasionId)
      .query('INSERT INTO ProductoOcasiones (ProductoId, OcasionId) SELECT @id, Id FROM Ocasiones WHERE Id = @ocasionId')
  }
}

const MAX_IMAGENES_EXTRA = 8

// Valida la lista de imágenes extra que manda el admin. Devuelve null si no vino
// (así editar sin mandar "imagenes" no borra las que había), o lanza un error con mensaje
function validarImagenes(imagenes) {
  if (imagenes === undefined) return null
  if (!Array.isArray(imagenes)) throw new Error('Las imágenes tienen que ser una lista')

  const urls = [...new Set(imagenes.filter(Boolean).map(String))]
  if (urls.length > MAX_IMAGENES_EXTRA) throw new Error(`Podés cargar hasta ${MAX_IMAGENES_EXTRA} imágenes extra`)
  if (urls.some(u => !/^https:\/\//.test(u) || u.length > 255)) throw new Error('Alguna imagen tiene una URL inválida')
  return urls
}

// Reemplaza las imágenes extra de un producto, en el orden recibido
async function guardarImagenes(transaction, productoId, urls) {
  await new sql.Request(transaction)
    .input('id', sql.Int, productoId)
    .query('DELETE FROM ProductoImagenes WHERE ProductoId = @id')

  for (const [orden, url] of urls.entries()) {
    await new sql.Request(transaction)
      .input('id', sql.Int, productoId)
      .input('url', sql.NVarChar, url)
      .input('orden', sql.Int, orden)
      .query('INSERT INTO ProductoImagenes (ProductoId, Url, Orden) VALUES (@id, @url, @orden)')
  }
}

// Admin: TODOS los productos (activos e inactivos), con sus imágenes extra
router.get('/admin/todos', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const pool = await poolPromise
    const result = await pool.request().query(`
      SELECT p.*, c.Nombre AS CategoriaNombre
      FROM Productos p
      LEFT JOIN Categorias c ON c.Id = p.CategoriaId
      ORDER BY p.FechaCreacion DESC
    `)
    const imagenes = await pool.request()
      .query('SELECT ProductoId, Url FROM ProductoImagenes ORDER BY ProductoId, Orden, Id')

    const ocasiones = await pool.request()
      .query('SELECT ProductoId, OcasionId FROM ProductoOcasiones')

    const porProducto = {}
    imagenes.recordset.forEach(i => {
      (porProducto[i.ProductoId] ||= []).push(i.Url)
    })
    const ocasionesPorProducto = {}
    ocasiones.recordset.forEach(o => {
      (ocasionesPorProducto[o.ProductoId] ||= []).push(o.OcasionId)
    })

    res.json(result.recordset.map(p => decorarProducto({
      ...p,
      Imagenes: porProducto[p.Id] || [],
      Ocasiones: ocasionesPorProducto[p.Id] || []
    })))
  } catch (err) {
    manejarError(res, err)
  }
})

// Público: ficha de producto (solo activos) con su categoría, imágenes extra y productos relacionados
router.get('/detalle/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(404).json({ error: 'Producto no encontrado' })
    }

    const pool = await poolPromise
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT p.*, c.Nombre AS CategoriaNombre, c.Slug AS CategoriaSlug
        FROM Productos p
        LEFT JOIN Categorias c ON c.Id = p.CategoriaId
        WHERE p.Id = @id AND p.Activo = 1
      `)

    const producto = result.recordset[0]
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' })
    }

    const imagenes = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT Url FROM ProductoImagenes WHERE ProductoId = @id ORDER BY Orden, Id')

    const ocasiones = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT o.Nombre, o.Slug FROM ProductoOcasiones po
        JOIN Ocasiones o ON o.Id = po.OcasionId
        WHERE po.ProductoId = @id AND o.Activo = 1
        ORDER BY o.Orden, o.Nombre
      `)

    const relacionados = await pool.request()
      .input('id', sql.Int, id)
      .input('categoriaId', sql.Int, producto.CategoriaId)
      .query(`
        SELECT TOP 4 * FROM Productos
        WHERE CategoriaId = @categoriaId AND Id <> @id AND Activo = 1
        ORDER BY Destacado DESC, FechaCreacion DESC
      `)

    res.json({
      ...decorarProducto(producto),
      Imagenes: imagenes.recordset.map(i => i.Url),
      Ocasiones: ocasiones.recordset,
      Relacionados: relacionados.recordset.map(p => decorarProducto(p))
    })
  } catch (err) {
    manejarError(res, err)
  }
})

// Público/Admin: un producto puntual
router.get('/:id', async (req, res) => {
  try {
    const pool = await poolPromise
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM Productos WHERE Id = @id')

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' })
    }

    res.json(decorarProducto(result.recordset[0]))
  } catch (err) {
    manejarError(res, err)
  }
})

// Valida la oferta que carga el admin. precioOferta vacío = sin oferta.
// ofertaHasta llega como "AAAA-MM-DD" (día de Argentina) y vale hasta el final de ese día
function validarOferta(precio, precioOferta, ofertaHasta) {
  if (precioOferta === undefined || precioOferta === null || precioOferta === '') {
    return { precioOferta: null, ofertaHasta: null }
  }
  const oferta = Number(precioOferta)
  if (!(oferta > 0)) throw new Error('El precio de oferta tiene que ser mayor a cero')
  if (oferta >= Number(precio)) throw new Error('El precio de oferta tiene que ser menor al precio normal')

  let hasta = null
  if (ofertaHasta) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ofertaHasta)) throw new Error('La fecha de fin de la oferta no es válida')
    hasta = finDiaArgentina(ofertaHasta)
  }
  return { precioOferta: oferta, ofertaHasta: hasta }
}

// Admin: crear producto
router.post('/', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { nombre, descripcion, precio, stock, categoriaId, imagenPrincipalUrl, destacado, imagenes, precioOferta, ofertaHasta, ocasiones } = req.body

    if (!nombre || !precio || !categoriaId) {
      return res.status(400).json({ error: 'Nombre, precio y categoría son obligatorios' })
    }

    let urls, oferta, idsOcasiones
    try {
      urls = validarImagenes(imagenes)
      oferta = validarOferta(precio, precioOferta, ofertaHasta)
      idsOcasiones = validarOcasiones(ocasiones)
    } catch (err) {
      return res.status(400).json({ error: err.message })
    }

    const pool = await poolPromise
    const transaction = new sql.Transaction(pool)
    await transaction.begin()

    try {
      const result = await new sql.Request(transaction)
        .input('nombre', sql.NVarChar, nombre)
        .input('descripcion', sql.NVarChar, descripcion || null)
        .input('precio', sql.Decimal(10, 2), precio)
        .input('stock', sql.Int, stock || 0)
        .input('categoriaId', sql.Int, categoriaId)
        .input('imagenUrl', sql.NVarChar, imagenPrincipalUrl || null)
        .input('destacado', sql.Bit, destacado || false)
        .input('precioOferta', sql.Decimal(10, 2), oferta.precioOferta)
        .input('ofertaHasta', sql.DateTime, oferta.ofertaHasta)
        .query(`
          INSERT INTO Productos (Nombre, Descripcion, Precio, Stock, CategoriaId, ImagenPrincipalUrl, Destacado, PrecioOferta, OfertaHasta)
          OUTPUT INSERTED.*
          VALUES (@nombre, @descripcion, @precio, @stock, @categoriaId, @imagenUrl, @destacado, @precioOferta, @ofertaHasta)
        `)

      const producto = result.recordset[0]
      if (urls) await guardarImagenes(transaction, producto.Id, urls)
      if (idsOcasiones) await guardarOcasiones(transaction, producto.Id, idsOcasiones)

      await transaction.commit()
      res.json({ ...producto, Imagenes: urls || [] })
    } catch (err) {
      await transaction.rollback().catch(() => {})
      throw err
    }
  } catch (err) {
    manejarError(res, err)
  }
})

// Admin: editar producto
router.put('/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { nombre, descripcion, precio, stock, categoriaId, imagenPrincipalUrl, destacado, activo, imagenes, precioOferta, ofertaHasta, ocasiones } = req.body

    let urls, oferta, idsOcasiones
    try {
      urls = validarImagenes(imagenes)
      oferta = validarOferta(precio, precioOferta, ofertaHasta)
      idsOcasiones = validarOcasiones(ocasiones)
    } catch (err) {
      return res.status(400).json({ error: err.message })
    }

    const pool = await poolPromise
    const transaction = new sql.Transaction(pool)
    await transaction.begin()

    try {
      const result = await new sql.Request(transaction)
        .input('id', sql.Int, req.params.id)
        .input('nombre', sql.NVarChar, nombre)
        .input('descripcion', sql.NVarChar, descripcion || null)
        .input('precio', sql.Decimal(10, 2), precio)
        .input('stock', sql.Int, stock || 0)
        .input('categoriaId', sql.Int, categoriaId)
        .input('imagenUrl', sql.NVarChar, imagenPrincipalUrl || null)
        .input('destacado', sql.Bit, destacado || false)
        .input('activo', sql.Bit, activo)
        .input('precioOferta', sql.Decimal(10, 2), oferta.precioOferta)
        .input('ofertaHasta', sql.DateTime, oferta.ofertaHasta)
        .query(`
          UPDATE Productos
          SET Nombre = @nombre, Descripcion = @descripcion, Precio = @precio,
              Stock = @stock, CategoriaId = @categoriaId, ImagenPrincipalUrl = @imagenUrl,
              Destacado = @destacado, Activo = @activo,
              PrecioOferta = @precioOferta, OfertaHasta = @ofertaHasta
          WHERE Id = @id
        `)

      if (result.rowsAffected[0] === 0) {
        await transaction.rollback()
        return res.status(404).json({ error: 'Producto no encontrado' })
      }

      if (urls) await guardarImagenes(transaction, Number(req.params.id), urls)
      if (idsOcasiones) await guardarOcasiones(transaction, Number(req.params.id), idsOcasiones)

      await transaction.commit()
      res.json({ ok: true })
    } catch (err) {
      await transaction.rollback().catch(() => {})
      throw err
    }
  } catch (err) {
    manejarError(res, err)
  }
})

// Admin: eliminar producto (soft delete)
router.delete('/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const pool = await poolPromise
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('UPDATE Productos SET Activo = 0 WHERE Id = @id')

    res.json({ ok: true })
  } catch (err) {
    manejarError(res, err)
  }
})

// Admin: reactivar producto
router.put('/admin/:id/reactivar', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const pool = await poolPromise
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('UPDATE Productos SET Activo = 1 WHERE Id = @id')

    res.json({ ok: true })
  } catch (err) {
    manejarError(res, err)
  }
})

module.exports = router