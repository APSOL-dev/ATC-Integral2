// src/utils/permisos.js

/**
 * Definición de perfiles y permisos del sistema ATC
 * 
 * - AdministracionA: Control total, gestión de usuarios, anulaciones y cierres.
 * - Administracion: Gestión operativa global, sin borrado/anulación crítica.
 * - Vendedor Calle: Gestión de pedidos propia. Solo ve sus clientes y sus pedidos.
 * - Super Vendedor: Vista global de clientes y pedidos, pero con permisos de vendedor.
 */
export const PERFILES = {
  AdministracionA: {
    label: 'Administración Full',
    sidebar: ['dashboard', 'pedidos', 'clientes', 'productos', 'presupuestos', 'pagos', 'saldos', 'usuarios', 'selector'],
    pedidos: { create: true, edit: true, delete: true, approve: true, close: true, anular: true, presupuesto: true },
    clientes: { read: true, edit: true },
    pagos: { read: true, create: true },
    usuarios: { read: true, edit: true },
    soloPropio: false,
  },
  Administracion: {
    label: 'Administración Operativa',
    sidebar: ['dashboard', 'pedidos', 'clientes', 'productos', 'presupuestos', 'pagos', 'saldos', 'usuarios', 'selector'],
    pedidos: { create: true, edit: true, delete: false, approve: true, close: true, anular: true, presupuesto: true },
    clientes: { read: true, edit: false },
    pagos: { read: true, create: true },
    usuarios: { read: true, edit: true },
    soloPropio: false,
  },
  VendedorCalle: {
    label: 'Vendedor de Calle',
    sidebar: ['dashboard', 'pedidos', 'clientes', 'productos', 'presupuestos'],
    pedidos: { create: true, edit: true, delete: true, approve: true, close: false, anular: false, presupuesto: false },
    clientes: { read: true },
    pagos: { read: false },
    usuarios: { read: false },
    soloPropio: true, // RESTRICCIÓN CLAVE: Solo ve sus propios datos
  },
  SuperVendedor: {
    label: 'Super Vendedor',
    sidebar: ['dashboard', 'pedidos', 'clientes', 'productos', 'presupuestos'],
    pedidos: { create: true, edit: true, delete: true, approve: true, close: false, anular: false, presupuesto: true },
    clientes: { read: true },
    pagos: { read: false },
    usuarios: { read: false },
    soloPropio: false, // DIFERENCIA CLAVE: Ve todos los clientes/pedidos del sistema
  },
  Deposito: {
    label: 'Depósito / Visualizador',
    sidebar: ['dashboard', 'pedidos', 'clientes', 'productos', 'presupuestos'],
    pedidos: { create: false, edit: false, delete: false, approve: false, close: false, anular: false, presupuesto: false },
    clientes: { read: true, edit: false },
    pagos: { read: false, create: false },
    usuarios: { read: false, edit: false },
    soloPropio: false,
  },
}

export function normalizePerfil(perfil) {
  if (!perfil) return 'VendedorCalle'
  const p = String(perfil).trim().toLowerCase()
  if (p === 'administración' || p === 'administracion' || p === 'administración operativa') return 'Administracion'
  if (p === 'administración full' || p === 'administraciona' || p === 'administrador' || p === 'admin') return 'AdministracionA'
  if (p === 'vendedor calle' || p === 'vendedorcalle' || p === 'vendedor de calle') return 'VendedorCalle'
  if (p === 'super vendedor' || p === 'supervendedor') return 'SuperVendedor'
  if (p === 'depósito' || p === 'deposito' || p === 'depósito / visualizador' || p === 'deposito / visualizador') return 'Deposito'
  return perfil
}

export function puedeDo(perfil, entidad, accion) {
  const norm = normalizePerfil(perfil)
  return PERFILES[norm]?.[entidad]?.[accion] === true
}

export function getSidebarItems(perfil) {
  const norm = normalizePerfil(perfil)
  return PERFILES[norm]?.sidebar || []
}
