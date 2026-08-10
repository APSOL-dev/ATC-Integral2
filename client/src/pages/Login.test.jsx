// client/src/pages/Login.test.jsx
// Tests del componente Login:
// - Renderizado del formulario
// - Flujo de login exitoso (redirige según perfil)
// - Manejo de credenciales incorrectas (muestra error)
// - Toggle de visibilidad de contraseña

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Login from './Login.jsx'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

let mockLoginFn = vi.fn()
vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({ login: mockLoginFn }),
}))

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('Login — Renderizado del formulario', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    mockLoginFn = vi.fn()
  })

  it('muestra el campo de usuario y el de contraseña', () => {
    render(<Login />)
    expect(screen.getByPlaceholderText('Ej. JuanPerez')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
  })

  it('muestra el botón "Iniciar Sesión"', () => {
    render(<Login />)
    expect(screen.getByRole('button', { name: /Iniciar Sesión/i })).toBeInTheDocument()
  })

  it('el campo de contraseña empieza como tipo "password" (oculto)', () => {
    render(<Login />)
    const passInput = screen.getByPlaceholderText('••••••••')
    expect(passInput.type).toBe('password')
  })

  it('el toggle de visibilidad cambia el tipo del campo de contraseña a "text"', () => {
    render(<Login />)
    const passInput = screen.getByPlaceholderText('••••••••')
    // El botón de toggle es el único button de tipo "button" en el formulario
    const toggleBtn = screen.getAllByRole('button').find(b => b.type === 'button')
    fireEvent.click(toggleBtn)
    expect(passInput.type).toBe('text')
    // Al hacer clic de nuevo, vuelve a password
    fireEvent.click(toggleBtn)
    expect(passInput.type).toBe('password')
  })
})

describe('Login — Flujo exitoso', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('admin redirige a /selector después de login exitoso', async () => {
    mockLoginFn = vi.fn().mockResolvedValue({
      nombre: 'AdminTest',
      perfil: 'Administracion',
      token: 'mock-token',
    })

    render(<Login />)

    fireEvent.change(screen.getByPlaceholderText('Ej. JuanPerez'), {
      target: { value: 'AdminTest' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'Admin123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/selector')
    })
  })

  it('vendedor redirige a "/" (dashboard) después de login exitoso', async () => {
    mockLoginFn = vi.fn().mockResolvedValue({
      nombre: 'VendedorTest',
      perfil: 'VendedorCalle',
      token: 'mock-token',
    })

    render(<Login />)

    fireEvent.change(screen.getByPlaceholderText('Ej. JuanPerez'), {
      target: { value: 'VendedorTest' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'pass123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })

  it('AdministracionA también redirige a /selector', async () => {
    mockLoginFn = vi.fn().mockResolvedValue({
      nombre: 'AdminFullTest',
      perfil: 'AdministracionA',
      token: 'mock-token',
    })

    render(<Login />)

    fireEvent.change(screen.getByPlaceholderText('Ej. JuanPerez'), {
      target: { value: 'AdminFullTest' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'pass' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/selector')
    })
  })
})

describe('Login — Manejo de errores', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('muestra el mensaje de error cuando login falla con credenciales inválidas', async () => {
    mockLoginFn = vi.fn().mockRejectedValue(new Error('Credenciales inválidas'))

    render(<Login />)

    fireEvent.change(screen.getByPlaceholderText('Ej. JuanPerez'), {
      target: { value: 'UserWrong' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'wrongpass' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }))

    await waitFor(() => {
      expect(screen.getByText('Credenciales inválidas')).toBeInTheDocument()
    })

    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('muestra mensaje de error genérico si el error no tiene mensaje', async () => {
    mockLoginFn = vi.fn().mockRejectedValue({})

    render(<Login />)

    fireEvent.change(screen.getByPlaceholderText('Ej. JuanPerez'), {
      target: { value: 'User' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'pass' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }))

    await waitFor(() => {
      expect(screen.getByText('Error al iniciar sesión')).toBeInTheDocument()
    })
  })

  it('no navega si el login falla', async () => {
    mockLoginFn = vi.fn().mockRejectedValue(new Error('Error de servidor'))

    render(<Login />)
    fireEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }))

    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })
})
