const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');
require('dotenv').config();

if (!globalThis.WebSocket) {
  globalThis.WebSocket = WebSocket;
}

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://cjqziapqtyjsxqxumgbx.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqcXppYXBxdHlqc3hxeHVtZ2J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMDE3NDIsImV4cCI6MjA2Nzc3Nzc0Mn0.EYVIWtOmrDd-_b-wA5lHMmO_CNuB22oc5I1dyl648rk';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
  realtime: {
    transport: WebSocket
  }
});

// Smart in-memory cache for fast read operations
const cache = new Map();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

function clearCache() {
  cache.clear();
}

const ALLOWED_COLUMNS_BY_VIEW = {
  atc_usuarios_v: new Set(['id', 'Nombre de usuario', 'Email', 'Contraseña', 'Perfil', 'NRO_VENDEDOR', 'Activo', 'Intentos fallidos', 'Bloqueado hasta']),
  atc_pedidos_v: new Set([
    'IDPedido', 'Cliente', 'Cliente en BD?', 'Fecha y hora', 'Dirección cliente',
    'Nombre', 'Razón social (NO BD)', 'Celular de contacto', 'Porcentaje de descuento (%)',
    'Observaciones', 'Emitido por', 'Emitido por con fecha', 'Emitido Fecha',
    'Lugar de entrega', 'Deposito que prepara', 'Fecha de envio', 'Fecha de envío',
    'Creado por', 'Total', 'Fecha_Ultima_Modificacion', 'Fecha y Hora de Última Modificación',
    'Estado', 'Vendedor', 'Nro_PedidoGestion', 'Nro_PedidoReferencia'
  ]),
  atc_detalles_pedidos_v: new Set([
    'IDDetalle', 'IDPedido', 'Codigo (más alla de si es item o nombre)',
    'Nombre (más alla de si es item o nombre)', 'Item  codigo', 'Nombre item',
    'Cantidad', 'Descuento', 'Precio', 'Subtotal (precio x cantidad)',
    'Monto del descuento', 'Total (subtotal - monto del descuento)',
    'Stock al momento de cargar', 'Proveedor'
  ])
};

const INTEGER_COLUMNS = new Set([
  'Cliente', 'Vendedor', 'Nro_PedidoGestion', 'Nro_PedidoReferencia', 'NRO_VENDEDOR', 'Intentos fallidos'
]);

const NUMERIC_COLUMNS = new Set([
  'Porcentaje de descuento (%)', 'Total', 'Cantidad', 'Descuento', 'Precio',
  'Subtotal (precio x cantidad)', 'Monto del descuento', 'Total (subtotal - monto del descuento)',
  'Stock al momento de cargar'
]);

const DATE_COLUMNS = new Set([
  'Fecha y hora', 'Emitido Fecha', 'Fecha de envio', 'Fecha de envío',
  'Fecha_Ultima_Modificacion', 'Fecha y Hora de Última Modificación', 'Bloqueado hasta'
]);

function sanitizeRow(tableName, rowObj) {
  const allowed = ALLOWED_COLUMNS_BY_VIEW[tableName];
  if (!allowed || !rowObj || typeof rowObj !== 'object') return rowObj;
  const clean = {};
  for (const [key, value] of Object.entries(rowObj)) {
    if (allowed.has(key)) {
      if ((DATE_COLUMNS.has(key) || INTEGER_COLUMNS.has(key) || NUMERIC_COLUMNS.has(key)) && (value === '' || value === undefined)) {
        clean[key] = null;
      } else {
        clean[key] = value;
      }
    }
  }
  return clean;
}

/**
 * Normaliza las peticiones de lectura hacia las vistas públicas de Supabase
 * @param {string} viewName 'atc_usuarios_v' | 'atc_pedidos_v' | 'atc_detalles_pedidos_v'
 */
async function getRows(viewName) {
  let tableName = 'atc_usuarios_v';
  if (viewName.includes('Usuarios')) {
    tableName = 'atc_usuarios_v';
  } else if (viewName.includes('Detalles')) {
    tableName = 'atc_detalles_pedidos_v';
  } else if (viewName.includes('Pedidos')) {
    tableName = 'atc_pedidos_v';
  } else {
    tableName = viewName;
  }

  const now = Date.now();
  const cached = cache.get(tableName);
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.data;
  }

  const { data, error } = await supabase
    .from(tableName)
    .select('*');

  if (error) {
    console.error(`Error fetching from Supabase view ${tableName}:`, error.message);
    throw error;
  }

  const result = data || [];
  cache.set(tableName, { data: result, timestamp: now });
  return result;
}

/**
 * Inserta o actualiza un registro en la vista pública
 * @param {string} viewName
 * @param {Object} rowData
 */
async function upsertRow(viewName, rowData) {
  clearCache();
  let tableName = 'atc_usuarios_v';
  if (viewName.includes('Usuarios')) {
    tableName = 'atc_usuarios_v';
  } else if (viewName.includes('Detalles')) {
    tableName = 'atc_detalles_pedidos_v';
  } else if (viewName.includes('Pedidos')) {
    tableName = 'atc_pedidos_v';
  } else {
    tableName = viewName;
  }

  const cleanData = sanitizeRow(tableName, rowData);
  const { data, error } = await supabase
    .from(tableName)
    .insert([cleanData]);

  if (error) {
    console.error(`Error upserting into Supabase view ${tableName}:`, error.message);
    throw error;
  }
  return data;
}

/**
 * Inserta múltiples registros en la vista pública
 * @param {string} viewName
 * @param {Array<Object>} rowsData
 */
async function insertRows(viewName, rowsData) {
  clearCache();
  if (!Array.isArray(rowsData) || rowsData.length === 0) return [];

  let tableName = 'atc_usuarios_v';
  if (viewName.includes('Usuarios')) {
    tableName = 'atc_usuarios_v';
  } else if (viewName.includes('Detalles')) {
    tableName = 'atc_detalles_pedidos_v';
  } else if (viewName.includes('Pedidos')) {
    tableName = 'atc_pedidos_v';
  } else {
    tableName = viewName;
  }

  const cleanRows = rowsData.map(row => sanitizeRow(tableName, row));
  const { data, error } = await supabase
    .from(tableName)
    .insert(cleanRows);

  if (error) {
    console.error(`Error inserting rows into Supabase view ${tableName}:`, error.message);
    throw error;
  }
  return data;
}

/**
 * Actualiza registros en la vista pública que coincidan con un filtro
 * @param {string} viewName
 * @param {Object} matchFilter e.g. { "Nombre de usuario": "Juan" } o { "IDPedido": 100001 }
 * @param {Object} updateData
 */
async function updateRows(viewName, matchFilter, updateData) {
  clearCache();
  let tableName = 'atc_usuarios_v';
  if (viewName.includes('Usuarios')) {
    tableName = 'atc_usuarios_v';
  } else if (viewName.includes('Detalles')) {
    tableName = 'atc_detalles_pedidos_v';
  } else if (viewName.includes('Pedidos')) {
    tableName = 'atc_pedidos_v';
  } else {
    tableName = viewName;
  }

  const cleanData = sanitizeRow(tableName, updateData);
  let query = supabase.from(tableName).update(cleanData);
  Object.entries(matchFilter).forEach(([key, val]) => {
    query = query.eq(key, val);
  });

  const { data, error } = await query;
  if (error) {
    console.error(`Error updating rows in Supabase view ${tableName}:`, error.message);
    throw error;
  }
  return data;
}

/**
 * Elimina registros en la vista pública por filtro
 * @param {string} viewName
 * @param {Object} matchFilter
 */
async function deleteRows(viewName, matchFilter) {
  clearCache();
  let tableName = 'atc_usuarios_v';
  if (viewName.includes('Usuarios')) {
    tableName = 'atc_usuarios_v';
  } else if (viewName.includes('Detalles')) {
    tableName = 'atc_detalles_pedidos_v';
  } else if (viewName.includes('Pedidos')) {
    tableName = 'atc_pedidos_v';
  } else {
    tableName = viewName;
  }

  let query = supabase.from(tableName).delete();
  Object.entries(matchFilter).forEach(([key, val]) => {
    query = query.eq(key, val);
  });

  const { data, error } = await query;
  if (error) {
    console.error(`Error deleting rows from Supabase view ${tableName}:`, error.message);
    throw error;
  }
  return data;
}

module.exports = {
  supabase,
  getRows,
  upsertRow,
  insertRows,
  updateRows,
  deleteRows,
  clearCache
};
