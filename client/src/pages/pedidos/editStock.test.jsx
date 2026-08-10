import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import EditPedidoModal from './EditPedidoModal.jsx'

// Mock de react-dom para usar createPortal en tests
vi.mock('react-dom', () => ({
  createPortal: (node) => node
}))

const mockProducts = [
  {
    CODART: '10001',
    DESCRI: 'Látex Interior Blanco 20L',
    CC_CIVA: 4250,
    stock: 45,
    Proveedor: 'Sinteplast SA'
  },
  {
    CODART: '10002',
    DESCRI: 'Esmalte Sintético 1L',
    CC_CIVA: 1500,
    stock: 0,
    Proveedor: 'Sinteplast SA'
  }
]

// Mock de DataContext
vi.mock('../../context/DataContext.jsx', () => ({
  useData: () => ({
    productos: mockProducts
  })
}))

describe('EditPedidoModal: Visualización y Colores del Stock de Productos', () => {
  const mockPedido = {
    IDPedido: '99999',
    Nombre: 'Ferretería El Tornillo',
    'Lugar de entrega': 'Av. 7 1234',
    Observaciones: 'Entregar por la tarde',
    'Porcentaje de descuento (%)': 5,
    detalles: [] // Inicialmente vacío
  }

  it('debería mostrar el stock con colores verde (positivo) y rojo (cero/sin stock) en el buscador y en la tabla', () => {
    const handleClose = vi.fn()
    const handleSave = vi.fn()

    render(
      <EditPedidoModal
        pedido={mockPedido}
        onClose={handleClose}
        onSave={handleSave}
      />
    )

    const searchInput = screen.getByPlaceholderText(/Buscar por código o descripción/i)

    // === PROBAR PRODUCTO CON STOCK POSITIVO (45) ===
    fireEvent.change(searchInput, { target: { value: 'Látex' } })
    
    // Verificar buscador
    const dropdownStockGreen = screen.getByText('Stock: 45')
    expect(dropdownStockGreen).toBeInTheDocument()
    expect(dropdownStockGreen.className).toContain('text-emerald-700')

    // Agregar producto
    const itemGreen = screen.getByText('Látex Interior Blanco 20L')
    fireEvent.click(itemGreen)

    // Verificar en tabla de edición
    const tableStockGreen = screen.getAllByText('Stock: 45').find(el => el.closest('tr'))
    expect(tableStockGreen).toBeDefined()
    expect(tableStockGreen.className).toContain('text-emerald-700')

    // === PROBAR PRODUCTO CON STOCK CERO ===
    fireEvent.change(searchInput, { target: { value: 'Esmalte' } })

    // Verificar buscador
    const dropdownStockRed = screen.getByText('Stock: 0')
    expect(dropdownStockRed).toBeInTheDocument()
    expect(dropdownStockRed.className).toContain('text-red-600')

    // Agregar producto
    const itemRed = screen.getByText('Esmalte Sintético 1L')
    fireEvent.click(itemRed)

    // Verificar en tabla de edición
    const tableStockRed = screen.getAllByText('Stock: 0').find(el => el.closest('tr'))
    expect(tableStockRed).toBeDefined()
    expect(tableStockRed.className).toContain('text-red-600')
  })

  it('debería actualizar el stock disponible con los datos actuales del catálogo cuando se ingresa a editar un pedido 0.0 cuyos detalles tenían stock en 0', () => {
    const mockPedido00 = {
      IDPedido: '88888',
      Estado: '0.0',
      Nombre: 'Pinturas San Justo',
      detalles: [
        {
          'Item  codigo': '10001',
          'Codigo (más alla de si es item o nombre)': '10001',
          'Nombre item': 'Látex Interior Blanco 20L',
          Precio: 4250,
          Cantidad: 2,
          StockAvailable: 0, // En la base estaba en 0 o desactualizado
          'Stock al momento de cargar': 0
        }
      ]
    }

    render(
      <EditPedidoModal
        pedido={mockPedido00}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    )

    // El componente debe cruzar con mockProducts (stock: 45) y mostrar 45 en lugar de 0
    const tableStockLive = screen.getByText('Stock: 45')
    expect(tableStockLive).toBeInTheDocument()
    expect(tableStockLive.className).toContain('text-emerald-700')
  })
})
