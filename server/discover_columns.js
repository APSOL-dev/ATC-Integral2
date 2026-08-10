const { poolPromise } = require('./src/config/mssql');

async function discover() {
  const pool = await poolPromise;
  if (!pool) {
    console.error('No connection');
    return;
  }

  console.log('--- Clientes Columns ---');
  const resC = await pool.request().query('SELECT TOP 1 * FROM App.ClientesMay');
  console.log(Object.keys(resC.recordset[0] || {}).join(', '));

  console.log('\n--- Productos Columns ---');
  const resP = await pool.request().query('SELECT TOP 1 * FROM App.Productos');
  console.log(Object.keys(resP.recordset[0] || {}).join(', '));

  process.exit(0);
}

discover();
