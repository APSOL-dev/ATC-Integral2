const sheetsService = require('../src/services/sheets.service');
const { rowsToObjects } = require('../src/utils/sheetMapper');

async function inspectRow() {
  const detailRowsRaw = await sheetsService.getRows('Copia de Detalles pedidos!A1:AZ');
  const details = rowsToObjects(detailRowsRaw);
  const testDetails = details.filter(d => d.IDPedido === '56420002' || d.IDPedido === '56420001');
  console.log("Test details in Sheets:", testDetails);
}

inspectRow();
