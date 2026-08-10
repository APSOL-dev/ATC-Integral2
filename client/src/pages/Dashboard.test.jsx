// client/src/pages/Dashboard.test.jsx
// Tests del componente Dashboard:
// - Renderizado de cards de resumen de pedidos según el estado del usuario
// - Restricción de acceso a "Control de Usuarios" para perfiles no-admin
// - Visibilidad de acceso rápido a "Cargar Pedido" para perfiles con permiso create

import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Dashboard from './Dashboard.jsx'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/atc', search: '' }),
  NavLink: ({ children, to }) => <a href={to}>{children}</a>,
}))

const mockPedidos = [
  { IDPedido: '90001', Cliente: '1001', Estado: '0', Vendedor: '3', VendedorNombre: 'Vendedor Test', 'Fecha y hora': new Date().toISOString(), Total: 5000, detalles: [] },
  { IDPedido: '90002', Cliente: '1002', Estado: '1', Vendedor: '3', VendedorNombre: 'Vendedor Test', 'Fecha y hora': new Date().toISOString(), Total: 15000, detalles: [] },
  { IDPedido: '90003', Cliente: '1003', Estado: '2', Vendedor: '5', VendedorNombre: 'Otro Vendedor', 'Fecha y hora': new Date().toISOString(), Total: 8000, detalles: [] },
]

const mockClientes = [
  { NRO_CLIENTE: 1001, NOMBRE_CLIENTE: 'Ferretería El Tornillo', NRO_VENDEDOR: '3', VENDEDOR: 'Vendedor Test', SALDO: 10000 },
  { NRO_CLIENTE: 1002, NOMBRE_CLIENTE: 'Constructora del Sol', NRO_VENDEDOR: '5', VENDEDOR: 'Otro Vendedor', SALDO: 20000 },
]

let activeUser = {
  nombre: 'AdminTest',
  perfil: 'Administracion',
  nroVendedor: null,
  token: 'mock-token',
}

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({ user: activeUser }),
}))

vi.mock('../context/DataContext.jsx', () => ({
  useData: () => ({
    pedidos: mockPedidos,
    clientes: mockClientes,
    loading: false,
    isRefreshing: false,
    fetchPedidos: vi.fn(),
    secondsLeft: 300,
    isReady: true,
  }),
}))

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('Dashboard — Renderizado para Administracion', () => {
  beforeEach(() => {
    activeUser = {
      nombre: 'AdminTest',
      perfil: 'Administracion',
      nroVendedor: null,
      token: 'mock-token',
    }
    mockNavigate.mockClear()
  })

  it('renderiza sin errores y muestra al menos un elemento de acceso rápido', () => {
    render(<Dashboard />)
    // El admin puede crear pedidos, así que "Cargar Pedido" debe estar visible
    expect(screen.getByText('Cargar Pedido')).toBeInTheDocument()
  })

  it('muestra el acceso a "Control de Usuarios" para el perfil Administracion', () => {
    render(<Dashboard />)
    expect(screen.getByText('Control de Usuarios')).toBeInTheDocument()
  })

  it('muestra acceso a "Stock / Catálogo" (visible para todos)', () => {
    render(<Dashboard />)
    expect(screen.getByText('Stock / Catálogo')).toBeInTheDocument()
  })

  it('muestra acceso a "Ficha Clientes" (visible para todos)', () => {
    render(<Dashboard />)
    expect(screen.getByText('Ficha Clientes')).toBeInTheDocument()
  })
})

describe('Dashboard — Restricciones para VendedorCalle', () => {
  beforeEach(() => {
    activeUser = {
      nombre: 'Vendedor Test',
      perfil: 'VendedorCalle',
      nroVendedor: '3',
      token: 'mock-token',
    }
    mockNavigate.mockClear()
  })

  it('NO muestra "Control de Usuarios" para VendedorCalle', () => {
    render(<Dashboard />)
    expect(screen.queryByText('Control de Usuarios')).not.toBeInTheDocument()
  })

  it('NO muestra "Cambiar Aplicación" (selector) para VendedorCalle', () => {
    render(<Dashboard />)
    expect(screen.queryByText('Cambiar Aplicación')).not.toBeInTheDocument()
  })

  it('SÍ muestra "Cargar Pedido" (VendedorCalle puede crear pedidos)', () => {
    render(<Dashboard />)
    expect(screen.getByText('Cargar Pedido')).toBeInTheDocument()
  })
})

describe('Dashboard — Restricciones para Deposito', () => {
  beforeEach(() => {
    activeUser = {
      nombre: 'Pedro Depósito',
      perfil: 'Deposito',
      nroVendedor: null,
      token: 'mock-token',
    }
    mockNavigate.mockClear()
  })

  it('NO muestra "Cargar Pedido" para Deposito (sin permiso de create)', () => {
    render(<Dashboard />)
    expect(screen.queryByText('Cargar Pedido')).not.toBeInTheDocument()
  })

  it('SÍ muestra "Stock / Catálogo" y "Ficha Clientes" (visibles para todos)', () => {
    render(<Dashboard />)
    expect(screen.getByText('Stock / Catálogo')).toBeInTheDocument()
    expect(screen.getByText('Ficha Clientes')).toBeInTheDocument()
  })
})
