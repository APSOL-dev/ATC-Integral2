const sheetsService = require('../src/services/sheets.service');
const { rowsToObjects } = require('../src/utils/sheetMapper');

async function findTodayOrders() {
  const rows = await sheetsService.getRows('Copia de Pedidos!A:AZ');
  const pedidos = rowsToObjects(rows);
  
  // Filter orders created today (2026-07-10)
  const today = '2026-07-10';
  const match = pedidos.filter(p => p['Fecha y hora'] && p['Fecha y hora'].includes(today));
  
  console.log("Total orders created today in Copia de Pedidos:", match.length);
  if (match.length > 0) {
    match.forEach(p => {
      console.log(`ID: ${p.IDPedido}, Client: ${p.Nombre}, Estado: ${p.Estado}, Fecha: ${p['Fecha y hora']}`);
    });
  }
}

findTodayOrders();
