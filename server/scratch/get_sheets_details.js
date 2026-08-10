const sheetsService = require('../src/services/sheets.service');
const { rowsToObjects } = require('../src/utils/sheetMapper');

async function checkDetails() {
  const detailRowsRaw = await sheetsService.getRows('Copia de Detalles pedidos!A1:AZ');
  const details = rowsToObjects(detailRowsRaw);
  console.log("First detail keys:", Object.keys(details[0]));
  console.log("First detail sample:", details[0]);
}

checkDetails();
