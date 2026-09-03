/**
 * Filtra un producto según una cadena de búsqueda con soporte para modos de búsqueda ('nombre' o 'codigo').
 * 
 * @param {Object} product - El objeto producto con campos como DESCRI, CODART, Proveedor, etc.
 * @param {string} searchString - Término o términos de búsqueda ingresados por el usuario.
 * @param {string} mode - Modo de búsqueda: 'nombre' (Descripción, Marca, Rubro, Proveedor) o 'codigo' (Código SKU).
 * @returns {boolean} - true si el producto coincide con la búsqueda.
 */
export function matchProductSearch(product, searchString, mode = 'all') {
  if (!searchString || !searchString.trim()) return true
  const lowerQuery = searchString.toLowerCase().trim()
  const codigo = String(product.CODART || product.CODIGO || '').toLowerCase()

  // Búsqueda exclusiva por código de artículo
  if (mode === 'codigo') {
    return codigo.includes(lowerQuery)
  }

  // Coincidencia directa por código de artículo en modo por defecto ('all')
  if (mode === 'all' && codigo.includes(lowerQuery)) {
    return true
  }

  // Búsqueda por nombre / descripción / marca / rubro / proveedor (modo 'nombre' y 'all')
  const terms = lowerQuery.split(/[\s+]+/).filter(Boolean)
  if (terms.length === 0) return true

  const descri = String(product.DESCRI || product.DESCRIPCION || '').toLowerCase()
  const marca = String(product.NombreMarca || (typeof product.MARCA === 'string' ? product.MARCA : '') || '').toLowerCase()
  const proveedor = String(product.Proveedor || product.PROVEEDOR || '').toLowerCase()
  const nombreRubro = String(product.NombreRubro || product.Rubro || '').toLowerCase()
  const rubro = String(product.RUBRO || '').toLowerCase()
  const fullText = `${descri} ${marca} ${proveedor} ${nombreRubro} ${rubro}`

  return terms.every(term => fullText.includes(term))
}
