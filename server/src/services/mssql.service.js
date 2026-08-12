const { poolPromise, sql } = require('../config/mssql');

async function getPool() {
  const pool = await poolPromise;
  if (!pool) throw new Error('MSSQL no disponible');
  return pool;
}

function safeParseInt32(val) {
  const num = parseInt(val, 10);
  if (isNaN(num)) return 0;
  if (num <= 2147483647 && num >= -2147483648) {
    return num;
  }
  const str = String(val);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function formatToLocalSQLString(date) {
  if (!date) return null;
  const d = (date instanceof Date) ? date : new Date(date);
  if (isNaN(d.getTime())) return null;

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

  const y = get('year')
  const m = get('month')
  const day = get('day')
  let h = get('hour')
  if (h === '24') h = '00'
  const min = get('minute')
  const s = get('second')

  return `${y}-${m}-${day} ${h}:${min}:${s}`;
}

const MOCK_CLIENTES = [
  { NRO_CLIENTE: 1001, NOMBRE_CLIENTE: 'Ferretería El Tornillo', CUIT: '20-12345678-9', SALDO: 45200, NRO_VENDEDOR: 3, VENDEDOR: 'Carlos Ruiz', DIREC: 'Av. San Martín 1234', LOCALIDAD: 'La Plata', PROVINCIA: 'Buenos Aires', TELE: '0221-4567890', SUC: 1 },
  { NRO_CLIENTE: 1002, NOMBRE_CLIENTE: 'Pinturas del Sur S.A.', CUIT: '30-23456789-0', SALDO: 128500, NRO_VENDEDOR: 3, VENDEDOR: 'Carlos Ruiz', DIREC: 'Calle 7 nro 890', LOCALIDAD: 'Quilmes', PROVINCIA: 'Buenos Aires', TELE: '011-42345678', SUC: 1 },
  { NRO_CLIENTE: 1003, NOMBRE_CLIENTE: 'Construcciones Ramírez', CUIT: '23-34567890-4', SALDO: 0, NRO_VENDEDOR: 5, VENDEDOR: 'Ana Flores', DIREC: 'Ruta 2 km 45', LOCALIDAD: 'Mar del Plata', PROVINCIA: 'Buenos Aires', TELE: '0223-5678901', SUC: 2 },
  { NRO_CLIENTE: 1004, NOMBRE_CLIENTE: 'Decoraciones Modernas', CUIT: '20-45678901-5', SALDO: 78900, NRO_VENDEDOR: 5, VENDEDOR: 'Ana Flores', DIREC: 'Lavalle 456', LOCALIDAD: 'Rosario', PROVINCIA: 'Santa Fe', TELE: '0341-6789012', SUC: 1 },
  { NRO_CLIENTE: 1005, NOMBRE_CLIENTE: 'Pinturería Central', CUIT: '30-56789012-6', SALDO: 215000, NRO_VENDEDOR: 3, VENDEDOR: 'Carlos Ruiz', DIREC: 'Belgrano 789', LOCALIDAD: 'Córdoba', PROVINCIA: 'Córdoba', TELE: '0351-7890123', SUC: 3 }
];

const MOCK_PRODUCTOS = [
  { CODART: 10001, DESCRI: 'Látex Interior Blanco 20L', CC_CIVA: 4250, stock: 45, FAMILIA: 1, NombreFamilia: 'Látex', RUBRO: 10, NombreRubro: 'Interior', MARCA: 1, NombreMarca: 'Sinteplast', Embalaje: '4', Proveedor: 'Sinteplast SA' },
  { CODART: 10002, DESCRI: 'Látex Exterior Blanco Hueso 20L', CC_CIVA: 5100, stock: 32, FAMILIA: 1, NombreFamilia: 'Látex', RUBRO: 11, NombreRubro: 'Exterior', MARCA: 1, NombreMarca: 'Sinteplast', Embalaje: '4', Proveedor: 'Sinteplast SA' },
  { CODART: 10003, DESCRI: 'Esmalte Sintético Negro Mate 4L', CC_CIVA: 3200, stock: 18, FAMILIA: 2, NombreFamilia: 'Esmalte', RUBRO: 20, NombreRubro: 'Sintético', MARCA: 2, NombreMarca: 'Alba', Embalaje: '6', Proveedor: 'Alba SA' },
  { CODART: 10004, DESCRI: 'Barniz Sintético Transparente 4L', CC_CIVA: 2800, stock: 25, FAMILIA: 2, NombreFamilia: 'Esmalte', RUBRO: 20, NombreRubro: 'Sintético', MARCA: 2, NombreMarca: 'Alba', Embalaje: '6', Proveedor: 'Alba SA' },
  { CODART: 10005, DESCRI: 'Fondo Sintético Blanco 4L', CC_CIVA: 2400, stock: 12, FAMILIA: 2, NombreFamilia: 'Esmalte', RUBRO: 20, NombreRubro: 'Sintético', MARCA: 1, NombreMarca: 'Sinteplast', Embalaje: '6', Proveedor: 'Sinteplast SA' }
];

const MOCK_VENDEDORES = [
  { VDOR: 3, NRO_VENDEDOR: 3, NOMBRE: 'Carlos Ruiz', ALIAS: 'Carlos' },
  { VDOR: 5, NRO_VENDEDOR: 5, NOMBRE: 'Ana Flores', ALIAS: 'Ana' },
  { VDOR: 7, NRO_VENDEDOR: 7, NOMBRE: 'Diego Sosa', ALIAS: 'Diego' }
];

async function executeWithRetry(fn, retries = 3, delayMs = 1000) {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        console.warn(`⚠️ Error al conectar con SQL Server (intento ${attempt}/${retries}): ${err.message}. Reintentando en ${delayMs}ms...`);
        await new Promise(r => setTimeout(r, delayMs));
      }
    }
  }
  throw new Error(`Fallo de conexión con SQL Server tras ${retries} reintentos: ${lastError?.message || 'Servidor no disponible'}`);
}

async function getClientes(search = '') {
  return executeWithRetry(async () => {
    const pool = await getPool();
    let query = 'SELECT NRO_CLIENTE, NOMBRE_CLIENTE, CUIT, SALDO, VENDEDOR, NRO_VENDEDOR, LOCALIDAD, PROVINCIA, TELE FROM App.ClientesMay';
    if (search) {
      const s = search.replace(/'/g, "''");
      query = `SELECT NRO_CLIENTE, NOMBRE_CLIENTE, CUIT, SALDO, VENDEDOR, NRO_VENDEDOR, LOCALIDAD, PROVINCIA, TELE 
               FROM App.ClientesMay 
               WHERE NOMBRE_CLIENTE LIKE '%${s}%' 
                  OR CAST(NRO_CLIENTE AS VARCHAR) LIKE '%${s}%'
               ORDER BY NOMBRE_CLIENTE`;
    } else {
      query += ' ORDER BY NOMBRE_CLIENTE';
    }
    const result = await pool.request().query(query);
    return result.recordset;
  });
}

async function getClienteById(id) {
  return executeWithRetry(async () => {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', id)
      .query('SELECT * FROM App.ClientesMay WHERE NRO_CLIENTE = @id');
    return result.recordset[0] || null;
  });
}

async function getProductos(search = '') {
  return executeWithRetry(async () => {
    const pool = await getPool();
    let query;
    if (search) {
      const s = search.replace(/'/g, "''");
      query = `SELECT CODART, DESCRI, CC_CIVA, stock, NombreFamilia, NombreMarca, Proveedor 
               FROM App.Productos 
               WHERE DESCRI LIKE '%${s}%' 
                  OR CAST(CODART AS VARCHAR) LIKE '%${s}%'
               ORDER BY DESCRI`;
    } else {
      query = 'SELECT CODART, DESCRI, CC_CIVA, stock, NombreFamilia, NombreMarca, Proveedor FROM App.Productos ORDER BY DESCRI';
    }
    const result = await pool.request().query(query);
    return result.recordset;
  });
}

async function getVendedores() {
  return executeWithRetry(async () => {
    const pool = await getPool();
    const result = await pool.request().query('SELECT TOP 100 * FROM App.Vendedores ORDER BY NOMBRE');
    return result.recordset;
  });
}

async function getPedidosFromDB() {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM AppTransacciones.PedidoAppCabe ORDER BY IDPedido DESC');
    return result.recordset;
  } catch (err) {
    return [];
  }
}

async function getDetallesFromDB() {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM AppTransacciones.PedidoAppDeta');
    return result.recordset;
  } catch (err) {
    return [];
  }
}

async function createPedidoInDB(pedidoData, detallesData) {
  try {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    try {
      const checkReq = new sql.Request(transaction);
      checkReq.input('checkId', sql.Int, pedidoData.IDPedido);
      const checkRes = await checkReq.query('SELECT 1 FROM AppTransacciones.PedidoAppCabe WHERE IDPedido = @checkId');
      if (checkRes.recordset && checkRes.recordset.length > 0) {
        await transaction.commit();
        return true;
      }

      const headerQuery = `
        INSERT INTO AppTransacciones.PedidoAppCabe (
          IDPedido, IDCliente, Cliente_En_Base, Nombre, Direccion, Celular_Contacto,
          Fecha_Hora, PorcentajeDescuento, Total, Emitido_Por, Fecha_Envio,
          Creado_Por, Observaciones, Fecha_Ultima_Modificacion, Estado, Vendedor,
          Nro_PedidoGestion, Nro_PedidoReferencia, EstadoEnviado
        ) VALUES (
          @id, @idCliente, @clienteEnBase, @nombre, @direccion, @celular,
          @fechaHora, @porcentajeDescuento, @total, @emitidoPor, @fechaEnvio,
          @creadoPor, @observaciones, @fechaMod, @estado, @vendedor,
          @nroPedidoGestion, @nroPedidoReferencia, @estadoEnviado
        )
      `;
      
      const requestHeader = new sql.Request(transaction);
      requestHeader.input('id', sql.Int, pedidoData.IDPedido);
      requestHeader.input('idCliente', sql.Int, parseInt(pedidoData.Cliente) || null);
      requestHeader.input('clienteEnBase', sql.Bit, pedidoData['Cliente en BD?'] === 'TRUE' ? 1 : 0);
      requestHeader.input('nombre', sql.NVarChar(50), pedidoData.Nombre || '');
      requestHeader.input('direccion', sql.NVarChar(100), pedidoData['Dirección cliente'] || '');
      requestHeader.input('celular', sql.NVarChar(50), pedidoData['Celular de contacto'] || '');
      requestHeader.input('fechaHora', sql.DateTime, formatToLocalSQLString(pedidoData['Fecha y hora'] || new Date()));
      requestHeader.input('porcentajeDescuento', sql.Float, parseFloat(pedidoData['Porcentaje de descuento (%)']) || 0);
      requestHeader.input('total', sql.Float, parseFloat(pedidoData.Total) || 0);
      requestHeader.input('emitidoPor', sql.NVarChar(100), pedidoData['Emitido por'] || '');
      requestHeader.input('fechaEnvio', sql.DateTime, pedidoData['Fecha de envio'] ? formatToLocalSQLString(pedidoData['Fecha de envio']) : null);
      requestHeader.input('creadoPor', sql.NVarChar(100), pedidoData['Creado por'] || '');
      requestHeader.input('observaciones', sql.NVarChar(255), pedidoData.Observaciones || '');
      requestHeader.input('fechaMod', sql.DateTime, formatToLocalSQLString(pedidoData.Fecha_Ultima_Modificacion || new Date()));
      requestHeader.input('estado', sql.NVarChar(50), String(pedidoData.Estado || '1'));
      requestHeader.input('vendedor', sql.Int, parseInt(pedidoData.Vendedor) || null);
      requestHeader.input('nroPedidoGestion', sql.Int, parseInt(pedidoData.Nro_PedidoGestion) || null);
      requestHeader.input('nroPedidoReferencia', sql.Int, parseInt(pedidoData.Nro_PedidoReferencia) || null);
      requestHeader.input('estadoEnviado', sql.Bit, pedidoData.EstadoEnviado ? 1 : 0);

      await requestHeader.query(headerQuery);

      for (const item of detallesData) {
        const detailQuery = `
          INSERT INTO AppTransacciones.PedidoAppDeta (
            IdPedido, IdDetalle, ItemCodigo, NombreItem, Cantidad, Precio,
            Sub_Total, PORCENT, Descuento, Total, CantidadPreparada, IdRenglonGestion
          ) VALUES (
            @idPedido, @idDetalle, @itemCodigo, @nombreItem, @cantidad, @precio,
            @subTotal, @porcent, @descuento, @totalDeta, @cantidadPreparada, @idRenglonGestion
          )
        `;
        
        const requestDeta = new sql.Request(transaction);
        requestDeta.input('idPedido', sql.Int, item.IDPedido);
        requestDeta.input('idDetalle', sql.Int, safeParseInt32(item.IDDetalle));
        requestDeta.input('itemCodigo', sql.Int, parseInt(item['Codigo (más alla de si es item o nombre)']) || null);
        requestDeta.input('nombreItem', sql.NVarChar(100), item['Nombre (más alla de si es item o nombre)'] || '');
        requestDeta.input('cantidad', sql.Float, parseFloat(item.Cantidad) || 0);
        requestDeta.input('precio', sql.Float, parseFloat(item.Precio) || 0);
        requestDeta.input('subTotal', sql.Float, parseFloat(item['Subtotal (precio x cantidad)']) || 0);
        requestDeta.input('porcent', sql.Float, parseFloat(item.PORCENT) || 0);
        requestDeta.input('descuento', sql.Float, parseFloat(item.Descuento) || 0);
        requestDeta.input('totalDeta', sql.Float, parseFloat(item['Total (subtotal - monto del descuento)']) || 0);
        requestDeta.input('cantidadPreparada', sql.Float, parseFloat(item['Cantidad preparada']) || 0);
        requestDeta.input('idRenglonGestion', sql.Int, parseInt(item.IdRenglonGestion) || null);

        await requestDeta.query(detailQuery);
      }

      await transaction.commit();
      return true;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.warn('MSSQL no disponible para createPedidoInDB - omitiendo persistencia en SQL Server');
    return false;
  }
}

async function updatePedidoEstadoInDB(idPedido, nuevoEstado) {
  try {
    const pool = await getPool();
    const query = `
      UPDATE AppTransacciones.PedidoAppCabe
      SET Estado = @estado,
          Fecha_Ultima_Modificacion = @fechaMod,
          EstadoEnviado = @estadoEnviado
      WHERE IDPedido = @id
    `;
    const now = new Date();
    
    const cleanStatus = String(nuevoEstado).trim();
    const estadoEnviadoVal = (cleanStatus === '1' || cleanStatus === '1.' || cleanStatus === '0.0.99' || cleanStatus === '99.') ? 1 : 0;
    
    await pool.request()
      .input('id', sql.Int, parseInt(idPedido))
      .input('estado', sql.NVarChar(50), cleanStatus)
      .input('fechaMod', sql.DateTime, formatToLocalSQLString(now))
      .input('estadoEnviado', sql.Bit, estadoEnviadoVal)
      .query(query);
    return true;
  } catch (err) {
    console.warn('MSSQL no disponible para updatePedidoEstadoInDB');
    return false;
  }
}

async function updatePedidoInDB(idPedido, pedidoData, detallesData) {
  try {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    try {
      const headerQuery = `
        UPDATE AppTransacciones.PedidoAppCabe
        SET IDCliente = @idCliente,
            Cliente_En_Base = @clienteEnBase,
            Nombre = @nombre,
            Direccion = @direccion,
            Celular_Contacto = @celular,
            Fecha_Hora = @fechaHora,
            PorcentajeDescuento = @porcentajeDescuento,
            Total = @total,
            Emitido_Por = @emitidoPor,
            Fecha_Envio = @fechaEnvio,
            Creado_Por = @creadoPor,
            Observaciones = @observaciones,
            Fecha_Ultima_Modificacion = @fechaMod,
            Estado = @estado,
            Vendedor = @vendedor,
            Nro_PedidoGestion = @nroPedidoGestion,
            Nro_PedidoReferencia = @nroPedidoReferencia
        WHERE IDPedido = @id
      `;
      
      const requestHeader = new sql.Request(transaction);
      requestHeader.input('id', sql.Int, parseInt(idPedido));
      requestHeader.input('idCliente', sql.Int, parseInt(pedidoData.Cliente) || null);
      requestHeader.input('clienteEnBase', sql.Bit, pedidoData['Cliente en BD?'] === 'TRUE' ? 1 : 0);
      requestHeader.input('nombre', sql.NVarChar(50), pedidoData.Nombre || '');
      requestHeader.input('direccion', sql.NVarChar(100), pedidoData['Dirección cliente'] || '');
      requestHeader.input('celular', sql.NVarChar(50), pedidoData['Celular de contacto'] || '');
      requestHeader.input('fechaHora', sql.DateTime, formatToLocalSQLString(pedidoData['Fecha y hora'] || new Date()));
      requestHeader.input('porcentajeDescuento', sql.Float, parseFloat(pedidoData['Porcentaje de descuento (%)']) || 0);
      requestHeader.input('total', sql.Float, parseFloat(pedidoData.Total) || 0);
      requestHeader.input('emitidoPor', sql.NVarChar(100), pedidoData['Emitido por'] || '');
      requestHeader.input('fechaEnvio', sql.DateTime, pedidoData['Fecha de envio'] ? formatToLocalSQLString(pedidoData['Fecha de envio']) : null);
      requestHeader.input('creadoPor', sql.NVarChar(100), pedidoData['Creado por'] || '');
      requestHeader.input('observaciones', sql.NVarChar(255), pedidoData.Observaciones || '');
      requestHeader.input('fechaMod', sql.DateTime, formatToLocalSQLString(new Date()));
      requestHeader.input('estado', sql.NVarChar(50), String(pedidoData.Estado || '1'));
      requestHeader.input('vendedor', sql.Int, parseInt(pedidoData.Vendedor) || null);
      requestHeader.input('nroPedidoGestion', sql.Int, parseInt(pedidoData.Nro_PedidoGestion) || null);
      requestHeader.input('nroPedidoReferencia', sql.Int, parseInt(pedidoData.Nro_PedidoReferencia) || null);

      await requestHeader.query(headerQuery);

      await transaction.request()
        .input('id', sql.Int, parseInt(idPedido))
        .query('DELETE FROM AppTransacciones.PedidoAppDeta WHERE IdPedido = @id');

      for (const item of detallesData) {
        const detailQuery = `
          INSERT INTO AppTransacciones.PedidoAppDeta (
            IdPedido, IdDetalle, ItemCodigo, NombreItem, Cantidad, Precio,
            Sub_Total, PORCENT, Descuento, Total, CantidadPreparada, IdRenglonGestion
          ) VALUES (
            @idPedido, @idDetalle, @itemCodigo, @nombreItem, @cantidad, @precio,
            @subTotal, @porcent, @descuento, @totalDeta, @cantidadPreparada, @idRenglonGestion
          )
        `;
        
        const requestDeta = new sql.Request(transaction);
        requestDeta.input('idPedido', sql.Int, parseInt(idPedido));
        requestDeta.input('idDetalle', sql.Int, safeParseInt32(item.IDDetalle));
        requestDeta.input('itemCodigo', sql.Int, parseInt(item['Codigo (más alla de si es item o nombre)']) || null);
        requestDeta.input('nombreItem', sql.NVarChar(100), item['Nombre (más alla de si es item o nombre)'] || '');
        requestDeta.input('cantidad', sql.Float, parseFloat(item.Cantidad) || 0);
        requestDeta.input('precio', sql.Float, parseFloat(item.Precio) || 0);
        requestDeta.input('subTotal', sql.Float, parseFloat(item['Subtotal (precio x cantidad)']) || 0);
        requestDeta.input('porcent', sql.Float, parseFloat(item.PORCENT) || 0);
        requestDeta.input('descuento', sql.Float, parseFloat(item.Descuento) || 0);
        requestDeta.input('totalDeta', sql.Float, parseFloat(item['Total (subtotal - monto del descuento)']) || 0);
        requestDeta.input('cantidadPreparada', sql.Float, parseFloat(item['Cantidad preparada']) || 0);
        requestDeta.input('idRenglonGestion', sql.Int, parseInt(item.IdRenglonGestion) || null);

        await requestDeta.query(detailQuery);
      }

      await transaction.commit();
      return true;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.warn('MSSQL no disponible para updatePedidoInDB');
    return false;
  }
}

async function deletePedidoFromDB(idPedido) {
  try {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    try {
      await transaction.request()
        .input('id', sql.Int, parseInt(idPedido))
        .query('DELETE FROM AppTransacciones.PedidoAppDeta WHERE IdPedido = @id');
        
      await transaction.request()
        .input('id', sql.Int, parseInt(idPedido))
        .query('DELETE FROM AppTransacciones.PedidoAppCabe WHERE IDPedido = @id');
        
      await transaction.commit();
      return true;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.warn('MSSQL no disponible para deletePedidoFromDB');
    return false;
  }
}

async function getClientesByMultipleIds(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  return executeWithRetry(async () => {
    const pool = await getPool();
    const request = pool.request();
    const inputNames = [];
    ids.forEach((id, idx) => {
      request.input(`id_${idx}`, id);
      inputNames.push(`@id_${idx}`);
    });
    const query = `SELECT * FROM App.ClientesMay WHERE NRO_CLIENTE IN (${inputNames.join(',')})`;
    const result = await request.query(query);
    return result.recordset;
  });
}

module.exports = {
  getClientes,
  getClienteById,
  getClientesByMultipleIds,
  getProductos,
  getVendedores,
  getPedidosFromDB,
  getDetallesFromDB,
  createPedidoInDB,
  updatePedidoEstadoInDB,
  deletePedidoFromDB,
  updatePedidoInDB
};
