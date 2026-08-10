require('dotenv').config();
const { sheets, SPREADSHEET_ID } = require('./src/config/sheets');
const { rowsToObjects } = require('./src/utils/sheetMapper');

async function test() {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Copia de Pedidos!A1:AZ',
    });
    const pedidos = rowsToObjects(res.data.values || []);
    const p = pedidos.find(x => String(x.IDPedido) === '79695');
    if (p) {
      console.log('--- ALL STATUS FIELDS FOR 79695 ---');
      Object.keys(p).forEach(key => {
        if (key.toLowerCase().includes('termin') || key.toLowerCase().includes('compl') || key.toLowerCase().includes('esta') || key.toLowerCase().includes('carg') || key.toLowerCase().includes('entr')) {
          console.log(`${key}: "${p[key]}"`);
        }
      });
    } else {
      console.log('Not found');
    }
  } catch (err) {
    console.error(err.message);
  }
}

test();
