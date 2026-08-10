require('dotenv').config();
const { sheets, SPREADSHEET_ID } = require('./src/config/sheets');
const { rowsToObjects } = require('./src/utils/sheetMapper');

function calcEstadoBadge(pedido) {
  if (!pedido) return 'pendiente';
  
  const e = String(pedido.Estado || '').trim();
  if (e === '0.0') return 'budget_sys';
  if (e === '0.0.99') return 'budget_anul';
  if (e === '0.' || e === '0') return 'budget';
  if (e === '1.' || e === '1') return 'new';
  if (e === '1.1') return 'management';
  if (e === '2.' || e === '2') return 'prepared';
  if (e === '4.' || e === '4') return 'invoiced';
  if (e === '5.' || e === '5') return 'shipping';
  if (e === '6.' || e === '6') return 'finished';
  if (e === '99.' || e === '99') return 'anulado';

  const isTrue = (val) => val === 'TRUE' || val === true || val === 'checked';

  if (isTrue(pedido.Anulado) || e === '99.') return 'anulado';
  if (isTrue(pedido.Entregado) || e === '6.') return 'finished';
  if (isTrue(pedido.Cargado) || e === '5.') return 'shipping';
  if (isTrue(pedido.Completo) || isTrue(pedido['Preparación terminada?']) || e === '2.') return 'prepared';
  if (pedido['Deposito que prepara']) return 'management';
  
  return 'new';
}

async function test() {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Copia de Pedidos!A1:AZ',
    });
    const pedidos = rowsToObjects(res.data.values || []);
    
    const userName = 'nelson';
    const nelsons = pedidos.filter(p => {
      const pVendedor = String(p.Vendedor || '').trim().toLowerCase();
      const pEmitido = String(p['Emitido por'] || '').trim().toLowerCase();
      const pVdorNombre = String(p.VendedorNombre || '').trim().toLowerCase();
      
      return pVendedor === '26' || 
             pEmitido === userName ||
             pVdorNombre === userName;
    });

    const statusMap = {};
    nelsons.forEach(p => {
      const status = calcEstadoBadge(p);
      statusMap[status] = (statusMap[status] || 0) + 1;
    });

    console.log("Nelson's status breakdown:");
    console.log(statusMap);
    
  } catch (err) {
    console.error(err.message);
  }
}

test();
