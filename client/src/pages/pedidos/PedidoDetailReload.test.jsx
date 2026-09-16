// client/src/pages/pedidos/PedidoDetailReload.test.jsx
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import PedidoDetail from './PedidoDetail.jsx'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/pedidos/11038500', search: '', state: null }),
  useParams: () => ({ id: '11038500' }),
  NavLink: ({ children }) => children,
}))

vi.mock('react-dom', async (importOriginal) => {
  const original = await importOriginal()
  return {
    ...original,
    createPortal: (node) => node,
  }
})

let mockCurrentUser = {
  nombre: 'AdminTest',
  perfil: 'Administracion',
  nroVendedor: null,
  token: 'mock-jwt-token',
}

vi.mock('../../context/AuthContext.jsx', () => ({
  useAuth: () => ({ user: mockCurrentUser }),
}))

let mockPedidos = [
  {
    IDPedido: '11038500',
    Cliente: '386',
    Nombre: 'VARONA GUSTAVO DANIEL',
    Estado: '99',
    Total: 25000,
    Vendedor: '50',
    VendedorNombre: 'LILIANA',
    detalles: [] // Initial state on reload (lightweight header)
  }
]

let mockHydrateDetails = vi.fn().mockImplementation(async (orderIds) => {
  // Simulate hydration returning details
  mockPedidos = [
    {
      IDPedido: '11038500',
      Cliente: '386',
      Nombre: 'VARONA GUSTAVO DANIEL',
      Estado: '99',
      Total: 25000,
      Vendedor: '50',
      VendedorNombre: 'LILIANA',
      detalles: [
        {
          'Codigo (más alla de si es item o nombre)': '1421',
          'Nombre (más alla de si es item o nombre)': 'LIJA GOLD EN SECO 150',
          'Item  codigo': '1421',
          'Nombre item': 'LIJA GOLD EN SECO 150',
          Precio: 2500,
          Cantidad: 10,
          StockAvailable: 15,
        }
      ]
    }
  ]
})

vi.mock('../../context/DataContext.jsx', () => ({
  useData: () => ({
    pedidos: mockPedidos,
    fetchPedidos: vi.fn(),
    setPedidos: vi.fn(),
    hydrateDetails: mockHydrateDetails,
    descuentosMarca: {},
  }),
}))

describe('PedidoDetail — Recarga de Página e Hidratación', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPedidos = [
      {
        IDPedido: '11038500',
        Cliente: '386',
        Nombre: 'VARONA GUSTAVO DANIEL',
        Estado: '99',
        Total: 25000,
        Vendedor: '50',
        VendedorNombre: 'LILIANA',
        detalles: []
      }
    ]
  })

  it('dispara hydrateDetails al detectar cabecera sin detalles e hidrata los artículos', async () => {
    render(<PedidoDetail />)

    // Should call hydrateDetails for '11038500'
    expect(mockHydrateDetails).toHaveBeenCalledWith(['11038500'])

    // Wait for item details to appear on screen
    await waitFor(() => {
      expect(screen.getByText(/LIJA GOLD EN SECO 150/i)).toBeInTheDocument()
    })
  })
})
