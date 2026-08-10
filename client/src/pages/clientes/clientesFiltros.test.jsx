import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import ClientesList from './ClientesList.jsx'

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/clientes', search: '', state: null }),
  NavLink: ({ children }) => children
}))

const mockUser = {
  nombre: 'Administrador',
  perfil: 'Administracion',
  nroVendedor: null
}

const mockClientes = [
  { NRO_CLIENTE: 1001, NOMBRE_CLIENTE: 'Ferretería El Tornillo', CUIT: '20-11111111-2', LOCALIDAD: 'La Plata', VENDEDOR: 'Vendedor 1', VENDEDOR_NOMBRE: 'Vendedor 1' },
  { NRO_CLIENTE: 1002, NOMBRE_CLIENTE: 'Constructora del Sol', CUIT: '20-22222222-2', LOCALIDAD: 'Tandil', VENDEDOR: 'Vendedor 2', VENDEDOR_NOMBRE: 'Vendedor 2' },
  { NRO_CLIENTE: 1003, NOMBRE_CLIENTE: 'Pinturería San Martín', CUIT: '20-33333333-2', LOCALIDAD: 'La Plata', VENDEDOR: 'Vendedor 1', VENDEDOR_NOMBRE: 'Vendedor 1' }
]

vi.mock('../../context/AuthContext.jsx', () => ({
  useAuth: () => ({ user: mockUser })
}))

vi.mock('../../context/DataContext.jsx', () => ({
  useData: () => ({
    clientes: mockClientes,
    loading: false,
    fetchPedidos: vi.fn()
  })
}))

describe('ClientesList: Filtros y Buscador', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('debería filtrar clientes por nombre en el buscador', () => {
    render(<ClientesList />)

    // Por defecto se ven todos
    expect(screen.getByText('Ferretería El Tornillo')).toBeInTheDocument()
    expect(screen.getByText('Constructora del Sol')).toBeInTheDocument()
    expect(screen.getByText('Pinturería San Martín')).toBeInTheDocument()

    // Filtrar por texto
    const searchInput = screen.getByPlaceholderText('Buscar por nombre, CUIT o ID...')
    fireEvent.change(searchInput, { target: { value: 'Pinturería' } })

    // Avanzar el temporizador 400ms para disparar el debounce
    act(() => {
      vi.advanceTimersByTime(400)
    })

    expect(screen.queryByText('Ferretería El Tornillo')).not.toBeInTheDocument()
    expect(screen.getByText('Pinturería San Martín')).toBeInTheDocument()
  })

  it('debería filtrar clientes por localidad', () => {
    render(<ClientesList />)

    // Localidad input
    const locInput = screen.getByPlaceholderText('Localidad...')
    fireEvent.focus(locInput)

    // Seleccionar "Tandil" del listado
    const tandilOption = screen.getByRole('button', { name: /Tandil/i })
    fireEvent.click(tandilOption)

    // Solo se debe ver Constructora del Sol
    expect(screen.queryByText('Ferretería El Tornillo')).not.toBeInTheDocument()
    expect(screen.getByText('Constructora del Sol')).toBeInTheDocument()
    expect(screen.queryByText('Pinturería San Martín')).not.toBeInTheDocument()
  })

  it('debería filtrar clientes por vendedor', () => {
    render(<ClientesList />)

    // Vendedor input
    const vendorInput = screen.getByPlaceholderText('Vendedor...')
    fireEvent.focus(vendorInput)

    // Seleccionar "Vendedor 2" del listado
    const vendor2Option = screen.getByRole('button', { name: /Vendedor 2/i })
    fireEvent.click(vendor2Option)

    // Solo se debe ver Constructora del Sol (vendedor 2)
    expect(screen.queryByText('Ferretería El Tornillo')).not.toBeInTheDocument()
    expect(screen.getByText('Constructora del Sol')).toBeInTheDocument()
  })
})
