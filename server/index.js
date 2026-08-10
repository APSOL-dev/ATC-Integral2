require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

// Pre-warm MSSQL connection pool on startup
require('./src/config/mssql');

const server = app.listen(PORT, async () => {
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

