import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import EditPedidoModal from './EditPedidoModal.jsx'

// Mock react-dom createPortal for modal rendering in test environment
vi.mock('react-dom', () => ({
  createPortal: (node) => node
}))

const mockProducts = [
  {
    CODART: '1001',
    DESCRI: 'Producto Alfa',
    CC_CIVA: 1000,
    stock: 50,
    Proveedor: 'Marca A'
  },
  {
    CODART: '1002',
    DESCRI: 'Producto Beta',
    CC_CIVA: 2000,
    stock: 30,
    Proveedor: 'Marca B'
  },
  {
    CODART: '1003',
    DESCRI: 'Producto Gamma',
    CC_CIVA: 1500,
    stock: 20,
    Proveedor: 'Marca C'
  }
]

vi.mock('../../context/DataContext.jsx', () => ({
  useData: () => ({
    productos: mockProducts,
    descuentosMarca: []
  })
}))

describe('EditPedidoModal: Ingreso manual de cantidades y orden estático de filas', () => {
  const mockPedido = {
    IDPedido: '12345',
    Nombre: 'Cliente Test',
    'Lugar de entrega': 'Calle Falsa 123',
    Observaciones: 'Prueba',
    'Porcentaje de descuento (%)': 0,
    detalles: [
      {
        'Item  codigo': '1001',
        'Codigo (más alla de si es item o nombre)': '1001',
        'Nombre item': 'Producto Alfa',
        Precio: 1000,
        Cantidad: 2,
        StockAvailable: 50
      },
      {
        'Item  codigo': '1002',
        'Codigo (más alla de si es item o nombre)': '1002',
        'Nombre item': 'Producto Beta',
        Precio: 2000,
        Cantidad: 5,
        StockAvailable: 30
      }
    ]
  }

  it('debería permitir ingresar manualmente la cantidad y actualizar in-place sin mover la fila', () => {
    render(
      <EditPedidoModal
        pedido={mockPedido}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    )

    // Buscar los inputs de cantidad dentro de los renglones de la tabla
    const rowsBefore = screen.getAllByRole('row')
    expect(rowsBefore[1]).toHaveTextContent('Producto Alfa')
    expect(rowsBefore[2]).toHaveTextContent('Producto Beta')

    const qtyInput2 = rowsBefore[2].querySelector('input[type="number"]')
    expect(qtyInput2).toHaveValue(5)

    // Cambiar manualmente el valor de la cantidad del segundo producto directamente en la fila
    fireEvent.change(qtyInput2, { target: { value: '15' } })

    const rowsAfter = screen.getAllByRole('row')
    expect(rowsAfter[1]).toHaveTextContent('Producto Alfa')
    expect(rowsAfter[2]).toHaveTextContent('Producto Beta')
    expect(qtyInput2).toHaveValue(15)
  })

  it('debería posicionar al inicio de la tabla cuando se busca y agrega un producto existente desde la búsqueda', () => {
    render(
      <EditPedidoModal
        pedido={mockPedido}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    )

    // Buscar 'Producto Beta' en el buscador y hacer click para sumar 1 más
    const searchInput = screen.getByPlaceholderText(/descripción/i)
    fireEvent.change(searchInput, { target: { value: 'Beta' } })

    const betaOptions = screen.getAllByText('Producto Beta')
    fireEvent.click(betaOptions[0])

    // Al agregarlo desde la búsqueda, pasa al primer lugar (Fila 1)
    const rowsAfter = screen.getAllByRole('row')
    expect(rowsAfter[1]).toHaveTextContent('Producto Beta')
    expect(rowsAfter[2]).toHaveTextContent('Producto Alfa')

    const qtyInputBeta = rowsAfter[1].querySelector('input[type="number"]')
    expect(qtyInputBeta).toHaveValue(6)
  })

  it('debería posicionar al inicio de la tabla cuando se agrega un nuevo producto desde la búsqueda', () => {
    render(
      <EditPedidoModal
        pedido={mockPedido}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    )

    const searchInput = screen.getByPlaceholderText(/descripción/i)
    fireEvent.change(searchInput, { target: { value: 'Gamma' } })

    const gammaOption = screen.getByText('Producto Gamma')
    fireEvent.click(gammaOption)

    const rows = screen.getAllByRole('row')
    expect(rows[1]).toHaveTextContent('Producto Gamma')
    expect(rows[2]).toHaveTextContent('Producto Alfa')
    expect(rows[3]).toHaveTextContent('Producto Beta')
  })
})
