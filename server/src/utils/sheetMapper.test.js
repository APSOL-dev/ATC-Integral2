// server/src/utils/sheetMapper.test.js
// Tests unitarios para las funciones de mapeo de hojas de cálculo.
// Siguen el ciclo TDD: cada caso describe el comportamiento esperado.

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { rowsToObjects, objectToRow } = require('./sheetMapper');

// ---------------------------------------------------------------------------
// rowsToObjects
// ---------------------------------------------------------------------------
describe('rowsToObjects', () => {

  test('devuelve [] para null', () => {
    assert.deepStrictEqual(rowsToObjects(null), []);
  });

  test('devuelve [] para undefined', () => {
    assert.deepStrictEqual(rowsToObjects(undefined), []);
  });

  test('devuelve [] para array vacío', () => {
    assert.deepStrictEqual(rowsToObjects([]), []);
  });

  test('devuelve [] para array con solo la cabecera (1 fila, sin datos)', () => {
    assert.deepStrictEqual(rowsToObjects([['IDPedido', 'Nombre']]), []);
  });

  test('mapea correctamente 2 filas de datos a objetos', () => {
    const rows = [
      ['IDPedido', 'Nombre', 'Total'],
      ['1001', 'Ferretería El Tornillo', '5000'],
      ['1002', 'Constructora del Sol', '15000'],
    ];
    const result = rowsToObjects(rows);
    assert.strictEqual(result.length, 2);
    assert.deepStrictEqual(result[0], {
      IDPedido: '1001',
      Nombre: 'Ferretería El Tornillo',
      Total: '5000',
    });
    assert.deepStrictEqual(result[1], {
      IDPedido: '1002',
      Nombre: 'Constructora del Sol',
      Total: '15000',
    });
  });

  test('omite columnas cuya cabecera es una cadena vacía', () => {
    const rows = [
      ['IDPedido', '', 'Nombre'],
      ['1001', 'ignorado', 'Ferretería'],
    ];
    const result = rowsToObjects(rows);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].IDPedido, '1001');
    assert.strictEqual(result[0].Nombre, 'Ferretería');
    // La columna vacía no debe crear una clave '' en el objeto
    assert.ok(!Object.prototype.hasOwnProperty.call(result[0], ''));
  });

  test('recorta espacios en blanco en las cabeceras', () => {
    const rows = [
      ['  IDPedido  ', '  Nombre  '],
      ['1001', 'Test'],
    ];
    const result = rowsToObjects(rows);
    assert.ok(Object.prototype.hasOwnProperty.call(result[0], 'IDPedido'));
    assert.ok(Object.prototype.hasOwnProperty.call(result[0], 'Nombre'));
  });

  test('maneja celdas undefined dentro de las filas de datos', () => {
    const rows = [
      ['IDPedido', 'Nombre'],
      ['1001', undefined],
    ];
    const result = rowsToObjects(rows);
    assert.strictEqual(result[0].IDPedido, '1001');
    assert.strictEqual(result[0].Nombre, undefined);
  });

});

// ---------------------------------------------------------------------------
// objectToRow
// ---------------------------------------------------------------------------
describe('objectToRow', () => {

  test('genera una fila respetando el orden de los headers', () => {
    const headers = ['IDPedido', 'Nombre', 'Total'];
    const obj = { IDPedido: '1001', Nombre: 'Test', Total: '5000' };
    assert.deepStrictEqual(objectToRow(obj, headers), ['1001', 'Test', '5000']);
  });

  test('usa string vacío para claves del header ausentes en el objeto', () => {
    const headers = ['IDPedido', 'Nombre', 'Total'];
    const obj = { IDPedido: '1001' };
    assert.deepStrictEqual(objectToRow(obj, headers), ['1001', '', '']);
  });

  test('respeta el orden del header aunque el objeto tenga un orden diferente', () => {
    const headers = ['IDPedido', 'Nombre', 'Total'];
    const obj = { Total: '5000', Nombre: 'Test', IDPedido: '1001' };
    assert.deepStrictEqual(objectToRow(obj, headers), ['1001', 'Test', '5000']);
  });

  test('devuelve array vacío si headers es un array vacío', () => {
    assert.deepStrictEqual(objectToRow({ IDPedido: '1001' }, []), []);
  });

  test('recorta espacios en los headers al buscar valores en el objeto', () => {
    const headers = ['  IDPedido  ', '  Nombre  '];
    const obj = { IDPedido: '1001', Nombre: 'Test' };
    // objectToRow recorta el header antes de buscar — resultado esperado: ['1001', 'Test']
    const result = objectToRow(obj, headers);
    assert.deepStrictEqual(result, ['1001', 'Test']);
  });

});
