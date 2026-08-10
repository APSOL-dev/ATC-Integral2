const sheetsService = require('../src/services/sheets.service');
const { rowsToObjects } = require('../src/utils/sheetMapper');

async function checkOriginals() {
  const [pedRows, detRows] = await Promise.all([
    sheetsService.getRows('Copia de Pedidos!A1:AZ'),
    sheetsService.getRows('Copia de Detalles pedidos!A1:AZ')
  ]);

  const pedidos = rowsToObjects(pedRows);
  const detalles = rowsToObjects(detRows);

  // Find some original orders (with IDs < 100000) that have a discount > 0
  const discountOrders = pedidos.filter(p => {
    const id = parseInt(p.IDPedido);
    const disc = parseFloat(p['Porcentaje de descuento (%)']);
    return !isNaN(id) && id < 100000 && !isNaN(disc) && disc > 0;
  }).slice(0, 3);

  for (const p of discountOrders) {
    const id = p.IDPedido;
    const pDetalles = detalles.filter(d => d.IDPedido === id);
    const sumSubtotals = pDetalles.reduce((sum, d) => {
      // replace dots and commas
      const price = parseFloat(String(d.Precio || 0).replace(/\./g, '').replace(',', '.'));
      const qty = parseFloat(String(d.Cantidad || 0).replace(/\./g, '').replace(',', '.'));
      return sum + (price * qty);
    }, 0);

    console.log(`\nPedido ID: ${id}`);
    console.log(`Discount %: ${p['Porcentaje de descuento (%)']}`);
    console.log(`Saved Total in Sheet: ${p.Total}`);
    console.log(`Sum of Details Subtotals: ${sumSubtotals}`);
    const expectedNet = sumSubtotals * (1 - parseFloat(p['Porcentaje de descuento (%)'])/100);
    console.log(`Expected Net (Sum - Disc): ${expectedNet}`);
  }
}

checkOriginals();
