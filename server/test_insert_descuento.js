const supabaseService = require('./src/services/supabase.service');

async function test() {
  console.log('Testing insert via Supabase client...');
  const { data, error } = await supabaseService.supabase
    .from('atc_descuentos_marca_v')
    .insert({
      marca: 'TestFromNode',
      porcentaje: 25,
      activo: true
    })
    .select();

  if (error) {
    console.error('❌ Insert error:', error);
  } else {
    console.log('✅ Insert success:', data);
  }

  const { data: readData, error: readErr } = await supabaseService.supabase
    .from('atc_descuentos_marca_v')
    .select('*');

  if (readErr) {
    console.error('❌ Read error:', readErr);
  } else {
    console.log('✅ Read success:', readData);
  }

  process.exit(0);
}

test();
