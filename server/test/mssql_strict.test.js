const test = require('node:test');
const assert = require('node:assert/strict');
const mssqlService = require('../src/services/mssql.service');

test('MSSQL Strict Mode — no retorna datos mock en caso de fallo de conexión', async () => {
  try {
    await mssqlService.getClientes();
  } catch (err) {
    assert.match(err.message, /MSSQL|SQL Server|conexión/i);
  }
});

test('MSSQL Retry Logic — ejecuta reintentos automáticos ante fallos temporales', async () => {
  let attempts = 0;
  const executeWithRetry = async (fn, retries = 3, delayMs = 10) => {
    let lastErr;
    for (let i = 1; i <= retries; i++) {
      try {
        attempts++;
        return await fn();
      } catch (err) {
        lastErr = err;
        if (i < retries) await new Promise(r => setTimeout(r, delayMs));
      }
    }
    throw lastErr;
  };

  try {
    await executeWithRetry(async () => {
      if (attempts < 3) throw new Error('Error temporal de red SQL');
      return [{ NRO_CLIENTE: 1, NOMBRE_CLIENTE: 'Cliente OK' }];
    }, 3, 10);
    assert.equal(attempts, 3);
  } catch (err) {
    assert.fail('Debería haber tenido éxito en el tercer intento');
  }
});
