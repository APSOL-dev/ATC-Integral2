const sheetsService = require('../src/services/sheets.service');
const { rowsToObjects } = require('../src/utils/sheetMapper');

async function cleanSheets() {
  console.log('Fetching Pedidos...');
  const pedRows = await sheetsService.getRows('Copia de Pedidos!A:A');
  const pedHeadersRows = await sheetsService.getRows('Copia de Pedidos!1:1');
  const pedColsCount = pedHeadersRows[0].length;

  console.log('Fetching Detalles...');
  const detRows = await sheetsService.getRows('Copia de Detalles pedidos!A:A');
  const detHeadersRows = await sheetsService.getRows('Copia de Detalles pedidos!1:1');
  const detColsCount = detHeadersRows[0].length;

  // Find all rows where IDPedido is test (>= 50000000)
  for (let idx = 1; idx < pedRows.length; idx++) {
    const val = parseInt(pedRows[idx][0]);
    if (!isNaN(val) && val >= 50000000) {
      console.log(`Clearing Pedido row ${idx + 1} with ID: ${val}`);
      const emptyRow = new Array(pedColsCount).fill('');
      await sheetsService.updateRow(`Copia de Pedidos!A${idx + 1}`, emptyRow);
    }
  }

  for (let idx = 1; idx < detRows.length; idx++) {
    const val = parseInt(detRows[idx][0]);
    if (!isNaN(val) && val >= 50000000) {
      console.log(`Clearing Detalle row ${idx + 1} with ID: ${val}`);
      const emptyRow = new Array(detColsCount).fill('');
      await sheetsService.updateRow(`Copia de Detalles pedidos!A${idx + 1}`, emptyRow);
    }
  }

  console.log('✅ Google Sheets test data cleaned up successfully!');
}

cleanSheets();
