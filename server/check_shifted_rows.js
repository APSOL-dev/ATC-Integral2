const { sheets, SPREADSHEET_ID } = require('./src/config/sheets');

async function checkShiftedRows() {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Copia de Pedidos!A:BC',
    });
    const rows = res.data.values || [];
    console.log(`Total rows read: ${rows.length}`);
    
    // Find rows where the first column is empty or undefined, but there are values in other columns
    let count = 0;
    rows.forEach((row, index) => {
      const rowNum = index + 1;
      const isColAEmpty = !row[0] || row[0].trim() === '';
      const hasAnyValue = row.some(val => val && val.trim() !== '');
      
      if (isColAEmpty && hasAnyValue) {
        count++;
        // Print the row number and the non-empty columns
        const nonVal = [];
        row.forEach((val, colIdx) => {
          if (val && val.trim() !== '') {
            nonVal.push({ colIdx, colName: getColLetter(colIdx + 1), value: val });
          }
        });
        console.log(`Row ${rowNum} has empty A, but values:`, JSON.stringify(nonVal));
      }
    });
    console.log(`Total shifted/empty-A rows found: ${count}`);
  } catch (err) {
    console.error(err);
  }
}

function getColLetter(num) {
  let letter = '';
  while (num > 0) {
    let temp = (num - 1) % 26;
    letter = String.fromCharCode(65 + temp) + letter;
    num = (num - temp - 1) / 26;
  }
  return letter;
}

checkShiftedRows();
