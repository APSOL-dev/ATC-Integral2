import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Usuarios from './Usuarios.jsx'

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/admin/usuarios', search: '', state: null }),
  NavLink: ({ children }) => children
}))

const mockCurrentUser = {
  nombre: 'admin',
  perfil: 'Administracion',
  token: 'mock-jwt-token'
}

const mockUsuariosInitial = [
  {
    id: 'ivan-id',
    'Nombre de usuario': 'Ivan',
    'Perfil': 'Administracion',
    'NRO_VENDEDOR': null,
    'Activo': true
  },
  {
    id: 'vendedor-1-id',
    'Nombre de usuario': 'Vendedor 1',
    'Perfil': 'VendedorCalle',
    'NRO_VENDEDOR': '3',
    'Activo': true
  }
]

vi.mock('../../context/AuthContext.jsx', () => ({
  useAuth: () => ({ user: mockCurrentUser })
}))

// Mock de DataContext
let mockUsuariosList = [...mockUsuariosInitial]
const setUsuariosMock = vi.fn((val) => { mockUsuariosList = val })

vi.mock('../../context/DataContext.jsx', () => ({
  useData: () => ({
    usuarios: mockUsuariosList,
    loading: false,
    setUsuarios: setUsuariosMock
  })
}))

describe('Usuarios Admin Page: Test Integrado (ABM)', () => {
  let alertSpy

  beforeEach(() => {
    mockUsuariosList = [...mockUsuariosInitial]
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    // Resetear el mock global de fetch
    global.fetch.mockReset()
  })

  afterEach(() => {
    alertSpy.mockRestore()
  })

  it('Happy Path: debería listar los usuarios iniciales y crear un nuevo usuario exitosamente', async () => {
    // Configurar comportamiento del mock global de fetch directamente sin spyOn
    global.fetch.mockImplementation((url, options) => {
      // 1. Alta de usuario (POST)
      if (options?.method === 'POST') {
        const body = JSON.parse(options.body)
        mockUsuariosList = [
          ...mockUsuariosList,
          {
            id: `${body.nombre}-id`,
            'Nombre de usuario': body.nombre,
            'Perfil': body.perfil,
            'NRO_VENDEDOR': body.legajo || null,
            'Activo': true
          }
        ]
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Usuario creado' })
        })
      }
      // 2. Recarga de la lista (GET)
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockUsuariosList)
      })
    })

    render(<Usuarios />)

    // Verificar renderizado inicial
    expect(screen.getByText('Ivan')).toBeInTheDocument()
    expect(screen.getByText('Vendedor 1')).toBeInTheDocument()

    // Abrir Modal de Alta
    const btnAlta = screen.getByRole('button', { name: /Alta de Usuario/i })
    fireEvent.click(btnAlta)

    // Rellenar formulario
    const inputNombre = screen.getByPlaceholderText('Ej. Juan Pérez')
    const inputLegajo = screen.getByPlaceholderText('Ej. 1234')
    const inputPassword = screen.getByPlaceholderText('******')

    fireEvent.change(inputNombre, { target: { value: 'Juan Perez' } })
    fireEvent.change(inputLegajo, { target: { value: '999' } })
    fireEvent.change(inputPassword, { target: { value: 'Contrasena123' } })

    // Enviar formulario
    const btnGuardar = screen.getByRole('button', { name: /Guardar Cambios/i })
    fireEvent.click(btnGuardar)

    // Esperar a que el usuario se agregue al DOM tras la recarga exitosa
    await waitFor(() => {
      expect(screen.getByText('Juan Perez')).toBeInTheDocument()
    })

    // Verificar que el POST se realizó con los parámetros esperados
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/usuarios'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          nombre: 'Juan Perez',
          perfil: 'VendedorCalle',
          legajo: '999',
          password: 'Contrasena123'
        })
      })
    )
  })

  it('Caso Borde: debería alertar de error si el nombre de usuario está duplicado', async () => {
    // Configurar comportamiento del mock global de fetch para fallar con 400 Bad Request
    global.fetch.mockImplementation((url, options) => {
      if (options?.method === 'POST') {
        return Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ message: 'El nombre de usuario ya está registrado' })
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockUsuariosList)
      })
    })

    render(<Usuarios />)

    // Abrir Modal de Alta
    const btnAlta = screen.getByRole('button', { name: /Alta de Usuario/i })
    fireEvent.click(btnAlta)

    // Rellenar nombre ya existente
    const inputNombre = screen.getByPlaceholderText('Ej. Juan Pérez')
    fireEvent.change(inputNombre, { target: { value: 'Ivan' } })

    const inputPassword = screen.getByPlaceholderText('******')
    fireEvent.change(inputPassword, { target: { value: 'ClaveSegura123' } })

    // Enviar
    const btnGuardar = screen.getByRole('button', { name: /Guardar Cambios/i })
    fireEvent.click(btnGuardar)

    // Validar que se muestre la alerta del navegador con el mensaje de error de la API
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('El nombre de usuario ya está registrado')
    })
  })
})
