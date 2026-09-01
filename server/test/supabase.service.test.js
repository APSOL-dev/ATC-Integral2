const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const supabaseService = require('../src/services/supabase.service');

describe('Supabase Service — Mapeo de vistas y columnas de ordenamiento', () => {
  test('getRows con "atc_usuarios_v" debe consultar sin fallar por columna inexistente', async () => {
    // Si la función utiliza IDPedido o id para atc_usuarios_v, Supabase responderá con error.
    // Con la corrección a "Nombre de usuario", getRows resolverá exitosamente.
    const rows = await supabaseService.getRows('atc_usuarios_v');
    assert.ok(Array.isArray(rows), 'getRows debe retornar un array de usuarios');
  });
});
