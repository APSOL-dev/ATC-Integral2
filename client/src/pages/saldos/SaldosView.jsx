import { useState, useMemo, useEffect } from 'react'
import { Search, X, TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight, User } from 'lucide-react'
import { formatCurrency } from '../../utils/format.js'
import { useData } from '../../context/DataContext.jsx'

const PAGE_SIZE = 10

export default function SaldosView() {
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const { clientes, loading } = useData()

  const filteredSaldos = useMemo(() => {
    if (!search.trim()) return clientes
    const q = search.toLowerCase()
    return clientes.filter(c =>
      (c.NOMBRE_CLIENTE || c.NOMBRE)?.toLowerCase().includes(q) ||
      String(c.NRO_CLIENTE).includes(q)
    )
  }, [search, clientes])

  const totales = useMemo(() => ({
    saldoTotal: filteredSaldos.reduce((s, c) => s + (Number(c.SALDO) || 0), 0),
    pagosTotal: 0, 
    pendienteTotal: filteredSaldos.reduce((s, c) => s + (Number(c.SALDO) || 0), 0),
  }), [filteredSaldos])

  // Pagination
  const totalPages = Math.ceil(filteredSaldos.length / PAGE_SIZE)
  const paginatedSaldos = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredSaldos.slice(start, start + PAGE_SIZE)
  }, [filteredSaldos, currentPage])

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-[#1e293b] tracking-tight">Análisis de Saldos</h1>
          <p className="text-[#0f5da9]/60 font-bold uppercase text-[10px] tracking-widest mt-1">
            Resumen de cuenta corriente por cliente
          </p>
        </div>
      </div>

      {/* Totales resumen - Premium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Saldo Deudor Total', value: totales.saldoTotal, icon: TrendingUp, color: 'emerald', bg: 'bg-emerald-500' },
          { label: 'Cobranzas Totales', value: totales.pagosTotal, icon: TrendingDown, color: 'blue', bg: 'bg-[#0f5da9]' },
          { label: 'Pendiente Neto', value: totales.pendienteTotal, icon: Minus, color: 'red', bg: 'bg-[#fe4a65]' },
        ].map(item => (
          <div key={item.label} className="bg-white rounded-[2rem] border border-slate-200/60 shadow-xl shadow-black/5 p-8 relative overflow-hidden group">
            <div className={`absolute -bottom-6 -right-6 size-32 ${item.bg}/5 rounded-full transition-transform group-hover:scale-110`} />
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg ${item.bg} relative z-10`}>
              <item.icon size={22} strokeWidth={3} />
            </div>
            <p className="text-3xl font-bold text-[#1e293b] mb-1 relative z-10">{formatCurrency(item.value)}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest relative z-10">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Búsqueda */}
      <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-xl shadow-black/5 p-6">
        <div className="relative max-w-xl">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Filtrar por nombre o cuenta..."
            className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-[#1e293b] placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#0f5da9]/10 focus:border-[#0f5da9] focus:bg-white transition-all"
          />
          {search && (
            <button onClick={() => { setSearch(''); setCurrentPage(1); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#fe4a65] transition-colors">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-2xl shadow-black/5 overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-8 py-5">Cliente / Vendedor</th>
                <th className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest px-6 py-5">Saldo de Cuenta</th>
                <th className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest px-6 py-5">Pagos Registrados</th>
                <th className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest px-8 py-5">Saldo Pendiente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="size-12 border-4 border-[#0f5da9]/20 border-t-[#0f5da9] rounded-full animate-spin" />
                      <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Cargando saldos...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedSaldos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-24 text-center">
                    <p className="text-slate-400 font-bold text-sm">No se encontraron cuentas con saldo</p>
                  </td>
                </tr>
              ) : (
                paginatedSaldos.map(c => (
                  <tr key={c.NRO_CLIENTE} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#0f5da9] group-hover:text-white transition-all">
                          <User size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-[#1e293b] text-sm uppercase">{c.NOMBRE_CLIENTE || c.NOMBRE}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cuenta #{c.NRO_CLIENTE} · {c.VENDEDOR_NOMBRE || c.VENDEDOR || 'S/V'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-right font-bold text-[#1e293b]/70">—</td>
                    <td className="px-6 py-6 text-right font-bold text-emerald-600">—</td>
                    <td className="px-8 py-6 text-right">
                      <span className={`text-lg font-bold ${Number(c.SALDO) > 0 ? 'text-[#fe4a65]' : Number(c.SALDO) < 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
                        {formatCurrency(c.SALDO || 0)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Análisis de {filteredSaldos.length} cuentas corrientes
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-[#0f5da9] hover:text-white disabled:opacity-30 transition-all shadow-sm">
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button key={i} onClick={() => setCurrentPage(i + 1)} className={`size-8 rounded-lg text-[10px] font-bold transition-all ${currentPage === i + 1 ? 'bg-[#0f5da9] text-white shadow-md' : 'bg-white text-slate-400 hover:bg-slate-100'}`}>
                    {i + 1}
                  </button>
                ))}
              </div>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-[#0f5da9] hover:text-white disabled:opacity-30 transition-all shadow-sm">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
