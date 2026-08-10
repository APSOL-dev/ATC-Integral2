const sql = require('mssql');
require('dotenv').config();

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

const BASE_URL = 'http://localhost:3025/api/pedidos';

async function testAnnulment() {
  console.log('--- STARTING ANNULMENT TEST FOR SYSTEM BUDGETS (0.0) ---');
  const testOrderId = 9986499;

  try {
    const pool = await sql.connect(config);

    // 1. Manually insert system order in state 0.0 into SQL database
    console.log('\nStep 1: Inserting system order (state 0.0) in SQL...');
    const now = new Date();
    await pool.request()
      .input('id', sql.Int, testOrderId)
      .input('idCliente', sql.Int, 1072)
      .input('clienteEnBase', sql.Bit, 1)
      .input('nombre', sql.NVarChar(50), 'SYSTEM BUDGET CLIENT')
      .input('direccion', sql.NVarChar(100), 'System Road 456')
      .input('celular', sql.NVarChar(50), '987654321')
      .input('fechaHora', sql.DateTime, now)
      .input('porcentajeDescuento', sql.Float, 0)
      .input('total', sql.Float, 500)
      .input('emitidoPor', sql.NVarChar(100), 'ERP')
      .input('creadoPor', sql.NVarChar(100), 'ERP')
      .input('observaciones', sql.NVarChar(255), 'SYSTEM BUDGET TEST ORDER')
      .input('estado', sql.NVarChar(50), '0.0')
      .input('vendedor', sql.Int, 858)
      .query(`
        INSERT INTO AppTransacciones.PedidoAppCabe (
          IDPedido, IDCliente, Cliente_En_Base, Nombre, Direccion, Celular_Contacto,
          Fecha_Hora, PorcentajeDescuento, Total, Emitido_Por, Creado_Por, Observaciones, Estado, Vendedor
        ) VALUES (
          @id, @idCliente, @clienteEnBase, @nombre, @direccion, @celular,
          @fechaHora, @porcentajeDescuento, @total, @emitidoPor, @creadoPor, @observaciones, @estado, @vendedor
        )
      `);

    await pool.request()
      .input('idPedido', sql.Int, testOrderId)
      .input('idDetalle', sql.Int, 99864991)
      .input('itemCodigo', sql.Int, 6019)
      .input('nombreItem', sql.NVarChar(100), 'System item')
      .input('cantidad', sql.Float, 1)
      .input('precio', sql.Float, 500)
      .input('subTotal', sql.Float, 500)
      .input('totalDeta', sql.Float, 500)
      .query(`
        INSERT INTO AppTransacciones.PedidoAppDeta (
          IdPedido, IdDetalle, ItemCodigo, NombreItem, Cantidad, Precio, Sub_Total, Total
        ) VALUES (
          @idPedido, @idDetalle, @itemCodigo, @nombreItem, @cantidad, @precio, @subTotal, @totalDeta
        )
      `);

    console.log('✅ System budget inserted in SQL.');

    // 2. Call DELETE /api/pedidos/:id in the app
    console.log(`\nStep 2: Calling DELETE on order ${testOrderId}...`);
    const deleteRes = await fetch(`${BASE_URL}/${testOrderId}`, {
      method: 'DELETE'
    });

    if (!deleteRes.ok) {
      throw new Error(`Delete failed: ${deleteRes.status} ${await deleteRes.text()}`);
    }
    
    const deleteData = await deleteRes.json();
    console.log('✅ DELETE response:', deleteData);

    // 3. Verify it STILL exists in SQL database but is now in state 0.0.99
    console.log('\nStep 3: Checking if order is still in SQL with state 0.0.99...');
    const sqlCheck = await pool.request()
      .input('id', sql.Int, testOrderId)
      .query('SELECT Estado, EstadoEnviado FROM AppTransacciones.PedidoAppCabe WHERE IDPedido = @id');
    
    if (sqlCheck.recordset.length === 0) {
      throw new Error('Order was physically deleted from SQL! It should only have been annulled.');
    }
    
    const dbOrder = sqlCheck.recordset[0];
    console.log(`✅ Order exists. Estado in SQL: ${dbOrder.Estado} (Expected: 0.0.99), EstadoEnviado: ${dbOrder.EstadoEnviado}`);
    if (String(dbOrder.Estado).trim() !== '0.0.99') {
      throw new Error(`Expected state '0.0.99', got: ${dbOrder.Estado}`);
    }

    // 4. Cleanup the manual test order
    console.log('\nStep 4: Cleaning up manual test order from SQL database...');
    await pool.request().input('id', sql.Int, testOrderId).query('DELETE FROM AppTransacciones.PedidoAppDeta WHERE IdPedido = @id');
    await pool.request().input('id', sql.Int, testOrderId).query('DELETE FROM AppTransacciones.PedidoAppCabe WHERE IDPedido = @id');
    console.log('✅ Cleaned up successfully.');

    console.log('\n🎉 ANNULMENT TEST PASSED SUCCESSFULLY! 🎉');
    pool.close();
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.message);
    try {
      const pool = await sql.connect(config);
      await pool.request().input('id', sql.Int, testOrderId).query('DELETE FROM AppTransacciones.PedidoAppDeta WHERE IdPedido = @id');
      await pool.request().input('id', sql.Int, testOrderId).query('DELETE FROM AppTransacciones.PedidoAppCabe WHERE IDPedido = @id');
      pool.close();
    } catch (e) {}
  }
}

testAnnulment();
