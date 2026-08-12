// server/test/pedidos_fecha_creacion.test.js
const test = require('node:test');
const assert = require('node:assert');

test('Creación de pedido: al crear a las 10:00 (13:00 UTC), al leer desde Supabase debe formatear a las 10:00 y no 07:00', () => {
  const { formatDate } = require('../src/routes/pedidos.routes');
  
  // Simular la fecha UTC que se guarda en Supabase para las 10:00 AR (13:00 UTC)
  const fechaSupabaseRealUTC = "2026-08-12T13:00:00.000Z";
  
  // Al formatear el valor devuelto por Supabase para la app:
  const fechaEnApp = formatDate(fechaSupabaseRealUTC, 'FULL');
  
  assert.strictEqual(fechaEnApp, '2026-08-12 10:00:00', `Esperaba 10:00:00 pero se obtuvo ${fechaEnApp}`);
});

test('Creación de pedido en Supabase: los campos de fecha guardados en Supabase deben estar en formato ISO UTC para no restar 3h al leer', () => {
  // A las 10:00 AR, un objeto Date nativo del servidor representa las 13:00 UTC
  const now = new Date('2026-08-12T13:00:00.000Z');
  
  // Al guardarse en Supabase debe guardarse con .toISOString()
  const fechaParaSupabase = now.toISOString();
  
  const { formatDate } = require('../src/routes/pedidos.routes');
  // Al leer la respuesta devuelta de Supabase debe dar exactamente la hora local de creación (10:00)
  const fechaFinal = formatDate(fechaParaSupabase, 'FULL');
  
  assert.strictEqual(fechaFinal, '2026-08-12 10:00:00');
});
