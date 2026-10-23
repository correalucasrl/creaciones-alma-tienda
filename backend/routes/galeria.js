const express = require('express')
const router = express.Router()
const { sql, poolPromise } = require('../db')
const { manejarError } = require('../utils/errores')
const { verificarToken, verificarAdmin } = require('../middleware/authMiddleware')

// Agrupa filas planas (trabajo + imagen) en trabajos con un array de imágenes
function agruparTrabajos(filas) {
  const mapa = new Map()

  filas.forEach(fila => {
    if (!mapa.has(fila.Id)) {
      mapa.set(fila.Id, {
        Id: fila.Id,
        Titulo: fila.Titulo,
        Orden: fila.Orden,
        Activo: fila.Activo,
        FechaCreacion: fila.FechaCreacion,
        Imagenes: []
      })
    }
    if (fila.ImagenUrl) {
      mapa.get(fila.Id).Imagenes.push(fila.ImagenUrl)
    }
  })

  return Array.from(mapa.values())
}

// Público: listar trabajos activos con sus imágenes, ordenados
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise
    const result = await pool.request().query(`
      SELECT t.Id, t.Titulo, t.Orden, t.Activo, t.FechaCreacion, i.ImagenUrl
      FROM TrabajosGaleria t
      LEFT JOIN TrabajosGaleriaImagenes i ON i.TrabajoId = t.Id
      WHERE t.Activo = 1
      ORDER BY t.Orden, t.Id, i.Orden
    `)
    res.json(agruparTrabajos(result.recordset))
  } catch (err) {
    manejarError(res, err)
  }
})

// Admin: traer TODOS los trabajos (activos e inactivos) con sus imágenes
router.get('/admin/todos', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const pool = await poolPromise
    const result = await pool.request().query(`
      SELECT t.Id, t.Titulo, t.Orden, t.Activo, t.FechaCreacion, i.ImagenUrl
      FROM TrabajosGaleria t
      LEFT JOIN TrabajosGaleriaImagenes i ON i.TrabajoId = t.Id
      ORDER BY t.Orden, t.Id, i.Orden
    `)
    res.json(agruparTrabajos(result.recordset))
  } catch (err) {
    manejarError(res, err)
  }
})

// Admin: crear trabajo con sus imágenes
router.post('/', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { titulo, orden, imagenes } = req.body

    if (!imagenes || imagenes.length === 0) {
      return res.status(400).json({ error: 'Agregá al menos una imagen' })
    }

    const pool = await poolPromise

    const result = await pool.request()
      .input('titulo', sql.NVarChar, titulo || null)
      .input('orden', sql.Int, orden || 0)
      .query(`
        INSERT INTO TrabajosGaleria (Titulo, Orden)
        OUTPUT INSERTED.Id
        VALUES (@titulo, @orden)
      `)

    const trabajoId = result.recordset[0].Id

    for (let i = 0; i < imagenes.length; i++) {
      await pool.request()
        .input('trabajoId', sql.Int, trabajoId)
        .input('imagenUrl', sql.NVarChar, imagenes[i])
        .input('orden', sql.Int, i)
        .query('INSERT INTO TrabajosGaleriaImagenes (TrabajoId, ImagenUrl, Orden) VALUES (@trabajoId, @imagenUrl, @orden)')
    }

    res.json({ ok: true, id: trabajoId })
  } catch (err) {
    manejarError(res, err)
  }
})

// Admin: editar trabajo (reemplaza título/orden/estado y TODAS las imágenes)
router.put('/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { titulo, orden, activo, imagenes } = req.body
    const pool = await poolPromise

    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('titulo', sql.NVarChar, titulo || null)
      .input('orden', sql.Int, orden || 0)
      .input('activo', sql.Bit, activo)
      .query('UPDATE TrabajosGaleria SET Titulo = @titulo, Orden = @orden, Activo = @activo WHERE Id = @id')

    // Reemplaza el set completo de imágenes (más simple que calcular diferencias)
    await pool.request()
      .input('trabajoId', sql.Int, req.params.id)
      .query('DELETE FROM TrabajosGaleriaImagenes WHERE TrabajoId = @trabajoId')

    if (imagenes && imagenes.length > 0) {
      for (let i = 0; i < imagenes.length; i++) {
        await pool.request()
          .input('trabajoId', sql.Int, req.params.id)
          .input('imagenUrl', sql.NVarChar, imagenes[i])
          .input('orden', sql.Int, i)
          .query('INSERT INTO TrabajosGaleriaImagenes (TrabajoId, ImagenUrl, Orden) VALUES (@trabajoId, @imagenUrl, @orden)')
      }
    }

    res.json({ ok: true })
  } catch (err) {
    manejarError(res, err)
  }
})

// Admin: eliminar trabajo (soft delete, las imágenes quedan asociadas por si se reactiva)
router.delete('/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const pool = await poolPromise
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('UPDATE TrabajosGaleria SET Activo = 0 WHERE Id = @id')

    res.json({ ok: true })
  } catch (err) {
    manejarError(res, err)
  }
})

// Admin: reactivar trabajo
router.put('/admin/:id/reactivar', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const pool = await poolPromise
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('UPDATE TrabajosGaleria SET Activo = 1 WHERE Id = @id')

    res.json({ ok: true })
  } catch (err) {
    manejarError(res, err)
  }
})

module.exports = router