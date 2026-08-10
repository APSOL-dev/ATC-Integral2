const { sheets, SPREADSHEET_ID } = require('./src/config/sheets');
const { rowsToObjects } = require('./src/utils/sheetMapper');

async function checkEstados() {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Copia de Pedidos!A1:AZ',
    });
    const rows = res.data.values;
    const pedidos = rowsToObjects(rows);
    
    const countMap = {};
    pedidos.forEach(p => {
      const e = String(p.Estado);
      countMap[e] = (countMap[e] || 0) + 1;
    });
    
    console.log('--- Unique Estado counts ---');
    console.log(countMap);
    
    console.log('--- Sample orders with Estado 0.0 or 0 ---');
    const samples = pedidos.filter(p => String(p.Estado).startsWith('0')).slice(0, 5);
    samples.forEach(p => {
      console.log(`ID: ${p.IDPedido}, Estado: "${p.Estado}", Type: ${typeof p.Estado}`);
    });
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkEstados();
