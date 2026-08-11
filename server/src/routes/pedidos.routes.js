const express = require('express');
const router = express.Router();
const supabaseService = require('../services/supabase.service');
const mssqlService = require('../services/mssql.service');
const auth = require('../middlewares/auth');

// Protect all routes
router.use(auth);

// Date Formatter (America/Argentina/Buenos_Aires timezone)
function formatDate(date, format = 'ISO') {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const options = {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };

  const parts = new Intl.DateTimeFormat('en-CA', options).formatToParts(d);
  const get = (type) => parts.find(p => p.type === type)?.value || '00';

  const y = get('year');
  const m = get('month');
  const day = get('day');
  let h = get('hour');
  if (h === '24') h = '00';
  const min = get('minute');
  const s = get('second');

  if (format === 'FULL') return `${y}-${m}-${day} ${h}:${min}:${s}`;
  if (format === 'SHORT_WITH_TIME') return `${day}/${m}/${y} ${h}:${min}`;
  return `${y}-${m}-${day}T${h}:${min}:${s}`;
}

function parseCurrency(value) {
  if (value == null || value === '') return 0;
  if (typeof value === 'number') return value;
  const num = parseFloat(String(value).replace(/\./g, '').replace(',', '.'));
  return isNaN(num) ? 0 : num;
}

// Shared queue to serialize order creations and avoid ID collision under concurrent requests
let creationQueue = Promise.resolve();

// Helper to map vendedor names
async function mapVendedorNames(pedidos) {
  try {
    const withTimeout = (promise, ms, fallback = []) =>
      Promise.race([
        promise,
        new Promise(resolve => setTimeout(() => resolve(fallback), ms))
      ]);
    const vendedores = await withTimeout(mssqlService.getVendedores(), 4000, []);
    pedidos.forEach(pedido => {
      const rawId = pedido.Vendedor || pedido['Emitido por'];
      const vdorId = String(rawId || '').trim();
      
      const vdorObj = vendedores.find(v => {
        const sqlVdor = String(v.VDOR || '');
        const sqlAlias = String(v.ALIAS || '').toLowerCase();
        const sqlNombre = String(v.NOMBRE || '').toLowerCase();
        const searchId = vdorId.toLowerCase();

        if (parseInt(sqlVdor) === parseInt(searchId) && !isNaN(parseInt(sqlVdor))) return true;
        if (sqlVdor === searchId) return true;
        if (sqlAlias === searchId) return true;
        if (sqlNombre === searchId) return true;
        return false;
      });
      
      if (vdorObj) {
        pedido.VendedorNombre = vdorObj.NOMBRE;
      } else {
        pedido.VendedorNombre = rawId;
      }
    });
  } catch (err) {
    console.error('Error mapping vendedors:', err.message);
  }
}

function mapDbPedidoToSheetFormat(dbP) {
  return {
    IDPedido: dbP.IDPedido,
    Cliente: dbP.IDCliente ? String(dbP.IDCliente) : '',
    'Cliente en BD?': dbP.Cliente_En_Base ? 'TRUE' : 'FALSE',
    'Fecha y hora': dbP.Fecha_Hora ? formatDate(dbP.Fecha_Hora, 'FULL') : '',
    'Dirección cliente': dbP.Direccion || '',
    Nombre: dbP.Nombre || '',
    'Razón social (NO BD)': '',
    'Celular de contacto': dbP.Celular_Contacto || '',
    'Porcentaje de descuento (%)': dbP.PorcentajeDescuento || 0,
    Observaciones: dbP.Observaciones || '',
    'Emitido por': dbP.Emitido_Por || '',
    'Emitido por con fecha': dbP.Emitido_Por ? `${dbP.Emitido_Por} - ${formatDate(dbP.Fecha_Hora, 'SHORT_WITH_TIME')}` : '',
    'Emitido Fecha': dbP.Fecha_Hora ? formatDate(dbP.Fecha_Hora, 'FULL') : '',
    'Lugar de entrega': dbP.Direccion || '',
    'Fecha de envio': dbP.Fecha_Envio ? formatDate(dbP.Fecha_Envio, 'FULL') : '',
    'Creado por': dbP.Creado_Por || '',
    Total: dbP.Total || 0,
    Fecha_Ultima_Modificacion: dbP.Fecha_Ultima_Modificacion ? formatDate(dbP.Fecha_Ultima_Modificacion, 'FULL') : '',
    'Fecha y Hora de Última Modificación': dbP.Fecha_Ultima_Modificacion ? formatDate(dbP.Fecha_Ultima_Modificacion, 'FULL') : '',
    Estado: dbP.Estado || '1',
    Vendedor: dbP.Vendedor ? String(dbP.Vendedor) : '',
    Nro_PedidoGestion: dbP.Nro_PedidoGestion || '',
    Nro_PedidoReferencia: dbP.Nro_PedidoReferencia || '',
    _source: 'db'
  };
}

function mapDbDetalleToSheetFormat(dbD) {
  return {
    IDPedido: dbD.IdPedido,
    IDDetalle: dbD.IdDetalle,
    'Item  codigo': dbD.ItemCodigo ? String(dbD.ItemCodigo) : '',
    'Nombre item': dbD.NombreItem || '',
    'Nombre (más alla de si es item o nombre)': dbD.NombreItem || '',
    'Codigo (más alla de si es item o nombre)': dbD.ItemCodigo ? String(dbD.ItemCodigo) : '',
    Cantidad: dbD.Cantidad || 0,
    Descuento: dbD.Descuento || 0,
    Precio: dbD.Precio || 0,
    'Cantidad preparada': dbD.CantidadPreparada || 0,
    'Subtotal (precio x cantidad)': dbD.Sub_Total || 0,
    'Monto del descuento': 0,
    'Total (subtotal - monto del descuento)': dbD.Total || 0,
    'Stock al momento de cargar': 0,
    Proveedor: '',
    IdRenglonGestion: dbD.IdRenglonGestion || null
  };
}

// GET all pedidos with details
// Server-Side In-Memory Cache configuration
let pedidosCache = null;
let lastCacheFetchTime = 0;
const CACHE_TTL = 4 * 60 * 1000; // 4 minutes

function invalidatePedidosCache() {
  pedidosCache = null;
  lastCacheFetchTime = 0;
  supabaseService.clearCache();
}

// Function to fetch and build everything (complete orders with details)
async function getCompletePedidos() {
  const now = Date.now();
  if (pedidosCache && (now - lastCacheFetchTime < CACHE_TTL)) {
    return pedidosCache;
  }

  const withTimeout = (promise, ms, fallback = []) =>
    Promise.race([
      promise,
      new Promise(resolve => setTimeout(() => resolve(fallback), ms))
    ]);

  // Fetch all Supabase data + MSSQL DB data in parallel
  const [supabasePedidos, supabaseDetalles, dbPedidos, dbDetalles, sqlProducts] = await Promise.all([
    supabaseService.getRows('atc_pedidos_v').catch(err => {
      console.error('Error fetching Supabase pedidos:', err.message);
      return [];
    }),
    supabaseService.getRows('atc_detalles_pedidos_v').catch(err => {
      console.error('Error fetching Supabase detalles:', err.message);
      return [];
    }),
    withTimeout(mssqlService.getPedidosFromDB(), 10000).catch(err => {
      console.error('Error fetching DB pedidos for cache:', err.message);
      return [];
    }),
    withTimeout(mssqlService.getDetallesFromDB(), 10000).catch(err => {
      console.error('Error fetching DB detalles for cache:', err.message);
      return [];
    }),
    withTimeout(mssqlService.getProductos(), 10000).catch(err => {
      console.error('Error fetching SQL products for cache:', err.message);
      return [];
    })
  ]);

  const productProviderMap = new Map();
  if (Array.isArray(sqlProducts)) {
    sqlProducts.forEach(prod => {
      if (prod.CODART && prod.Proveedor) {
        productProviderMap.set(String(prod.CODART).trim().toLowerCase(), String(prod.Proveedor).trim());
      }
    });
  }

  const mappedDbPedidos = Array.isArray(dbPedidos) ? dbPedidos.map(mapDbPedidoToSheetFormat) : [];
  const mappedDbDetalles = Array.isArray(dbDetalles) ? dbDetalles.map(mapDbDetalleToSheetFormat) : [];

  const supabaseDetailsByPedido = {};
  supabaseDetalles.forEach(d => {
    const id = String(d.IDPedido);
    if (!supabaseDetailsByPedido[id]) supabaseDetailsByPedido[id] = [];
    supabaseDetailsByPedido[id].push(d);
  });

  const dbDetailsByPedido = {};
  mappedDbDetalles.forEach(d => {
    const id = String(d.IDPedido);
    if (!dbDetailsByPedido[id]) dbDetailsByPedido[id] = [];
    dbDetailsByPedido[id].push(d);
  });

  const pedidosMap = new Map();

  supabasePedidos.forEach(p => {
    const id = String(p.IDPedido);
    const details = supabaseDetailsByPedido[id] || [];
    details.forEach(d => {
      const code = String(d['Codigo (más alla de si es item o nombre)'] || d['Item  codigo'] || '').trim().toLowerCase();
      d.Proveedor = productProviderMap.get(code) || '—';
    });
    p.detalles = details;
    pedidosMap.set(id, p);
  });

  mappedDbPedidos.forEach(p => {
    const id = String(p.IDPedido);
    const details = dbDetailsByPedido[id] || [];
    details.forEach(d => {
      const code = String(d['Codigo (más alla de si es item o nombre)'] || d['Item  codigo'] || '').trim().toLowerCase();
      d.Proveedor = productProviderMap.get(code) || '—';
    });
    p.detalles = details;
    pedidosMap.set(id, p);
  });

  const finalPedidos = Array.from(pedidosMap.values());
  await mapVendedorNames(finalPedidos);
  finalPedidos.sort((a, b) => (parseInt(b.IDPedido) || 0) - (parseInt(a.IDPedido) || 0));

  pedidosCache = finalPedidos;
  lastCacheFetchTime = Date.now();
  return finalPedidos;
}

// GET all pedidos (lightweight header list by default for ultra-fast boot)
router.get('/', async (req, res, next) => {
  try {
    const finalPedidos = await getCompletePedidos();
    if (req.query.includeDetails === 'true') {
      return res.json(finalPedidos);
    }
    
    // Light mapping
    const lightPedidos = finalPedidos.map(p => ({
      IDPedido: p.IDPedido,
      Cliente: p.Cliente,
      'Cliente en BD?': p['Cliente en BD?'],
      'Fecha y hora': p['Fecha y hora'],
      'Dirección cliente': p['Dirección cliente'],
      Nombre: p.Nombre,
      'Razón social (NO BD)': p['Razón social (NO BD)'],
      'Celular de contacto': p['Celular de contacto'],
      'Porcentaje de descuento (%)': p['Porcentaje de descuento (%)'],
      Observaciones: p.Observaciones,
      'Emitido por': p['Emitido por'],
      'Emitido por con fecha': p['Emitido por con fecha'],
      'Emitido Fecha': p['Emitido Fecha'],
      Fecha_Ultima_Modificacion: p.Fecha_Ultima_Modificacion,
      'Lugar de entrega': p['Lugar de entrega'],
      Total: p.Total,
      Estado: p.Estado,
      Vendedor: p.Vendedor,
      VendedorNombre: p.VendedorNombre,
      Nro_PedidoGestion: p.Nro_PedidoGestion,
      Nro_PedidoReferencia: p.Nro_PedidoReferencia,
      detalles: []
    }));

    res.json(lightPedidos);
  } catch (error) {
    next(error);
  }
});

// POST /details-batch - fetch details for specific order IDs
router.post('/details-batch', async (req, res, next) => {
  try {
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.json({});
    }
    const finalPedidos = await getCompletePedidos();
    const result = {};
    ids.forEach(id => {
      const p = finalPedidos.find(x => String(x.IDPedido) === String(id));
      result[id] = p ? (p.detalles || []) : [];
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// POST new pedido
router.post('/', (req, res, next) => {
  creationQueue = creationQueue.then(async () => {
    try {
      const { header, detalles } = req.body;
      
      // 1. Get current IDs to generate new one
      const existingPedidos = await supabaseService.getRows('atc_pedidos_v');
      let maxId = 0;
      if (existingPedidos.length > 0) {
        const ids = existingPedidos
          .map(p => parseInt(p.IDPedido))
          .filter(id => !isNaN(id) && id < 1000000);
        maxId = Math.max(...ids, 0);
      }
      const newId = maxId < 110000 ? 110000 : maxId + 1;
      
      const now = new Date();
      const emitidoPor = header['Emitido por'] || 'Admin';

      let vdorFinal = header.Vendedor;
      if (isNaN(parseInt(vdorFinal)) && vdorFinal) {
        try {
          const vendedores = await mssqlService.getVendedores();
          const found = vendedores.find(v => v.NOMBRE && v.NOMBRE.toLowerCase().includes(String(vdorFinal).toLowerCase()));
          if (found) vdorFinal = found.VDOR || found.NRO_VENDEDOR;
        } catch (e) { console.error('Error mapping vdor name to id:', e); }
      }

      const pedidoData = {
        IDPedido: newId,
        'Cliente': header.Cliente,
        'Cliente en BD?': 'TRUE',
        'Fecha y hora': formatDate(now, 'FULL'),
        'Dirección cliente': header['Lugar de entrega'],
        'Nombre': header.Nombre,
        'Razón social (NO BD)': '',
        'Celular de contacto': header.Celular,
        'Porcentaje de descuento (%)': header.Descuento || 0,
        'Observaciones': header.Observaciones || '',
        'Emitido por': emitidoPor,
        'Emitido por con fecha': `${emitidoPor} - ${formatDate(now, 'SHORT_WITH_TIME')}`,
        'Emitido Fecha': formatDate(now, 'FULL'),
        'Lugar de entrega': header['Lugar de entrega'],
        'Deposito que prepara': '',
        'Creado por': emitidoPor,
        'Total': header.Total || 0,
        'Fecha_Ultima_Modificacion': formatDate(now, 'FULL'),
        'Fecha y Hora de Última Modificación': formatDate(now, 'FULL'),
        'Estado': '0',
        'Vendedor': vdorFinal || ''
      };
      
      await supabaseService.upsertRow('atc_pedidos_v', pedidoData);
      
      const detailObjects = detalles.map(item => {
        const precio = parseCurrency(item.Precio);
        const cant = parseCurrency(item.Cantidad);
        const desc = parseCurrency(item.Descuento);
        const subtotal = precio * cant;
        
        return {
          IDPedido: newId,
          IDDetalle: `${newId}${item['Codigo (más alla de si es item o nombre)'] || item['Item  codigo'] || ''}`.replace(/\D/g, ''),
          'Codigo (más alla de si es item o nombre)': item['Codigo (más alla de si es item o nombre)'] || item['Item  codigo'] || '',
          'Nombre (más alla de si es item o nombre)': item['Nombre (más alla de si es item o nombre)'] || item['Nombre item'] || '',
          'Item  codigo': item['Codigo (más alla de si es item o nombre)'] || item['Item  codigo'] || '',
          'Nombre item': item['Nombre (más alla de si es item o nombre)'] || item['Nombre item'] || '',
          'Cantidad': cant,
          'Descuento': desc,
          'Precio': precio,
          'Subtotal (precio x cantidad)': subtotal,
          'Monto del descuento': 0,
          'Total (subtotal - monto del descuento)': subtotal,
          'Stock al momento de cargar': parseCurrency(item.StockAvailable),
          'Proveedor': item.Proveedor || ''
        };
      });

      if (detailObjects.length > 0) {
        await supabaseService.insertRows('atc_detalles_pedidos_v', detailObjects);
      }

      invalidatePedidosCache();
      res.status(201).json({ IDPedido: newId, message: 'Pedido creado exitosamente' });
    } catch (error) {
      console.error('Error creating pedido:', error);
      next(error);
    }
  }).catch(err => {
    console.error('Queue fatal error:', err);
  });
});

async function withRetry(fn, retries = 2, delayMs = 500, exponential = false) {
  let lastError;
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const currentDelay = exponential ? delayMs * Math.pow(2, attempt - 1) : delayMs;
      console.warn(`[RETRY] Attempt ${attempt}/${retries + 1} failed: ${err.message}. Retrying in ${currentDelay}ms...`);
      if (attempt <= retries) {
        await new Promise(res => setTimeout(res, currentDelay));
      }
    }
  }
  throw lastError;
}

// PATCH update pedido estado
router.patch('/:id/estado', async (req, res, next) => {
  try {
    const pedidoId = req.params.id;
    const { estado } = req.body;
    const now = new Date();
    const cleanStatus = String(estado).trim();
    
    // Check if it exists in the database
    const dbPedidos = await mssqlService.getPedidosFromDB().catch(() => []);
    const existsInDB = dbPedidos.some(p => String(p.IDPedido) === String(pedidoId));
    
    if (existsInDB) {
      await withRetry(() => mssqlService.updatePedidoEstadoInDB(pedidoId, cleanStatus));
      
      // Update in Supabase if present
      await supabaseService.updateRows('atc_pedidos_v', { IDPedido: pedidoId }, {
        Estado: cleanStatus,
        Fecha_Ultima_Modificacion: formatDate(now, 'FULL')
      });
      invalidatePedidosCache();
      return res.json({ message: 'Estado del pedido en Base de Datos actualizado exitosamente', newStatus: cleanStatus });
    }
    
    // Draft in Supabase
    const supabasePedidos = await supabaseService.getRows('atc_pedidos_v');
    const pedidoObj = supabasePedidos.find(p => String(p.IDPedido) === String(pedidoId));
    
    if (!pedidoObj) return res.status(404).json({ message: 'Pedido no encontrado en Supabase' });
    
    pedidoObj.Estado = cleanStatus;
    pedidoObj.Fecha_Ultima_Modificacion = formatDate(now, 'FULL');
    
    if (cleanStatus === '1' || cleanStatus === '1.' || cleanStatus === '0.0.99') {
      const allDetalles = await supabaseService.getRows('atc_detalles_pedidos_v');
      const detalles = allDetalles.filter(d => String(d.IDPedido) === String(pedidoId));
      
      await withRetry(() => mssqlService.createPedidoInDB(pedidoObj, detalles), 4, 1000, true);
    }
    
    await supabaseService.updateRows('atc_pedidos_v', { IDPedido: pedidoId }, {
      Estado: cleanStatus,
      Fecha_Ultima_Modificacion: formatDate(now, 'FULL')
    });
    
    invalidatePedidosCache();
    res.json({ message: 'Estado actualizado exitosamente en Supabase y Base de Datos', newStatus: cleanStatus });
  } catch (error) {
    next(error);
  }
});

// DELETE pedido permanently
router.delete('/:id', async (req, res, next) => {
  try {
    const pedidoId = req.params.id;
    
    const dbPedidos = await mssqlService.getPedidosFromDB().catch(() => []);
    const dbPedido = dbPedidos.find(p => String(p.IDPedido) === String(pedidoId));
    
    if (dbPedido) {
      const state = String(dbPedido.Estado || '').trim();
      if (state === '0.0') {
        await withRetry(() => mssqlService.updatePedidoEstadoInDB(pedidoId, '0.0.99'));
        await supabaseService.updateRows('atc_pedidos_v', { IDPedido: pedidoId }, { Estado: '0.0.99' });
        invalidatePedidosCache();
        return res.json({ message: 'Pedido de sistema anulado correctamente' });
      } else {
        await withRetry(() => mssqlService.deletePedidoFromDB(pedidoId));
      }
    }
    
    await supabaseService.deleteRows('atc_detalles_pedidos_v', { IDPedido: pedidoId });
    await supabaseService.deleteRows('atc_pedidos_v', { IDPedido: pedidoId });
    
    invalidatePedidosCache();
    res.json({ message: 'Pedido eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting pedido:', error);
    next(error);
  }
});

// PUT update pedido
router.put('/:id', async (req, res, next) => {
  try {
    const pedidoId = req.params.id;
    const { header, detalles } = req.body;
    const now = new Date();
    
    const dbPedidos = await mssqlService.getPedidosFromDB().catch(() => []);
    const dbPedido = dbPedidos.find(p => String(p.IDPedido) === String(pedidoId));
    
    const newDetailRows = detalles.map(item => {
      const precio = parseCurrency(item.Precio);
      const cant = parseCurrency(item.Cantidad);
      const desc = parseCurrency(item.Descuento);
      const subtotal = precio * cant;
      
      return {
        IDPedido: pedidoId,
        IDDetalle: `${pedidoId}${item['Codigo (más alla de si es item o nombre)'] || item['Item  codigo'] || ''}`.replace(/\D/g, ''),
        'Codigo (más alla de si es item o nombre)': item['Codigo (más alla de si es item o nombre)'] || item['Item  codigo'] || '',
        'Nombre (más alla de si es item o nombre)': item['Nombre (más alla de si es item o nombre)'] || item['Nombre item'] || '',
        'Item  codigo': item['Codigo (más alla de si es item o nombre)'] || item['Item  codigo'] || '',
        'Nombre item': item['Nombre (más alla de si es item o nombre)'] || item['Nombre item'] || '',
        'Cantidad': cant,
        'Descuento': desc,
        'Precio': precio,
        'Subtotal (precio x cantidad)': subtotal,
        'Monto del descuento': 0,
        'Total (subtotal - monto del descuento)': subtotal,
        'Stock al momento de cargar': parseCurrency(item.StockAvailable || item['Stock al momento de cargar']),
        'Proveedor': item.Proveedor || '',
        PORCENT: parseCurrency(item.PORCENT),
        CantidadPreparada: parseCurrency(item['Cantidad preparada'] || item.CantidadPreparada),
        IdRenglonGestion: item.IdRenglonGestion || null
      };
    });
    
    if (dbPedido) {
      const mappedDbHeader = mapDbPedidoToSheetFormat(dbPedido);
      const updatedPedido = {
        ...mappedDbHeader,
        ...header,
        IDPedido: pedidoId,
        'Fecha_Ultima_Modificacion': formatDate(now, 'FULL')
      };
      
      await withRetry(() => mssqlService.updatePedidoInDB(pedidoId, updatedPedido, newDetailRows));
      await supabaseService.updateRows('atc_pedidos_v', { IDPedido: pedidoId }, updatedPedido);
      invalidatePedidosCache();
      return res.json({ message: 'Pedido en Base de Datos actualizado exitosamente' });
    }
    
    const existingPedidos = await supabaseService.getRows('atc_pedidos_v');
    const existingPedido = existingPedidos.find(p => String(p.IDPedido) === String(pedidoId));
    
    if (!existingPedido) return res.status(404).json({ message: 'Pedido no encontrado' });
    
    const rawUpdated = {
      ...existingPedido,
      ...header,
      IDPedido: pedidoId,
      'Fecha_Ultima_Modificacion': formatDate(now, 'FULL')
    };
    
    const validColumns = new Set([
      'IDPedido', 'Cliente', 'Cliente en BD?', 'Fecha y hora', 'Dirección cliente',
      'Nombre', 'Razón social (NO BD)', 'Celular de contacto', 'Porcentaje de descuento (%)',
      'Observaciones', 'Emitido por', 'Emitido por con fecha', 'Emitido Fecha',
      'Lugar de entrega', 'Deposito que prepara', 'Fecha de envio', 'Creado por',
      'Total', 'Fecha_Ultima_Modificacion', 'Fecha y Hora de Última Modificación',
      'Estado', 'Vendedor', 'Nro_PedidoGestion', 'Nro_PedidoReferencia'
    ]);
    
    const updatedPedido = {};
    Object.keys(rawUpdated).forEach(k => {
      if (validColumns.has(k)) {
        updatedPedido[k] = rawUpdated[k];
      }
    });
    
    await supabaseService.updateRows('atc_pedidos_v', { IDPedido: pedidoId }, updatedPedido);
    await supabaseService.deleteRows('atc_detalles_pedidos_v', { IDPedido: pedidoId });
    if (newDetailRows.length > 0) {
      const validDetailColumns = new Set([
        'IDDetalle', 'IDPedido', 'Codigo (más alla de si es item o nombre)',
        'Nombre (más alla de si es item o nombre)', 'Item  codigo', 'Nombre item',
        'Cantidad', 'Descuento', 'Precio', 'Subtotal (precio x cantidad)',
        'Monto del descuento', 'Total (subtotal - monto del descuento)',
        'Stock al momento de cargar', 'Proveedor'
      ]);
      const sanitizedDetails = newDetailRows.map(row => {
        const clean = {};
        Object.keys(row).forEach(k => {
          if (validDetailColumns.has(k)) clean[k] = row[k];
        });
        return clean;
      });
      await supabaseService.insertRows('atc_detalles_pedidos_v', sanitizedDetails);
    }
    
    invalidatePedidosCache();
    res.json({ message: 'Pedido actualizado exitosamente' });
  } catch (error) {
    console.error('Error updating pedido:', error);
    next(error);
  }
});

// GET pedido by ID
router.get('/:id', async (req, res, next) => {
  try {
    const pedidoId = req.params.id;
    
    if (pedidosCache) {
      const found = pedidosCache.find(p => String(p.IDPedido) === String(pedidoId));
      if (found) {
        return res.json(found);
      }
    }
    
    const dbPedidos = await mssqlService.getPedidosFromDB().catch(() => []);
    const dbPedido = dbPedidos.find(p => String(p.IDPedido) === String(pedidoId));
    
    let pedido;
    let detalles = [];
    
    const [sqlProducts] = await Promise.all([
      mssqlService.getProductos().catch(err => {
        console.error('Error fetching SQL products for single pedido:', err.message);
        return [];
      })
    ]);
    
    const productProviderMap = new Map();
    if (Array.isArray(sqlProducts)) {
      sqlProducts.forEach(prod => {
        if (prod.CODART && prod.Proveedor) {
          productProviderMap.set(String(prod.CODART).trim().toLowerCase(), String(prod.Proveedor).trim());
        }
      });
    }
    
    if (dbPedido) {
      pedido = mapDbPedidoToSheetFormat(dbPedido);
      const dbDetalles = await mssqlService.getDetallesFromDB().catch(() => []);
      detalles = dbDetalles
        .filter(d => String(d.IdPedido) === String(pedidoId))
        .map(mapDbDetalleToSheetFormat);
    } else {
      const [supabasePedidos, supabaseDetalles] = await Promise.all([
        supabaseService.getRows('atc_pedidos_v'),
        supabaseService.getRows('atc_detalles_pedidos_v')
      ]);
      const foundPedido = supabasePedidos.find(p => String(p.IDPedido) === String(pedidoId));
      
      if (!foundPedido) return res.status(404).json({ message: 'Pedido no encontrado' });
      
      pedido = foundPedido;
      detalles = supabaseDetalles.filter(d => String(d.IDPedido) === String(pedidoId));
    }
    
    pedido.detalles = detalles.map(d => {
      const code = String(d['Codigo (más alla de si es item o nombre)'] || d['Item  codigo'] || '').trim().toLowerCase();
      if (productProviderMap.has(code)) {
        d.Proveedor = productProviderMap.get(code);
      }
      if (!d.Proveedor || d.Proveedor === '—') {
        d.Proveedor = '—';
      }
      return d;
    });

    await mapVendedorNames([pedido]);
    res.json(pedido);
  } catch (error) {
    next(error);
  }
});

// Automatic server background warmup on boot
setTimeout(() => {
  console.log('[WARMUP] Starting initial background cache warmup for pedidos...');
  getCompletePedidos()
    .then(data => {
      console.log(`[WARMUP] Cache warmup complete! ${data.length} pedidos ready in memory.`);
    })
    .catch(err => {
      console.error('[WARMUP] Error preloading cache on startup:', err.message);
    });
}, 1000);

module.exports = router;
