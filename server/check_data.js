const { sheets, SPREADSHEET_ID } = require('./src/config/sheets');

async function checkData() {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Copia de Pedidos!A1:C5',
    });
    console.log('Sample Data from Copia de Pedidos:');
    console.table(res.data.values);

    const res2 = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Copia de Detalles pedidos!A1:C5',
    });
    console.log('Sample Data from Copia de Detalles pedidos:');
    console.table(res2.data.values);
  } catch (err) {
    console.error('Error fetching data:', err.message);
  }
}

checkData();
