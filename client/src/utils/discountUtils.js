import { parseCurrency } from './format.js'

/**
 * Extrae el nombre o texto representativo de la marca de un producto u objeto de ítem.
 * Prioriza las propiedades de tipo texto (NombreMarca, Marca, marca) sobre IDs numéricos (MARCA: 144).
 * Como fallback, utiliza la descripción del producto o nombre del ítem.
 *
 * @param {Object|string} obj Producto, ítem o string
 * @returns {string} Nombre de la marca o texto descriptivo
 */
export function getBrandName(obj) {
  if (!obj) return ''
  if (typeof obj === 'string') return obj.trim()
  if (typeof obj !== 'object') return String(obj).trim()

  // 1. Prefer explicit string properties for brand name
  if (typeof obj.NombreMarca === 'string' && obj.NombreMarca.trim()) {
    return obj.NombreMarca.trim()
  }
  if (typeof obj.Marca === 'string' && obj.Marca.trim()) {
    return obj.Marca.trim()
  }
  if (typeof obj.marca === 'string' && obj.marca.trim()) {
    return obj.marca.trim()
  }
  if (typeof obj.MARCA === 'string' && obj.MARCA.trim()) {
    return obj.MARCA.trim()
  }

  // 2. Fallback to product description or item name
  const desc = obj.DESCRI || obj.DESCRIPCION || obj['Nombre (más alla de si es item o nombre)'] || obj['Nombre item'] || obj.NombreItem || ''
  if (typeof desc === 'string' && desc.trim()) {
    return desc.trim()
  }

  return ''
}

/**
 * Obtiene el porcentaje de descuento asignado a una marca dentro del objeto o mapa de descuentos por marca.
 * La búsqueda es insensible a mayúsculas/minúsculas y espacios.
 *
 * @param {string|Object} marcaOrObj Nombre de la marca o bien objeto de producto/ítem
 * @param {Object|Array} descuentosMarca Mapa o lista de descuentos por marca activos
 * @returns {number} Porcentaje de descuento (0 si no aplica)
 */
export function getMarcaDiscount(marcaOrObj, descuentosMarca) {
  if (!marcaOrObj || !descuentosMarca) return 0
  
  let numericId = null
  let searchStr = ''

  if (typeof marcaOrObj === 'object') {
    if (typeof marcaOrObj.MARCA === 'number' && marcaOrObj.MARCA > 0) {
      numericId = marcaOrObj.MARCA
    } else if (typeof marcaOrObj.IdMarca === 'number' && marcaOrObj.IdMarca > 0) {
      numericId = marcaOrObj.IdMarca
    } else if (typeof marcaOrObj.id_marca === 'number' && marcaOrObj.id_marca > 0) {
      numericId = marcaOrObj.id_marca
    } else if (typeof marcaOrObj.MARCA === 'string' && /^\d+$/.test(marcaOrObj.MARCA.trim())) {
      numericId = parseInt(marcaOrObj.MARCA.trim(), 10)
    }
    searchStr = getBrandName(marcaOrObj).trim().toLowerCase()
  } else {
    const raw = String(marcaOrObj).trim()
    if (/^\d+$/.test(raw)) {
      numericId = parseInt(raw, 10)
    }
    searchStr = raw.toLowerCase()
  }

  if (Array.isArray(descuentosMarca)) {
    const found = descuentosMarca.find(d => {
      if (d.activo === false) return false

      const dId = Number(d.marca_id || d.id_marca || d.IdMarca || d.MARCA)
      if (numericId && !isNaN(dId) && dId > 0 && dId === numericId) {
        return true
      }

      const m = String(d.marca || d.MARCA || d.NombreMarca || '').trim().toLowerCase()
      if (m && searchStr && (searchStr === m || searchStr.includes(m) || m.includes(searchStr))) {
        return true
      }

      return false
    })
    return found ? parseCurrency(found.porcentaje || found.Porcentaje || found.descuento || 0) : 0
  }

  if (typeof descuentosMarca === 'object') {
    for (const [key, value] of Object.entries(descuentosMarca)) {
      const k = String(key).trim().toLowerCase()
      if (numericId && String(numericId) === k) {
        return parseCurrency(value)
      }
      if (k && searchStr && (searchStr === k || searchStr.includes(k) || k.includes(searchStr))) {
        return parseCurrency(value)
      }
    }
  }

  return 0
}

/**
 * Calcula los totales de un pedido desglosando los descuentos por marca y el descuento general.
 * 
 * Regla de negocio:
 * - Los artículos con descuento específico por marca aplican ese % sobre su subtotal bruto.
 * - El Descuento General (% del pedido) aplica ÚNICAMENTE sobre la suma de subtotales de artículos SIN descuento por marca.
 *
 * @param {Array} items Lista de ítems del pedido
 * @param {number|string} headerDiscount Porcentaje de descuento general del pedido
 * @param {Object|Array} descuentosMarca Mapa o lista de descuentos por marca activos
 * @returns {Object} { subtotalBruto, montoDescMarca, subtotalSinDescMarca, montoDescGeneral, total, totalUnidades, totalItems }
 */
export function calculateOrderTotals(items = [], headerDiscount = 0, descuentosMarca = {}) {
  let subtotalBruto = 0
  let montoDescMarca = 0
  let subtotalSinDescMarca = 0
  let totalUnidades = 0

  const generalDiscPct = parseCurrency(headerDiscount)

  items.forEach(item => {
    const precio = parseCurrency(item.Precio)
    const cantidad = parseCurrency(item.Cantidad)
    const brutoLine = precio * cantidad
    totalUnidades += cantidad
    subtotalBruto += brutoLine

    // Verificar si el ítem tiene descuento asignado por marca
    const itemMarca = getBrandName(item)
    const itemDescPct = parseCurrency((item.Descuento !== undefined && item.Descuento !== null && Number(item.Descuento) > 0) ? item.Descuento : getMarcaDiscount(itemMarca, descuentosMarca))

    if (itemDescPct > 0) {
      const descMarcaLine = brutoLine * (itemDescPct / 100)
      montoDescMarca += descMarcaLine
    } else {
      subtotalSinDescMarca += brutoLine
    }
  })

  const montoDescGeneral = subtotalSinDescMarca * (generalDiscPct / 100)
  const total = subtotalBruto - montoDescMarca - montoDescGeneral

  return {
    subtotalBruto,
    montoDescMarca,
    subtotalSinDescMarca,
    montoDescGeneral,
    total,
    totalUnidades,
    totalItems: items.length
  }
}
