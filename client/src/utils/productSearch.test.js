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
})
