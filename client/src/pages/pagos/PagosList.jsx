import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, X, FileText, ChevronLeft, ChevronRight, DollarSign } from 'lucide-react'
import { mockPagos, mockClientes } from '../../data/mock.js'
import { formatCurrency, formatDateTime } from '../../utils/format.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { puedeDo } from '../../utils/permisos.js'

const PAGE_SIZE = 10

export default function PagosList() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  
  const canCreate = puedeDo(user?.perfil, 'pagos', 'create')

  const pagosData = useMemo(() => {
    return mockPagos.map(p => ({
      ...p,
      NombreCliente: mockClientes.find(c => c.NRO_CLIENTE === p.Cliente)?.NOMBRE_CLIENTE || 'Cliente ' + p.Cliente,
    }))
  }, [])

  const filteredPagos = useMemo(() => {
    if (!search.trim()) return pagosData
    const q = search.toLowerCase()
    return pagosData.filter(p =>
      p.NombreCliente?.toLowerCase().includes(q) ||
      String(p.IDPago).includes(q) ||
      p.Observaciones?.toLowerCase().includes(q)
    )
  }, [search, pagosData])

  // Pagination
  const totalPages = Math.ceil(filteredPagos.length / PAGE_SIZE)
  const paginatedPagos = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredPagos.slice(start, start + PAGE_SIZE)
  }, [filteredPagos, currentPage])

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-[#1e293b] tracking-tight">Pagos y Cobranzas</h1>
            <span className="px-2 py-1 bg-amber-100 text-amber-600 rounded-lg text-[9px] font-bold uppercase tracking-widest border border-amber-200">Test Mode</span>
          </div>
          <p className="text-[#0f5da9]/60 font-bold uppercase text-[10px] tracking-widest mt-1">
            {filteredPagos.length} registros (Simulados)
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => navigate('/pagos/nuevo')}
            className="flex items-center gap-3 bg-[#fe4a65] hover:bg-[#e63e58] text-white font-bold px-6 py-4 rounded-2xl shadow-xl shadow-[#fe4a65]/20 transition-all transform active:scale-95 text-xs uppercase tracking-widest"
          >
            <Plus size={18} strokeWidth={3} />
            Registrar Pago
          </button>
        )}
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-xl shadow-black/5 p-6">
        <div className="relative max-w-xl">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Buscar por cliente, ID de pago u observaciones..."
            className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-[#1e293b] placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#0f5da9]/10 focus:border-[#0f5da9] focus:bg-white transition-all"
          />
          {search && (
            <button onClick={() => { setSearch(''); setCurrentPage(1); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#fe4a65] transition-colors">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-2xl shadow-black/5 overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-8 py-5">ID / Estado</th>
                <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-6 py-5">Cliente / Usuario</th>
                <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-6 py-5">Fecha de Ingreso</th>
                <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-6 py-5">Observaciones</th>
                <th className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest px-8 py-5">Monto Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedPagos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="size-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FileText size={32} className="text-slate-200" />
                    </div>
                    <p className="text-slate-400 font-bold text-sm">No se encontraron pagos registrados</p>
                  </td>
                </tr>
              ) : (
                paginatedPagos.map(p => (
                  <tr key={p.IDPago} className="hover:bg-[#0f5da9]/5 transition-all group">
                    <td className="px-8 py-6">
                      <p className="font-bold text-[#1e293b] text-base">#{p.IDPago}</p>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[9px] font-bold uppercase tracking-tighter border border-emerald-100 mt-1">
                        {p.Estado}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <p className="font-bold text-[#1e293b] text-sm">{p.NombreCliente}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p['Nombre de usuario']}</p>
                    </td>
                    <td className="px-6 py-6 text-xs font-bold text-slate-500 italic">
                      {formatDateTime(p['Fecha ingreso pago'])}
                    </td>
                    <td className="px-6 py-6 text-xs font-bold text-slate-400 max-w-[200px] truncate group-hover:whitespace-normal group-hover:overflow-visible transition-all">
                      {p.Observaciones || '—'}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 text-emerald-600">
                        <DollarSign size={14} strokeWidth={3} />
                        <span className="text-lg font-bold">{formatCurrency(p.Monto)}</span>
                      </div>
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
              Página {currentPage} de {totalPages} — Cobranzas registradas
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1} 
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-[#0f5da9] hover:text-white disabled:opacity-30 transition-all shadow-sm"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button 
                    key={i} 
                    onClick={() => setCurrentPage(i + 1)} 
                    className={`size-8 rounded-lg text-[10px] font-bold transition-all ${currentPage === i + 1 ? 'bg-[#0f5da9] text-white shadow-md' : 'bg-white text-slate-400 hover:bg-slate-100'}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages} 
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-[#0f5da9] hover:text-white disabled:opacity-30 transition-all shadow-sm"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
