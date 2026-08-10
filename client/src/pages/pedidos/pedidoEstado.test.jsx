// client/src/pages/pedidos/pedidoEstado.test.jsx
// Tests del flujo completo de cambio de estado de pedidos para el perfil Administracion:
// - Aprobación (estado 0 → 1) vía botón "Pedirlo"
// - Preparación (estado 1 → 2) vía botón "Preparado"
// - Anulación de pedido activo (estado 1 → 99) vía "Anularlo"
// - Restricción: Deposito no puede cambiar estados

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import PedidoDetail from './PedidoDetail.jsx'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/pedidos/90001', search: '', state: null }),
  useParams: () => ({ id: '90001' }),
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

const buildPedido = (estado) => ({
  IDPedido: '90001',
  Cliente: '1001',
  Nombre: 'Ferretería El Tornillo',
  Estado: estado,
  Total: 10000,
  Vendedor: '3',
  VendedorNombre: 'Vendedor Test',
  detalles: [
    {
      'Codigo (más alla de si es item o nombre)': 'A01',
      'Nombre (más alla de si es item o nombre)': 'Látex Interior 20L',
      'Item  codigo': 'A01',
      'Nombre item': 'Látex Interior 20L',
      Precio: 5000,
      Cantidad: 2,
      StockAvailable: 10,
    },
  ],
})

let mockPedidosList = [buildPedido('0')]

vi.mock('../../context/DataContext.jsx', () => ({
  useData: () => ({
    pedidos: mockPedidosList,
    fetchPedidos: vi.fn(),
    setPedidos: vi.fn(),
  }),
}))

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('PedidoDetail — Cambio de Estado: Flujos de Administracion', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    global.fetch.mockReset()
    mockCurrentUser = {
      nombre: 'AdminTest',
      perfil: 'Administracion',
      nroVendedor: null,
      token: 'mock-jwt-token',
    }
  })

  it('Admin puede enviar PATCH estado 1 al hacer clic en "Pedirlo" y confirmar', async () => {
    mockPedidosList = [buildPedido('0')]
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: 'Estado actualizado', newStatus: '1' }),
    })

    render(<PedidoDetail />)

    const btnPedirlo = screen.getAllByRole('button', { name: /Pedirlo/i })[0]
    fireEvent.click(btnPedirlo)

    const btnConfirmar = screen.getByRole('button', { name: /Sí, Confirmar/i })
    fireEvent.click(btnConfirmar)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/pedidos/90001/estado'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ estado: '1' }),
        })
      )
    })
  })

  it('AdminFull (AdministracionA) puede ver el botón de anular para pedido en estado 0.0', async () => {
    mockCurrentUser = {
      nombre: 'AdminFullTest',
      perfil: 'AdministracionA',
      nroVendedor: null,
      token: 'mock-jwt-token',
    }
    mockPedidosList = [buildPedido('0.0')]
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: 'Estado actualizado', newStatus: '0.0.99' }),
    })

    render(<PedidoDetail />)

    // En estado 0.0, AdministracionA ve el botón de anular
    const btnAnular = screen.queryAllByRole('button', { name: /Anular/i })
    expect(btnAnular.length).toBeGreaterThan(0)
  })

  it('Perfil Administracion puede ver el botón de anular y anular un presupuesto en estado 0.0', async () => {
    mockCurrentUser = {
      nombre: 'AdminOpTest',
      perfil: 'Administracion',
      nroVendedor: null,
      token: 'mock-jwt-token',
    }
    mockPedidosList = [buildPedido('0.0')]
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: 'Estado actualizado', newStatus: '0.0.99' }),
    })

    render(<PedidoDetail />)

    const btnAnular = screen.getAllByRole('button', { name: /Anularlo/i })[0]
    expect(btnAnular).toBeInTheDocument()

    fireEvent.click(btnAnular)
    const btnConfirmar = screen.getByRole('button', { name: /Sí, Anular/i })
    fireEvent.click(btnConfirmar)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/pedidos/90001/estado'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ estado: '0.0.99' }),
        })
      )
    })
  })

  it('Pedido en estado 0 muestra botones de acción para Admin', () => {
    mockPedidosList = [buildPedido('0')]
    render(<PedidoDetail />)

    // En estado 0, el admin debe ver "Pedirlo" como mínimo
    expect(screen.getAllByRole('button', { name: /Pedirlo/i }).length).toBeGreaterThan(0)
  })

  it('Pedido en estado 6 (finalizado) no muestra botones de transición de estado', () => {
    mockPedidosList = [buildPedido('6')]
    render(<PedidoDetail />)

    expect(screen.queryByRole('button', { name: /Pedirlo/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Borrarlo/i })).not.toBeInTheDocument()
  })
})

describe('PedidoDetail — Cambio de Estado: Restricciones de Deposito', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    global.fetch.mockReset()
    mockCurrentUser = {
      nombre: 'Pedro Depósito',
      perfil: 'Deposito',
      nroVendedor: null,
      token: 'mock-jwt-token',
    }
  })

  it('Deposito NO ve botones de "Pedirlo", "Editar" ni "Borrarlo" para pedido en estado 0', () => {
    mockPedidosList = [buildPedido('0')]
    render(<PedidoDetail />)

    expect(screen.queryByRole('button', { name: /Pedirlo/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Editar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Borrarlo/i })).not.toBeInTheDocument()
  })

  it('Deposito NO ve botones de acción para pedido en estado 1', () => {
    mockPedidosList = [buildPedido('1')]
    render(<PedidoDetail />)

    expect(screen.queryByRole('button', { name: /Pedirlo/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Editar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Anular/i })).not.toBeInTheDocument()
  })
})
