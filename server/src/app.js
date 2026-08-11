const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// Security HTTP Headers
app.use(helmet());
app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true }));
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://ui-avatars.com"],
      connectSrc: ["'self'", "*"], // Allows connection to external APIs and web sockets
    },
  })
);

app.use(cors());
app.use(express.json());

// Security: Block access to .env and other hidden files (dotfiles)
app.use((req, res, next) => {
  if (req.path.includes('/.env') || req.path.split('/').some(part => part.startsWith('.'))) {
    return res.status(403).send('Forbidden');
  }
  next();
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'API ATC Migración',
    status: 'ok',
    timestamp: new Date().toISOString(),
    health: '/api/health'
  });
});

// Health check with live database connectivity status
app.get('/api/health', async (req, res) => {
  let mssqlStatus = false;
  let supabaseStatus = false;

  try {
    const { poolPromise } = require('./config/mssql');
    const pool = await poolPromise;
    mssqlStatus = !!(pool && pool.connected);
  } catch (e) {
    mssqlStatus = false;
  }

  try {
    const supabaseService = require('./services/supabase.service');
    const { error } = await supabaseService.supabase.from('atc_usuarios_v').select('id').limit(1);
    supabaseStatus = !error;
  } catch (e) {
    supabaseStatus = false;
  }

  const isHealthy = mssqlStatus && supabaseStatus;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    mssql: mssqlStatus,
    supabase: supabaseStatus,
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/clientes',  require('./routes/clientes.routes'));
app.use('/api/productos', require('./routes/productos.routes'));
app.use('/api/pedidos',   require('./routes/pedidos.routes'));
app.use('/api/usuarios',  require('./routes/usuarios.routes'));
app.use('/api/tablero',   require('./routes/tablero.routes'));

// Serve static frontend files in production if client-dist folder exists
const path = require('path');
const fs = require('fs');
const clientDistPath = path.join(__dirname, '../client-dist');

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  
  // For any non-API route, send index.html for React SPA routing
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// 404 handler for API routes
app.use((req, res) => {
  res.status(404).json({ message: `Ruta no encontrada: ${req.method} ${req.path}` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.message);
  res.status(500).json({ message: err.message || 'Error interno del servidor' });
});

module.exports = app;
