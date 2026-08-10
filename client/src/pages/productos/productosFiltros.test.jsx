import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import ProductosCatalog from './ProductosCatalog.jsx'

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/productos', search: '', state: null }),
  NavLink: ({ children }) => children
}))

const mockUser = {
  nombre: 'Administrador',
  perfil: 'Administracion',
  nroVendedor: null
}

const mockProducts = [
  {
    CODART: '10001',
    DESCRI: 'Látex Interior Blanco 20L',
    CC_CIVA: 4250,
    stock: 45,
    Proveedor: 'Sinteplast SA',
    NombreFamilia: 'Pinturas',
    NombreMarca: 'Sinteplast'
  },
  {
    CODART: '10002',
    DESCRI: 'Esmalte Sintético Rojo 1L',
    CC_CIVA: 1500,
    stock: 0, // Sin stock
    Proveedor: 'Alba SA',
    NombreFamilia: 'Pinturas',
    NombreMarca: 'Alba'
  },
  {
    CODART: '10003',
    DESCRI: 'Pincel Profesional Nro 15',
    CC_CIVA: 800,
    stock: 20,
    Proveedor: 'El Galgo',
    NombreFamilia: 'Accesorios',
    NombreMarca: 'El Galgo'
  }
]

vi.mock('../../context/AuthContext.jsx', () => ({
  useAuth: () => ({ user: mockUser })
}))

vi.mock('../../context/DataContext.jsx', () => ({
  useData: () => ({
    productos: mockProducts,
    loading: false,
    fetchPedidos: vi.fn()
  })
}))

describe('ProductosCatalog: Filtros y Buscador', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('debería buscar productos por código o descripción', () => {
    render(<ProductosCatalog />)

    // Por defecto todos se ven
    expect(screen.getByText('Látex Interior Blanco 20L')).toBeInTheDocument()
    expect(screen.getByText('Esmalte Sintético Rojo 1L')).toBeInTheDocument()
    expect(screen.getByText('Pincel Profesional Nro 15')).toBeInTheDocument()

    // Buscar "Pincel"
    const searchInput = screen.getByPlaceholderText('Buscar descripción o código...')
    fireEvent.change(searchInput, { target: { value: 'Pincel' } })

    // Avanzar el temporizador 400ms para disparar el debounce
    act(() => {
      vi.advanceTimersByTime(400)
    })

    expect(screen.queryByText('Látex Interior Blanco 20L')).not.toBeInTheDocument()
    expect(screen.getByText('Pincel Profesional Nro 15')).toBeInTheDocument()
  })

  it('debería filtrar y ocultar productos sin stock al activar el checkbox "Stock"', () => {
    render(<ProductosCatalog />)

    // Al inicio se ve el esmalte con stock 0
    expect(screen.getByText('Esmalte Sintético Rojo 1L')).toBeInTheDocument()

    // Hacer click en el checkbox de Stock
    const stockCheckbox = screen.getByRole('checkbox')
    fireEvent.click(stockCheckbox)

    // Esmalte (con stock 0) ya no se debe ver en la lista
    expect(screen.queryByText('Esmalte Sintético Rojo 1L')).not.toBeInTheDocument()
    // Los otros dos productos sí se deben ver (tienen stock positivo)
    expect(screen.getByText('Látex Interior Blanco 20L')).toBeInTheDocument()
    expect(screen.getByText('Pincel Profesional Nro 15')).toBeInTheDocument()
  })

  it('debería filtrar por Proveedor', () => {
    render(<ProductosCatalog />)

    // Abrir dropdown Proveedor
    const provInput = screen.getByPlaceholderText('Proveedor...')
    fireEvent.focus(provInput)

    // Seleccionar "Sinteplast SA"
    const option = screen.getByRole('button', { name: /Sinteplast SA/i })
    fireEvent.click(option)

    // Solo se debe ver el Látex de Sinteplast
    expect(screen.getByText('Látex Interior Blanco 20L')).toBeInTheDocument()
    expect(screen.queryByText('Esmalte Sintético Rojo 1L')).not.toBeInTheDocument()
    expect(screen.queryByText('Pincel Profesional Nro 15')).not.toBeInTheDocument()
  })
})
