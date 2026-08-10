// src/data/mock.js
// Datos de ejemplo para desarrollo del frontend sin backend

export const MOCK_USER = {
  id: 1,
  nombre: 'María González',
  email: 'admin@atodocolor.com',
  perfil: 'AdministracionA',
  nroVendedor: null,
}

// ── Estados ─────────────────────────────────────────────────────────────
export const ESTADOS_PEDIDO = {
  ANULADO:      { key: 'Anulado',      label: 'Anulado',       badge: 'anulado',     order: -1 },
  PENDIENTE:    { key: 'Pendiente',    label: 'Pendiente',     badge: 'pendiente',   order: 0  },
  APROBADO:     { key: 'Aprobado',     label: 'Aprobado',      badge: 'aprobado',    order: 1  },
  PREPARACION:  { key: 'En preparación', label: 'En preparación', badge: 'preparacion', order: 2 },
  PREPARADO:    { key: 'Preparado',    label: 'Preparado',     badge: 'preparado',   order: 3  },
  CARGADO:      { key: 'Cargado',      label: 'Cargado',       badge: 'cargado',     order: 4  },
  ENTREGADO:    { key: 'Entregado',    label: 'Entregado',     badge: 'entregado',   order: 5  },
  CERRADO:      { key: 'Cerrado',      label: 'Cerrado',       badge: 'cerrado',     order: 6  },
  PARCIAL:      { key: 'Envío parcial', label: 'Envío parcial', badge: 'parcial',    order: 3  },
}

// ── Clientes ─────────────────────────────────────────────────────────────
export const mockClientes = [
  { NRO_CLIENTE: 1001, NOMBRE_CLIENTE: 'Ferretería El Tornillo', CUIT: '20-12345678-9', SALDO: 45200, NRO_VENDEDOR: 3, VENDEDOR: 'Carlos Ruiz', DIREC: 'Av. San Martín 1234', LOCALIDAD: 'La Plata', PROVINCIA: 'Buenos Aires', TELE: '0221-4567890', SUC: 1 },
  { NRO_CLIENTE: 1002, NOMBRE_CLIENTE: 'Pinturas del Sur S.A.', CUIT: '30-23456789-0', SALDO: 128500, NRO_VENDEDOR: 3, VENDEDOR: 'Carlos Ruiz', DIREC: 'Calle 7 nro 890', LOCALIDAD: 'Quilmes', PROVINCIA: 'Buenos Aires', TELE: '011-42345678', SUC: 1 },
  { NRO_CLIENTE: 1003, NOMBRE_CLIENTE: 'Construcciones Ramírez', CUIT: '23-34567890-4', SALDO: 0, NRO_VENDEDOR: 5, VENDEDOR: 'Ana Flores', DIREC: 'Ruta 2 km 45', LOCALIDAD: 'Mar del Plata', PROVINCIA: 'Buenos Aires', TELE: '0223-5678901', SUC: 2 },
  { NRO_CLIENTE: 1004, NOMBRE_CLIENTE: 'Decoraciones Modernas', CUIT: '20-45678901-5', SALDO: 78900, NRO_VENDEDOR: 5, VENDEDOR: 'Ana Flores', DIREC: 'Lavalle 456', LOCALIDAD: 'Rosario', PROVINCIA: 'Santa Fe', TELE: '0341-6789012', SUC: 1 },
  { NRO_CLIENTE: 1005, NOMBRE_CLIENTE: 'Pinturería Central', CUIT: '30-56789012-6', SALDO: 215000, NRO_VENDEDOR: 3, VENDEDOR: 'Carlos Ruiz', DIREC: 'Belgrano 789', LOCALIDAD: 'Córdoba', PROVINCIA: 'Córdoba', TELE: '0351-7890123', SUC: 3 },
]

// ── Productos ─────────────────────────────────────────────────────────────
export const mockProductos = [
  { CODART: 10001, DESCRI: 'Látex Interior Blanco 20L', CC_CIVA: 4250, stock: 45, FAMILIA: 1, NombreFamilia: 'Látex', RUBRO: 10, NombreRubro: 'Interior', MARCA: 1, NombreMarca: 'Sinteplast', Embalaje: '4', Proveedor: 'Sinteplast SA' },
  { CODART: 10002, DESCRI: 'Látex Exterior Blanco Hueso 20L', CC_CIVA: 5100, stock: 32, FAMILIA: 1, NombreFamilia: 'Látex', RUBRO: 11, NombreRubro: 'Exterior', MARCA: 1, NombreMarca: 'Sinteplast', Embalaje: '4', Proveedor: 'Sinteplast SA' },
  { CODART: 10003, DESCRI: 'Esmalte Sintético Negro Mate 4L', CC_CIVA: 3200, stock: 18, FAMILIA: 2, NombreFamilia: 'Esmalte', RUBRO: 20, NombreRubro: 'Sintético', MARCA: 2, NombreMarca: 'Alba', Embalaje: '6', Proveedor: 'Alba SA' },
]

// ── Vendedores ──────────────────────────────────────────────────────────
export const mockVendedores = [
  { NRO_VENDEDOR: 3, NOMBRE: 'Carlos Ruiz', EMAIL: 'c.ruiz@atodocolor.com' },
  { NRO_VENDEDOR: 5, NOMBRE: 'Ana Flores', EMAIL: 'a.flores@atodocolor.com' },
  { NRO_VENDEDOR: 7, NOMBRE: 'Diego Sosa', EMAIL: 'd.sosa@atodocolor.com' },
]

// ── Pedidos ──────────────────────────────────────────────────────────────
export const mockPedidos = [
  {
    IDPedido: 2001,
    Cliente: 1001,
    NombreCliente: 'Ferretería El Tornillo',
    'Fecha y hora': '2026-05-07T09:30:00',
    Estado: '1.',
    'Emitido por': 'María González',
    Total: 42500,
    detalles: []
  }
]

// ── Pagos ────────────────────────────────────────────────────────────────
export const mockPagos = [
  { IDPago: 4001, Cliente: 1001, 'Nombre de usuario': 'María González', 'Fecha ingreso pago': '2026-05-05T10:00:00', Monto: 30000, Observaciones: 'Transferencia bancaria', Estado: 'Confirmado' },
  { IDPago: 4002, Cliente: 1002, 'Nombre de usuario': 'María González', 'Fecha ingreso pago': '2026-05-04T14:30:00', Monto: 100000, Observaciones: 'Cheque #123456', Estado: 'Confirmado' },
  { IDPago: 4003, Cliente: 1005, 'Nombre de usuario': 'Carlos Ruiz', 'Fecha ingreso pago': '2026-05-06T09:15:00', Monto: 215000, Observaciones: 'Efectivo', Estado: 'Confirmado' },
]

// ── Usuarios del sistema ─────────────────────────────────────────────────
export const mockUsuarios = [
  { id: 1, 'Nombre de usuario': 'María González', Email: 'admin@atodocolor.com', Perfil: 'AdministracionA', NRO_VENDEDOR: null },
  { id: 2, 'Nombre de usuario': 'Luis Pérez', Email: 'l.perez@atodocolor.com', Perfil: 'Administracion', NRO_VENDEDOR: null },
  { id: 3, 'Nombre de usuario': 'Carlos Ruiz', Email: 'c.ruiz@atodocolor.com', Perfil: 'VendedorCalle', NRO_VENDEDOR: 3 },
  { id: 4, 'Nombre de usuario': 'Ana Flores', Email: 'a.flores@atodocolor.com', Perfil: 'VendedorCalle', NRO_VENDEDOR: 5 },
  { id: 5, 'Nombre de usuario': 'Diego Sosa', Email: 'd.sosa@atodocolor.com', Perfil: 'SuperVendedor', NRO_VENDEDOR: 7 },
]

// ── Helpers ───────────────────────────────────────────────────────────────
export function calcTotal(detalles) {
  return detalles.reduce((sum, d) => {
    const sub = d.Precio * d.Cantidad
    const desc = sub * (d.Descuento || 0)
    return sum + (sub - desc)
  }, 0)
}

export function calcEstadoBadge(pedido) {
  if (!pedido) return 'new'
  const e = String(pedido.Estado || '').trim()
  if (e === '0.0') return 'budget_sys'
  if (e === '0.') return 'budget'
  if (e === '1.') return 'new'
  if (e === '1.1') return 'management'
  if (e === '2.') return 'prepared'
  if (e === '4.') return 'invoiced'
  if (e === '5.') return 'shipping'
  if (e === '6.') return 'finished'
  if (e === '99.') return 'anulado'
  return 'new'
}
