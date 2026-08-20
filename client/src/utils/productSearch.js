/**
 * Filtra un producto según una cadena de búsqueda con soporte para múltiples términos sueltos o desordenados (ej: "esm net" o "esm + negro + net").
 * 
 * @param {Object} product - El objeto producto con campos como DESCRI, CODART, Proveedor, etc.
 * @param {string} searchString - Término o términos de búsqueda ingresados por el usuario.
 * @returns {boolean} - true si el producto coincide con la búsqueda.
 */
export function matchProductSearch(product, searchString) {
  if (!searchString || !searchString.trim()) return true
  const lowerQuery = searchString.toLowerCase().trim()

  // 1. Coincidencia directa por código de artículo
  const codigo = String(product.CODART || product.CODIGO || '').toLowerCase()
  if (codigo.includes(lowerQuery)) return true

  // 2. Búsqueda multitérmino separada por espacios o signo '+'
  const terms = lowerQuery.split(/[\s+]+/).filter(Boolean)
  if (terms.length === 0) return true

  const descri = String(product.DESCRI || product.DESCRIPCION || '').toLowerCase()
  const marca = String(product.NombreMarca || product.MARCA || '').toLowerCase()
  const proveedor = String(product.Proveedor || product.PROVEEDOR || '').toLowerCase()
  const fullText = `${descri} ${marca} ${proveedor} ${codigo}`

  return terms.every(term => fullText.includes(term))
}
