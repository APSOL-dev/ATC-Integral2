const test = require('node:test');
const assert = require('node:assert/strict');

// Mock required modules to avoid real database/API connections
const Module = require('module');
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request.includes('supabase.service') || request.endsWith('supabase.service')) {
    return {
      getRows: async () => [],
      clearCache: () => {}
    };
  }
  if (request.includes('mssql.service') || request.endsWith('mssql.service')) {
    return {
      getPedidosFromDB: async () => [],
      getDetallesFromDB: async () => [],
      getVendedores: async () => [],
      getProductos: async () => []
    };
  }
  if (request.includes('config/mssql') || request.endsWith('config/mssql')) {
    return { poolPromise: Promise.resolve(null), sql: {} };
  }
  if (request.includes('middlewares/auth') || request.endsWith('middlewares/auth')) {
    return (req, res, next) => next();
  }
  return originalLoad.apply(this, arguments);
};

const tableroRouter = require('../src/routes/tablero.routes');

test('Caché del Tablero — Debe exportar la función invalidateCache', () => {
  assert.equal(typeof tableroRouter.invalidateCache, 'function');
});

test('Caché de Tablero — La ejecución de invalidateCache no debe lanzar errores', () => {
  assert.doesNotThrow(() => {
    tableroRouter.invalidateCache();
  });
});
