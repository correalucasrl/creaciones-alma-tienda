const express = require('express')
const router = express.Router()
const { poolPromise } = require('../db')
const { verificarTokenOpcional } = require('../middleware/authMiddleware')

// Registra una visita (se llama una vez al cargar la web). Las del admin no cuentan:
// entrar al panel no es una visita de una clienta
router.post('/', verificarTokenOpcional, async (req, res) => {
  if (req.usuario?.rol === 'Admin') return res.sendStatus(200)
  try {
    const pool = await poolPromise
    await pool.request().query('INSERT INTO Visitas (Fecha) VALUES (SYSUTCDATETIME())')
    res.sendStatus(200)
  } catch (err) {
    // Si falla, no le importa a nadie más que a los logs — nunca debe romper la navegación
    console.error('No se pudo registrar la visita:', err.message)
    res.sendStatus(200)
  }
})

module.exports = router