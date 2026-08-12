const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');

// Mock fs to simulate that client-dist exists and has an index.html file
const fs = require('fs');

const originalExistsSync = fs.existsSync;
fs.existsSync = function (p) {
  if (p.includes('client-dist') || p.includes('dist')) {
    return true;
  }
  return originalExistsSync.apply(this, arguments);
};

const originalReadFile = fs.readFile;
fs.readFile = function (p, encoding, callback) {
  if (p.includes('index.html')) {
    const cb = typeof encoding === 'function' ? encoding : callback;
    return cb(null, '<html><head></head><body><script src="assets/index.js"></script></body></html>');
  }
  return originalReadFile.apply(this, arguments);
};

// Load app with mocks active
const app = require('../src/app');

let server;
let baseUrl;

test('Cabeceras de Control de Caché — Setup del servidor de pruebas', async () => {
  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, () => {
      baseUrl = `http://localhost:${server.address().port}`;
      resolve();
    });
  });
});

test('Cabeceras de Control de Caché — GET / (index.html) debe devolver Cache-Control: no-store', async () => {
  const res = await new Promise((resolve, reject) => {
    http.get(`${baseUrl}/`, (res) => {
      resolve(res);
    }).on('error', reject);
  });

  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(
    res.headers['cache-control'],
    'no-store, no-cache, must-revalidate, proxy-revalidate'
  );
});

test('Cabeceras de Control de Caché — Teardown del servidor de pruebas', async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  // Restore original fs methods
  fs.existsSync = originalExistsSync;
  fs.readFile = originalReadFile;
});
