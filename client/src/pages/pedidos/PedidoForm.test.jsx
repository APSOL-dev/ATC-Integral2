import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import PedidoForm from './PedidoForm.jsx'

// Mock react-router-dom
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
    LOCALIDAD: 'La Plata', 
    VENDEDOR: 'Vendedor 1', 
    NRO_VENDEDOR: '3' // Asignado a Vendedor 3 (user.nroVendedor)
  }
]

const mockProductos = [
  {
    CODART: '10001',
    CODIGO: '10001',
    DESCRI: 'Látex Interior Blanco 20L',
    DESCRIPCION: 'Látex Interior Blanco 20L',
    CC_CIVA: 4250,
    stock: 45,
    Proveedor: 'Sinteplast SA'
  },
  {
    CODART: '10002',
    CODIGO: '10002',
    DESCRI: 'Esmalte Sintético 4L',
    DESCRIPCION: 'Esmalte Sintético 4L',
    CC_CIVA: 1500,
    stock: 20,
    Proveedor: 'Alba SA'
  }
]

vi.mock('../../context/AuthContext.jsx', () => ({
  useAuth: () => ({ user: mockUser })
}))

// Mock de DataContext
vi.mock('../../context/DataContext.jsx', () => ({
  useData: () => ({
    clientes: mockClientes,
    productos: mockProductos,
    loading: false,
    setPedidos: vi.fn(),
    fetchPedidos: vi.fn()
  })
}))

describe('PedidoForm: Creación de Pedidos, Cálculos y Envío', () => {
  let alertSpy

  beforeEach(() => {
    mockNavigate.mockClear()
    global.fetch.mockReset()
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
  })

  afterEach(() => {
    alertSpy.mockRestore()
  })

  it('Happy Path: debería cargar cliente, agregar producto, calcular subtotales/descuentos y enviar el pedido', async () => {
    // Mock de respuesta para la creación del pedido (POST)
    global.fetch.mockImplementation((url, options) => {
      if (options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ IDPedido: '99999' })
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    })

    render(<PedidoForm />)

    // 1. Verificar que el botón de Generar Pedido esté deshabilitado inicialmente (Caso Borde: sin productos)
    const btnSubmit = screen.getByRole('button', { name: /Generar Pedido/i })
    expect(btnSubmit).toBeDisabled()

    // 2. Buscar y seleccionar cliente
    const clientInput = screen.getByPlaceholderText('Buscar por nombre o número de cliente...')
    fireEvent.change(clientInput, { target: { value: 'Ferretería' } })
    
    // Seleccionar cliente en el dropdown
    const clientOption = screen.getByText('Ferretería El Tornillo')
    fireEvent.click(clientOption)

    // 3. Buscar y agregar producto
    const productInput = screen.getByPlaceholderText('Código o descripción del producto...')
    fireEvent.change(productInput, { target: { value: 'Látex' } })
    
    // Seleccionar producto en el dropdown
    const productOption = screen.getByText('Látex Interior Blanco 20L')
    fireEvent.click(productOption)

    // Al agregar el producto, el botón de enviar debe habilitarse
    expect(btnSubmit).toBeEnabled()

    // Verificar que el subtotal inicial sea de $4.250
    expect(screen.getAllByText(/4\.250/).length).toBeGreaterThan(0)

    // 4. Cambiar cantidad a 2 unidades (primer spinbutton del formulario es el de cantidad del ítem)
    const qtyInput = screen.getAllByRole('spinbutton')[0]
    fireEvent.change(qtyInput, { target: { value: '2' } })

    // El subtotal por fila debe actualizarse a $8.500
    expect(screen.getAllByText(/8\.500/).length).toBeGreaterThan(0)

    // 5. Aplicar un descuento del 10%
    const discountInput = screen.getByPlaceholderText('0')
    fireEvent.change(discountInput, { target: { value: '10' } })

    // Validar monto de descuento final (-$850) e Importe Neto Final ($7.650) en el DOM
    expect(screen.getAllByText(/-.*850/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/7\.650/).length).toBeGreaterThan(0)

    // 6. Enviar Formulario
    fireEvent.click(btnSubmit)

    // Debe redireccionar instantáneamente
    expect(mockNavigate).toHaveBeenCalledWith('/pedidos')

    // Esperar a que la petición fetch sea llamada en segundo plano
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/pedidos'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"Porcentaje de descuento (%)":10')
        })
      )
    })
  })

  it('Debería ordenar los productos agregados situando el más reciente al principio de la tabla', () => {
    render(<PedidoForm />)

    const productInput = screen.getByPlaceholderText('Código o descripción del producto...')
    
    // 1. Agregar Producto 1 (Látex)
    fireEvent.change(productInput, { target: { value: 'Látex' } })
    fireEvent.click(screen.getByText('Látex Interior Blanco 20L'))

    // 2. Agregar Producto 2 (Esmalte)
    fireEvent.change(productInput, { target: { value: 'Esmalte' } })
    fireEvent.click(screen.getByText('Esmalte Sintético 4L'))

    // En la tabla de items, el primer producto mostrado (fila 0) debe ser Esmalte Sintético (el más reciente)
    let rowElements = screen.getAllByText(/SKU:/i).map(el => el.closest('tr'))
    expect(rowElements[0]).toHaveTextContent('Esmalte Sintético 4L')
    expect(rowElements[1]).toHaveTextContent('Látex Interior Blanco 20L')

    // 3. Volver a seleccionar Producto 1 desde el buscador
    fireEvent.change(productInput, { target: { value: 'Látex' } })
    fireEvent.click(screen.getAllByText('Látex Interior Blanco 20L')[0])

    // Producto 1 (Látex) vuelve a pasar al primer lugar
    rowElements = screen.getAllByText(/SKU:/i).map(el => el.closest('tr'))
    expect(rowElements[0]).toHaveTextContent('Látex Interior Blanco 20L')
    expect(rowElements[1]).toHaveTextContent('Esmalte Sintético 4L')
  })

  it('Caso Borde: debería alertar de error si intenta enviar sin cliente seleccionado', async () => {
    render(<PedidoForm />)

    // Agregar producto sin buscar ni seleccionar cliente
    const productInput = screen.getByPlaceholderText('Código o descripción del producto...')
    fireEvent.change(productInput, { target: { value: 'Látex' } })
    const productOption = screen.getByText('Látex Interior Blanco 20L')
    fireEvent.click(productOption)

    // El botón de enviar debe estar habilitado al tener productos
    const btnSubmit = screen.getByRole('button', { name: /Generar Pedido/i })
    expect(btnSubmit).toBeEnabled()

    // Intentar enviar el formulario
    fireEvent.click(btnSubmit)

    // Verificar que muestre la alerta solicitando seleccionar cliente
    expect(alertSpy).toHaveBeenCalledWith('Seleccione un cliente')
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('Caso Borde: debería enviar el pedido con descuento 0 si el input de descuento se deja vacío', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ IDPedido: '88888' })
    })

    render(<PedidoForm />)

    // Seleccionar cliente
    const clientInput = screen.getByPlaceholderText('Buscar por nombre o número de cliente...')
    fireEvent.change(clientInput, { target: { value: 'Ferretería' } })
    const clientOption = screen.getByText('Ferretería El Tornillo')
    fireEvent.click(clientOption)

    // Agregar producto
    const productInput = screen.getByPlaceholderText('Código o descripción del producto...')
    fireEvent.change(productInput, { target: { value: 'Látex' } })
    const productOption = screen.getByText('Látex Interior Blanco 20L')
    fireEvent.click(productOption)

    // Dejar descuento vacío/vaciarlo
    const discountInput = screen.getByPlaceholderText('0')
    fireEvent.change(discountInput, { target: { value: '' } })

    // Enviar
    const btnSubmit = screen.getByRole('button', { name: /Generar Pedido/i })
    fireEvent.click(btnSubmit)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/pedidos'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"Porcentaje de descuento (%)":0')
        })
      )
    })
  })
})
