// client/src/pages/pedidos/pedidoClienteNum.test.jsx
import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import PedidoDetail from './PedidoDetail.jsx'

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/pedidos/110385', search: '', state: null }),
  useParams: () => ({ id: '110385' }),
  NavLink: ({ children }) => children,
}))

vi.mock('react-dom', async (importOriginal) => {
  const original = await importOriginal()
  return {
    ...original,
    createPortal: (node) => node,
  }
})

vi.mock('../../context/AuthContext.jsx', () => ({
  useAuth: () => ({ user: { nombre: 'AdminTest', perfil: 'Administracion' } }),
}))

const mockPedido = {
  IDPedido: '110385',
  Cliente: '386',
  Nombre: 'VARONA GUSTAVO DANIEL',
  Estado: '1',
  Total: 5000,
  Vendedor: '50',
  detalles: [
    {
      'Codigo (más alla de si es item o nombre)': '1421',
      'Nombre (más alla de si es item o nombre)': 'LIJA GOLD',
      Precio: 500,
      Cantidad: 10,
    }
  ]
}

vi.mock('../../context/DataContext.jsx', () => ({
  useData: () => ({
    pedidos: [mockPedido],
    fetchPedidos: vi.fn(),
    setPedidos: vi.fn(),
    hydrateDetails: vi.fn(),
    fetchPedidoById: vi.fn(),
    descuentosMarca: {},
  }),
}))

describe('PedidoDetail — Número de Cliente', () => {
  it('muestra el número de cliente (Nº 386) en el detalle del pedido', () => {
    render(<PedidoDetail />)
    expect(screen.getAllByText(/Nº 386/i).length).toBeGreaterThan(0)
  })
})
