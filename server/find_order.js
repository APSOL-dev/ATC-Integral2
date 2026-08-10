const { sheets, SPREADSHEET_ID } = require('./src/config/sheets');
const { rowsToObjects } = require('./src/utils/sheetMapper');

async function findOrder() {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Copia de Pedidos!A1:AZ',
    });
    const rows = res.data.values;
    const pedidos = rowsToObjects(rows);
    const p = pedidos.find(p => String(p.IDPedido) === '67868');
    console.log(p);
  } catch (err) {
    console.error(err);
  }
}

findOrder();
