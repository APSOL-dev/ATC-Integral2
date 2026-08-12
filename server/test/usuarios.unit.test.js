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
    {
      'Nombre de usuario': 'LockoutTestUser',
      'Contraseña': 'Password123',
      'Perfil': 'VendedorCalle',
      'NRO_VENDEDOR': '7',
      'Activo': 'TRUE',
      'Intentos fallidos': 0,
      'Bloqueado hasta': null
    }
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

  test('rate limiting por IP — el 6to intento consecutivo desde la misma IP devuelve 429', async () => {
    const ip = '198.51.100.1';
    // Realizar 5 intentos fallidos
    for (let i = 0; i < 5; i++) {
      const { status } = await apiFetch(server, '/api/usuarios/login', {
        method: 'POST',
        headers: { 'X-Forwarded-For': ip },
        body: { username: 'AdminTest', password: 'WrongPassword' }
      });
      // Debería ser 401 porque las credenciales son incorrectas
      assert.strictEqual(status, 401);
    }

    // El 6to intento desde la misma IP debe ser bloqueado por Rate Limit (429)
    const { status, body } = await apiFetch(server, '/api/usuarios/login', {
      method: 'POST',
      headers: { 'X-Forwarded-For': ip },
      body: { username: 'AdminTest', password: 'WrongPassword' }
    });
    assert.strictEqual(status, 429);
    const parsed = JSON.parse(body);
    assert.ok(parsed.message.toLowerCase().includes('demasiados intentos'));
  });

  test('bloqueo de cuenta por usuario — 5 intentos fallidos desde distintas IPs bloquean la cuenta (403)', async () => {
    // Usamos LockoutTestUser y variamos las IPs para no gatillar el rate limit por IP (que es de 5)
    for (let i = 1; i <= 5; i++) {
      const { status } = await apiFetch(server, '/api/usuarios/login', {
        method: 'POST',
        headers: { 'X-Forwarded-For': `198.51.100.${i + 10}` },
        body: { username: 'LockoutTestUser', password: 'WrongPassword' }
      });
      assert.strictEqual(status, 401);
    }

    // El 6to intento (desde otra IP distinta) debe devolver 403 indicando cuenta bloqueada
    const { status, body } = await apiFetch(server, '/api/usuarios/login', {
      method: 'POST',
      headers: { 'X-Forwarded-For': '198.51.100.20' },
      body: { username: 'LockoutTestUser', password: 'Password123' } // incluso con contraseña correcta!
    });
    assert.strictEqual(status, 403);
    const parsed = JSON.parse(body);
    assert.ok(parsed.message.toLowerCase().includes('bloqueada'));
  });

  test('login exitoso restablece el contador de intentos fallidos', async () => {
    // 3 intentos fallidos con LockoutTestReset
    // (usamos el mismo usuario pero un nombre diferente para aislar el estado en el mockDb)
    // Agregamos un usuario dinámicamente al mockDb para este test
    mockSheetsDb.users.push({
      'Nombre de usuario': 'LockoutTestReset',
      'Contraseña': 'Password123',
      'Perfil': 'VendedorCalle',
      'NRO_VENDEDOR': '8',
      'Activo': 'TRUE',
      'Intentos fallidos': 0,
      'Bloqueado hasta': null
    });

    for (let i = 1; i <= 3; i++) {
      await apiFetch(server, '/api/usuarios/login', {
        method: 'POST',
        headers: { 'X-Forwarded-For': `198.51.100.3${i}` },
        body: { username: 'LockoutTestReset', password: 'WrongPassword' }
      });
    }

    // El usuario debe tener 3 intentos fallidos en la base de datos
    const userInDbBefore = mockSheetsDb.users.find(u => u['Nombre de usuario'] === 'LockoutTestReset');
    assert.strictEqual(userInDbBefore['Intentos fallidos'], 3);

    // Login exitoso
    const { status } = await apiFetch(server, '/api/usuarios/login', {
      method: 'POST',
      headers: { 'X-Forwarded-For': '198.51.100.40' },
      body: { username: 'LockoutTestReset', password: 'Password123' }
    });
    assert.strictEqual(status, 200);

    // Los intentos fallidos deben haber vuelto a 0
    const userInDbAfter = mockSheetsDb.users.find(u => u['Nombre de usuario'] === 'LockoutTestReset');
    assert.strictEqual(userInDbAfter['Intentos fallidos'], 0);
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
