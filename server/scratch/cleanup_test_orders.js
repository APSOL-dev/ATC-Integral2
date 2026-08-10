require('dotenv').config();
const sql = require('mssql');

const config = {
  user: process.env.MSSQL_USER,
  password: process.env.MSSQL_PASSWORD,
  server: process.env.MSSQL_HOST,
  port: parseInt(process.env.MSSQL_PORT, 10),
  database: process.env.MSSQL_DATABASE,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    requestTimeout: 30000,
  }
};

const idsToDelete = process.argv.slice(2).map(id => parseInt(id)).filter(id => !isNaN(id));

if (idsToDelete.length === 0) {
  console.log('Uso: node cleanup_test_orders.js <id1> [id2] [id3] ...');
  console.log('Ejemplo: node cleanup_test_orders.js 99001 99002');
  process.exit(1);
}

async function run() {
  console.log('Conectando a la base de datos...');
  let pool;
  try {
    pool = await sql.connect(config);
    console.log('Conectado con éxito.');

    for (const id of idsToDelete) {
      console.log(`\nIniciando eliminación de pedido de prueba ID: ${id}`);
      
      // We wrap in a transaction to be absolutely safe
      const transaction = new sql.Transaction(pool);
      await transaction.begin();
      
      try {
        // Delete details first due to foreign keys if they exist
        const deleteDetailsRes = await transaction.request()
          .input('id', sql.Int, id)
          .query('DELETE FROM AppTransacciones.PedidoAppDeta WHERE IdPedido = @id');
        
        console.log(`- Detalles eliminados: ${deleteDetailsRes.rowsAffected[0]}`);

        // Delete header
        const deleteHeaderRes = await transaction.request()
          .input('id', sql.Int, id)
          .query('DELETE FROM AppTransacciones.PedidoAppCabe WHERE IDPedido = @id');
        
        console.log(`- Cabecera eliminada: ${deleteHeaderRes.rowsAffected[0]}`);

        await transaction.commit();
        console.log(`✅ Pedido ${id} eliminado de la base de datos con éxito.`);
      } catch (err) {
        await transaction.rollback();
        console.error(`❌ Error al eliminar pedido ${id}, transacción revertida:`, err.message);
      }
    }
  } catch (err) {
    console.error('Error de conexión:', err.message);
  } finally {
    if (pool) {
      pool.close();
    }
  }
}

run();
