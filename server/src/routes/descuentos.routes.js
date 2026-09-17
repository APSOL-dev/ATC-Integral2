const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const supabaseService = require('../services/supabase.service');

// Storage en memoria local de respaldo
let descuentosMarcaStore = [];

// GET /api/descuentos-marca (Lee de la vista pública public.atc_descuentos_marca_v)
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseService.supabase
      .from('atc_descuentos_marca_v')
      .select('*')
      .order('marca', { ascending: true });

    if (error) {
      console.warn('⚠️ Error al consultar atc_descuentos_marca_v en Supabase, usando fallback local:', error.message);
      return res.json(descuentosMarcaStore);
    }

    descuentosMarcaStore = (data || []).map(item => ({
      id: item.id,
      marca_id: item.marca_id || item.id_marca || item.MARCA || item.IdMarca || null,
      marca: item.marca || item.Marca,
      porcentaje: parseFloat(item.porcentaje || item.Porcentaje || 0),
      activo: item.activo !== false,
      estado: item.estado || item.Estado || 'activo',
      fecha_baja: item.fecha_baja || item.FechaBaja || null
    }));

    res.json(descuentosMarcaStore);
  } catch (err) {
    console.error('Error GET /api/descuentos-marca:', err.message);
    res.json(descuentosMarcaStore.filter(d => d.activo));
  }
});

// POST /api/descuentos-marca (Upsert en la tabla privada "atc_migración".descuentos_marca)
router.post('/', auth, async (req, res) => {
  const { marca, marca_id, porcentaje, activo = true } = req.body;
  if (!marca) {
    return res.status(400).json({ message: 'El nombre de la marca es requerido' });
  }

  const numericPorcentaje = parseFloat(porcentaje) || 0;
  const cleanMarca = String(marca).trim();
  const numericMarcaId = marca_id ? parseInt(marca_id, 10) : null;

  // Actualizar fallback local (deshabilitar previos e insertar nuevo con ID único)
  const itemStore = {
    id: Date.now(),
    marca_id: numericMarcaId,
    marca: cleanMarca,
    porcentaje: numericPorcentaje,
    activo: Boolean(activo),
    estado: activo ? 'activo' : 'deshabilitado',
    fecha_baja: activo ? null : new Date().toISOString()
  };
  descuentosMarcaStore = descuentosMarcaStore.map(d => {
    if (d.marca.toLowerCase() === cleanMarca.toLowerCase() && d.activo) {
      return { ...d, activo: false, estado: 'deshabilitado', fecha_baja: new Date().toISOString() };
    }
    return d;
  });
  descuentosMarcaStore.push(itemStore);

  try {
    const payload = {
      marca: cleanMarca,
      porcentaje: numericPorcentaje,
      activo: Boolean(activo)
    };
    if (numericMarcaId) {
      payload.marca_id = numericMarcaId;
    }

    const { data, error } = await supabaseService.supabase
      .from('atc_descuentos_marca_v')
      .insert([payload])
      .select();

    if (error) {
      console.error('❌ Error al guardar en Supabase descuentos_marca:', error.message);
      return res.status(500).json({ message: 'Error en Supabase: ' + error.message, error: error.message });
    }

    res.json({ message: 'Descuento por marca guardado con éxito en Supabase', descuento: data ? data[0] : itemStore });
  } catch (err) {
    console.error('Error POST /api/descuentos-marca:', err.message);
    res.status(500).json({ message: 'Error interno al guardar descuento por marca', error: err.message });
  }
});

// DELETE /api/descuentos-marca/:marca (Soft delete a través de la vista pública public.atc_descuentos_marca_v)
router.delete('/:marca', auth, async (req, res) => {
  const marcaTarget = String(req.params.marca).trim();
  descuentosMarcaStore = descuentosMarcaStore.map(d => {
    if (d.marca.toLowerCase() === marcaTarget.toLowerCase() && d.activo) {
      return { ...d, activo: false, estado: 'deshabilitado', fecha_baja: new Date().toISOString() };
    }
    return d;
  });

  try {
    const { error } = await supabaseService.supabase
      .from('atc_descuentos_marca_v')
      .delete()
      .ilike('marca', marcaTarget);

    if (error) {
      console.error('❌ Error al eliminar en Supabase descuentos_marca:', error.message);
      return res.status(500).json({ message: 'Error en Supabase: ' + error.message, error: error.message });
    }

    res.json({ message: 'Descuento de marca deshabilitado con éxito en Supabase' });
  } catch (err) {
    console.error('Error DELETE /api/descuentos-marca:', err.message);
    res.status(500).json({ message: 'Error interno al eliminar descuento de marca', error: err.message });
  }
});

module.exports = router;
