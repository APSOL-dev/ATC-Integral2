const mssqlService = require('../src/services/mssql.service');
const sql = require('mssql');
const { poolPromise } = require('../src/config/mssql');

async function deleteOrderFromDB(pedidoId) {
  if (!pedidoId) {
    console.error("❌ Por favor, especifica el IDPedido. Ejemplo: node delete_db_order.js 9986403");
    process.exit(1);
  }

  console.log(`🧹 Iniciando eliminación de pedido de prueba ID: ${pedidoId} en SQL...`);

  try {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    
    await transaction.begin();
    try {
      // 1. Delete details first (FK constraint)
      console.log(`Removing details for IDPedido: ${pedidoId}...`);
      await transaction.request()
        .input('IDPedido', sql.VarChar, String(pedidoId))
        .query('DELETE FROM AppTransacciones.PedidoAppDeta WHERE IDPedido = @IDPedido');

      // 2. Delete header
      console.log(`Removing header for IDPedido: ${pedidoId}...`);
      await transaction.request()
        .input('IDPedido', sql.VarChar, String(pedidoId))
        .query('DELETE FROM AppTransacciones.PedidoAppCabe WHERE IDPedido = @IDPedido');

      await transaction.commit();
      console.log(`\n✅ ¡Pedido ${pedidoId} eliminado con éxito de la base de datos SQL!`);
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error("❌ Error al eliminar pedido en SQL:", err.message);
  } finally {
    process.exit(0);
  }
}

// Get ID from command line arguments
const args = process.argv.slice(2);
const id = args[0];
deleteOrderFromDB(id);
