const express = require('express');
const router = express.Router();
const mssqlService = require('../services/mssql.service');
const auth = require('../middlewares/auth');

// Protect all client routes
router.use(auth);

// GET all clients (supports ?search=texto)
router.get('/', async (req, res, next) => {
  try {
    const { search } = req.query;
    const clientes = await mssqlService.getClientes(search || '');
    res.json(clientes);
  } catch (error) {
    console.error('Error in GET /api/clientes:', error.message);
    res.status(503).json({ message: 'Error al conectar con la base de datos', error: error.message });
  }
});

// GET clients by multiple IDs (comma-separated query param ?ids=1,2,3)
router.get('/batch', async (req, res, next) => {
  try {
    const { ids } = req.query;
    if (!ids) return res.json([]);
    const idArray = ids.split(',').map(x => x.trim()).filter(Boolean);
    if (idArray.length === 0) return res.json([]);

    const clients = await mssqlService.getClientesByMultipleIds(idArray);
    res.json(clients);
  } catch (error) {
    console.error('Error in GET /api/clientes/batch:', error.message);
    res.status(503).json({ message: 'Error fetching batch clients', error: error.message });
  }
});

// GET client by ID
router.get('/:id', async (req, res, next) => {
  try {
    const client = await mssqlService.getClienteById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Cliente no encontrado' });
    res.json(client);
  } catch (error) {
    console.error('Error in GET /api/clientes/:id:', error.message);
    next(error);
  }
});

module.exports = router;
