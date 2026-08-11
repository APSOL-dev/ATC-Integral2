// server/test/usuarios.unit.test.js
// Tests unitarios de las rutas de Usuarios usando mocks de sheetsService y jwt.
// No requieren conexión a Google Sheets ni base de datos.

const { test, describe, before, after, mock, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const jwt = require('jsonwebtoken');

process.env.NODE_ENV = 'test';
const TEST_SECRET = 'test-jwt-secret-usuarios-unit';
process.env.JWT_SECRET = TEST_SECRET;

// ---------------------------------------------------------------------------
// Mock de sheetsService ANTES de importar la app
// ---------------------------------------------------------------------------
// Base de datos en memoria que simula Google Sheets
let mockSheetsDb = {
  headers: ['Nombre de usuario', 'Contraseña', 'Perfil', 'NRO_VENDEDOR', 'Activo'],
  users: [
    {
      'Nombre de usuario': 'AdminTest',
      'Contraseña': 'Admin123',
      'Perfil': 'Administracion',
      'NRO_VENDEDOR': '',
      'Activo': 'TRUE',
    },
    {
      'Nombre de usuario': 'InactivoTest',
      'Contraseña': 'pass',
      'Perfil': 'VendedorCalle',
      'NRO_VENDEDOR': '5',
      'Activo': 'FALSE',
    },
  ],
};

// Reemplazar el módulo sheetsService en require.cache ANTES de cargar la app
const Module = require('module');
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  // Interceptar tanto sheets.service como supabase.service
  if (request.includes('sheets.service') || request.endsWith('sheets.service') || request.includes('supabase.service') || request.endsWith('supabase.service')) {
    return {
      getRows: async (range) => {
        return mockSheetsDb.users;
      },
      upsertRow: async (view, row) => {
        mockSheetsDb.users.push(row);
        return [row];
      },
      insertRows: async (view, rows) => {
        mockSheetsDb.users.push(...rows);
        return rows;
      },
      updateRows: async (view, filter, updateData) => {
        const key = Object.keys(filter)[0];
        const val = filter[key];
        const user = mockSheetsDb.users.find(u => String(u[key] || '').toLowerCase() === String(val).toLowerCase());
        if (user) Object.assign(user, updateData);
        return [user];
      },
      deleteRows: async () => {},
      appendRow: async () => {},
      updateRow: async () => {},
      clearCache: () => {},
    };
  }
  // Interceptar mssql.service para que no intente conectar
  if (request.includes('mssql.service') || request.endsWith('mssql.service')) {
    return {
      getPedidosFromDB: async () => [],
      getDetallesFromDB: async () => [],
      getProductos: async () => [],
      getVendedores: async () => [],
      getClientes: async () => [],
      getClienteById: async () => null,
      getClientesByMultipleIds: async () => [],
    };
  }
  // Interceptar la config de mssql para que no intente conectar
  if (request.includes('config/mssql') || request.endsWith('config/mssql')) {
    const noop = async () => null;
    const fakePool = { then: (cb) => Promise.resolve(null).then(cb) };
    return { poolPromise: Promise.resolve(null), sql: {} };
  }
  return originalLoad.apply(this, arguments);
};

const app = require('../src/app');
// Restaurar el loader original
Module._load = originalLoad;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getAuthToken(perfil = 'Administracion') {
  return jwt.sign({ nombre: 'AdminTest', perfil }, TEST_SECRET, { expiresIn: '1h' });
}

function apiFetch(server, path, options = {}) {
  return new Promise((resolve, reject) => {
    const port = server.address().port;
    const reqOptions = {
      hostname: 'localhost',
      port,
      path,
      method: options.method || 'GET',
      headers: { 'Content-Type': 'application/json', ...options.headers },
    };
    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------
let server;

before(async () => {
  server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
});

after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('Usuarios Routes — Autenticación (POST /api/usuarios/login)', () => {

  test('login con credenciales válidas devuelve 200 con token JWT', async () => {
    const { status, body } = await apiFetch(server, '/api/usuarios/login', {
      method: 'POST',
      body: { username: 'AdminTest', password: 'Admin123' },
    });
    assert.strictEqual(status, 200);
    const parsed = JSON.parse(body);
    assert.ok(parsed.token, 'La respuesta debe incluir un token JWT');
    assert.strictEqual(parsed.nombre, 'AdminTest');
    assert.strictEqual(parsed.perfil, 'Administracion');
  });

  test('login con contraseña incorrecta devuelve 401', async () => {
    const { status } = await apiFetch(server, '/api/usuarios/login', {
      method: 'POST',
      body: { username: 'AdminTest', password: 'ContraseñaWrong' },
    });
    assert.strictEqual(status, 401);
  });

  test('login con usuario inexistente devuelve 401', async () => {
    const { status } = await apiFetch(server, '/api/usuarios/login', {
      method: 'POST',
      body: { username: 'UsuarioQueNoExiste', password: 'cualquiera' },
    });
    assert.strictEqual(status, 401);
  });

  test('login con usuario inactivo (Activo=FALSE) devuelve 403', async () => {
    const { status, body } = await apiFetch(server, '/api/usuarios/login', {
      method: 'POST',
      body: { username: 'InactivoTest', password: 'pass' },
    });
    assert.strictEqual(status, 403);
    const parsed = JSON.parse(body);
    assert.ok(parsed.message.toLowerCase().includes('inactivo'));
  });

  test('login es case-insensitive en el nombre de usuario', async () => {
    const { status } = await apiFetch(server, '/api/usuarios/login', {
      method: 'POST',
      body: { username: 'admintest', password: 'Admin123' },
    });
    assert.strictEqual(status, 200);
  });

});

describe('Usuarios Routes — Creación (POST /api/usuarios)', () => {

  test('sin token devuelve 401', async () => {
    const { status } = await apiFetch(server, '/api/usuarios', {
      method: 'POST',
      body: { nombre: 'Nuevo', perfil: 'VendedorCalle' },
    });
    assert.strictEqual(status, 401);
  });

  test('sin nombre ni perfil devuelve 400', async () => {
    const token = getAuthToken();
    const { status } = await apiFetch(server, '/api/usuarios', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: {},
    });
    assert.strictEqual(status, 400);
  });

  test('sin nombre devuelve 400', async () => {
    const token = getAuthToken();
    const { status } = await apiFetch(server, '/api/usuarios', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: { perfil: 'VendedorCalle' },
    });
    assert.strictEqual(status, 400);
  });

});

describe('Usuarios Routes — Cambio de contraseña (PATCH /api/usuarios/:username/password)', () => {

  test('sin password en body devuelve 400', async () => {
    const token = getAuthToken();
    const { status, body } = await apiFetch(server, '/api/usuarios/AdminTest/password', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: {},
    });
    assert.strictEqual(status, 400);
    const parsed = JSON.parse(body);
    assert.ok(parsed.message.toLowerCase().includes('contraseña'));
  });

  test('sin token devuelve 401', async () => {
    const { status } = await apiFetch(server, '/api/usuarios/AdminTest/password', {
      method: 'PATCH',
      body: { password: 'NuevaPassword123' },
    });
    assert.strictEqual(status, 401);
  });

});

describe('Usuarios Routes — Listado (GET /api/usuarios)', () => {

  test('sin token devuelve 401', async () => {
    const { status } = await apiFetch(server, '/api/usuarios');
    assert.strictEqual(status, 401);
  });

});
