const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const dns = require('dns');
const mssqlConfig = require('../src/config/mssql');

describe('MSSQL Config & Pool Resilience Suite', () => {
  test('MSSQL Config define timeouts de conexión de 30 segundos y enableArithAbort', () => {
    assert.strictEqual(mssqlConfig.config.connectionTimeout, 30000);
    assert.strictEqual(mssqlConfig.config.options.connectTimeout, 30000);
    assert.strictEqual(mssqlConfig.config.options.enableArithAbort, true);
    assert.strictEqual(mssqlConfig.config.pool.acquireTimeoutMillis, 30000);
  });

  test('dns.setDefaultResultOrder está configurado o disponible para priorizar IPv4', () => {
    // Si la versión de Node soporta setDefaultResultOrder, verificar que no arroja error
    if (typeof dns.setDefaultResultOrder === 'function') {
      assert.doesNotThrow(() => {
        dns.setDefaultResultOrder('ipv4first');
      });
    }
  });

  test('resetPool limpia el pool activo sin fallar', () => {
    assert.doesNotThrow(() => {
      mssqlConfig.resetPool();
    });
  });

  test('mssqlService exporta clearMssqlCache y getClientesByMultipleIds', () => {
    const mssqlService = require('../src/services/mssql.service');
    assert.strictEqual(typeof mssqlService.clearMssqlCache, 'function');
    assert.strictEqual(typeof mssqlService.getClientesByMultipleIds, 'function');
    assert.doesNotThrow(() => {
      mssqlService.clearMssqlCache();
    });
  });
});
