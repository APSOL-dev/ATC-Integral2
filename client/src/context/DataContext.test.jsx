// client/src/context/DataContext.test.jsx
import React from 'react'
import { render, screen, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DataProvider, useData } from './DataContext.jsx'

// Mock react-router-dom's useLocation
vi.mock('react-router-dom', () => ({
  useLocation: () => ({
    pathname: '/pedidos',
    search: '',
    state: null
  })
}))

// Mock localStorage to return a mock user with token
const mockUser = {
  nombre: 'AdminTest',
  perfil: 'Administracion',
  nroVendedor: null,
  token: 'mock-jwt-token'
}

describe('DataContext - Sincronización de pedidos y mezcla de detalles', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => {
        if (key === 'atc_user') return JSON.stringify(mockUser)
        return null
      }),
      setItem: vi.fn(),
      removeItem: vi.fn()
    })
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('debería mantener los detalles existentes al sincronizar/refrescar los pedidos', async () => {
    let fetchCount = 0
    global.fetch.mockImplementation((url) => {
      if (url.includes('/pedidos')) {
        fetchCount++
        if (fetchCount === 1) {
          // Carga inicial
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve([
              { IDPedido: '90001', Cliente: '1001', Total: 10000, detalles: [{ Codigo: 'A01', Cantidad: 2 }] }
            ])
          })
        } else {
          // Carga de sincronización (siguiente poll o force sync)
          // El backend devuelve los pedidos SIN detalles
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve([
              { IDPedido: '90001', Cliente: '1001', Total: 10000 } // Sin detalles!
            ])
          })
        }
      }
      
      // Mocks para clientes, productos, usuarios
      if (url.includes('/clientes') || url.includes('/productos') || url.includes('/usuarios')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([])
        })
      }

      return Promise.reject(new Error('Unknown url: ' + url))
    })

    // Componente de prueba para consumir el contexto y exponer las acciones
    let dataContextValue = null
    function TestComponent() {
      dataContextValue = useData()
      return (
        <div>
          <span data-testid="ready">{dataContextValue.isReady ? 'yes' : 'no'}</span>
          <span data-testid="pedidos-count">{dataContextValue.pedidos.length}</span>
          <span data-testid="has-details">
            {dataContextValue.pedidos[0]?.detalles ? 'yes' : 'no'}
          </span>
        </div>
      )
    }

    // Renderizar
    render(
      <DataProvider>
        <TestComponent />
      </DataProvider>
    )

    // Esperar a que se realice la primera carga inicial
    await waitFor(() => {
      expect(screen.getByTestId('ready').textContent).toBe('yes')
    })

    expect(screen.getByTestId('pedidos-count').textContent).toBe('1')
    expect(screen.getByTestId('has-details').textContent).toBe('yes')

    // Disparar sincronización manual de pedidos (force = true)
    await act(async () => {
      await dataContextValue.fetchPedidos(false, true)
    })

    // El test debería fallar en el estado RED actual porque se reemplaza la lista directamente
    expect(screen.getByTestId('has-details').textContent).toBe('yes')
  })
})
