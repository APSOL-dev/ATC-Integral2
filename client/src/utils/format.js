// src/utils/format.js

export function parseDate(value) {
  if (!value) return null
  if (value instanceof Date) return value
  
  const s = String(value).trim()
  if (!s) return null

  // If string comes from Supabase/Postgres with +00 or +00:00 offset on local timestamp:
  // e.g. "2026-08-11 11:23:48+00" or "2026-08-11T11:23:48+00"
  if (/[\sT]\d{2}:\d{2}:\d{2}\+00(?::00)?$/i.test(s)) {
    const cleanStr = s.replace(/\+00(?::00)?$/i, '').trim()
    const isoMatch = cleanStr.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{1,2}):(\d{2}):(\d{2})/)
    if (isoMatch) {
      const [_, y, m, d, h, min, sec] = isoMatch
      const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d), parseInt(h), parseInt(min), parseInt(sec))
      if (!isNaN(date)) return date
    }
  }

  // Latin format (DD/MM/YYYY)
  const latinMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/)
  if (latinMatch) {
    const [_, d, m, y, h = '0', min = '0', sec = '0'] = latinMatch
    const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d), parseInt(h), parseInt(min), parseInt(sec))
    if (!isNaN(date)) return date
  }

  // ISO format (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return new Date(s)

  const d = new Date(s)
  return isNaN(d) ? null : d
}

export function parseCurrency(value) {
  if (value == null || value === '') return 0
  if (typeof value === 'number') return value
  const num = parseFloat(String(value).replace(/\./g, '').replace(',', '.'))
  return isNaN(num) ? 0 : num
}

export function formatCurrency(value) {
  const num = parseCurrency(value)
  if (num === 0 && (value == null || value === '')) return '—'

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

/**
 * Calcula el estado de un pedido basado en sus columnas de proceso
 */
export function calcEstadoBadge(pedido) {
  if (!pedido) return 'pendiente';
  
  // Mapeo directo del campo 'Estado'
  const e = String(pedido.Estado || '').trim();
  if (e === '0.0') return 'budget_sys';
  if (e === '0.0.99') return 'budget_anul';
  if (e === '0.' || e === '0') return 'budget';
  if (e === '1.' || e === '1') return 'new';
  if (e === '1.1') return 'management';
  if (e === '2.' || e === '2') return 'prepared';
  if (e === '4.' || e === '4') return 'invoiced';
  if (e === '5.' || e === '5') return 'shipping';
  if (e === '6.' || e === '6') return 'finished';
  if (e === '99.' || e === '99') return 'anulado';

  const isTrue = (val) => val === 'TRUE' || val === true || val === 'checked';

  if (isTrue(pedido.Anulado) || e === '99.') return 'anulado';
  if (isTrue(pedido.Entregado) || e === '6.') return 'finished';
  if (isTrue(pedido.Cargado) || e === '5.') return 'shipping';
  if (isTrue(pedido.Completo) || isTrue(pedido['Preparación terminada?']) || e === '2.') return 'prepared';
  if (pedido['Deposito que prepara']) return 'management';
  
  return 'new';
}

/**
 * Retorna la config de color/label para un badge
 */
export function getStatusConfig(badge) {
  const b = badge?.toLowerCase();
  const MAP = {
    budget_sys: { color: 'blue', bg: 'bg-blue-100 text-blue-600', label: 'PRESUPUESTO SISTEMA (0.0)' },
    budget_anul: { color: 'red', bg: 'bg-red-100 text-red-600', label: 'P. ANULADO (0.0.99)' },
    budget: { color: 'sky', bg: 'bg-sky-100 text-sky-600', label: 'PRESUPUESTO (0)' },
    new: { color: 'amber', bg: 'bg-amber-100 text-amber-600', label: 'NUEVO (1)' },
    management: { color: 'pink', bg: 'bg-pink-100 text-pink-600', label: 'EN GESTIÓN (1.1)' },
    prepared: { color: 'indigo', bg: 'bg-indigo-100 text-indigo-600', label: 'PREPARADO (2)' },
    invoiced: { color: 'green', bg: 'bg-green-100 text-green-600', label: 'FACTURADO (4)' },
    shipping: { color: 'sky', bg: 'bg-sky-100 text-sky-600', label: 'EN VIAJE (5)' },
    finished: { color: 'emerald', bg: 'bg-emerald-100 text-emerald-600', label: 'FINALIZADO (6)' },
    anulado: { color: 'red', bg: 'bg-red-100 text-red-600', label: 'ANULADO (99)' },
    parcial: { color: 'purple', bg: 'bg-purple-100 text-purple-600', label: 'PARCIAL' },
  };
  return MAP[b] || MAP.new;
}

export function formatDate(value) {
  const d = parseDate(value)
  if (!d) return '—'
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatDateTime(value) {
  const d = parseDate(value)
  if (!d) return '—'
  return d.toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    hour12: false
  })
}

export function formatRelative(value) {
  const d = parseDate(value)
  if (!d) return '—'
  const now = new Date()
  const diffMs = now - d
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMs / 3600000)
  const diffD = Math.floor(diffMs / 86400000)
  if (diffMin < 1) return 'Ahora'
  if (diffMin < 60) return `Hace ${diffMin}m`
  if (diffH < 24) return `Hace ${diffH}h`
  if (diffD === 1) return 'Ayer'
  if (diffD < 7) return `Hace ${diffD}d`
  return formatDate(value)
}

export function estadoLabel(estado) {
  const labels = {
    '0.0': 'Presupuesto generado en el sistema (0.0)',
    '0.0.99': 'Presupuesto generado en el sistema anulado (0.0.99)',
    '0.': 'Presupuesto (0)',
    '1.': 'Pedido nuevo (1)',
    '1.1': 'Pedido en gestión (1.1)',
    '2.': 'Pedido preparado (2)',
    '4.': 'Facturado (4)',
    '5.': 'En viaje (5)',
    '6.': 'Finalizado (6)',
    '99.': 'Pedido anulado (99)'
  }
  return labels[estado] || estado || '—'
}

export function estadoBadgeClass(badge) {
  return `badge badge-${badge}`
}

export function initials(nombre) {
  if (!nombre) return '?'
  return nombre.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}
