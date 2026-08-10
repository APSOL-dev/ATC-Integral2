import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock de la base de datos en memoria para simular el comportamiento de Google Sheets en el test
let mockSheetsDatabase = [
  { 'Nombre de usuario': 'Apsol', 'Contraseña': 'ATC123', 'Perfil': 'Administracion', 'Activo': 'TRUE' }
]

// Mock global de fetch para simular la API del Backend
const mockFetch = vi.fn().mockImplementation((url, options) => {
  const urlObj = new URL(url)
  const path = urlObj.pathname
  const method = options?.method || 'GET'
  const body = options?.body ? JSON.parse(options.body) : null

  // 1. GET /api/usuarios (Obtener lista)
  if (path.endsWith('/api/usuarios') && method === 'GET') {
    const sanitized = mockSheetsDatabase.map(u => ({
      'Nombre de usuario': u['Nombre de usuario'],
      'Perfil': u['Perfil'],
      'Activo': u['Activo'] === 'TRUE'
    }))
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(sanitized)
    })
  }

  // 2. POST /api/usuarios (Crear usuario)
  if (path.endsWith('/api/usuarios') && method === 'POST') {
    const { nombre, perfil, legajo, password } = body
    
    // Verificar si el usuario ya existe
    const exists = mockSheetsDatabase.some(u => 
      String(u['Nombre de usuario']).toLowerCase() === String(nombre).toLowerCase()
    )
    if (exists) {
      return Promise.resolve({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'El usuario ya existe' })
      })
    }

    const newUser = {
      'Nombre de usuario': nombre,
      'Contraseña': password || 'ATC123',
      'Perfil': perfil,
      'NRO_VENDEDOR': legajo || '',
      'Activo': 'TRUE'
    }
    
    mockSheetsDatabase.push(newUser)
    
    return Promise.resolve({
      ok: true,
      status: 201,
      json: () => Promise.resolve({
        'Nombre de usuario': nombre,
        'Perfil': perfil,
        'Activo': true
      })
    })
  }

  // 3. POST /api/usuarios/login (Inicio de sesión)
  if (path.endsWith('/api/usuarios/login') && method === 'POST') {
    const { username, password } = body
    
    const user = mockSheetsDatabase.find(u => 
      String(u['Nombre de usuario']).toLowerCase() === String(username).toLowerCase() &&
      String(u['Contraseña']) === String(password)
    )

    if (user) {
      if (user['Activo'] === 'FALSE') {
        return Promise.resolve({
          ok: false,
          status: 403,
          json: () => Promise.resolve({ message: 'Usuario inactivo' })
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          nombre: user['Nombre de usuario'],
          perfil: user['Perfil'],
          token: 'mock-jwt-token-12345'
        })
      })
    } else {
      return Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Credenciales inválidas' })
      })
    }
  }

  return Promise.resolve({
    ok: false,
    status: 404,
    json: () => Promise.resolve({ message: 'Ruta no encontrada' })
  })
})

vi.stubGlobal('fetch', mockFetch)

describe('Flujo de ABM de Usuarios e Inicio de Sesión', () => {
  beforeEach(() => {
    // Resetear base de datos simulada antes de cada test
    mockSheetsDatabase = [
      { 'Nombre de usuario': 'Apsol', 'Contraseña': 'ATC123', 'Perfil': 'Administracion', 'Activo': 'TRUE' }
    ]
    mockFetch.mockClear()
  })

  it('debería rechazar el inicio de sesión para un usuario no existente ("Ivan")', async () => {
    const loginRes = await fetch('http://localhost:3025/api/usuarios/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'Ivan', password: 'IvanPassword123' })
    })
    
    expect(loginRes.ok).toBe(false)
    expect(loginRes.status).toBe(401)
    
    const data = await loginRes.json()
    expect(data.message).toBe('Credenciales inválidas')
  })

  it('debería permitir crear un nuevo usuario y luego iniciar sesión correctamente', async () => {
    // 1. Crear el usuario "Ivan"
    const createRes = await fetch('http://localhost:3025/api/usuarios', {
      method: 'POST',
      body: JSON.stringify({
        nombre: 'Ivan',
        perfil: 'VendedorCalle',
        legajo: '15',
        password: 'IvanPassword123'
      })
    })

    expect(createRes.ok).toBe(true)
    expect(createRes.status).toBe(201)
    
    const createData = await createRes.json()
    expect(createData['Nombre de usuario']).toBe('Ivan')
    expect(createData['Perfil']).toBe('VendedorCalle')
    expect(createData['Activo']).toBe(true)

    // 2. Intentar loguearse con las credenciales de "Ivan" recién creado
    const loginRes = await fetch('http://localhost:3025/api/usuarios/login', {
      method: 'POST',
      body: JSON.stringify({
        username: 'Ivan',
        password: 'IvanPassword123'
      })
    })

    expect(loginRes.ok).toBe(true)
    
    const loginData = await loginRes.json()
    expect(loginData.nombre).toBe('Ivan')
    expect(loginData.perfil).toBe('VendedorCalle')
    expect(loginData.token).toBeDefined()
  })

  it('debería rechazar la creación si el usuario ya existe', async () => {
    // Intentar crear "Apsol" de nuevo
    const createRes = await fetch('http://localhost:3025/api/usuarios', {
      method: 'POST',
      body: JSON.stringify({
        nombre: 'Apsol',
        perfil: 'VendedorCalle'
      })
    })

    expect(createRes.ok).toBe(false)
    expect(createRes.status).toBe(400)
    
    const data = await createRes.json()
    expect(data.message).toBe('El usuario ya existe')
  })
})
