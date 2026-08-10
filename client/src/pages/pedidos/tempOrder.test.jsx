import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import PedidoDetail from './PedidoDetail.jsx'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/pedidos/temp-1722856000000', search: '', state: null }),
  useParams: () => ({ id: 'temp-1722856000000' }),
  NavLink: ({ children }) => children
}))

vi.mock('react-dom', async (importOriginal) => {
  const original = await importOriginal()
  return {
    ...original,
    createPortal: (node) => node
  }
})

let mockCurrentUser = {
  nombre: 'Vendedor 1',
  perfil: 'VendedorCalle',
  nroVendedor: '3',
  token: 'mock-jwt-token'
}

vi.mock('../../context/AuthContext.jsx', () => ({
  useAuth: () => ({ user: mockCurrentUser })
}))

const mockTempPedido = {
  IDPedido: 'temp-1722856000000',
  isOptimistic: true,
  Cliente: '1001',
  Nombre: 'Ferretería El Tornillo',
  Estado: '0',
  Total: 5000,
  Vendedor: '3',
  VendedorNombre: 'Vendedor 1',
  detalles: [
    { 'Codigo (más alla de si es item o nombre)': 'A01', 'Nombre (más alla de si es item o nombre)': 'Látex Interior 20L', Precio: 5000, Cantidad: 1, StockAvailable: 10 }
  ]
}

let mockPedidosList = [mockTempPedido]

vi.mock('../../context/DataContext.jsx', () => ({
  useData: () => ({
    pedidos: mockPedidosList,
    fetchPedidos: vi.fn(),
    setPedidos: vi.fn()
  })
}))

describe('PedidoDetail: Bloqueo de Pedidos Temporales (#temp...)', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    global.fetch.mockReset()
  })

  it('Deshabilita y muestra "Generando pedido..." en el botón Pedirlo mientras el pedido sea temporal', () => {
    render(<PedidoDetail />)

    // El botón debe estar deshabilitado y mostrar la leyenda Generando pedido...
    const btnAsignando = screen.getAllByRole('button', { name: /Generando pedido/i })[0]
    expect(btnAsignando).toBeDisabled()

    // Los botones de Editar y Borrarlo deben estar deshabilitados
    expect(screen.getAllByRole('button', { name: /Editar/i })[0]).toBeDisabled()
    expect(screen.getAllByRole('button', { name: /Borrarlo/i })[0]).toBeDisabled()

    // Intentar hacer clic no debe gatillar fetch PATCH
    fireEvent.click(btnAsignando)
    expect(global.fetch).not.toHaveBeenCalled()
  })
})
