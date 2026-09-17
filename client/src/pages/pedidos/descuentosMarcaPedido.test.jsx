import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import PedidoForm from './PedidoForm.jsx'

// Mocks
const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/pedidos/nuevo', search: '', state: null }),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  NavLink: ({ children }) => children
}))

const mockUser = {
  nombre: 'Vendedor 1',
  perfil: 'VendedorCalle',
  nroVendedor: '3',
  token: 'mock-jwt-token'
}

const mockClientes = [
  { 
    NRO_CLIENTE: 1001, 
    NOMBRE_CLIENTE: 'Ferretería El Tornillo', 
    VENDEDOR: 'Vendedor 1', 
    NRO_VENDEDOR: '3'
  }
]

const mockProductos = [
  {
    CODART: '10001',
    CODIGO: '10001',
    DESCRI: 'Látex Sinteplast 20L',
    DESCRIPCION: 'Látex Sinteplast 20L',
    NombreMarca: 'Sinteplast',
    Marca: 'Sinteplast',
    CC_CIVA: 1000,
    stock: 50
  },
  {
    CODART: '10002',
    CODIGO: '10002',
    DESCRI: 'Esmalte Tersuave 4L',
    DESCRIPCION: 'Esmalte Tersuave 4L',
    NombreMarca: 'Tersuave',
    Marca: 'Tersuave',
    CC_CIVA: 1000,
    stock: 50
  }
]

const mockDescuentosMarca = {
  'Sinteplast': 15 // 15% por marca Sinteplast
}

vi.mock('../../context/AuthContext.jsx', () => ({
  useAuth: () => ({ user: mockUser })
}))

vi.mock('../../context/DataContext.jsx', () => ({
  useData: () => ({
    clientes: mockClientes,
    productos: mockProductos,
    descuentosMarca: mockDescuentosMarca,
    loading: false,
    setPedidos: vi.fn(),
    fetchPedidos: vi.fn()
  })
}))

describe('Descuentos por Marca en Pedidos (Integración)', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('debería precargar y bloquear descuento de marca al agregar producto promocionado y aplicar desc. general solo al producto sin desc. de marca', async () => {
    render(<PedidoForm />)

    // 1. Seleccionar Cliente
    const inputClient = screen.getByPlaceholderText(/Buscar por nombre o número de cliente.../i)
    fireEvent.change(inputClient, { target: { value: 'Ferretería El Tornillo' } })
    fireEvent.focus(inputClient)

    await waitFor(() => {
      expect(screen.getByText(/ID: 1001/i)).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText(/ID: 1001/i).closest('button'))

    // 2. Agregar Producto 1: Sinteplast ($1000, desc. marca 15% -> $850)
    const inputProduct = screen.getByPlaceholderText(/Buscar por descripción, marca o rubro del producto.../i)
    fireEvent.change(inputProduct, { target: { value: 'Látex Sinteplast' } })
    fireEvent.focus(inputProduct)

    await waitFor(() => {
      expect(screen.getByText(/Látex Sinteplast 20L/i)).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText(/Látex Sinteplast 20L/i).closest('button'))

    // Verificar badge de Descuento por Marca en la tabla
    await waitFor(() => {
      expect(screen.getByText(/🔒 Desc. Marca \(15%\)/i)).toBeInTheDocument()
    })

    // 3. Agregar Producto 2: Tersuave ($1000, sin desc. marca -> sujeto a desc. general)
    fireEvent.change(inputProduct, { target: { value: 'Esmalte Tersuave' } })
    fireEvent.focus(inputProduct)

    await waitFor(() => {
      expect(screen.getByText(/Esmalte Tersuave 4L/i)).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText(/Esmalte Tersuave 4L/i).closest('button'))

    // 4. Verificar que el descuento general del pedido esté fijo al 19% y bloqueado (readOnly / disabled)
    const inputDescGeneral = screen.getByDisplayValue('19')
    expect(inputDescGeneral).toHaveAttribute('readonly')
    expect(inputDescGeneral).toBeDisabled()

    // Validar subtotales y desgloses acumulativos:
    // Subtotal Bruto = $2.000
    // Descuento por Marca (Sinteplast 15% de $1.000) = -$150
    // Monto Desc. General (19% de $2.000) = -$380
    // Importe Neto Final = $2.000 - $150 - $380 = $1.470

    await waitFor(() => {
      expect(screen.getByText(/Subtotal Bruto/i)).toBeInTheDocument()
      expect(screen.getByText(/🔒 Desc. por Marca/i)).toBeInTheDocument()
      expect(screen.getAllByText(/150/).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/380/).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/1\.470/).length).toBeGreaterThan(0)
    })
  })
})
