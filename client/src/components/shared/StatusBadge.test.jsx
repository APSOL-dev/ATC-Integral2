// client/src/components/shared/StatusBadge.test.jsx
// Tests del componente StatusBadge:
// - Renderiza el label correcto para cada estado del sistema
// - Acepta badge directo o pedido para calcular el badge automáticamente
// - Aplica las clases de tamaño correctas

import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import StatusBadge from './StatusBadge.jsx'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('StatusBadge — Renderizado por badge directo', () => {

  it('badge "new" muestra "NUEVO"', () => {
    render(<StatusBadge badge="new" />)
    expect(screen.getByText(/NUEVO/i)).toBeInTheDocument()
  })

  it('badge "budget" muestra "PRESUPUESTO"', () => {
    render(<StatusBadge badge="budget" />)
    expect(screen.getByText(/PRESUPUESTO/i)).toBeInTheDocument()
  })

  it('badge "budget_sys" muestra "PRESUPUESTO SISTEMA"', () => {
    render(<StatusBadge badge="budget_sys" />)
    expect(screen.getByText(/PRESUPUESTO SISTEMA/i)).toBeInTheDocument()
  })

  it('badge "budget_anul" muestra "ANULADO"', () => {
    render(<StatusBadge badge="budget_anul" />)
    expect(screen.getByText(/ANULADO/i)).toBeInTheDocument()
  })

  it('badge "management" muestra "GESTIÓN"', () => {
    render(<StatusBadge badge="management" />)
    expect(screen.getByText(/GESTIÓN/i)).toBeInTheDocument()
  })

  it('badge "prepared" muestra "PREPARADO"', () => {
    render(<StatusBadge badge="prepared" />)
    expect(screen.getByText(/PREPARADO/i)).toBeInTheDocument()
  })

  it('badge "invoiced" muestra "FACTURADO"', () => {
    render(<StatusBadge badge="invoiced" />)
    expect(screen.getByText(/FACTURADO/i)).toBeInTheDocument()
  })

  it('badge "shipping" muestra "VIAJE"', () => {
    render(<StatusBadge badge="shipping" />)
    expect(screen.getByText(/VIAJE/i)).toBeInTheDocument()
  })

  it('badge "finished" muestra "FINALIZADO"', () => {
    render(<StatusBadge badge="finished" />)
    expect(screen.getByText(/FINALIZADO/i)).toBeInTheDocument()
  })

  it('badge "anulado" muestra "ANULADO"', () => {
    render(<StatusBadge badge="anulado" />)
    expect(screen.getByText(/ANULADO/i)).toBeInTheDocument()
  })

})

describe('StatusBadge — Renderizado por pedido (calcEstadoBadge automático)', () => {

  it('pedido con Estado "1" muestra badge de "NUEVO"', () => {
    render(<StatusBadge pedido={{ Estado: '1' }} />)
    expect(screen.getByText(/NUEVO/i)).toBeInTheDocument()
  })

  it('pedido con Estado "0" muestra badge de "PRESUPUESTO"', () => {
    render(<StatusBadge pedido={{ Estado: '0' }} />)
    expect(screen.getByText(/PRESUPUESTO/i)).toBeInTheDocument()
  })

  it('pedido con Estado "99" muestra badge de "ANULADO"', () => {
    render(<StatusBadge pedido={{ Estado: '99' }} />)
    expect(screen.getByText(/ANULADO/i)).toBeInTheDocument()
  })

  it('pedido con Estado "2" muestra badge de "PREPARADO"', () => {
    render(<StatusBadge pedido={{ Estado: '2' }} />)
    expect(screen.getByText(/PREPARADO/i)).toBeInTheDocument()
  })

  it('el badge pasado directamente tiene prioridad sobre el pedido', () => {
    // Si se pasa badge="anulado" y pedido con Estado "1", debe mostrar "ANULADO"
    render(<StatusBadge badge="anulado" pedido={{ Estado: '1' }} />)
    expect(screen.getByText(/ANULADO/i)).toBeInTheDocument()
    expect(screen.queryByText(/NUEVO/i)).not.toBeInTheDocument()
  })

})

describe('StatusBadge — Tamaños', () => {

  it('size="sm" aplica clase con texto más pequeño', () => {
    const { container } = render(<StatusBadge badge="new" size="sm" />)
    expect(container.firstChild.className).toContain('text-[9px]')
  })

  it('size="lg" aplica clase con texto más grande', () => {
    const { container } = render(<StatusBadge badge="new" size="lg" />)
    expect(container.firstChild.className).toContain('text-[11px]')
  })

  it('size por defecto (md) aplica texto mediano', () => {
    const { container } = render(<StatusBadge badge="new" />)
    expect(container.firstChild.className).toContain('text-[10px]')
  })

})
