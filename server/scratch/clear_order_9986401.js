const { sheets, SPREADSHEET_ID } = require('../src/config/sheets');
const sheetsService = require('../src/services/sheets.service');

async function run() {
  console.log("Cleaning up test order 9986401...");
  
  // 1. Clear from Copia de Pedidos
  const pedRows = await sheetsService.getRows('Copia de Pedidos!A:A');
  const pedIndex = pedRows.flat().indexOf('9986401');
  if (pedIndex !== -1) {
    const rowNum = pedIndex + 1;
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `Copia de Pedidos!A${rowNum}:AZ${rowNum}`
    });
    console.log(`Cleared Copia de Pedidos row ${rowNum}`);
  } else {
    console.log("Not found in Copia de Pedidos");
  }

  // 2. Clear from Copia de Detalles pedidos
  const detRows = await sheetsService.getRows('Copia de Detalles pedidos!A:A');
  const detIds = detRows.flat();
  for (let i = 0; i < detIds.length; i++) {
    if (detIds[i] === '9986401') {
      const rowNum = i + 1;
      await sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range: `Copia de Detalles pedidos!A${rowNum}:AZ${rowNum}`
      });
      console.log(`Cleared Copia de Detalles pedidos row ${rowNum}`);
    }
  }
  
  console.log("Done!");
}

run().catch(console.error);
