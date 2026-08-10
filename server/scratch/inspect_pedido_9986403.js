const sheetsService = require('../src/services/sheets.service');
const { rowsToObjects } = require('../src/utils/sheetMapper');

async function inspect() {
  const [pedRows, detRows] = await Promise.all([
    sheetsService.getRows('Copia de Pedidos!A1:AZ'),
    sheetsService.getRows('Copia de Detalles pedidos!A1:AZ')
  ]);

  const pedidos = rowsToObjects(pedRows);
  const detalles = rowsToObjects(detRows);

  const pedido = pedidos.find(p => String(p.IDPedido) === '9986403');
  const pedidoDetalles = detalles.filter(d => String(d.IDPedido) === '9986403');

  console.log("=== HEADER ===");
  console.log(pedido);

  console.log("\n=== DETAILS ===");
  pedidoDetalles.forEach((d, idx) => {
    console.log(`Item ${idx+1}: Code: ${d['Item  codigo']}, Name: ${d['Nombre item']}, Qty: ${d.Cantidad}, Price: ${d.Precio}, Subtotal: ${d['Subtotal (precio x cantidad)']}, Total: ${d['Total (subtotal - monto del descuento)']}`);
  });
}

inspect();
