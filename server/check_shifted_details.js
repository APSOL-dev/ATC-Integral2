const { sheets, SPREADSHEET_ID } = require('./src/config/sheets');

async function checkShiftedDetails() {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Copia de Detalles pedidos!A:O',
    });
    const rows = res.data.values || [];
    console.log(`Total details rows read: ${rows.length}`);
    
    let count = 0;
    rows.forEach((row, index) => {
      const rowNum = index + 1;
      const isColAEmpty = !row[0] || row[0].trim() === '';
      const hasAnyValue = row.some(val => val && val.trim() !== '');
      
      if (isColAEmpty && hasAnyValue) {
        count++;
        const nonVal = [];
        row.forEach((val, colIdx) => {
          if (val && val.trim() !== '') {
            nonVal.push({ colIdx, value: val });
          }
        });
        console.log(`Row ${rowNum} has empty A, but values:`, JSON.stringify(nonVal));
      }
    });
    console.log(`Total shifted/empty-A detail rows found: ${count}`);
  } catch (err) {
    console.error(err);
  }
}

checkShiftedDetails();
