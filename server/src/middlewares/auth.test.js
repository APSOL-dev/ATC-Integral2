// server/src/middlewares/auth.test.js
// Tests unitarios para el middleware de autenticación JWT.
// No requieren DB ni red — prueban el comportamiento del middleware de forma aislada.

const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

// Definir el secreto ANTES de importar el middleware para que process.env esté disponible
const TEST_SECRET = 'test-jwt-secret-para-suite-de-tests';
process.env.JWT_SECRET = TEST_SECRET;

const authMiddleware = require('./auth');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function buildRes() {
  const res = {};
  res.status = (code) => { res._status = code; return res; };
  res.json = (body) => { res._body = body; return res; };
  return res;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('middleware auth — JWT', () => {

  test('rechaza petición sin header Authorization con 401', () => {
    const req = { headers: {} };
    const res = buildRes();
    let nextCalled = false;
    authMiddleware(req, res, () => { nextCalled = true; });
    assert.strictEqual(res._status, 401);
    assert.deepStrictEqual(res._body, { error: 'No autorizado' });
    assert.strictEqual(nextCalled, false);
  });

  test('rechaza cuando el header Authorization existe pero el token es un string vacío', () => {
    const req = { headers: { authorization: 'Bearer ' } };
    const res = buildRes();
    let nextCalled = false;
    authMiddleware(req, res, () => { nextCalled = true; });
    assert.strictEqual(res._status, 401);
    assert.strictEqual(nextCalled, false);
  });

  test('rechaza token con firma inválida con 401', () => {
    const req = { headers: { authorization: 'Bearer token.invalido.aqui' } };
    const res = buildRes();
    let nextCalled = false;
    authMiddleware(req, res, () => { nextCalled = true; });
    assert.strictEqual(res._status, 401);
    assert.deepStrictEqual(res._body, { error: 'No autorizado' });
    assert.strictEqual(nextCalled, false);
  });

  test('rechaza token firmado con un secreto diferente con 401', () => {
    const tokenConOtroSecreto = jwt.sign({ id: 'x' }, 'otro-secreto-diferente', { expiresIn: '1h' });
    const req = { headers: { authorization: `Bearer ${tokenConOtroSecreto}` } };
    const res = buildRes();
    let nextCalled = false;
    authMiddleware(req, res, () => { nextCalled = true; });
    assert.strictEqual(res._status, 401);
    assert.strictEqual(nextCalled, false);
  });

  test('rechaza token expirado con 401', () => {
    const tokenExpirado = jwt.sign({ id: 'y' }, TEST_SECRET, { expiresIn: '-1s' });
    const req = { headers: { authorization: `Bearer ${tokenExpirado}` } };
    const res = buildRes();
    let nextCalled = false;
    authMiddleware(req, res, () => { nextCalled = true; });
    assert.strictEqual(res._status, 401);
    assert.strictEqual(nextCalled, false);
  });

  test('acepta token válido: llama next() y adjunta req.user con el payload correcto', () => {
    const payload = {
      nombre: 'UsuarioTest',
      perfil: 'Administracion',
      nroVendedor: '5',
    };
    const tokenValido = jwt.sign(payload, TEST_SECRET, { expiresIn: '1h' });
    const req = { headers: { authorization: `Bearer ${tokenValido}` } };
    const res = buildRes();
    let nextCalled = false;
    authMiddleware(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, true, 'next() debe ser llamado para tokens válidos');
    assert.ok(req.user, 'req.user debe estar adjunto');
    assert.strictEqual(req.user.nombre, 'UsuarioTest');
    assert.strictEqual(req.user.perfil, 'Administracion');
    assert.strictEqual(req.user.nroVendedor, '5');
  });

  test('res._status no debe ser seteado cuando el token es válido', () => {
    const tokenValido = jwt.sign({ id: 'z' }, TEST_SECRET, { expiresIn: '1h' });
    const req = { headers: { authorization: `Bearer ${tokenValido}` } };
    const res = buildRes();
    authMiddleware(req, res, () => {});
    assert.strictEqual(res._status, undefined);
  });

});
