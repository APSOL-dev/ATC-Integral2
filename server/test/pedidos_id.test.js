// server/test/pedidos_id.test.js
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const jwt = require('jsonwebtoken');
require('dotenv').config();

process.env.NODE_ENV = 'test';
const TEST_SECRET = 'test-jwt-secret-pedidos-id';
process.env.JWT_SECRET = TEST_SECRET;

// Mocks
const supabaseService = require('../src/services/supabase.service');
const mssqlService = require('../src/services/mssql.service');

const origGetRows = supabaseService.getRows;
const origGetPedidosFromDB = mssqlService.getPedidosFromDB;
const origGetDetallesFromDB = mssqlService.getDetallesFromDB;
const origGetProductos = mssqlService.getProductos;

const mockPedidos = [
  {
    IDPedido: '110385',
    Nombre: 'VARONA GUSTAVO DANIEL',
    Estado: '1',
    Total: 5000
  },
  {
    IDPedido: '11038500',
    Nombre: 'VARONA GUSTAVO DANIEL (MODIFICADO)',
    Estado: '99',
    Nro_PedidoReferencia: '110385',
    Total: 5000
  }
];

const mockDetalles = [
  { IDDetalle: '110385001', IDPedido: '110385', ItemCodigo: '1421', NombreItem: 'LIJA GOLD', Cantidad: 10, Precio: 500 }
];

describe('GET /api/pedidos/:id & details-batch fallback', () => {
  let server;
  let baseUrl;
  let validToken;

  before(async () => {
    supabaseService.getRows = async (table) => {
      if (table === 'atc_pedidos_v') return mockPedidos;
      if (table === 'atc_detalles_pedidos_v') return mockDetalles;
      return [];
    };
    mssqlService.getPedidosFromDB = async () => [];
    mssqlService.getDetallesFromDB = async () => [];
    mssqlService.getProductos = async () => [];

    const express = require('express');
    const app = express();
    app.use(express.json());
    const pedidosRouter = require('../src/routes/pedidos.routes');
    app.use('/api/pedidos', pedidosRouter);

    validToken = jwt.sign({ sub: 'user1', perfil: 'Administracion' }, TEST_SECRET);

    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    supabaseService.getRows = origGetRows;
    mssqlService.getPedidosFromDB = origGetPedidosFromDB;
    mssqlService.getDetallesFromDB = origGetDetallesFromDB;
    mssqlService.getProductos = origGetProductos;
    if (server) await new Promise((res) => server.close(res));
  });

  const request = (path, options = {}) => {
    return new Promise((resolve, reject) => {
      const url = new URL(path, baseUrl);
      const reqOpts = {
        method: options.method || 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      };

      const req = http.request(url, reqOpts, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          let parsed;
          try { parsed = JSON.parse(body); } catch { parsed = body; }
          resolve({ status: res.statusCode, body: parsed });
        });
      });
      req.on('error', reject);
      if (options.body) req.write(JSON.stringify(options.body));
      req.end();
    });
  };

  test('GET /api/pedidos/:id retorna 200 con pedido completo incluyendo detalles', async () => {
    const res = await request('/api/pedidos/110385');
    assert.equal(res.status, 200);
    assert.equal(String(res.body.IDPedido), '110385');
    assert.ok(Array.isArray(res.body.detalles));
    assert.equal(res.body.detalles.length, 1);
  });

  test('POST /api/pedidos/details-batch con pedido derivado sin detalles retorna los renglones del Nro_PedidoReferencia', async () => {
    const res = await request('/api/pedidos/details-batch', {
      method: 'POST',
      body: { ids: ['11038500'] }
    });
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body['11038500']));
    assert.equal(res.body['11038500'].length, 1);
    assert.equal(res.body['11038500'][0].NombreItem, 'LIJA GOLD');
  });
});
