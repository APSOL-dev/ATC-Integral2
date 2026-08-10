import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Search, X, ArrowRight, Building2, MapPin, 
  Phone, UserCheck, Users, ChevronLeft, ChevronRight,
  Filter, User, ChevronDown, Check, DollarSign
} from 'lucide-react'
import { formatCurrency } from '../../utils/format.js'

import { useAuth } from '../../context/AuthContext.jsx'
import { PERFILES } from '../../utils/permisos.js'
import { useData } from '../../context/DataContext.jsx'

// Debounce helper
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function ClientesList() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { clientes: globalClientes, loading: globalLoading, preloadClientesList } = useData()
  const [search, setSearch] = useState('')
  const loading = globalLoading
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(40)
  const [sortConfig, setSortConfig] = useState({ key: 'NOMBRE_CLIENTE', direction: 'asc' })
  
  // New Filters
  const [filtroVendedor, setFiltroVendedor] = useState('')
  const [selectedVendedor, setSelectedVendedor] = useState(null)
  const [showVendedorList, setShowVendedorList] = useState(false)
  const vendRef = useRef(null)

  const [filtroLocalidad, setFiltroLocalidad] = useState('')
  const [selectedLocalidad, setSelectedLocalidad] = useState(null)
  const [showLocalidadList, setShowLocalidadList] = useState(false)
  const locRef = useRef(null)

  const debouncedSearch = useDebounce(search, 400)

  const clientes = useMemo(() => {
    if (!debouncedSearch.trim()) return globalClientes
    const s = debouncedSearch.toLowerCase()
    return globalClientes.filter(c => 
      (c.NOMBRE_CLIENTE || '').toLowerCase().includes(s) ||
      String(c.NRO_CLIENTE).includes(s)
    )
  }, [globalClientes, debouncedSearch])

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (vendRef.current && !vendRef.current.contains(e.target)) setShowVendedorList(false)
      if (locRef.current && !locRef.current.contains(e.target)) setShowLocalidadList(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtrados = useMemo(() => {
    let result = clientes;
    
    // Perfil restriction
    const perfil = PERFILES[user?.perfil]
    if (perfil?.soloPropio) {
      result = result.filter(c => {
        const cVdorName = String(c.VENDEDOR || '').trim().toLowerCase()
        const cVdorId = String(c.NRO_VENDEDOR || '').trim().toLowerCase()
        const userVdorId = String(user?.nroVendedor || '').trim().toLowerCase()
        const userName = String(user?.nombre || '').trim().toLowerCase()
        
        return (userVdorId && cVdorId === userVdorId) || 
               (userName && cVdorName === userName)
      })
    }

    if (selectedVendedor) {
      result = result.filter(c => (c.VENDEDOR_NOMBRE || c.VENDEDOR) === selectedVendedor)
    }
    if (selectedLocalidad) {
      result = result.filter(c => c.LOCALIDAD === selectedLocalidad)
    }
    return result
  }, [clientes, selectedVendedor, selectedLocalidad, user])

  const vendedoresList = useMemo(() => {
    // Cross-filter: Only show vendors that have clients in the selected locality
    let source = clientes
    if (selectedLocalidad) {
      source = source.filter(c => c.LOCALIDAD === selectedLocalidad)
    }
    const all = [...new Set(source.map(c => c.VENDEDOR_NOMBRE || c.VENDEDOR).filter(Boolean))].sort()
    if (!filtroVendedor) return all.slice(0, 20)
    return all.filter(v => v.toLowerCase().includes(filtroVendedor.toLowerCase())).slice(0, 20)
  }, [clientes, filtroVendedor, selectedLocalidad])

  const localidadesList = useMemo(() => {
    // Cross-filter: Only show localities that have clients for the selected vendor
    let source = clientes
    if (selectedVendedor) {
      source = source.filter(c => (c.VENDEDOR_NOMBRE || c.VENDEDOR) === selectedVendedor)
    }
    const all = [...new Set(source.map(c => c.LOCALIDAD).filter(Boolean))].sort()
    if (!filtroLocalidad) return all.slice(0, 20)
    return all.filter(l => l.toLowerCase().includes(filtroLocalidad.toLowerCase())).slice(0, 20)
  }, [clientes, filtroLocalidad, selectedVendedor])

  const sortedClientes = useMemo(() => {
    let sortableItems = [...filtrados]
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let valA = a[sortConfig.key]
        let valB = b[sortConfig.key]

        if (sortConfig.key === 'SALDO') {
          valA = parseFloat(valA) || 0
          valB = parseFloat(valB) || 0
        } else {
          valA = String(valA || '').toLowerCase()
          valB = String(valB || '').toLowerCase()
        }

        if (valA < valB) {
          return sortConfig.direction === 'asc' ? -1 : 1
        }
        if (valA > valB) {
          return sortConfig.direction === 'asc' ? 1 : -1
        }
        return 0
      })
    }
    return sortableItems
  }, [filtrados, sortConfig])

  // Pagination Logic
  const totalPages = Math.ceil(sortedClientes.length / pageSize)
  const paginatedClientes = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedClientes.slice(start, start + pageSize)
  }, [sortedClientes, currentPage, pageSize])

  const requestSort = (key) => {
    let direction = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  useEffect(() => { setCurrentPage(1) }, [selectedVendedor, selectedLocalidad, search, pageSize])

  useEffect(() => {
    if (paginatedClientes && paginatedClientes.length > 0 && preloadClientesList) {
      const ids = paginatedClientes.map(c => c.NRO_CLIENTE || c.id).filter(Boolean)
      preloadClientesList(ids)
    }
  }, [paginatedClientes, preloadClientesList])

  return (
    <div className="max-w-[95%] mx-auto space-y-6 animate-fade-in pb-12 px-4">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-[#1e293b] tracking-tight">Cartera de Clientes</h1>
          <p className="text-[#0f5da9]/60 font-bold uppercase text-[10px] tracking-widest mt-1">
            {loading ? 'Consultando base de datos...' : `${filtrados.length} registros encontrados`}
          </p>
        </div>
      </div>

      {/* Búsqueda y Filtros */}
      <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-xl shadow-black/5 p-6 flex flex-col md:flex-row gap-4 items-center z-20 relative">
        <div className="relative flex-1 w-full">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, CUIT o ID..."
            className="w-full pl-12 pr-11 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-[#1e293b] focus:ring-4 focus:ring-[#0f5da9]/5 focus:border-[#0f5da9] transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#fe4a65] transition-colors">
              <X size={18} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap md:flex-nowrap gap-3 w-full md:w-auto">
          {/* Vendedor Filter */}
          <div className="relative w-full md:w-56" ref={vendRef}>
             <div className="relative group">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input 
                  value={filtroVendedor}
                  onChange={e => { setFiltroVendedor(e.target.value); setSelectedVendedor(null); setShowVendedorList(true); }}
                  onFocus={() => setShowVendedorList(true)}
                  placeholder="Vendedor..."
                  className={`w-full pl-11 pr-4 py-4 bg-slate-50 border rounded-2xl text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-[#0f5da9] transition-all ${selectedVendedor ? 'border-[#0f5da9] bg-[#0f5da9]/5' : 'border-slate-200'}`}
                />
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
             </div>
             {showVendedorList && (
               <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-60 overflow-y-auto no-scrollbar py-2 animate-slide-up">
                 {vendedoresList.map(v => (
                   <button key={v} onClick={() => { setFiltroVendedor(v); setSelectedVendedor(v); setShowVendedorList(false); }} className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#1e293b] hover:bg-[#0f5da9]/5 hover:text-[#0f5da9] transition-colors flex items-center justify-between border-b border-slate-50 last:border-0">
                     {v} {selectedVendedor === v && <Check size={12} />}
                   </button>
                 ))}
               </div>
             )}
          </div>

          {/* Localidad Filter */}
          <div className="relative w-full md:w-56" ref={locRef}>
             <div className="relative group">
                <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input 
                  value={filtroLocalidad}
                  onChange={e => { setFiltroLocalidad(e.target.value); setSelectedLocalidad(null); setShowLocalidadList(true); }}
                  onFocus={() => setShowLocalidadList(true)}
                  placeholder="Localidad..."
                  className={`w-full pl-11 pr-4 py-4 bg-slate-50 border rounded-2xl text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-[#0f5da9] transition-all ${selectedLocalidad ? 'border-[#0f5da9] bg-[#0f5da9]/5' : 'border-slate-200'}`}
                />
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
             </div>
             {showLocalidadList && (
               <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-60 overflow-y-auto no-scrollbar py-2 animate-slide-up">
                 {localidadesList.map(l => (
                   <button key={l} onClick={() => { setFiltroLocalidad(l); setSelectedLocalidad(l); setShowLocalidadList(false); }} className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#1e293b] hover:bg-[#0f5da9]/5 hover:text-[#0f5da9] transition-colors flex items-center justify-between border-b border-slate-50 last:border-0">
                     {l} {selectedLocalidad === l && <Check size={12} />}
                   </button>
                 ))}
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="bg-white rounded-[2rem] border border-slate-200/60 p-6 animate-pulse space-y-4">
          <div className="h-8 bg-slate-100 rounded-xl w-full" />
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-50 rounded-xl w-full" />
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-xl shadow-black/5 py-24 text-center">
          <div className="size-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-200"><Users size={32} /></div>
          <h3 className="text-lg font-bold text-[#1e293b] mb-1">Sin resultados para estos filtros</h3>
          <p className="text-slate-400 font-bold text-xs uppercase">Probá ajustando la búsqueda o los filtros</p>
        </div>
      ) : (
        <>
          {/* Table Container with Header Pagination Inside */}
          <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-xl shadow-black/5 overflow-hidden">
            {filtrados.length > 0 && (
              <div className="px-8 py-4 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
                    Mostrando {paginatedClientes.length} de {filtrados.length} clientes
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Ver por página:</span>
                    <select
                      value={pageSize}
                      onChange={e => {
                        setPageSize(Number(e.target.value))
                        setCurrentPage(1)
                      }}
                      className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-500 focus:outline-none focus:border-[#0f5da9] transition-all cursor-pointer shadow-sm"
                    >
                      <option value={40}>40</option>
                      <option value={80}>80</option>
                      <option value={120}>120</option>
                    </select>
                  </div>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-[#0f5da9] hover:text-white disabled:opacity-30 transition-all shadow-sm">
                      <ChevronLeft size={14} />
                    </button>
                    <div className="flex items-center gap-1 mx-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Pág. {currentPage} de {totalPages}</span>
                    </div>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-[#0f5da9] hover:text-white disabled:opacity-30 transition-all shadow-sm">
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">ID Cuenta</th>
                    <th 
                      onClick={() => requestSort('NOMBRE_CLIENTE')}
                      className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        Nombre
                        <span className="text-xs">
                          {sortConfig?.key === 'NOMBRE_CLIENTE' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}
                        </span>
                      </div>
                    </th>
                    <th 
                      onClick={() => requestSort('LOCALIDAD')}
                      className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        Localidad
                        <span className="text-xs">
                          {sortConfig?.key === 'LOCALIDAD' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}
                        </span>
                      </div>
                    </th>
                    <th 
                      onClick={() => requestSort('SALDO')}
                      className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors select-none text-right"
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        Saldo
                        <span className="text-xs">
                          {sortConfig?.key === 'SALDO' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}
                        </span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Vendedor</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">CUIT</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Teléfono</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedClientes.map(c => (
                    <tr 
                      key={c.NRO_CLIENTE}
                      onClick={() => navigate(`/clientes/${c.NRO_CLIENTE}`)}
                      className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-4 text-sm font-bold text-slate-400 tabular-nums">#{c.NRO_CLIENTE}</td>
                      <td className="px-6 py-4 text-[15px] font-bold text-[#1e293b] uppercase group-hover:text-[#0f5da9] transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-[#0f5da9] group-hover:text-white transition-all overflow-visible shrink-0">
                            <Building2 size={14} className="text-slate-400 group-hover:text-white overflow-visible !overflow-visible" style={{ overflow: 'visible' }} />
                          </div>
                          {c.NOMBRE_CLIENTE || c.NOMBRE || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-500 uppercase">{c.LOCALIDAD || '—'}</td>
                      <td className={`px-6 py-4 text-sm font-bold tabular-nums text-right ${Number(c.SALDO) > 0 ? 'text-[#fe4a65]' : 'text-emerald-600'}`}>
                        {formatCurrency(c.SALDO || 0)}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-500 uppercase">{c.VENDEDOR_NOMBRE || c.VENDEDOR || '—'}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-500 tabular-nums">{c.CUIT || '—'}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-500 tabular-nums">{c.TELE || c.TELEFONO || '—'}</td>
                      <td className="px-6 py-4 text-center" onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={() => navigate(`/clientes/${c.NRO_CLIENTE}`)}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-[#0f5da9]/5 hover:text-[#fe4a65] transition-all"
                          title="Ver Ficha"
                        >
                          <ArrowRight size={16} className="overflow-visible" style={{ overflow: 'visible' }} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
