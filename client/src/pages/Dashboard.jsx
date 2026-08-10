import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShoppingCart, Clock, Truck, CheckCircle,
  TrendingUp, AlertCircle, Package, ArrowRight, Users,
  FileText, Ban, Play, Activity, Hash, ChevronRight, ExternalLink, User, Tag, MessageSquare, Search,
   Check, ShoppingBag, Plus, Minus, X, BarChart2, RefreshCw, Settings, LayoutGrid
} from 'lucide-react'
import { formatCurrency, formatDateTime, calcEstadoBadge, getStatusConfig } from '../utils/format.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useData } from '../context/DataContext.jsx'
import { PERFILES, normalizePerfil, puedeDo } from '../utils/permisos.js'
import StatusBadge from '../components/shared/StatusBadge.jsx'

const CHART_COLOR_MAP = {
  slate: 'bg-slate-400 group-hover:bg-slate-500 shadow-slate-200',
  red: 'bg-red-400 group-hover:bg-red-500 shadow-red-200',
  amber: 'bg-amber-400 group-hover:bg-amber-500 shadow-amber-200',
  indigo: 'bg-indigo-400 group-hover:bg-indigo-500 shadow-indigo-200',
  blue: 'bg-blue-400 group-hover:bg-blue-500 shadow-blue-200',
  emerald: 'bg-emerald-400 group-hover:bg-emerald-500 shadow-emerald-200',
  sky: 'bg-sky-400 group-hover:bg-sky-500 shadow-sky-200',
  green: 'bg-green-400 group-hover:bg-green-500 shadow-green-200',
}

// Reusable skeleton pulse block
const Skel = ({ className = '' }) => (
  <div className={`bg-slate-200 rounded-lg animate-pulse ${className}`} />
)

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { pedidos, clientes, loading, isRefreshing, fetchPedidos, secondsLeft, isReady } = useData()

  const formatCountdown = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  const saldoTotal = useMemo(() => {
    if (!user || !Array.isArray(clientes)) return 0
    let filteredClientes = clientes
    const profile = normalizePerfil(user?.perfil)
    const soloPropio = PERFILES[profile]?.soloPropio
    if (soloPropio) {
      filteredClientes = clientes.filter(c => {
        const cVdorName = String(c.VENDEDOR || '').trim().toLowerCase()
        const cVdorId = String(c.NRO_VENDEDOR || '').trim().toLowerCase()
        const userVdorId = String(user?.nroVendedor || '').trim().toLowerCase()
        const userName = String(user?.nombre || '').trim().toLowerCase()
        return (userVdorId && cVdorId === userVdorId) ||
               (userName && cVdorName === userName)
      })
    }
    return filteredClientes.reduce((sum, c) => sum + (Number(c.SALDO) || 0), 0)
  }, [clientes, user])

  // DataContext handles initial fetch; no need to duplicate it here

  const filteredPedidos = useMemo(() => {
    if (!user) return []
    const profile = normalizePerfil(user?.perfil)
    const soloPropio = PERFILES[profile]?.soloPropio
    let list = pedidos
    if (soloPropio) {
      const userVdor = String(user.nroVendedor || '').trim().toLowerCase()
      const userName = String(user.nombre || '').trim().toLowerCase()
      list = pedidos.filter(p => {
        const pVendedor = String(p.Vendedor || '').trim().toLowerCase()
        const pEmitido = String(p['Emitido por'] || '').trim().toLowerCase()
        const pVdorNombre = String(p.VendedorNombre || '').trim().toLowerCase()
        return (userVdor && pVendedor === userVdor) ||
               (userName && pEmitido === userName) ||
               (userName && pVdorNombre === userName)
      })
    }
    const seen = new Set()
    return list.filter(p => {
      const id = String(p.IDPedido)
      if (seen.has(id)) return false
      seen.add(id)
      return true
    })
  }, [pedidos, user])

  const stats = useMemo(() => {
    const hoyStr = new Date().toISOString().split('T')[0]
    const hoyPedidos = filteredPedidos.filter(p => p['Fecha y hora']?.startsWith(hoyStr))
    const statusKeys = ['budget', 'budget_sys', 'budget_anul', 'new', 'management', 'prepared', 'invoiced', 'anulado']
    const distribution = statusKeys.map(key => ({
      key,
      label: getStatusConfig(key).label,
      count: filteredPedidos.filter(p => calcEstadoBadge(p) === key).length,
      color: getStatusConfig(key).color
    }))
    return { hoyCount: hoyPedidos.length, distribution }
  }, [filteredPedidos])

  const normPerfil = normalizePerfil(user?.perfil)
  const isAdmin = normPerfil === 'Administracion' || normPerfil === 'AdministracionA'
  const canUsers = puedeDo(user?.perfil, 'usuarios', 'read')

  const quickAccessItems = useMemo(() => {
    return [
      { label: 'Cargar Pedido', path: '/pedidos/nuevo', icon: ShoppingCart, iconBg: 'bg-[#0f5da9]/10', iconColor: 'text-[#0f5da9]', desc: 'Nueva orden mayorista', visible: puedeDo(user?.perfil, 'pedidos', 'create') },
      { label: 'Stock / Catálogo', path: '/productos', icon: Package, iconBg: 'bg-amber-50', iconColor: 'text-amber-600', desc: 'Consulta de artículos', visible: true },
      { label: 'Ficha Clientes', path: '/clientes', icon: Users, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600', desc: 'Cartera y saldos', visible: true },
      { label: 'Reservas de Stock', path: '/productos/presupuestos', icon: Clock, iconBg: 'bg-purple-50', iconColor: 'text-purple-600', desc: 'Presupuestos activos', visible: true },
      { label: 'Control de Usuarios', path: '/admin/usuarios', icon: Settings, iconBg: 'bg-rose-50', iconColor: 'text-rose-600', desc: 'Permisos y accesos', visible: canUsers },
      { label: 'Cambiar Aplicación', path: '/selector', icon: LayoutGrid, iconBg: 'bg-slate-100', iconColor: 'text-slate-600', desc: 'Panel de selección', visible: isAdmin },
    ].filter(item => item.visible)
  }, [canUsers, isAdmin])

  return (
    <div className="min-h-full flex flex-col gap-4 sm:gap-6 animate-fade-in no-scrollbar pb-6">

      {/* Top Row: Welcome & Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 sm:gap-6 shrink-0 px-1 sm:px-2">

        {/* Welcome card */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] p-6 flex items-center justify-between border border-slate-200/60 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-[#0f5da9]/5 rounded-full blur-2xl" />
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-[#0f5da9]/10 flex items-center justify-center text-2xl">👋</div>
            <div>
              <h1 className="text-xl font-bold text-[#1e293b] tracking-tight leading-none">
                ¡Hola, {String(user?.nombre || '').split(' ')[0]}!
              </h1>
            </div>
          </div>
          <div className="text-right border-l border-slate-100 pl-6 flex items-center gap-3">
            <div>
              <p className="text-slate-300 text-[8px] font-bold uppercase tracking-widest mb-1">Próxima Sinc.</p>
              <p className="text-[#0f5da9] font-bold text-sm tabular-nums">
                {loading ? '...' : isRefreshing ? 'Sincronizando...' : formatCountdown(secondsLeft)}
              </p>
            </div>
            <button
              onClick={() => fetchPedidos(true, true)}
              disabled={loading || isRefreshing}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-[#0f5da9] active:scale-95 transition-all disabled:opacity-50"
              title="Sincronizar ahora"
            >
              <RefreshCw size={14} className={(loading || isRefreshing) ? 'animate-spin text-[#0f5da9]' : ''} />
            </button>
          </div>
        </div>

        {/* Pedidos de hoy */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] p-6 flex items-center justify-between border border-slate-200/60 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-[#fe4a65]/5 flex items-center justify-center text-[#fe4a65]">
              <ShoppingCart size={22} />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pedidos de hoy</p>
              {loading
                ? <Skel className="h-8 w-16 mt-1" />
                : <span className="text-3xl font-bold text-[#1e293b] tabular-nums">{stats.hoyCount}</span>
              }
            </div>
          </div>
        </div>

        {/* Saldo total */}
        <div className="lg:col-span-2 bg-[#0f5da9] rounded-[2rem] p-6 flex items-center justify-between border border-[#0f5da9]/20 shadow-xl shadow-[#0f5da9]/20 relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-32 h-32 -mb-16 -mr-16 bg-white/10 rounded-full blur-2xl" />
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white">
              <BarChart2 size={22} />
            </div>
            <div>
              <p className="text-[9px] font-bold text-white/70 uppercase tracking-widest mb-1">Saldo Total de Clientes</p>
              {loading
                ? <div className="bg-white/20 rounded-lg animate-pulse h-7 w-32 mt-1" />
                : <span className="text-2xl font-bold text-white tabular-nums">{formatCurrency(saldoTotal)}</span>
              }
            </div>
          </div>
        </div>
      </div>

      {/* Status Cards Grid */}
      <div className="shrink-0 px-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm flex flex-col gap-2">
                  <Skel className="h-3 w-24" />
                  <Skel className="h-7 w-12 mt-1" />
                </div>
              ))
            : stats.distribution.map((d) => (
                <button
                  key={d.key}
                  onClick={() => navigate(`/pedidos?estado=${d.key}`)}
                  className="group bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm hover:shadow-md hover:border-[#0f5da9]/40 transition-all flex flex-col items-start relative overflow-hidden"
                >
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${CHART_COLOR_MAP[d.color]?.split(' ')[0] || 'bg-slate-200'}`} />
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 group-hover:text-[#0f5da9] transition-colors">
                    {d.label}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-[#1e293b] tabular-nums">{d.count}</span>
                    <span className="text-[10px] font-bold text-slate-300 group-hover:text-[#0f5da9]/50 transition-colors uppercase">Pedidos</span>
                  </div>
                  <ChevronRight size={14} className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-[#0f5da9]" />
                </button>
              ))
          }
        </div>
      </div>

      {/* Bottom Section */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-4 gap-6 px-2">

        {/* Recent Activity */}
        <div className="lg:col-span-3 bg-white rounded-[2rem] border border-slate-200/60 shadow-lg flex flex-col overflow-hidden">
          <div className="px-8 py-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
            <div className="flex items-center gap-3">
              <Activity size={18} className="text-[#fe4a65]" />
              <h2 className="text-[10px] font-bold text-[#1e293b] uppercase tracking-widest">Actividad Reciente</h2>
            </div>
            <button onClick={() => navigate('/pedidos')} className="text-[#0f5da9] text-[9px] font-bold uppercase tracking-widest hover:underline flex items-center gap-2">
              Ver Todo <ArrowRight size={12} />
            </button>
          </div>
          <div className="overflow-y-auto no-scrollbar flex-1 divide-y divide-slate-50">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="pl-8 pr-6 py-4 flex items-center gap-4">
                    <Skel className="h-3 w-8 shrink-0" />
                    <div className="flex-1 flex flex-col gap-1.5">
                      <Skel className="h-3 w-48" />
                      <Skel className="h-2 w-24" />
                    </div>
                    <Skel className="h-5 w-20 rounded-full shrink-0" />
                  </div>
                ))
              : filteredPedidos.slice(0, 10).map(pedido => (
                  <div
                    key={pedido.IDPedido}
                    onClick={() => navigate(`/pedidos/${pedido.IDPedido}`)}
                    className="pl-8 pr-6 py-4 grid grid-cols-12 items-center gap-4 hover:bg-slate-50 transition-all cursor-pointer group"
                  >
                    <div className="col-span-2 md:col-span-1 text-slate-500 font-bold text-xs group-hover:text-[#0f5da9] transition-all text-left">
                      #{pedido.IDPedido}
                    </div>
                    <div className="col-span-7 md:col-span-6 flex flex-col min-w-0 text-left">
                      <p className="text-[11px] font-bold text-[#1e293b] uppercase truncate pr-2">
                        {pedido.Nombre || pedido['Razón social (NO BD)']}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                        {formatDateTime(pedido['Fecha y hora'])}
                      </p>
                    </div>
                    <div className="hidden md:block md:col-span-3 text-right pr-3 min-w-0">
                      <p className="text-[9px] font-bold text-[#0f5da9] uppercase tracking-widest leading-none mb-1 truncate">
                        {pedido.VendedorNombre || pedido.Vendedor}
                      </p>
                      <p className="text-[9px] font-bold text-slate-300 uppercase">{formatCurrency(pedido.Total)}</p>
                    </div>
                    <div className="col-span-3 md:col-span-2 flex justify-end md:justify-start">
                      <StatusBadge pedido={pedido} size="sm" className="shrink-0" />
                    </div>
                  </div>
                ))
            }
          </div>
        </div>

        {/* Quick Access */}
        <div className="bg-white rounded-[2rem] p-6 border border-slate-200/60 shadow-lg flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-[#0f5da9]/5 rounded-full blur-2xl" />
          <div className="relative z-10 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#0f5da9] mb-5">Accesos Rápidos</h3>
              <div className="grid grid-cols-1 gap-2.5">
                {quickAccessItems.map(item => (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-2xl border border-slate-100 hover:border-[#0f5da9]/20 hover:bg-slate-50 transition-all group text-left shadow-sm hover:shadow-md"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.iconBg} ${item.iconColor} transition-transform group-hover:scale-105`}>
                      <item.icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-800 leading-tight mb-0.5">{item.label}</span>
                      <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-tight truncate">{item.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-end">
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">Sincronizado</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
