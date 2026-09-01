const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');

process.env.NODE_ENV = 'test';

// Importar app sin mockear (para probar contratos vivos)
const app = require('../src/app');

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      const reqOpts = {
        hostname: 'localhost',
        port,
        path,
        method: options.method || 'GET',
        headers: options.headers || {}
      };

      const req = http.request(reqOpts, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          server.close();
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        });
      });

      req.on('error', (err) => {
        server.close();
        reject(err);
      });

      if (options.body) {
        req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
      }
      req.end();
    });
  });
}

describe('Contratación de API y Seguridad Global — Protection Suite', () => {
  test('GET /api/health responde con estado 200 o 503 conteniendo mssql y supabase', async () => {
    const { status, body } = await makeRequest('/api/health');
    assert.ok(status === 200 || status === 503);
    const data = JSON.parse(body);
    assert.ok('status' in data);
    assert.ok('mssql' in data);
    assert.ok('supabase' in data);
  });

  test('Ruta inexistente /api/no-existe responde 404', async () => {
    const { status, body } = await makeRequest('/api/no-existe');
    assert.strictEqual(status, 404);
    const data = JSON.parse(body);
    assert.ok(data.message.includes('Ruta no encontrada'));
  });

  test('Acceso a archivo sensible /.env responde 403 Forbidden', async () => {
    const { status } = await makeRequest('/.env');
    assert.strictEqual(status, 403);
  });
});
