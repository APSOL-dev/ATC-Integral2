import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import PedidoDetail from './PedidoDetail.jsx'

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/pedidos/90001', search: '', state: null }),
  useParams: () => ({ id: '90001' }),
  NavLink: ({ children }) => children
}))

// Mock de react-dom createPortal para JSDOM testing
vi.mock('react-dom', async (importOriginal) => {
  const original = await importOriginal()
  return {
    ...original,
    createPortal: (node) => node // Renderizar portal en línea en lugar de acoplar a document.body
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

const mockPedido0 = {
  IDPedido: '90001',
  Cliente: '1001',
  Nombre: 'Ferretería El Tornillo',
  Estado: '0', // Estado Borrador
  Total: 5000,
  Vendedor: '3',
  VendedorNombre: 'Vendedor 1',
  detalles: [
    { 'Codigo (más alla de si es item o nombre)': 'A01', 'Nombre (más alla de si es item o nombre)': 'Látex Interior 20L', 'Item  codigo': 'A01', 'Nombre item': 'Látex Interior 20L', Precio: 5000, Cantidad: 1, StockAvailable: 10 }
  ]
}

const mockPedido1 = {
  IDPedido: '90001',
  Cliente: '1001',
  Nombre: 'Ferretería El Tornillo',
  Estado: '1', // Estado Confirmado/Enviado
  Total: 5000,
  Vendedor: '3',
  VendedorNombre: 'Vendedor 1',
  detalles: [
    { 'Codigo (más alla de si es item o nombre)': 'A01', 'Nombre (más alla de si es item o nombre)': 'Látex Interior 20L', 'Item  codigo': 'A01', 'Nombre item': 'Látex Interior 20L', Precio: 5000, Cantidad: 1, StockAvailable: 10 }
  ]
}

let mockPedidosList = [mockPedido0]

vi.mock('../../context/DataContext.jsx', () => ({
  useData: () => ({
    pedidos: mockPedidosList,
    fetchPedidos: vi.fn(),
    setPedidos: vi.fn()
  })
}))

describe('PedidoDetail: Visibilidad de Aprobación, Edición y Borrado por Rol', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    global.fetch.mockReset()
    vi.spyOn(window, 'alert').mockImplementation(() => {})
  })

  it('Debería mostrar Editar, Pedirlo y Borrarlo al Vendedor Calle si el pedido está en estado 0', async () => {
    mockCurrentUser = {
      nombre: 'Vendedor 1',
      perfil: 'VendedorCalle',
      nroVendedor: '3',
      token: 'mock-jwt-token'
    }
    mockPedidosList = [mockPedido0]

    render(<PedidoDetail />)

    // En estado 0, el vendedor debe ver los 3 botones de acción
    expect(screen.getAllByRole('button', { name: /Editar/i })[0]).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Pedirlo/i })[0]).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Borrarlo/i })[0]).toBeInTheDocument()
  })

  it('Debería mostrar Editar, Pedirlo y Borrarlo al Super Vendedor si el pedido está en estado 0.0', async () => {
    mockCurrentUser = {
      nombre: 'Super Vendedor 1',
      perfil: 'SuperVendedor',
      token: 'mock-jwt-token'
    }
    const mockPedido00 = { ...mockPedido0, Estado: '0.0' }
    mockPedidosList = [mockPedido00]

    render(<PedidoDetail />)

    // En estado 0.0, el supervendedor debe ver los 3 botones (Editar, Pedirlo, Borrarlo)
    expect(screen.getAllByRole('button', { name: /Editar/i })[0]).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Pedirlo/i })[0]).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Borrarlo/i })[0]).toBeInTheDocument()
  })

  it('Debería poder hacer PATCH a estado 1 al hacer clic en Pedirlo y confirmar el modal', async () => {
    mockCurrentUser = {
      nombre: 'Vendedor 1',
      perfil: 'VendedorCalle',
      nroVendedor: '3',
      token: 'mock-jwt-token'
    }
    mockPedidosList = [mockPedido0]

    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: 'Estado actualizado' })
    })

    render(<PedidoDetail />)

    // Hacer clic en "Pedirlo"
    const btnPedirlo = screen.getAllByRole('button', { name: /Pedirlo/i })[0]
    fireEvent.click(btnPedirlo)

    // El modal de confirmación debe mostrarse con el texto de confirmación
    const btnConfirmar = screen.getByRole('button', { name: /Sí, Confirmar/i })
    fireEvent.click(btnConfirmar)

    // Verificar que se realice el PATCH al servidor
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/pedidos/90001/estado'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ estado: '1' })
        })
      )
    })
  })

  it('Debería mostrar "Enviando..." y deshabilitar el botón mientras la petición está en vuelo', async () => {
    mockCurrentUser = {
      nombre: 'Vendedor 1',
      perfil: 'VendedorCalle',
      nroVendedor: '3',
      token: 'mock-jwt-token'
    }
    mockPedidosList = [mockPedido0]

    let resolvePromise
    global.fetch.mockImplementation(() => new Promise((resolve) => {
      resolvePromise = resolve
    }))

    render(<PedidoDetail />)

    fireEvent.click(screen.getAllByRole('button', { name: /Pedirlo/i })[0])
    fireEvent.click(screen.getByRole('button', { name: /Sí, Confirmar/i }))

    // El botón debe estar deshabilitado y mostrar Enviando...
    const btnEnviando = screen.getAllByRole('button', { name: /Enviando.../i })[0]
    expect(btnEnviando).toBeDisabled()

    // Resolver la promesa limpiamente dentro de act
    await act(async () => {
      resolvePromise({ ok: true, json: () => Promise.resolve({ message: 'OK' }) })
    })
  })

  it('En caso de error del servidor, se mantiene el estado borrador y el botón se reactiva', async () => {
    mockCurrentUser = {
      nombre: 'Vendedor 1',
      perfil: 'VendedorCalle',
      nroVendedor: '3',
      token: 'mock-jwt-token'
    }
    mockPedidosList = [mockPedido0]

    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: 'Error en SQL' })
    })

    render(<PedidoDetail />)

    fireEvent.click(screen.getAllByRole('button', { name: /Pedirlo/i })[0])
    fireEvent.click(screen.getByRole('button', { name: /Sí, Confirmar/i }))

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('No se pudo cambiar el estado en el servidor'))
    })

    // El pedido permanece en estado 0 y los botones siguen disponibles y habilitados
    expect(screen.getAllByRole('button', { name: /Pedirlo/i })[0]).toBeEnabled()
    expect(screen.getAllByRole('button', { name: /Editar/i })[0]).toBeInTheDocument()
  })

  it('No debería mostrar ningún botón de acción (Editar, Pedirlo, Borrarlo) si el pedido ya está en estado 1', async () => {
    mockCurrentUser = {
      nombre: 'Vendedor 1',
      perfil: 'VendedorCalle',
      nroVendedor: '3',
      token: 'mock-jwt-token'
    }
    mockPedidosList = [mockPedido1] // Estado 1

    render(<PedidoDetail />)

    // Los botones de acción no deben renderizarse
    expect(screen.queryByRole('button', { name: /Editar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Pedirlo/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Borrarlo/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Anularlo/i })).not.toBeInTheDocument()
  })
})
