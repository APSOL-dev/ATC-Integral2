const sheetsService = require('../src/services/sheets.service');
const { rowsToObjects } = require('../src/utils/sheetMapper');

async function checkLastOrders() {
  const rows = await sheetsService.getRows('Copia de Pedidos!A:A');
  console.log("Total rows in Copia de Pedidos:", rows.length);
  if (rows.length > 5) {
    const last5 = rows.slice(-5);
    console.log("Last 5 rows in Copia de Pedidos (IDs):", last5.map(r => r[0]));
  }
}

checkLastOrders();
