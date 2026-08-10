const { sheets, SPREADSHEET_ID } = require('./src/config/sheets');

async function checkHeaders() {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Copia de Pedidos!1:1',
    });
    console.log('Headers in Copia de Pedidos:', res.data.values[0]);

    const res2 = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Copia de Detalles pedidos!1:1',
    });
    console.log('Headers in Copia de Detalles pedidos:', res2.data.values[0]);
  } catch (err) {
    console.error('Error fetching headers:', err.message);
  }
}

checkHeaders();
