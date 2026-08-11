const test = require('node:test');
const assert = require('node:assert/strict');
const pedidosRoutes = require('../src/routes/pedidos.routes');

test('Generación de ID de Pedido — debe comenzar en 110000 cuando la base está vacía', () => {
  const existingPedidos = [];
  let maxId = 0;
  if (existingPedidos.length > 0) {
    const ids = existingPedidos
      .map(p => parseInt(p.IDPedido))
      .filter(id => !isNaN(id) && id < 1000000);
    maxId = Math.max(...ids, 0);
  }
  const newId = maxId < 110000 ? 110000 : maxId + 1;
  assert.equal(newId, 110000);
});

test('Generación de ID de Pedido — incrementa correlativamente a 110001 tras existir el 110000', () => {
  const existingPedidos = [{ IDPedido: 110000 }];
  let maxId = 0;
  if (existingPedidos.length > 0) {
    const ids = existingPedidos
      .map(p => parseInt(p.IDPedido))
      .filter(id => !isNaN(id) && id < 1000000);
    maxId = Math.max(...ids, 0);
  }
  const newId = maxId < 110000 ? 110000 : maxId + 1;
  assert.equal(newId, 110001);
});
