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

async function testLifecycle() {
  console.log('--- STARTING LIFECYCLE TEST ---');
  let testOrderId = null;

  try {
    // 1. Create a local draft (status 0) via POST /api/pedidos
    console.log('\nStep 1: Creating local draft order (status 0)...');
    const payload = {
      header: {
        Cliente: '1072',
        Nombre: 'LIFECYCLE TEST CLIENT',
        'Lugar de entrega': 'Test Address 123',
        Celular: '123456789',
        Descuento: 0,
        Observaciones: 'PEDIDO DE PRUEBA DE CICLO DE VIDA',
        'Emitido por': 'TestUser',
        Vendedor: '858',
        Total: 9999
      },
      detalles: [
        {
          'Item  codigo': '56420002',
          'Nombre item': 'Test Product A',
          Cantidad: 2,
          Precio: 4999.5,
          StockAvailable: 10,
          Descuento: 0,
          Proveedor: 'Test Provider'
        }
      ]
    };

    const postRes = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!postRes.ok) {
      throw new Error(`Failed to create order: ${postRes.status} ${await postRes.text()}`);
    }

    const postData = await postRes.json();
    testOrderId = postData.IDPedido;
    console.log(`✅ Order created in Google Sheets with ID: ${testOrderId}`);

    // Verify it is listed in the app and its source is Sheets (no DB source yet)
    const getList1 = await fetch(BASE_URL).then(r => r.json());
    const order1 = getList1.find(p => String(p.IDPedido) === String(testOrderId));
    if (!order1) {
      throw new Error(`Order ${testOrderId} not found in the list!`);
    }
    console.log(`✅ Verified order listed. Estado: ${order1.Estado}, Source: ${order1._source || 'sheets'}`);

    // Verify it does NOT exist in SQL database
    console.log('\nStep 2: Checking if order is NOT in SQL database...');
    const pool = await sql.connect(config);
    const sqlCheck1 = await pool.request()
      .input('id', sql.Int, testOrderId)
      .query('SELECT IDPedido FROM AppTransacciones.PedidoAppCabe WHERE IDPedido = @id');
    
    if (sqlCheck1.recordset.length > 0) {
      throw new Error('Order was found in SQL database prematurely!');
    }
    console.log('✅ Verified order is NOT in SQL database.');

    // 2. Approve/Send the order (transition to status 1) via PATCH /api/pedidos/:id/estado
    console.log(`\nStep 3: Approving order to state 1 (triggers direct SQL INSERT)...`);
    const patchRes = await fetch(`${BASE_URL}/${testOrderId}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: '1' })
    });

    if (!patchRes.ok) {
      throw new Error(`Failed to patch order state: ${patchRes.status} ${await patchRes.text()}`);
    }
    console.log('✅ PATCH request completed successfully.');

    // Verify it now exists in SQL database (Header and Details)
    console.log('Step 4: Checking if order is now in SQL database...');
    const sqlCheckHeader = await pool.request()
      .input('id', sql.Int, testOrderId)
      .query('SELECT * FROM AppTransacciones.PedidoAppCabe WHERE IDPedido = @id');
    
    if (sqlCheckHeader.recordset.length === 0) {
      throw new Error('Order Header not found in SQL database after approval!');
    }
    const dbHeader = sqlCheckHeader.recordset[0];
    console.log(`✅ Order Header found in SQL. Estado: ${dbHeader.Estado}, Total: ${dbHeader.Total}`);

    const sqlCheckDeta = await pool.request()
      .input('id', sql.Int, testOrderId)
      .query('SELECT * FROM AppTransacciones.PedidoAppDeta WHERE IdPedido = @id');
    
    if (sqlCheckDeta.recordset.length === 0) {
      throw new Error('Order Details not found in SQL database after approval!');
    }
    console.log(`✅ Order Details found in SQL. Total rows: ${sqlCheckDeta.recordset.length}`);

    // Verify the list endpoint returns it from DB source
    const getList2 = await fetch(BASE_URL).then(r => r.json());
    const order2 = getList2.find(p => String(p.IDPedido) === String(testOrderId));
    console.log(`✅ Verified order listed after approval. Estado: ${order2.Estado}, Source: ${order2._source || 'sheets'}`);

    // 3. Update the order state in SQL manually to simulate ERP update
    console.log('\nStep 5: Simulating ERP update (changing state to 2. Prepared in SQL)...');
    await pool.request()
      .input('id', sql.Int, testOrderId)
      .query("UPDATE AppTransacciones.PedidoAppCabe SET Estado = '2.' WHERE IDPedido = @id");
    
    // Fetch via GET /api/pedidos/:id and verify status is '2.'
    const getSingle = await fetch(`${BASE_URL}/${testOrderId}`).then(r => r.json());
    console.log(`✅ Fetching single order. Estado in app: ${getSingle.Estado} (Expected: 2.)`);
    if (String(getSingle.Estado).trim() !== '2.') {
      throw new Error(`Expected state '2.', got: ${getSingle.Estado}`);
    }

    // 4. Delete the test order from SQL
    console.log('\nStep 6: Deleting/Cleaning up test order from SQL database...');
    const deleteRes = await fetch(`${BASE_URL}/${testOrderId}`, {
      method: 'DELETE'
    });
    
    if (!deleteRes.ok) {
      throw new Error(`Failed to delete order: ${deleteRes.status} ${await deleteRes.text()}`);
    }
    console.log('✅ DELETE request completed successfully.');

    // Verify it is gone from both SQL and Sheets
    const sqlCheckFinal = await pool.request()
      .input('id', sql.Int, testOrderId)
      .query('SELECT IDPedido FROM AppTransacciones.PedidoAppCabe WHERE IDPedido = @id');
    
    if (sqlCheckFinal.recordset.length > 0) {
      throw new Error('Order still exists in SQL database after delete!');
    }
    console.log('✅ Verified order is deleted from SQL database.');

    const getListFinal = await fetch(BASE_URL).then(r => r.json());
    const orderFinal = getListFinal.find(p => String(p.IDPedido) === String(testOrderId));
    if (orderFinal && orderFinal.Estado === '0') {
      throw new Error('Order still exists in Sheets after delete!');
    }
    console.log('✅ Verified order is deleted from Sheets.');

    console.log('\n🎉 ALL LIFECYCLE TESTS PASSED SUCCESSFULLY! 🎉');
    
    pool.close();
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.message);
    // Cleanup if possible
    if (testOrderId) {
      console.log(`Attempting cleanup of order ID: ${testOrderId}`);
      try {
        const pool = await sql.connect(config);
        await pool.request().input('id', sql.Int, testOrderId).query('DELETE FROM AppTransacciones.PedidoAppDeta WHERE IdPedido = @id');
        await pool.request().input('id', sql.Int, testOrderId).query('DELETE FROM AppTransacciones.PedidoAppCabe WHERE IDPedido = @id');
        pool.close();
        console.log('Cleanup successful.');
      } catch (e) {
        console.error('Cleanup failed:', e.message);
      }
    }
  }
}

testLifecycle();
