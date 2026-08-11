const XLSX = require('xlsx');
const supabaseService = require('../src/services/supabase.service');

const filePath = 'C:/Users/Renata Morano/OneDrive/Documentos/Antigravity/ATC Migración/Pedidos en estado 0 .xlsx';
const workbook = XLSX.readFile(filePath);

const pedidosRaw = XLSX.utils.sheet_to_json(workbook.Sheets['Pedidos']);
const detallesRaw = XLSX.utils.sheet_to_json(workbook.Sheets['Detalles pedidos']);

function excelDateToFormatted(excelDate) {
  if (!excelDate) return new Date().toISOString();
  if (typeof excelDate === 'string') {
    const parts = excelDate.match(/(\d{2})\/(\d{2})\/(\d{4})\s*(\d{2}:\d{2}(:\d{2})?)?/);
    if (parts) {
      const timePart = parts[4] ? (parts[4].length === 5 ? parts[4] + ':00' : parts[4]) : '00:00:00';
      return `${parts[3]}-${parts[2]}-${parts[1]} ${timePart}`;
    }
    return excelDate;
  }
  const date = XLSX.SSF.parse_date_code(excelDate);
  if (!date) return new Date().toISOString();
  const pad = n => String(n).padStart(2, '0');
  return `${date.y}-${pad(date.m)}-${pad(date.d)} ${pad(date.H)}:${pad(date.M)}:${pad(date.S)}`;
}

function parseMoney(val) {
  if (val === undefined || val === null || val === '') return 0;
  let num = 0;
  if (typeof val === 'number') {
    num = val;
  } else {
    const str = String(val).replace(/\./g, '').replace(',', '.').trim();
    num = parseFloat(str);
  }
  if (isNaN(num)) return 0;
  if (num > 10000000) {
    num = num / 10000;
  }
  return Math.round(num * 100) / 100;
}

async function migrate() {
  console.log('🚀 Iniciando migración de ' + pedidosRaw.length + ' pedidos y ' + detallesRaw.length + ' detalles desde Excel...');

  const cleanPedidos = pedidosRaw.map(p => {
    const fechaStr = excelDateToFormatted(p['Fecha y hora']);
    const emitido = String(p['Emitido por'] || 'Admin').trim();
    const idPed = parseInt(p.IDPedido);
    const vdor = parseInt(p.Vendedor) || null;
    const clienteId = parseInt(p.Cliente) || 1;

    return {
      IDPedido: idPed,
      'Cliente': clienteId,
      'Cliente en BD?': 'TRUE',
      'Fecha y hora': fechaStr,
      'Dirección cliente': String(p['Dirección cliente'] || p['Lugar de entrega'] || '').trim(),
      'Nombre': String(p.Nombre || 'CONSUMIDOR FINAL').trim(),
      'Razón social (NO BD)': '',
      'Celular de contacto': String(p['Celular de contacto'] || '').trim(),
      'Porcentaje de descuento (%)': parseMoney(p['Porcentaje de descuento (%)']),
      'Observaciones': String(p.Observaciones || '').trim(),
      'Emitido por': emitido,
      'Emitido por con fecha': `${emitido} - ${fechaStr}`,
      'Emitido Fecha': fechaStr,
      'Lugar de entrega': String(p['Lugar de entrega'] || '').trim(),
      'Deposito que prepara': '',
      'Creado por': emitido,
      'Total': parseMoney(p.Total),
      'Fecha_Ultima_Modificacion': excelDateToFormatted(p.Fecha_Ultima_Modificacion || p['Fecha y hora']),
      'Fecha y Hora de Última Modificación': excelDateToFormatted(p['Fecha y Hora de Última Modificación'] || p['Fecha y hora']),
      'Estado': '0',
      'Vendedor': vdor
    };
  });

  const cleanDetalles = detallesRaw.map((d, index) => {
    const idPed = parseInt(d.IDPedido);
    const codeStr = String(d['Codigo (más alla de si es item o nombre)'] || '').trim();
    const nameStr = String(d['Nombre (más alla de si es item o nombre)'] || '').trim();
    const cant = parseMoney(d.Cantidad) || 1;
    const precio = parseMoney(d.Precio);
    const subtotal = parseMoney(d['Subtotal (precio x cantidad)']) || Math.round(precio * cant * 100) / 100;
    const total = parseMoney(d['Total (subtotal - monto del descuento)']) || subtotal;
    const detailId = d.IDDetalle ? String(d.IDDetalle) : `${idPed}${codeStr || index}`;

    return {
      IDPedido: idPed,
      IDDetalle: detailId,
      'Codigo (más alla de si es item o nombre)': codeStr,
      'Nombre (más alla de si es item o nombre)': nameStr,
      'Item  codigo': codeStr,
      'Nombre item': nameStr,
      'Cantidad': cant,
      'Descuento': 0,
      'Precio': precio,
      'Subtotal (precio x cantidad)': subtotal,
      'Monto del descuento': 0,
      'Total (subtotal - monto del descuento)': total,
      'Stock al momento de cargar': 0,
      'Proveedor': String(d.Proveedor || '').trim()
    };
  });

  // Insert headers into Supabase
  for (const ped of cleanPedidos) {
    console.log(`Upserting pedido ID ${ped.IDPedido} (${ped.Nombre})...`);
    await supabaseService.upsertRow('atc_pedidos_v', ped);
  }

  // Insert details into Supabase
  console.log(`Insertando ${cleanDetalles.length} detalles...`);
  await supabaseService.insertRows('atc_detalles_pedidos_v', cleanDetalles);

  console.log('✅ Migración completada exitosamente en Supabase!');
}

migrate().catch(err => console.error('❌ Error en migración:', err));
