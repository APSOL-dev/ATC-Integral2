const { sheets, SPREADSHEET_ID } = require('./src/config/sheets');

async function cleanShiftedRows() {
  try {
    const rowsToClear = [11811, 11812, 11813, 11814];
    for (const rowNum of rowsToClear) {
      console.log(`Clearing row ${rowNum}...`);
      // We will write empty cells from A to BC
      const emptyRow = new Array(55).fill('');
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `Copia de Pedidos!A${rowNum}:BC${rowNum}`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [emptyRow],
        },
      });
      console.log(`Row ${rowNum} cleared successfully.`);
    }
  } catch (err) {
    console.error('Error clearing rows:', err.message);
  }
}

cleanShiftedRows();
