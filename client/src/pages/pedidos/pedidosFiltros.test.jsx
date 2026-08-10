import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import PedidosList from './PedidosList.jsx'

// Mock react-router-dom con soporte de estado real para useSearchParams
const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => {
  return {
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/pedidos', search: '', state: null }),
    useSearchParams: () => {
      const [params, setParams] = React.useState(new URLSearchParams())
      return [params, setParams]
    },
    NavLink: ({ children }) => children
  }
})

const mockUser = {
  nombre: 'Administrador',
  perfil: 'Administracion',
  nroVendedor: null
}

const mockPedidos = [
  {
    IDPedido: '90001',
    Cliente: 1001,
    Nombre: 'Ferretería El Tornillo',
    VendedorNombre: 'Vendedor 1',
    Vendedor: '3',
    'Fecha y hora': '2026-07-30T10:00:00',
    Estado: '0', // Presupuesto (budget)
    Total: 5000,
    detalles: []
  },
  {
    IDPedido: '90002',
    Cliente: 1002,
    Nombre: 'Constructora del Sol',
    VendedorNombre: 'Vendedor 2',
    Vendedor: '5',
    'Fecha y hora': '2026-07-28T12:00:00',
    Estado: '1', // Nuevo (new)
    Total: 15000,
    detalles: []
  },
  {
    IDPedido: '90003',
    Cliente: 1001,
    Nombre: 'Ferretería El Tornillo',
    VendedorNombre: 'Vendedor 1',
    Vendedor: '3',
    'Fecha y hora': '2026-07-25T14:30:00',
    Estado: '2', // Preparado (prepared)
    Total: 8000,
    detalles: []
  }
]

const mockClientes = [
  { NRO_CLIENTE: 1001, NOMBRE_CLIENTE: 'Ferretería El Tornillo', VENDEDOR: 'Vendedor 1' },
  { NRO_CLIENTE: 1002, NOMBRE_CLIENTE: 'Constructora del Sol', VENDEDOR: 'Vendedor 2' }
]

const mockVendedores = ['Vendedor 1', 'Vendedor 2']

vi.mock('../../context/AuthContext.jsx', () => ({
  useAuth: () => ({ user: mockUser })
}))

// Mock estático completo de DataContext usando state de React interno
vi.mock('../../context/DataContext.jsx', () => {
  return {
    useData: () => {
      const [activeTab, setActiveTab] = React.useState('Todos')
      const [filterID, setFilterID] = React.useState('')
      const [selectedCliente, setSelectedCliente] = React.useState(null)
      const [selectedVendedor, setSelectedVendedor] = React.useState(null)
      const [filterFechaDesde, setFilterFechaDesde] = React.useState('')
      const [filterFechaHasta, setFilterFechaHasta] = React.useState('')
      const [sortConfig, setSortConfig] = React.useState({ key: 'Fecha y hora', direction: 'desc' })
      const [currentPage, setCurrentPage] = React.useState(1)
      const [pageSize, setPageSize] = React.useState(40)

      return {
        pedidos: mockPedidos,
        clientes: mockClientes,
        vendedores: mockVendedores,
        loading: false,
        isRefreshing: false,
        fetchPedidos: vi.fn(),
        activeTab,
        setActiveTab,
        filterID,
        setFilterID,
        selectedCliente,
        setSelectedCliente,
        selectedVendedor,
        setSelectedVendedor,
        filterFechaDesde,
        setFilterFechaDesde,
        filterFechaHasta,
        setFilterFechaHasta,
        sortConfig,
        setSortConfig,
        currentPage,
        setCurrentPage,
        pageSize,
        setPageSize,
        resetPedidosFilters: vi.fn()
      }
    }
  }
})

describe('PedidosList: Filtros y Buscador', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('debería filtrar pedidos por ID o Nombre en el buscador', () => {
    render(<PedidosList />)

    // Por defecto se ven todos (usando prefijo '#')
    expect(screen.getByText('#90001')).toBeInTheDocument()
    expect(screen.getByText('#90002')).toBeInTheDocument()
    expect(screen.getByText('#90003')).toBeInTheDocument()

    // Filtrar por ID
    const searchIdInput = screen.getByPlaceholderText('Ej: 99...')
    fireEvent.change(searchIdInput, { target: { value: '90002' } })

    expect(screen.queryByText('#90001')).not.toBeInTheDocument()
    expect(screen.getByText('#90002')).toBeInTheDocument()
    expect(screen.queryByText('#90003')).not.toBeInTheDocument()
  })

  it('debería filtrar por estado al interactuar con las pestañas de estados (tabs)', () => {
    render(<PedidosList />)

    // Por defecto en "Todos" se ven todos los pedidos
    expect(screen.getByText('#90001')).toBeInTheDocument()
    expect(screen.getByText('#90002')).toBeInTheDocument()

    // Hacer clic en la pestaña "Presupuesto (0)"
    const tabPresupuesto = screen.getByRole('button', { name: /Presupuesto \(0\)/i })
    fireEvent.click(tabPresupuesto)

    // Solo se debe ver el pedido 90001 (estado 0)
    expect(screen.getByText('#90001')).toBeInTheDocument()
    expect(screen.queryByText('#90002')).not.toBeInTheDocument()
    expect(screen.queryByText('#90003')).not.toBeInTheDocument()
  })
})
