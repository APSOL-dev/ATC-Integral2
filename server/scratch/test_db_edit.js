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

async function testEdit() {
  console.log('--- STARTING EDIT TEST FOR DB ORDERS ---');
  const testOrderId = 9986477;

  try {
    const pool = await sql.connect(config);

    // 1. Manually insert system order in SQL database
    console.log('\nStep 1: Inserting system order in SQL...');
    const now = new Date();
    await pool.request()
      .input('id', sql.Int, testOrderId)
      .input('idCliente', sql.Int, 1072)
      .input('clienteEnBase', sql.Bit, 1)
      .input('nombre', sql.NVarChar(50), 'EDIT TEST CLIENT')
      .input('direccion', sql.NVarChar(100), 'Edit St 111')
      .input('celular', sql.NVarChar(50), '111111')
      .input('fechaHora', sql.DateTime, now)
      .input('porcentajeDescuento', sql.Float, 0)
      .input('total', sql.Float, 100)
      .input('emitidoPor', sql.NVarChar(100), 'ERP')
      .input('creadoPor', sql.NVarChar(100), 'ERP')
      .input('observaciones', sql.NVarChar(255), 'BEFORE EDIT')
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
      .input('idDetalle', sql.Int, 99864771)
      .input('itemCodigo', sql.Int, 6019)
      .input('nombreItem', sql.NVarChar(100), 'Old item')
      .input('cantidad', sql.Float, 1)
      .input('precio', sql.Float, 100)
      .input('subTotal', sql.Float, 100)
      .input('totalDeta', sql.Float, 100)
      .query(`
        INSERT INTO AppTransacciones.PedidoAppDeta (
          IdPedido, IdDetalle, ItemCodigo, NombreItem, Cantidad, Precio, Sub_Total, Total
        ) VALUES (
          @idPedido, @idDetalle, @itemCodigo, @nombreItem, @cantidad, @precio, @subTotal, @totalDeta
        )
      `);

    console.log('✅ Order inserted.');

    // 2. Call PUT /api/pedidos/:id with updated data
    console.log(`\nStep 2: Calling PUT to edit order ${testOrderId}...`);
    const updatePayload = {
      header: {
        Cliente: '1072',
        Nombre: 'EDIT TEST CLIENT',
        'Lugar de entrega': 'Edit St 111',
        Celular: '111111',
        Descuento: 0,
        Observaciones: 'AFTER EDIT',
        'Emitido por': 'ERP',
        Vendedor: '858',
        Total: 500,
        Estado: '0.0'
      },
      detalles: [
        {
          'Item  codigo': '11016',
          'Nombre item': 'New item A',
          Cantidad: 5,
          Precio: 100,
          StockAvailable: 4,
          Descuento: 0,
          Proveedor: 'Test Provider'
        }
      ]
    };

    const putRes = await fetch(`${BASE_URL}/${testOrderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload)
    });

    if (!putRes.ok) {
      throw new Error(`PUT failed: ${putRes.status} ${await putRes.text()}`);
    }

    console.log('✅ PUT response:', await putRes.json());

    // 3. Verify in SQL database
    console.log('\nStep 3: Verifying updates in SQL...');
    const headerCheck = await pool.request()
      .input('id', sql.Int, testOrderId)
      .query('SELECT Observaciones, Total FROM AppTransacciones.PedidoAppCabe WHERE IDPedido = @id');
    
    const dbHeader = headerCheck.recordset[0];
    console.log(`✅ Observaciones: ${dbHeader.Observaciones} (Expected: AFTER EDIT), Total: ${dbHeader.Total} (Expected: 500)`);
    if (dbHeader.Observaciones !== 'AFTER EDIT' || dbHeader.Total !== 500) {
      throw new Error('Header updates not saved in SQL!');
    }

    const detaCheck = await pool.request()
      .input('id', sql.Int, testOrderId)
      .query('SELECT ItemCodigo, NombreItem, Cantidad FROM AppTransacciones.PedidoAppDeta WHERE IdPedido = @id');
    
    console.log(`✅ Details row count: ${detaCheck.recordset.length} (Expected: 1)`);
    if (detaCheck.recordset.length !== 1) {
      throw new Error('Details length mismatch!');
    }
    const dbDeta = detaCheck.recordset[0];
    console.log(`✅ Detail: ${dbDeta.NombreItem} (Expected: New item A), Cantidad: ${dbDeta.Cantidad} (Expected: 5)`);
    if (dbDeta.NombreItem !== 'New item A' || dbDeta.Cantidad !== 5) {
      throw new Error('Detail updates not saved in SQL!');
    }

    // 4. Cleanup test order
    console.log('\nStep 4: Cleaning up manual test order...');
    await pool.request().input('id', sql.Int, testOrderId).query('DELETE FROM AppTransacciones.PedidoAppDeta WHERE IdPedido = @id');
    await pool.request().input('id', sql.Int, testOrderId).query('DELETE FROM AppTransacciones.PedidoAppCabe WHERE IDPedido = @id');
    console.log('✅ Cleaned up successfully.');

    console.log('\n🎉 EDIT TEST PASSED SUCCESSFULLY! 🎉');
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

testEdit();
