import '@testing-library/jest-dom'
import React from 'react'
import { vi } from 'vitest'

// Configurar variables de entorno mockeadas
vi.stubEnv('VITE_API_URL', 'http://localhost:3025/api')

// Mock de localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value) },
    removeItem: (key) => { delete store[key] },
    clear: () => { store = {} }
  }
})()
vi.stubGlobal('localStorage', localStorageMock)

// Mock global de fetch que devuelve una promesa resuelta por defecto para evitar errores de .then()
const fetchMock = vi.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([])
  })
)
vi.stubGlobal('fetch', fetchMock)

// Crear componente dummy para simular iconos de lucide-react
const createDummyIcon = (name) => {
  const component = (props) => {
    return React.createElement('span', {
      ...props,
      'data-testid': `icon-${name}`,
      className: props.className
    }, name)
  }
  component.displayName = name
  return component
}

// Lista completa y exhaustiva de iconos de lucide-react usados en el código
const UNIQUE_ICONS = [
  'Activity',      'AlertCircle',   'AlignLeft',       'ArrowDown',
  'ArrowLeft',     'ArrowRight',    'ArrowUp',         'ArrowUpDown',
  'Ban',           'BarChart2',     'BarChart3',       'Bell',
  'Building2',     'Calendar',      'Check',           'CheckCircle',
  'CheckCircle2',  'ChevronDown',   'ChevronLeft',     'ChevronRight',
  'ChevronUp',     'ClipboardList', 'Clock',           'CreditCard',
  'DollarSign',    'Download',      'Edit2',           'ExternalLink',
  'Eye',           'EyeOff',        'FileSpreadsheet', 'FileText',
  'Filter',        'Globe',         'Hash',            'Info',
  'Key',           'Layers',        'LayoutDashboard', 'LayoutGrid',
  'List',          'Loader2',       'Lock',            'LogIn',
  'LogOut',        'Mail',          'MapPin',          'Menu',
  'MessageSquare', 'Minus',         'MoreVertical',    'Package',
  'PackageCheck',  'Phone',         'Play',            'Plus',
  'Printer',       'RefreshCw',     'Save',            'Search',
  'Settings',      'Shield',        'ShieldAlert',     'ShoppingBag',
  'ShoppingCart',  'Tag',           'Trash2',          'TrendingDown',
  'TrendingUp',    'Truck',         'User',            'UserCheck',
  'UserPlus',      'Users',         'X'
]

const mockLucide = {
  __esModule: true
}
UNIQUE_ICONS.forEach(iconName => {
  mockLucide[iconName] = createDummyIcon(iconName)
})

vi.mock('lucide-react', () => mockLucide)

// Mock de librerías pesadas de PDF/Canvas que no necesitamos testear en componentes
vi.mock('jspdf', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      text: vi.fn(),
      save: vi.fn(),
      addImage: vi.fn()
    }))
  }
})

vi.mock('html2canvas', () => {
  return {
    default: vi.fn().mockResolvedValue(document.createElement('canvas'))
  }
})

vi.mock('html2pdf.js', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      from: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      save: vi.fn().mockResolvedValue(true)
    }))
  }
})
