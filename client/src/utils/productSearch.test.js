import { describe, it, expect } from 'vitest'
import { matchProductSearch } from './productSearch.js'

describe('matchProductSearch utility', () => {
  const sampleProduct = {
    CODART: '10045',
    DESCRI: 'ESM. NEGRO 1/4 AIK./NETC.',
    Proveedor: 'Sinteplast SA',
    NombreMarca: 'Netcolor'
  }

  it('debería retornar true si la búsqueda está vacía', () => {
    expect(matchProductSearch(sampleProduct, '')).toBe(true)
    expect(matchProductSearch(sampleProduct, '   ')).toBe(true)
    expect(matchProductSearch(sampleProduct, null)).toBe(true)
  })

  it('debería encontrar coincidencia directa por código de artículo', () => {
    expect(matchProductSearch(sampleProduct, '10045')).toBe(true)
  })

  it('debería encontrar coincidencia por múltiples palabras sueltas separadas por espacio', () => {
    expect(matchProductSearch(sampleProduct, 'esm net')).toBe(true)
    expect(matchProductSearch(sampleProduct, 'negro 1/4 esm')).toBe(true)
  })

  it('debería encontrar coincidencia separada por signo "+"', () => {
    expect(matchProductSearch(sampleProduct, 'esm + negro + net')).toBe(true)
  })

  it('debería retornar false si al menos una de las palabras no coincide', () => {
    expect(matchProductSearch(sampleProduct, 'esm blanco')).toBe(false)
    expect(matchProductSearch(sampleProduct, 'latex net')).toBe(false)
  })

  it('debería encontrar coincidencia por NombreRubro o RUBRO', () => {
    const productWithRubro = {
      ...sampleProduct,
      NombreRubro: 'Sintéticos y Barnices',
      RUBRO: 'Pinturas de Obra'
    }
    expect(matchProductSearch(productWithRubro, 'sintéticos')).toBe(true)
    expect(matchProductSearch(productWithRubro, 'Pinturas')).toBe(true)
  })

  it('en modo "nombre" no debería buscar en el código si se desactiva la coincidencia por código', () => {
    expect(matchProductSearch(sampleProduct, '10045', 'nombre')).toBe(false)
    expect(matchProductSearch(sampleProduct, 'esm', 'nombre')).toBe(true)
  })

  it('en modo "codigo" solo debería buscar por código de artículo con coincidencia exacta', () => {
    expect(matchProductSearch(sampleProduct, '10045', 'codigo')).toBe(true)
    expect(matchProductSearch(sampleProduct, '100', 'codigo')).toBe(false)
    expect(matchProductSearch(sampleProduct, 'esm', 'codigo')).toBe(false)
  })
})
