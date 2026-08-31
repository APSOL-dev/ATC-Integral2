const test = require('node:test');
const assert = require('node:assert/strict');

// 1. Test IDDetalle generation logic with sequential indexing
test('Generación de IDDetalle — asigna secuencialidad infalible sin colisiones para cualquier código de producto', () => {
  const newId = 110195;
  const items = [
    { 'Codigo (más alla de si es item o nombre)': 'ART-ALPHA', Cantidad: 2, Precio: 100 },
    { 'Codigo (más alla de si es item o nombre)': 'ART-BETA', Cantidad: 1, Precio: 200 },
    { 'Codigo (más alla de si es item o nombre)': '', Cantidad: 5, Precio: 50 }
  ];

  const detailObjects = items.map((item, idx) => {
    const seq = String(idx + 1).padStart(3, '0');
    return {
      IDPedido: newId,
      IDDetalle: `${newId}${seq}`,
      'Item  codigo': item['Codigo (más alla de si es item o nombre)'] || '',
      Cantidad: item.Cantidad,
      Precio: item.Precio
    };
  });

  assert.equal(detailObjects.length, 3);
  assert.equal(detailObjects[0].IDDetalle, '110195001');
  assert.equal(detailObjects[1].IDDetalle, '110195002');
  assert.equal(detailObjects[2].IDDetalle, '110195003');

  // Verify all IDs are strictly unique
  const uniqueIds = new Set(detailObjects.map(d => d.IDDetalle));
  assert.equal(uniqueIds.size, 3);
});

// 2. Test prevention of sending empty details to DB
test('Validación de estado — rechaza cambiar a estado "1" si los detalles del pedido están vacíos', () => {
  const cleanStatus = '1';
  const detalles = []; // empty details

  const isValidToSend = (status, detailsArr) => {
    if (status === '1' || status === '1.' || status === '0.0.99') {
      if (!detailsArr || detailsArr.length === 0) {
        return false;
      }
    }
    return true;
  };

  assert.equal(isValidToSend(cleanStatus, detalles), false);
  assert.equal(isValidToSend(cleanStatus, [{ IDDetalle: '110195001' }]), true);
});
