require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

// Pre-warm MSSQL connection pool on startup
require('./src/config/mssql');

const startServer = (portToTry) => {
  const server = app.listen(portToTry, async () => {
    const actualPort = server.address().port;
    console.log(`🚀 Server running on port ${actualPort}`);
    console.log(`📊 Google Sheets ID: ${process.env.SPREADSHEET_ID}`);
    console.log(`🗄️  MSSQL Host: ${process.env.MSSQL_HOST}:${process.env.MSSQL_PORT}`);

    // Pre-warm Supabase cache so first user request is instant
    try {
      const supabaseService = require('./src/services/supabase.service');
      console.log('🔥 Pre-warming Supabase cache...');
      await Promise.all([
        supabaseService.getRows('atc_pedidos_v'),
        supabaseService.getRows('atc_detalles_pedidos_v'),
      ]);
      console.log('✅ Supabase cache warm-up complete');
    } catch (err) {
      console.warn('⚠️  Supabase cache warm-up failed (will load on first request):', err.message);
    }
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && portToTry !== 0) {
      console.warn(`⚠️  Port ${portToTry} is in use, looking for an open port...`);
      startServer(0);
    } else {
      console.error('❌ Server error:', err);
    }
  });
};

startServer(PORT);

