// server/test/tablero.routes.test.js
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const jwt = require('jsonwebtoken');
require('dotenv').config();

process.env.NODE_ENV = 'test';
const TEST_SECRET = 'test-jwt-secret-tablero-unit';
process.env.JWT_SECRET = TEST_SECRET;

// Mocks de datos
const mockSupabasePedidos = [
  {
    IDPedido: '100001',
    Cliente: '123',
    Nombre: 'Cliente Supabase 1',
    Estado: '1',
    Total: 1500,
    'Fecha y hora': '2026-08-12T11:13:00.000Z',
    'Fecha_Ultima_Modificacion': '2026-08-12T11:13:00.000Z'
  }
];

const mockSupabaseDetalles = [
  { IDDetalle: '1', IDPedido: '100001', Cantidad: 2, Precio: 750, Total: 1500 }
];

const mockDbPedidos = [
  {
    IDPedido: 100002,
    IDCliente: 456,
    Nombre: 'Cliente SQL 1',
    Fecha_Hora: new Date('2026-08-12T11:13:00.000Z'),
    Direccion: 'Calle Falsa 123',
    Celular_Contacto: '1122334455',
    Total: 2500,
    Estado: '2',
    Vendedor: 5,
    Nro_PedidoGestion: 'PED-999',
    Nro_PedidoReferencia: 'REF-888',
    Cliente_En_Base: true,
    Fecha_Ultima_Modificacion: new Date('2026-08-12T11:13:00.000Z')
  }
];

const mockDbDetalles = [
  {
    IdPedido: 100002,
    IdDetalle: 2,
    ItemCodigo: 'ART-01',
    NombreItem: 'Articulo de Prueba',
    Cantidad: 5,
    Precio: 500,
    Total: 2500,
    CantidadPrepared: 5
  }
];

const mockVendedores = [
  { VDOR: 5, NOMBRE: 'Vendedor Pepe', ALIAS: 'Pepe', ACTIVO: 1 }
];

// Mock de cargador de módulos para evitar inicializar conexiones reales
const Module = require('module');
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request.includes('supabase.service') || request.endsWith('supabase.service')) {
    return {
      getRows: async (viewName) => {
        if (viewName.includes('pedidos') || viewName.includes('atc_pedidos_v')) {
          return mockSupabasePedidos;
        }
        if (viewName.includes('detalles') || viewName.includes('atc_detalles_pedidos_v')) {
          return mockSupabaseDetalles;
        }
        return [];
      },
      clearCache: () => {}
    };
  }
  if (request.includes('mssql.service') || request.endsWith('mssql.service')) {
    return {
      getPedidosFromDB: async () => mockDbPedidos,
      getDetallesFromDB: async () => mockDbDetalles,
      getVendedores: async () => mockVendedores,
      getProductos: async () => []
    };
  }
  if (request.includes('config/mssql') || request.endsWith('config/mssql')) {
    return { poolPromise: Promise.resolve(null), sql: {} };
  }
  return originalLoad.apply(this, arguments);
};

const app = require('../src/app');

let server;
let baseUrl;

before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  // Restaurar el cargador de módulos original
  Module._load = originalLoad;
});

function getAuthHeaders() {
  const token = jwt.sign(
    { id: 'test-user-id', username: 'TestUser', rol: 'admin' },
    TEST_SECRET,
    { expiresIn: '1h' }
  );
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

describe('Suite de pruebas: Tablero (Supabase + SQL Server)', () => {
  test('GET /api/tablero/pedidos sin JWT retorna 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/tablero/pedidos`);
    assert.strictEqual(res.status, 401);
  });

  test('GET /api/tablero/pedidos con JWT retorna la lista unificada de pedidos', async () => {
    const res = await fetch(`${baseUrl}/api/tablero/pedidos`, {
      headers: getAuthHeaders()
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(body.data);
    assert.ok(Array.isArray(body.data));
    
    // Debería tener exactamente 2 pedidos (1 de Supabase, 1 de SQL Server)
    assert.strictEqual(body.data.length, 2);

    const pSupabase = body.data.find(p => String(p.IDPedido) === '100001');
    const pSQL = body.data.find(p => String(p.IDPedido) === '100002');

    assert.ok(pSupabase, 'Debe incluir el pedido de Supabase');
    assert.ok(pSQL, 'Debe incluir el pedido de SQL Server');

    // Validar el mapeo del vendedor en SQL Server
    assert.strictEqual(pSQL.VendedorNombre, 'Vendedor Pepe');
    assert.strictEqual(pSQL.Nombre, 'Cliente SQL 1');

    // Validar el formateo de fecha (Argentina UTC-3)
    // 11:13 UTC de Supabase y SQL Server debe mostrarse como las 08:13 de Argentina
    assert.strictEqual(pSupabase['Fecha y hora'], '2026-08-12 08:13:00');
    assert.strictEqual(pSQL['Fecha y hora'], '2026-08-12 11:13:00');
  });

  test('GET /api/tablero/detalles sin JWT retorna 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/tablero/detalles`);
    assert.strictEqual(res.status, 401);
  });

  test('GET /api/tablero/detalles con JWT retorna la lista de detalles unificada', async () => {
    const res = await fetch(`${baseUrl}/api/tablero/detalles`, {
      headers: getAuthHeaders()
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(body.data);
    assert.ok(Array.isArray(body.data));

    // Debería tener exactamente 2 detalles (1 de Supabase, 1 de SQL Server)
    assert.strictEqual(body.data.length, 2);

    const dSupabase = body.data.find(d => String(d.IDPedido) === '100001');
    const dSQL = body.data.find(d => String(d.IDPedido) === '100002');

    assert.ok(dSupabase, 'Debe incluir el detalle de Supabase');
    assert.ok(dSQL, 'Debe incluir el detalle de SQL Server');

    assert.strictEqual(dSQL['Nombre item'], 'Articulo de Prueba');
    assert.strictEqual(dSQL['Item  codigo'], 'ART-01');
  });
});
