const XLSX = require('xlsx');
const path = require('path');

const filePath = 'C:/Users/Renata Morano/OneDrive/Documentos/Antigravity/ATC Migración/Pedidos en estado 0 .xlsx';
const workbook = XLSX.readFile(filePath);

const pedidosRaw = XLSX.utils.sheet_to_json(workbook.Sheets['Pedidos']);
const detallesRaw = XLSX.utils.sheet_to_json(workbook.Sheets['Detalles pedidos']);

function excelDateToFormatted(excelDate) {
  if (!excelDate) return '';
  if (typeof excelDate === 'string') return excelDate;
  const date = XLSX.SSF.parse_date_code(excelDate);
  if (!date) return '';
  const pad = n => String(n).padStart(2, '0');
  return `${pad(date.d)}/${pad(date.m)}/${date.y} ${pad(date.H)}:${pad(date.M)}:${pad(date.S)}`;
}

function parseNumber(val) {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  const str = String(val).replace(/\./g, '').replace(',', '.').trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

console.log('=== PEDIDOS HEADER ===');
pedidosRaw.forEach(p => {
  console.log(`ID: ${p.IDPedido} | Cliente: ${p.Cliente} (${p.Nombre}) | Vendedor: ${p.Vendedor} (${p['Emitido por']}) | Total: ${parseNumber(p.Total)} | Fecha: ${excelDateToFormatted(p['Fecha y hora'])}`);
});

console.log('\n=== DETALLES (Total: ' + detallesRaw.length + ') ===');
detallesRaw.forEach(d => {
  console.log(`IDPedido: ${d.IDPedido} | Cod: ${d['Codigo (más alla de si es item o nombre)']} | Nombre: ${d['Nombre (más alla de si es item o nombre)']} | Cant: ${parseNumber(d.Cantidad)} | Precio: ${parseNumber(d.Precio)} | Subtotal: ${parseNumber(d['Subtotal (precio x cantidad)'])}`);
});
