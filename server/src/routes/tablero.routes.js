const mssqlService = require('../services/mssql.service');

// Date Formatter helper (preserves literal time for SQL Server, converts UTC with offset for Supabase to America/Argentina/Buenos_Aires timezone)
function formatDate(date, format = 'ISO') {
  if (!date) return ''

  let y, m, day, h, min, s;

  if (date instanceof Date) {
    // Si ya es un objeto Date (como el que viene de SQL Server o new Date())
    // Queremos formatearlo en la zona horaria de Buenos Aires
    const options = {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }
    const parts = new Intl.DateTimeFormat('en-CA', options).formatToParts(date)
    const get = (type) => parts.find(p => p.type === type)?.value || '00'

    y = get('year')
    m = get('month')
    day = get('day')
    h = get('hour')
    if (h === '24') h = '00'
    min = get('minute')
    s = get('second')
  } else {
    const str = String(date).trim();
    // Si contiene timezone (ej: contiene +00, Z o +00:00) o es formato ISO completo de Supabase
    if (str.includes('+00') || str.toLowerCase().includes('z') || str.includes('T')) {
      const d = new Date(str);
      if (isNaN(d.getTime())) return '';
      // Formatear en zona de Buenos Aires
      const options = {
        timeZone: 'America/Argentina/Buenos_Aires',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }
      const parts = new Intl.DateTimeFormat('en-CA', options).formatToParts(d)
      const get = (type) => parts.find(p => p.type === type)?.value || '00'

      y = get('year')
      m = get('month')
      day = get('day')
      h = get('hour')
      if (h === '24') h = '00'
      min = get('minute')
      s = get('second')
    } else {
      // Si es un string sin zona horaria (como el de SQL Server), extraer literal
      const match = str.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})/);
      if (match) {
        [, y, m, day, h, min, s] = match;
      } else {
        const d = new Date(str);
        if (isNaN(d.getTime())) return '';
        y   = String(d.getFullYear()).padStart(4, '0');
        m   = String(d.getMonth() + 1).padStart(2, '0');
        day = String(d.getDate()).padStart(2, '0');
        h   = String(d.getHours()).padStart(2, '0');
        min = String(d.getMinutes()).padStart(2, '0');
        s   = String(d.getSeconds()).padStart(2, '0');
      }
    }
  }

  if (format === 'FULL') return `${y}-${m}-${day} ${h}:${min}:${s}`
  if (format === 'SHORT_WITH_TIME') return `${day}/${m}/${y} ${h}:${min}`
  return `${y}-${m}-${day}T${h}:${min}:${s}`
}

async function mapVendedorNames(pedidos) {
  try {
    const vendedores = await mssqlService.getVendedores();
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
    'Cantidad preparada': dbD.CantidadPrepared || dbD.CantidadPreparada || 0,
    'Subtotal (precio x cantidad)                   ': dbD.Sub_Total || 0,
    'Monto del descuento   ': 0,
    'Total (subtotal - monto del descuento)': dbD.Total || 0,
    'Stock al momento de cargar': 0,
    Proveedor: '',
    IdRenglonGestion: dbD.IdRenglonGestion || null
  };
}

const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../config/mssql');
const supabaseService = require('../services/supabase.service');
const auth = require('../middlewares/auth');

// Protect all dashboard analytics routes
router.use(auth);

async function getPool(res) {
  const pool = await poolPromise;
  if (!pool) {
    if (res) res.status(500).json({ error: 'MSSQL no disponible' });
    return null;
  }
  return pool;
}

// ─── Helpers for SQL Filtering ─────────────────────────────────────
const applyProductosFilters = (req, request, baseWhere = '') => {
  let clauses = [];
  if (baseWhere) clauses.push(`(${baseWhere})`);
  
  const handleMultiple = (paramName, dbField) => {
    let val = req.query[paramName];
    if (!val) return;
    
    const values = (Array.isArray(val) ? val : val.split(',')).map(v => String(v)).filter(v => v.trim() !== '');
    if (values.length === 0) return;

    if (values.length === 1) {
      request.input(`param${paramName}`, sql.NVarChar, values[0]);
      clauses.push(`${dbField} = @param${paramName}`);
    } else {
      const valueParams = values.map((v, i) => {
        const pName = `param${paramName}${i}`;
        request.input(pName, sql.NVarChar, v);
        return `@${pName}`;
      });
      clauses.push(`${dbField} IN (${valueParams.join(', ')})`);
    }
  };

  handleMultiple('familia', 'NombreFamilia');
  handleMultiple('proveedor', 'Proveedor');
  handleMultiple('marca', 'NombreMarca');
  
  if (req.query.search) {
    request.input('paramSearchProd', `%${req.query.search}%`);
    clauses.push(`DESCRI LIKE @paramSearchProd`);
  }
  
  return clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
};

const applyClientesFilters = (req, request, baseWhere = '') => {
  let clauses = [];
  if (baseWhere) clauses.push(`(${baseWhere})`);
  
  const handleMultiple = (paramName, dbField) => {
    let val = req.query[paramName];
    if (!val) return;
    
    const values = (Array.isArray(val) ? val : val.split(',')).map(v => String(v)).filter(v => v.trim() !== '');
    if (values.length === 0) return;

    if (values.length === 1) {
      request.input(`param${paramName}`, sql.NVarChar, values[0]);
      clauses.push(`${dbField} = @param${paramName}`);
    } else {
      const valueParams = values.map((v, i) => {
        const pName = `param${paramName}${i}`;
        request.input(pName, sql.NVarChar, v);
        return `@${pName}`;
      });
      clauses.push(`${dbField} IN (${valueParams.join(', ')})`);
    }
  };

  handleMultiple('vendedor', 'VENDEDOR');
  handleMultiple('provincia', 'PROVINCIA');
  handleMultiple('localidad', 'LOCALIDAD');
  
  if (req.query.search) {
    request.input('paramSearchCli', `%${req.query.search}%`);
    clauses.push(`NOMBRE_CLIENTE LIKE @paramSearchCli`);
  }

  return clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
};

// ─── Health check ───────────────────────────────────────────────
router.get('/health', async (req, res) => {
  try {
    const pool = await getPool(res);
    if (!pool) return;
    await pool.request().query('SELECT 1');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// ─── KPIs (metrics summary) ────────────────────────────────────
router.get('/kpis', async (req, res) => {
  try {
    const pool = await getPool(res);
    if (!pool) return;
    
    const reqProductosConStock = pool.request();
    const whereProdStock = applyProductosFilters(req, reqProductosConStock, 'stock > 0');
    
    const reqProdTotal = pool.request();
    const whereProdTotal = applyProductosFilters(req, reqProdTotal, '');

    const [saldos, productos, articulos, vendedores, clientes, saldosNegativos] = await Promise.all([
      pool.request().query(`SELECT SUM(SALDO) as totalSaldo, SUM(CASE WHEN SALDO > 0 THEN 1 ELSE 0 END) as totalClientes FROM App.ClientesMay`),
      reqProductosConStock.query(`SELECT COUNT(*) as total FROM App.Productos ${whereProdStock}`),
      reqProdTotal.query(`SELECT COUNT(*) as total FROM App.Productos ${whereProdTotal}`),
      pool.request().query(`SELECT COUNT(*) as total FROM App.Vendedores WHERE ACTIVO = 1`),
      pool.request().query(`SELECT COUNT(*) as total FROM App.ClientesMay`),
      pool.request().query(`SELECT COUNT(*) as total FROM App.ClientesMay WHERE SALDO < 0`),
    ]);

    res.json({
      saldoTotal: saldos.recordset[0].totalSaldo,
      clientesConSaldo: saldos.recordset[0].totalClientes,
      clientesConSaldoAFavor: saldosNegativos.recordset[0].total,
      productosConStock: productos.recordset[0].total,
      totalProductos: articulos.recordset[0].total,
      vendedoresActivos: vendedores.recordset[0].total,
      totalClientes: clientes.recordset[0].total,
    });
  } catch (err) {
    console.error('Error /api/tablero/kpis:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Clientes y Saldos (top) ────────────────────────────────────
router.get('/clientes/saldos', async (req, res) => {
  try {
    const pool = await getPool(res);
    if (!pool) return;
    const limit = parseInt(req.query.limit) || 15;

    const request = pool.request();
    const whereClause = applyClientesFilters(req, request, "");

    const sortBy = String(req.query.sortBy || '').toLowerCase() === 'name' ? 'NOMBRE_CLIENTE' : 'SALDO';
    const sortOrder = String(req.query.sortOrder || '').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const result = await request.query(`
      SELECT TOP ${limit} 
        NOMBRE_CLIENTE as name, 
        SALDO as value, 
        VENDEDOR as vendedor,
        LOCALIDAD as localidad,
        PROVINCIA as provincia
      FROM App.ClientesMay 
      ${whereClause}
      ORDER BY [${sortBy}] ${sortOrder}
    `);

    const reqTotal = pool.request();
    const whereTotal = applyClientesFilters(req, reqTotal, "");
    const totalResult = await reqTotal.query(`SELECT SUM(SALDO) as total FROM App.ClientesMay ${whereTotal}`);

    res.json({
      clientes: result.recordset,
      total: totalResult.recordset[0].total,
    });
  } catch (err) {
    console.error('Error /api/tablero/clientes/saldos:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Vendedores (clientes por vendedor) ──────────────────────────
router.get('/vendedores', async (req, res) => {
  try {
    const pool = await getPool(res);
    if (!pool) return;
    const request = pool.request();
    const whereClause = applyClientesFilters(req, request, "VENDEDOR IS NOT NULL AND VENDEDOR != ''");

    const result = await request.query(`
      SELECT 
        VENDEDOR as name, 
        COUNT(*) as cantClientes, 
        SUM(SALDO) as saldoTotal
      FROM App.ClientesMay
      ${whereClause}
      GROUP BY VENDEDOR
      ORDER BY cantClientes DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error /api/tablero/vendedores:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Global Filters Endpoint ──────────────────────────────────────
router.get('/filters/productos', async (req, res) => {
  try {
    const pool = await getPool(res);
    if (!pool) return;
    const familias = await pool.request().query("SELECT DISTINCT NombreFamilia FROM App.Productos WHERE NombreFamilia IS NOT NULL AND NombreFamilia != '' ORDER BY NombreFamilia");
    const proveedores = await pool.request().query("SELECT DISTINCT Proveedor FROM App.Productos WHERE Proveedor IS NOT NULL AND Proveedor != '' ORDER BY Proveedor");
    const marcas = await pool.request().query("SELECT DISTINCT NombreMarca FROM App.Productos WHERE NombreMarca IS NOT NULL AND NombreMarca != '' ORDER BY NombreMarca");
    
    res.json({
      familias: familias.recordset.map(row => row.NombreFamilia),
      proveedores: proveedores.recordset.map(row => row.Proveedor),
      marcas: marcas.recordset.map(row => row.NombreMarca)
    });
  } catch (err) {
    console.error('Error /api/tablero/filters/productos:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/filters/clientes', async (req, res) => {
  try {
    const pool = await getPool(res);
    if (!pool) return;
    const vendedores = await pool.request().query("SELECT DISTINCT VENDEDOR FROM App.ClientesMay WHERE VENDEDOR IS NOT NULL AND VENDEDOR != '' ORDER BY VENDEDOR");
    const provincias = await pool.request().query("SELECT DISTINCT PROVINCIA FROM App.ClientesMay WHERE PROVINCIA IS NOT NULL AND PROVINCIA != '' ORDER BY PROVINCIA");
    const localidades = await pool.request().query("SELECT DISTINCT LOCALIDAD FROM App.ClientesMay WHERE LOCALIDAD IS NOT NULL AND LOCALIDAD != '' ORDER BY LOCALIDAD");
    
    res.json({
      vendedores: vendedores.recordset.map(row => row.VENDEDOR),
      provincias: provincias.recordset.map(row => row.PROVINCIA),
      localidades: localidades.recordset.map(row => row.LOCALIDAD)
    });
  } catch (err) {
    console.error('Error /api/tablero/filters/clientes:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Geo: Saldos por localidad ──────────────────────────────────
router.get('/geo/localidades', async (req, res) => {
  try {
    const pool = await getPool(res);
    if (!pool) return;
    const limit = parseInt(req.query.limit) || 8;

    const request = pool.request();
    const whereClause = applyClientesFilters(req, request, "LOCALIDAD IS NOT NULL");

    const result = await request.query(`
      SELECT TOP ${limit}
        LOCALIDAD + ', ' + PROVINCIA as label, 
        SUM(SALDO) as value,
        COUNT(*) as cantClientes
      FROM App.ClientesMay
      ${whereClause}
      GROUP BY LOCALIDAD, PROVINCIA
      ORDER BY SUM(SALDO) DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error /api/tablero/geo/localidades:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Productos por familia ──────────────────────────────────────
router.get('/productos/familias', async (req, res) => {
  try {
    const pool = await getPool(res);
    if (!pool) return;
    const request = pool.request();
    const whereClause = applyProductosFilters(req, request, '');
    
    const result = await request.query(`
      SELECT 
        NombreFamilia as name, 
        COUNT(*) as cantidad
      FROM App.Productos
      ${whereClause}
      GROUP BY NombreFamilia
      ORDER BY cantidad DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error /api/tablero/productos/familias:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Top proveedores ────────────────────────────────────────────
router.get('/productos/proveedores', async (req, res) => {
  try {
    const pool = await getPool(res);
    if (!pool) return;
    const limit = parseInt(req.query.limit) || 10;
    const request = pool.request();
    const whereClause = applyProductosFilters(req, request, "Proveedor IS NOT NULL AND Proveedor != ''");

    const result = await request.query(`
      SELECT TOP ${limit}
        Proveedor as name, 
        COUNT(*) as cantProductos
      FROM App.Productos
      ${whereClause}
      GROUP BY Proveedor
      ORDER BY cantProductos DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error /api/tablero/productos/proveedores:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Productos más valiosos (por precio) ────────────────────────
router.get('/productos/top', async (req, res) => {
  try {
    const pool = await getPool(res);
    if (!pool) return;
    const limit = parseInt(req.query.limit) || 10;
    const request = pool.request();
    const whereClause = applyProductosFilters(req, request, "stock > 0");

    const sortByRaw = String(req.query.sortBy || 'stock').toLowerCase();
    const sortOrder = String(req.query.sortOrder || '').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    let sortBy = 'stock';
    if (sortByRaw === 'name') sortBy = 'DESCRI';
    if (sortByRaw === 'precio') sortBy = 'precio';
    
    const query = `
      SELECT TOP ${limit}
        DESCRI as name, 
        stock,
        (CASE WHEN CC_CIVA < 500 THEN CC_CIVA * 1050 ELSE CC_CIVA END) as precio,
        NombreFamilia as familia,
        NombreMarca as marca,
        Proveedor as proveedor
      FROM App.Productos
      ${whereClause}
      ORDER BY [${sortBy}] ${sortOrder}
    `;
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error /api/tablero/productos/top:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Clientes por localidad (cantidad) ──────────────────────────
router.get('/clientes/por-localidad', async (req, res) => {
  try {
    const pool = await getPool(res);
    if (!pool) return;
    const limit = parseInt(req.query.limit) || 10;

    const result = await pool.request().query(`
      SELECT TOP ${limit}
        LOCALIDAD as label,
        COUNT(*) as value
      FROM App.ClientesMay
      WHERE LOCALIDAD IS NOT NULL
      GROUP BY LOCALIDAD
      ORDER BY COUNT(*) DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error /api/tablero/clientes/por-localidad:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Clientes por provincia ─────────────────────────────────────
router.get('/clientes/por-provincia', async (req, res) => {
  try {
    const pool = await getPool(res);
    if (!pool) return;
    const result = await pool.request().query(`
      SELECT 
        PROVINCIA as label,
        COUNT(*) as cantClientes,
        SUM(SALDO) as saldoTotal
      FROM App.ClientesMay
      WHERE PROVINCIA IS NOT NULL
      GROUP BY PROVINCIA
      ORDER BY SUM(SALDO) DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error /api/tablero/clientes/por-provincia:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Productos por marca ────────────────────────────────────────
router.get('/productos/marcas', async (req, res) => {
  try {
    const pool = await getPool(res);
    if (!pool) return;
    const limit = parseInt(req.query.limit) || 10;
    const request = pool.request();
    const whereClause = applyProductosFilters(req, request, "NombreMarca IS NOT NULL AND NombreMarca != '0'");

    const result = await request.query(`
      SELECT TOP ${limit}
        NombreMarca as name,
        COUNT(*) as cantidad
      FROM App.Productos
      ${whereClause}
      GROUP BY NombreMarca
      ORDER BY cantidad DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error /api/tablero/productos/marcas:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── PEDIDOS Y DETALLES (Supabase + SQL Server) ───────────────────
// Tablero In-Memory Cache configuration
let tableroPedidosCache = null;
let lastTableroPedidosFetch = 0;
let tableroDetallesCache = null;
let lastTableroDetallesFetch = 0;
const TABLERO_CACHE_TTL = 30 * 1000; // 30 seconds

function invalidateTableroCache() {
  tableroPedidosCache = null;
  lastTableroPedidosFetch = 0;
  tableroDetallesCache = null;
  lastTableroDetallesFetch = 0;
}

router.get('/pedidos', async (req, res) => {
  try {
    const now = Date.now();
    if (tableroPedidosCache && (now - lastTableroPedidosFetch < TABLERO_CACHE_TTL)) {
      return res.json({ data: tableroPedidosCache });
    }

    const [supabasePedidos, dbPedidos] = await Promise.all([
      supabaseService.getRows('atc_pedidos_v').catch(err => {
        console.error('Error fetching Supabase pedidos for tablero:', err.message);
        return [];
      }),
      mssqlService.getPedidosFromDB().catch(err => {
        console.error('Error fetching DB pedidos for tablero:', err.message);
        return [];
      })
    ]);

    const mappedDbPedidos = Array.isArray(dbPedidos) ? dbPedidos.map(mapDbPedidoToSheetFormat) : [];

    // Group/Merge: DB overrides Supabase (similar to how it overrides Sheets before)
    const pedidosMap = new Map();
    if (Array.isArray(supabasePedidos)) {
      supabasePedidos.forEach(p => {
        // Formatear fechas de Supabase a la hora local para la correcta visualización
        if (p['Fecha y hora']) p['Fecha y hora'] = formatDate(p['Fecha y hora'], 'FULL');
        if (p['Fecha_Ultima_Modificacion']) p['Fecha_Ultima_Modificacion'] = formatDate(p['Fecha_Ultima_Modificacion'], 'FULL');
        if (p['Fecha y Hora de Última Modificación']) p['Fecha y Hora de Última Modificación'] = formatDate(p['Fecha y Hora de Última Modificación'], 'FULL');
        if (p['Emitido Fecha']) p['Emitido Fecha'] = formatDate(p['Emitido Fecha'], 'FULL');
        if (p['Fecha de envio']) p['Fecha de envio'] = formatDate(p['Fecha de envio'], 'FULL');

        pedidosMap.set(String(p.IDPedido), p);
      });
    }
    mappedDbPedidos.forEach(p => {
      pedidosMap.set(String(p.IDPedido), p);
    });

    const finalPedidos = Array.from(pedidosMap.values());
    await mapVendedorNames(finalPedidos);

    tableroPedidosCache = finalPedidos;
    lastTableroPedidosFetch = Date.now();

    res.json({ data: finalPedidos });
  } catch (error) {
    console.error('Error reading Pedidos for tablero:', error.message);
    res.status(500).json({ error: 'No se pudo leer la información de pedidos', details: error.message });
  }
});

router.get('/detalles', async (req, res) => {
  try {
    const now = Date.now();
    if (tableroDetallesCache && (now - lastTableroDetallesFetch < TABLERO_CACHE_TTL)) {
      return res.json({ data: tableroDetallesCache });
    }

    const [supabaseDetalles, dbDetalles, dbPedidos] = await Promise.all([
      supabaseService.getRows('atc_detalles_pedidos_v').catch(err => {
        console.error('Error fetching Supabase detalles for tablero:', err.message);
        return [];
      }),
      mssqlService.getDetallesFromDB().catch(err => {
        console.error('Error fetching DB detalles for tablero:', err.message);
        return [];
      }),
      mssqlService.getPedidosFromDB().catch(err => {
        console.error('Error fetching DB pedidos for details filter:', err.message);
        return [];
      })
    ]);

    const dbPedidoIds = new Set(
      (Array.isArray(dbPedidos) ? dbPedidos : []).map(p => String(p.IDPedido))
    );

    // Keep Supabase details only for orders that are NOT in the SQL Server database
    const filteredSupabaseDetalles = Array.isArray(supabaseDetalles)
      ? supabaseDetalles.filter(d => d.IDPedido && !dbPedidoIds.has(String(d.IDPedido)))
      : [];

    const mappedDbDetalles = Array.isArray(dbDetalles) ? dbDetalles.map(mapDbDetalleToSheetFormat) : [];

    const finalDetalles = [...filteredSupabaseDetalles, ...mappedDbDetalles];

    tableroDetallesCache = finalDetalles;
    lastTableroDetallesFetch = Date.now();

    res.json({ data: finalDetalles });
  } catch (error) {
    console.error('Error reading Detalles for tablero:', error.message);
    res.status(500).json({ error: 'No se pudo leer la información de detalles de pedidos', details: error.message });
  }
});

router.invalidateCache = invalidateTableroCache;

module.exports = router;
