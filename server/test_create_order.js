const { sheets, SPREADSHEET_ID } = require('./src/config/sheets');

async function runTest() {
  const url = 'http://localhost:3025/api/pedidos';
  const payload = {
    header: {
      Cliente: '1072',
      Nombre: 'Laura Test',
      'Lugar de entrega': 'Direccion Test 123',
      Celular: '3415555555',
      Descuento: 0,
      Observaciones: 'PEDIDO DE PRUEBA DESDE SCRIPT DE VERIFICACION',
      'Emitido por': 'Laura',
      Vendedor: '858',
      Total: 2500
    },
    detalles: [
      {
        'Item  codigo': '56420002',
        'Nombre item': 'Pintura Test',
        Cantidad: 1,
        Precio: 2500,
        StockAvailable: 15,
        Descuento: 0,
        Proveedor: 'Test Prov'
      }
    ]
  };

  try {
    console.log('Sending POST request to create test order...');
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Server returned status ${response.status}: ${text}`);
    }

    const data = await response.json();
    console.log('✅ Response from server:', data);
    
    const newId = data.IDPedido;
    console.log(`Checking sheet for order ID: ${newId}`);
    
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Copia de Pedidos!A:BC',
    });
    
    const rows = res.data.values || [];
    console.log(`Total rows in sheet now: ${rows.length}`);
    
    const rowIndex = rows.findIndex(r => String(r[0]) === String(newId));
    if (rowIndex === -1) {
      console.error('❌ Could not find the new order row by ID in column A!');
    } else {
      const row = rows[rowIndex];
      console.log(`✅ Found row ${rowIndex + 1} with ID ${newId} in column A!`);
      console.log('Row values:', JSON.stringify(row.slice(0, 10)));
      
      const isShifted = !row[0] || row[0].trim() === '';
      if (isShifted) {
        console.error('❌ Error: The row is shifted! Column A is empty.');
      } else {
        console.log('✅ Success: The row is NOT shifted. Columns are aligned correctly.');
      }
    }
  } catch (err) {
    console.error('Test failed:', err.message);
  }
}

runTest();
