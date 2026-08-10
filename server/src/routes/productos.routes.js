const express = require('express');
const router = express.Router();
const mssqlService = require('../services/mssql.service');
const auth = require('../middlewares/auth');

// Protect all product routes
router.use(auth);

// GET all products (supports ?search=texto)
router.get('/', async (req, res, next) => {
  try {
    const { search } = req.query;
    const productos = await mssqlService.getProductos(search || '');
    res.json(productos);
  } catch (error) {
    console.error('Error in GET /api/productos:', error.message);
    res.status(503).json({ message: 'Error al conectar con la base de datos', error: error.message });
  }
});

module.exports = router;
