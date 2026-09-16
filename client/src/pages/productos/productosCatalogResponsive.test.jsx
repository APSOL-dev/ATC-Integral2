// client/src/pages/productos/productosCatalogResponsive.test.jsx
import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ProductosCatalog from './ProductosCatalog.jsx'

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/productos', search: '', state: null }),
  NavLink: ({ children }) => children,
}))

vi.mock('../../context/AuthContext.jsx', () => ({
  useAuth: () => ({ user: { nombre: 'AdminTest', perfil: 'Administracion' } }),
}))

const mockProductos = Array.from({ length: 150 }, (_, i) => ({
  CODART: String(i + 1),
  DESCRI: `Producto Test ${i + 1}`,
  CC_CIVA: 100,
  stock: 10,
  NombreMarca: 'MARCA TEST',
  NombreFamilia: 'FAMILIA TEST',
  NombreRubro: 'RUBRO TEST',
  Proveedor: 'PROVEEDOR TEST'
}))

vi.mock('../../context/DataContext.jsx', () => ({
  useData: () => ({
    productos: mockProductos,
    loading: false,
    descuentosMarca: {},
  }),
}))

describe('ProductosCatalog — 120 por página y Tabla Responsive', () => {
  it('inicializa el tamaño de página en 120 por defecto', () => {
    render(<ProductosCatalog />)
    const select = screen.getByRole('combobox')
    expect(select.value).toBe('120')
  })
})
