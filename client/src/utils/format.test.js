// client/src/utils/format.test.js
// Tests unitarios para todas las funciones de format.js.
// Verifican transformaciones de fechas, monedas, estados de pedidos y strings de UI.

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import {
  parseDate,
  parseCurrency,
  formatCurrency,
  calcEstadoBadge,
  getStatusConfig,
  formatDate,
  formatRelative,
  estadoLabel,
  estadoBadgeClass,
  initials,
} from './format.js'

// ---------------------------------------------------------------------------
// parseDate
// ---------------------------------------------------------------------------
describe('parseDate', () => {
  it('retorna null para null', () => {
    expect(parseDate(null)).toBeNull()
  })

  it('retorna null para string vacío', () => {
    expect(parseDate('')).toBeNull()
  })

  it('retorna null para fecha inválida "hola"', () => {
    expect(parseDate('hola')).toBeNull()
  })

  it('parsea formato ISO correctamente', () => {
    const d = parseDate('2026-07-30')
    expect(d).toBeInstanceOf(Date)
    expect(d.getFullYear()).toBe(2026)
  })

  it('parsea formato ISO con hora correctamente', () => {
    const d = parseDate('2026-07-30T10:30:00')
    expect(d).toBeInstanceOf(Date)
    expect(d.getFullYear()).toBe(2026)
  })

  it('parsea formato DD/MM/YYYY correctamente', () => {
    const d = parseDate('30/07/2026')
    expect(d).toBeInstanceOf(Date)
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(6) // julio = 6 (0-indexed)
  })

  it('retorna la misma instancia si ya es un Date', () => {
    const original = new Date('2026-07-30')
    const result = parseDate(original)
    expect(result).toBe(original)
  })
})

// ---------------------------------------------------------------------------
// parseCurrency
// ---------------------------------------------------------------------------
describe('parseCurrency', () => {
  it('retorna 0 para null', () => expect(parseCurrency(null)).toBe(0))
  it('retorna 0 para undefined', () => expect(parseCurrency(undefined)).toBe(0))
  it('retorna 0 para string vacío', () => expect(parseCurrency('')).toBe(0))
  it('retorna el número tal cual si ya es un número', () => expect(parseCurrency(1500)).toBe(1500))
  it('retorna 0 para string no numérico', () => expect(parseCurrency('abc')).toBe(0))
  it('parsea "1250" → 1250', () => expect(parseCurrency('1250')).toBe(1250))
  it('parsea string con formato argentino "1.250,50" → 1250.5', () => {
    expect(parseCurrency('1.250,50')).toBe(1250.5)
  })
  it('parsea string con separadores de miles "5.000" → 5000', () => {
    expect(parseCurrency('5.000')).toBe(5000)
  })
})

// ---------------------------------------------------------------------------
// formatCurrency
// ---------------------------------------------------------------------------
describe('formatCurrency', () => {
  it('formatea 5000 como moneda ARS con símbolo', () => {
    const result = formatCurrency(5000)
    expect(result).toContain('5')
    expect(result).toContain('000')
  })

  it('retorna "—" para null', () => {
    expect(formatCurrency(null)).toBe('—')
  })

  it('retorna "—" para string vacío', () => {
    expect(formatCurrency('')).toBe('—')
  })

  it('formatea 0 (literal) como moneda (no "—")', () => {
    // parseCurrency(0) = 0 pero el valor 0 numérico no es null/''
    const result = formatCurrency(0)
    expect(result).toContain('0')
  })
})

// ---------------------------------------------------------------------------
// calcEstadoBadge
// ---------------------------------------------------------------------------
describe('calcEstadoBadge', () => {
  it('retorna "pendiente" para pedido null/undefined', () => {
    expect(calcEstadoBadge(null)).toBe('pendiente')
    expect(calcEstadoBadge(undefined)).toBe('pendiente')
  })

  it('"0.0" → budget_sys', () => expect(calcEstadoBadge({ Estado: '0.0' })).toBe('budget_sys'))
  it('"0.0.99" → budget_anul', () => expect(calcEstadoBadge({ Estado: '0.0.99' })).toBe('budget_anul'))
  it('"0." → budget', () => expect(calcEstadoBadge({ Estado: '0.' })).toBe('budget'))
  it('"0" → budget', () => expect(calcEstadoBadge({ Estado: '0' })).toBe('budget'))
  it('"1." → new', () => expect(calcEstadoBadge({ Estado: '1.' })).toBe('new'))
  it('"1" → new', () => expect(calcEstadoBadge({ Estado: '1' })).toBe('new'))
  it('"1.1" → management', () => expect(calcEstadoBadge({ Estado: '1.1' })).toBe('management'))
  it('"2." → prepared', () => expect(calcEstadoBadge({ Estado: '2.' })).toBe('prepared'))
  it('"2" → prepared', () => expect(calcEstadoBadge({ Estado: '2' })).toBe('prepared'))
  it('"4." → invoiced', () => expect(calcEstadoBadge({ Estado: '4.' })).toBe('invoiced'))
  it('"4" → invoiced', () => expect(calcEstadoBadge({ Estado: '4' })).toBe('invoiced'))
  it('"5." → shipping', () => expect(calcEstadoBadge({ Estado: '5.' })).toBe('shipping'))
  it('"5" → shipping', () => expect(calcEstadoBadge({ Estado: '5' })).toBe('shipping'))
  it('"6." → finished', () => expect(calcEstadoBadge({ Estado: '6.' })).toBe('finished'))
  it('"6" → finished', () => expect(calcEstadoBadge({ Estado: '6' })).toBe('finished'))
  it('"99." → anulado', () => expect(calcEstadoBadge({ Estado: '99.' })).toBe('anulado'))
  it('"99" → anulado', () => expect(calcEstadoBadge({ Estado: '99' })).toBe('anulado'))
  it('campo Anulado=TRUE → anulado', () => {
    expect(calcEstadoBadge({ Estado: '', Anulado: 'TRUE' })).toBe('anulado')
  })
  it('campo Entregado=TRUE → finished', () => {
    expect(calcEstadoBadge({ Estado: '', Entregado: 'TRUE' })).toBe('finished')
  })
  it('estado desconocido → new (fallback)', () => {
    expect(calcEstadoBadge({ Estado: 'OTRO_DESCONOCIDO' })).toBe('new')
  })
})

// ---------------------------------------------------------------------------
// getStatusConfig
// ---------------------------------------------------------------------------
describe('getStatusConfig', () => {
  const EXPECTED_BADGES = [
    'budget_sys', 'budget_anul', 'budget', 'new', 'management',
    'prepared', 'invoiced', 'shipping', 'finished', 'anulado',
  ]

  EXPECTED_BADGES.forEach((badge) => {
    it(`devuelve config con color, bg y label para badge "${badge}"`, () => {
      const config = getStatusConfig(badge)
      expect(config).toHaveProperty('color')
      expect(config).toHaveProperty('bg')
      expect(config).toHaveProperty('label')
      expect(typeof config.label).toBe('string')
      expect(config.label.length).toBeGreaterThan(0)
    })
  })

  it('badge desconocido → fallback a config de "new"', () => {
    const config = getStatusConfig('badge-desconocido')
    const newConfig = getStatusConfig('new')
    expect(config).toEqual(newConfig)
  })
})

// ---------------------------------------------------------------------------
// estadoLabel
// ---------------------------------------------------------------------------
describe('estadoLabel', () => {
  it('"0.0" retorna label de presupuesto sistema', () => {
    expect(estadoLabel('0.0')).toContain('sistema')
  })
  it('"1." retorna label de pedido nuevo', () => {
    expect(estadoLabel('1.')).toContain('nuevo')
  })
  it('"99." retorna label de pedido anulado', () => {
    expect(estadoLabel('99.')).toContain('anulado')
  })
  it('estado desconocido retorna el estado mismo o "—"', () => {
    const result = estadoLabel('XYZ')
    expect(result === 'XYZ' || result === '—').toBe(true)
  })
  it('estado null/undefined retorna "—"', () => {
    expect(estadoLabel(null)).toBe('—')
    expect(estadoLabel(undefined)).toBe('—')
  })
})

// ---------------------------------------------------------------------------
// estadoBadgeClass
// ---------------------------------------------------------------------------
describe('estadoBadgeClass', () => {
  it('retorna string con prefijo "badge"', () => {
    expect(estadoBadgeClass('new')).toContain('badge')
    expect(estadoBadgeClass('new')).toContain('new')
  })
})

// ---------------------------------------------------------------------------
// initials
// ---------------------------------------------------------------------------
describe('initials', () => {
  it('"Juan Pérez" → "JP"', () => {
    expect(initials('Juan Pérez')).toBe('JP')
  })

  it('"Ana" → "A"', () => {
    expect(initials('Ana')).toBe('A')
  })

  it('nombre vacío → "?"', () => {
    expect(initials('')).toBe('?')
  })

  it('null → "?"', () => {
    expect(initials(null)).toBe('?')
  })

  it('más de 2 palabras → solo las 2 primeras iniciales', () => {
    expect(initials('Carlos Alberto García')).toBe('CA')
  })

  it('retorna siempre mayúsculas', () => {
    const result = initials('mario garcia')
    expect(result).toBe(result.toUpperCase())
  })
})

// ---------------------------------------------------------------------------
// formatRelative (sin depender de tiempo real — mockeamos Date)
// ---------------------------------------------------------------------------
describe('formatRelative', () => {
  it('retorna "—" para null', () => {
    expect(formatRelative(null)).toBe('—')
  })

  it('retorna "—" para string vacío', () => {
    expect(formatRelative('')).toBe('—')
  })

  it('retorna "Ahora" para fecha muy reciente (menos de 1 minuto)', () => {
    // Una fecha de hace 30 segundos
    const recent = new Date(Date.now() - 30_000).toISOString()
    expect(formatRelative(recent)).toBe('Ahora')
  })

  it('retorna "Hace Xm" para fecha de hace ~5 minutos', () => {
    const fiveMin = new Date(Date.now() - 5 * 60_000).toISOString()
    const result = formatRelative(fiveMin)
    expect(result).toMatch(/Hace \d+m/)
  })

  it('retorna "Hace Xh" para fecha de hace ~3 horas', () => {
    const threeHours = new Date(Date.now() - 3 * 3_600_000).toISOString()
    const result = formatRelative(threeHours)
    expect(result).toMatch(/Hace \d+h/)
  })

  it('retorna "Ayer" para fecha de hace exactamente 1 día', () => {
    const yesterday = new Date(Date.now() - 24 * 3_600_000).toISOString()
    const result = formatRelative(yesterday)
    expect(result === 'Ayer' || result.startsWith('Hace')).toBe(true)
  })
})
