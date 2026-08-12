// server/test/app.routes.test.js
// Tests de integración leve del servidor Express.
// Levanta el servidor en un puerto aleatorio y verifica las rutas base (health, 404, seguridad).
// No necesitan credenciales de DB — prueban solo el layer de routing/seguridad.

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const jwt = require('jsonwebtoken');
process.env.NODE_ENV = 'test';
require('dotenv').config();

const app = require('../src/app');

let server;
let baseUrl;

// ---------------------------------------------------------------------------
// Helper: petición HTTP simplificada
// ---------------------------------------------------------------------------
function apiFetch(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const reqOptions = {
      hostname: url.hostname,
      port: Number(url.port),
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };
    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, bodyRaw: data, headers: res.headers });
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

function getAuthToken() {
  return jwt.sign(
    { nombre: 'TestUser', perfil: 'Administracion' },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------
before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, () => {
      baseUrl = `http://localhost:${server.address().port}`;
      resolve();
    });
  });
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('app.js — rutas base y seguridad', () => {

  test('GET /api/health devuelve objeto de salud con mssql, supabase y status', async () => {
    const { status, bodyRaw } = await apiFetch('/api/health');
    assert.ok(status === 200 || status === 503);
    const body = JSON.parse(bodyRaw);
    assert.ok(body.status === 'ok' || body.status === 'degraded');
    assert.ok(typeof body.mssql === 'boolean');
    assert.ok(typeof body.supabase === 'boolean');
    assert.ok(typeof body.timestamp === 'string', 'timestamp debe ser un string ISO');
  });

  test('GET / devuelve 200 con mensaje de bienvenida y status ok', async () => {
    const { status, bodyRaw } = await apiFetch('/');
    assert.strictEqual(status, 200);
    const body = JSON.parse(bodyRaw);
    assert.strictEqual(body.status, 'ok');
  });

  test('Ruta de API inexistente devuelve 404 con mensaje descriptivo', async () => {
    const { status, bodyRaw } = await apiFetch('/api/ruta-que-no-existe');
    assert.strictEqual(status, 404);
    const body = JSON.parse(bodyRaw);
    assert.ok(
      body.message.includes('Ruta no encontrada'),
      `El mensaje debe mencionar "Ruta no encontrada", recibido: "${body.message}"`
    );
  });

  test('Acceso a /.env retorna 403 Forbidden', async () => {
    const { status } = await apiFetch('/.env');
    assert.strictEqual(status, 403);
  });

  test('Acceso a una ruta con segmento oculto (/.hidden/archivo) retorna 403 Forbidden', async () => {
    const { status } = await apiFetch('/.hidden/archivo');
    assert.strictEqual(status, 403);
  });

  test('GET /api/pedidos sin token devuelve 401', async () => {
    const { status } = await apiFetch('/api/pedidos');
    assert.strictEqual(status, 401);
  });

  test('GET /api/clientes sin token devuelve 401', async () => {
    const { status } = await apiFetch('/api/clientes');
    assert.strictEqual(status, 401);
  });

  test('GET /api/productos sin token devuelve 401', async () => {
    const { status } = await apiFetch('/api/productos');
    assert.strictEqual(status, 401);
  });

  test('GET /api/usuarios sin token devuelve 401', async () => {
    const { status } = await apiFetch('/api/usuarios');
    assert.strictEqual(status, 401);
  });

  test('GET /api/usuarios/login responde (ruta pública — no requiere token)', async () => {
    // POST /login es público — verificamos que llega al handler (no 404, no 403)
    // Enviamos credenciales vacías para verificar que llega al handler y no da 404
    const { status } = await apiFetch('/api/usuarios/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'noexiste', password: 'noexiste' }),
    });
    // Puede ser 401 (credenciales inválidas) o 500 (no conecta a sheets en test) — nunca 404 ni 403
    assert.notStrictEqual(status, 404);
    assert.notStrictEqual(status, 403);
  });

  test('Las cabeceras HTTP incluyen Content-Security-Policy (CSP) robusta, sin unsafe-inline y con connect-src restringido', async () => {
    const { headers } = await apiFetch('/api/health');
    
    const csp = headers['content-security-policy'];
    assert.ok(csp, 'Debe existir la cabecera Content-Security-Policy');
    
    // 1. Validar que connect-src no tenga el comodín *
    assert.ok(!csp.includes('connect-src \'self\' *') && !csp.includes('connect-src *'), 'connect-src no debe permitir el comodín *');
    
    // 2. Validar que connect-src tenga self y cloudflareinsights
    assert.ok(csp.includes("connect-src 'self'") && csp.includes('https://static.cloudflareinsights.com'), 'connect-src debe incluir self y cloudflareinsights');

    // 3. Validar que script-src no incluya unsafe-inline
    const scriptSrcMatch = csp.match(/script-src\s+([^;]+)/);
    assert.ok(scriptSrcMatch, 'Debe existir la directiva script-src en el CSP');
    const scriptSrcDirectives = scriptSrcMatch[1];
    assert.ok(!scriptSrcDirectives.includes("'unsafe-inline'"), 'script-src no debe contener "unsafe-inline"');

    // 4. Validar que script-src incluya un nonce dinámico
    assert.ok(/'nonce-[A-Za-z0-9+/=]+'/.test(scriptSrcDirectives), 'script-src debe contener un nonce en base64');
  });

});
