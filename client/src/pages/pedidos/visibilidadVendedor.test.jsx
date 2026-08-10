import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import PedidosList from './PedidosList.jsx'
import ClientesList from '../clientes/ClientesList.jsx'

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/atc', search: '', state: null }),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  NavLink: ({ children }) => children
}))

const mockPedidos = [
  {
    IDPedido: '90001',
    Cliente: 1001,
    Nombre: 'Ferretería El Tornillo',
    Vendedor: '3', // Asignado a Vendedor 3
    VendedorNombre: 'Juan Vendedor',
    'Fecha y hora': '2026-07-30T10:00:00',
    Estado: '0',
    Total: 5000,
    detalles: []
  },
  {
    IDPedido: '90002',
    Cliente: 1002,
    Nombre: 'Constructora del Sol',
    Vendedor: '5', // Asignado a Vendedor 5
    VendedorNombre: 'Carlos Vendedor',
    'Fecha y hora': '2026-07-28T12:00:00',
    Estado: '1',
    Total: 15000,
    detalles: []
  }
]

const mockClientes = [
  { NRO_CLIENTE: 1001, NOMBRE_CLIENTE: 'Ferretería El Tornillo', NRO_VENDEDOR: '3', VENDEDOR: 'Juan Vendedor' },
  { NRO_CLIENTE: 1002, NOMBRE_CLIENTE: 'Constructora del Sol', NRO_VENDEDOR: '5', VENDEDOR: 'Carlos Vendedor' }
]

const mockVendedores = ['Juan Vendedor', 'Carlos Vendedor']

let activeUser = {
  nombre: 'Juan Vendedor',
  perfil: 'VendedorCalle',
  nroVendedor: '3'
}

vi.mock('../../context/AuthContext.jsx', () => ({
  useAuth: () => ({ user: activeUser })
}))

// Mock estático de DataContext con soporte de hooks de estado internos
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

describe('Seguridad y Scoping: Restricción de Visibilidad por Vendedor', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  describe('Caso Vendedor Calle (Acceso restringido - Solo lo propio)', () => {
    beforeEach(() => {
      activeUser.nombre = 'Juan Vendedor'
      activeUser.perfil = 'VendedorCalle'
      activeUser.nroVendedor = '3'
    })

    it('Pedidos: Juan solo debe visualizar el pedido 90001 (suyo) y tener oculto el 90002 (ajeno)', () => {
      render(<PedidosList />)
      expect(screen.getByText('#90001')).toBeInTheDocument()
      expect(screen.queryByText('#90002')).not.toBeInTheDocument()
    })

    it('Clientes: Juan solo debe visualizar Ferretería El Tornillo (suyo) y tener oculto Constructora del Sol (ajeno)', () => {
      render(<ClientesList />)
      expect(screen.getByText('Ferretería El Tornillo')).toBeInTheDocument()
      expect(screen.queryByText('Constructora del Sol')).not.toBeInTheDocument()
    })
  })

  describe('Caso Depósito / Administración (Acceso global - Ve todo)', () => {
    beforeEach(() => {
      activeUser.nombre = 'Pedro Depósito'
      activeUser.perfil = 'Deposito'
      activeUser.nroVendedor = null
    })

    it('Pedidos: El personal de Depósito debe ver tanto el pedido 90001 como el 90002', () => {
      render(<PedidosList />)
      expect(screen.getByText('#90001')).toBeInTheDocument()
      expect(screen.getByText('#90002')).toBeInTheDocument()
    })

    it('Clientes: El personal de Depósito debe ver tanto Ferretería El Tornillo como Constructora del Sol', () => {
      render(<ClientesList />)
      expect(screen.getByText('Ferretería El Tornillo')).toBeInTheDocument()
      expect(screen.getByText('Constructora del Sol')).toBeInTheDocument()
    })
  })
})
