// server/test/pedidos_edit_upsert.test.js
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const jwt = require('jsonwebtoken');
require('dotenv').config();

process.env.NODE_ENV = 'test';
const TEST_SECRET = 'test-jwt-secret-edit-upsert';
process.env.JWT_SECRET = TEST_SECRET;

const supabaseService = require('../src/services/supabase.service');
const mssqlService = require('../src/services/mssql.service');

const origGetRows = supabaseService.getRows;
const origUpdateRows = supabaseService.updateRows;
const origInsertRows = supabaseService.insertRows;
const origDeleteRows = supabaseService.deleteRows;
const origGetPedidosFromDB = mssqlService.getPedidosFromDB;
const origGetDetallesFromDB = mssqlService.getDetallesFromDB;
const origUpdatePedidoInDB = mssqlService.updatePedidoInDB;

describe('PUT /api/pedidos/:id — Upsert seguro para pedidos 0.0 y existentes', () => {
  let server;
  let baseUrl;
  let validToken;
  let supabasePedidosData = [];
  let supabaseDetallesData = [];
  let updateCalls = [];
  let insertCalls = [];
  let deleteCalls = [];
  let mssqlUpdateCalls = [];

  before(async () => {
    supabaseService.getRows = async (table) => {
      if (String(table).includes('pedidos')) return supabasePedidosData;
      if (String(table).includes('detalles')) return supabaseDetallesData;
      return [];
    };

    supabaseService.updateRows = async (table, filter, data) => {
      updateCalls.push({ table, filter, data });
      return [data];
    };

    supabaseService.insertRows = async (table, rows) => {
      insertCalls.push({ table, rows });
      return rows;
    };

    supabaseService.deleteRows = async (table, filter) => {
      deleteCalls.push({ table, filter });
      return [];
    };

    mssqlService.updatePedidoInDB = async (id, pedidoData, detalles) => {
      mssqlUpdateCalls.push({ id, pedidoData, detalles });
      return true;
    };

    mssqlService.getPedidosFromDB = async () => [
      {
        IDPedido: 11047400,
        Nombre: 'RIVAS DIEGO HERNAN',
        Estado: '0.0',
        Nro_PedidoReferencia: '110474',
        Total: 34458,
        PorcentajeDescuento: 19
      }
    ];

    mssqlService.getDetallesFromDB = async () => [];
    mssqlService.getProductos = async () => [];

    const express = require('express');
    const app = express();
    app.use(express.json());
    const pedidosRouter = require('../src/routes/pedidos.routes');
    app.use('/api/pedidos', pedidosRouter);

    server = http.createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;

    validToken = jwt.sign(
      { username: 'testuser', role: 'Administracion' },
      TEST_SECRET,
      { expiresIn: '1h' }
    );
  });

  after(async () => {
    supabaseService.getRows = origGetRows;
    supabaseService.updateRows = origUpdateRows;
    supabaseService.insertRows = origInsertRows;
    supabaseService.deleteRows = origDeleteRows;
    mssqlService.getPedidosFromDB = origGetPedidosFromDB;
    mssqlService.getDetallesFromDB = origGetDetallesFromDB;
    mssqlService.updatePedidoInDB = origUpdatePedidoInDB;

    if (server) await new Promise(resolve => server.close(resolve));
  });

  test('PUT /api/pedidos/:id para pedido que YA EXISTE en Supabase actualiza con updateRows', async () => {
    supabasePedidosData = [
      {
        IDPedido: '110001',
        Nombre: 'CLIENTE EXISTENTE',
        Estado: '1',
        Total: 1000
      }
    ];
    updateCalls = [];
    insertCalls = [];

    const res = await fetch(`${baseUrl}/api/pedidos/110001`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${validToken}`
      },
      body: JSON.stringify({
        header: {
          Nombre: 'CLIENTE EXISTENTE MODIFICADO',
          'Porcentaje de descuento (%)': 19,
          Total: 2500
        },
        detalles: [
          {
            'Codigo (más alla de si es item o nombre)': '72072',
            'Nombre (más alla de si es item o nombre)': 'ALBA ENDUIDO',
            Cantidad: 2,
            Precio: 1500
          }
        ]
      })
    });

    assert.strictEqual(res.status, 200, `Esperaba status 200 pero fue ${res.status}`);
    const body = await res.json();
    assert.ok(body.message, 'Debe devolver un mensaje de éxito');

    // Debe haber llamado a updateRows en atc_pedidos_v
    const pedidosUpdate = updateCalls.find(c => String(c.table).includes('pedidos'));
    assert.ok(pedidosUpdate, 'Debe haber actualizado la cabecera en atc_pedidos_v');
    assert.strictEqual(String(pedidosUpdate.filter.IDPedido), '110001');
  });

  test('PUT /api/pedidos/:id para pedido 0.0 de SQL que NO EXISTE en Supabase realiza insertRows en Supabase sin fallar', async () => {
    // Simulamos que en Supabase NO está el 11047400
    supabasePedidosData = [];
    updateCalls = [];
    insertCalls = [];
    deleteCalls = [];
    mssqlUpdateCalls = [];

    const res = await fetch(`${baseUrl}/api/pedidos/11047400`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${validToken}`
      },
      body: JSON.stringify({
        header: {
          Nombre: 'RIVAS DIEGO HERNAN',
          'Lugar de entrega': 'POSADAS',
          Observaciones: 'retira atc 27',
          'Porcentaje de descuento (%)': 19,
          Total: 55822
        },
        detalles: [
          {
            'Codigo (más alla de si es item o nombre)': '72072',
            'Nombre (más alla de si es item o nombre)': 'ALBA ENDUIDO INT STANDARD - 10',
            Cantidad: 2,
            Precio: 34458
          }
        ]
      })
    });

    assert.strictEqual(res.status, 200, `Esperaba status 200 pero fue ${res.status}`);
    const body = await res.json();
    assert.ok(body.message, 'Debe responder con éxito');

    // Validar que se actualizó en MSSQL
    assert.strictEqual(mssqlUpdateCalls.length, 1, 'Debe haber llamado a updatePedidoInDB');
    assert.strictEqual(String(mssqlUpdateCalls[0].id), '11047400');

    // Validar que en Supabase se insertó la cabecera (porque no existía)
    const pedidoInserted = insertCalls.find(c => String(c.table).includes('pedidos') && !String(c.table).includes('detalles'));
    assert.ok(pedidoInserted, 'Debe haber insertado la cabecera en atc_pedidos_v ya que no existía');

    // Validar que los detalles se insertaron en atc_detalles_pedidos_v
    const detallesInserted = insertCalls.find(c => String(c.table).includes('detalles'));
    assert.ok(detallesInserted, 'Debe haber insertado los detalles en atc_detalles_pedidos_v');
    assert.strictEqual(detallesInserted.rows.length, 1);
    assert.strictEqual(detallesInserted.rows[0].Cantidad, 2);
  });
});
