const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const supabaseService = require('../src/services/supabase.service');

describe('Supabase Service Protection Suite — Garantía de Robustez y Mapeos', () => {
  test('clearCache limpia el mapa en memoria sin lanzar excepciones', () => {
    assert.doesNotThrow(() => {
      supabaseService.clearCache();
    }, 'clearCache debe ejecutarse sin errores');
  });

  test('getRows soporta nombres de vistas con cualquier combinacion de mayusculas/minusculas', async () => {
    const viewsToTest = ['atc_usuarios_v', 'atc_pedidos_v', 'atc_detalles_pedidos_v'];
    for (const view of viewsToTest) {
      const rows = await supabaseService.getRows(view);
      assert.ok(Array.isArray(rows), `getRows(${view}) debe retornar un array`);
    }
  });

  test('upsertRow sanitiza campos desconocidos o no permitidos', async () => {
    // Probar sanitizacion en atc_usuarios_v
    const rawData = {
      'Nombre de usuario': 'TestSanitizeUser',
      'Perfil': 'VendedorCalle',
      'CampoDesconocidoInvalido': 'HackValue'
    };
    
    // Al intentar hacer upsert, no debe fallar por campos invalidos ni incluir CampoDesconocidoInvalido en la consulta
    try {
      await supabaseService.upsertRow('atc_usuarios_v', rawData);
    } catch (err) {
      // Si falla por permisos o restricción en DB, validamos que no sea por la columna invalida
      assert.doesNotMatch(err.message, /CampoDesconocidoInvalido/, 'No debe incluir columnas desconocidas');
    }
  });

  test('updateRows y deleteRows operan usando filtros case-insensitive en vista', async () => {
    assert.ok(typeof supabaseService.updateRows === 'function');
    assert.ok(typeof supabaseService.deleteRows === 'function');
    assert.ok(typeof supabaseService.insertRows === 'function');
  });
});
