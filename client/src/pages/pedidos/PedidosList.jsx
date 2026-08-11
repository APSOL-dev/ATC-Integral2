import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { 
  Plus, Search, Filter, ArrowRight, ChevronDown, 
  X, Calendar, User, Hash, RefreshCw, ChevronLeft, ChevronRight,
  Users, Clock, ChevronUp, MessageSquare, FileText
} from 'lucide-react'
import { formatCurrency, formatDateTime, calcEstadoBadge, getStatusConfig, parseDate, parseCurrency } from '../../utils/format.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useData } from '../../context/DataContext.jsx'
import { puedeDo, PERFILES, normalizePerfil } from '../../utils/permisos.js'
import StatusBadge from '../../components/shared/StatusBadge.jsx'

const ESTADOS_MAP = [
  { key: 'Todos', label: 'Todos', color: 'slate' },
  { key: 'budget', label: 'Presupuesto (0)', code: '0.', color: 'sky' },
  { key: 'budget_sys', label: 'Presup. Sistema (0.0)', code: '0.0', color: 'blue' },
  { key: 'new', label: 'Nuevo (1)', code: '1.', color: 'amber' },
  { key: 'management', label: 'En Gestión (1.1)', code: '1.1', color: 'pink' },
  { key: 'prepared', label: 'Preparado (2)', code: '2.', color: 'indigo' },
  { key: 'invoiced', label: 'Facturado (4)', code: '4.', color: 'green' },
  { key: 'budget_anul', label: 'Presup. Anulado (0.0.99)', code: '0.0.99', color: 'red' },
  { key: 'anulado', label: 'Anulado (99)', code: '99.', color: 'red' },
]

const COLOR_CLASSES = {
  slate: { bg: 'bg-slate-500', bgLight: 'bg-slate-400', shadow: 'shadow-slate-500/30' },
  red: { bg: 'bg-red-500', bgLight: 'bg-red-400', shadow: 'shadow-red-500/30' },
  amber: { bg: 'bg-amber-500', bgLight: 'bg-amber-400', shadow: 'shadow-amber-500/30' },
  indigo: { bg: 'bg-indigo-500', bgLight: 'bg-indigo-400', shadow: 'shadow-indigo-500/30' },
  blue: { bg: 'bg-blue-500', bgLight: 'bg-blue-400', shadow: 'shadow-blue-500/30' },
  emerald: { bg: 'bg-emerald-500', bgLight: 'bg-emerald-400', shadow: 'shadow-emerald-500/30' },
  sky: { bg: 'bg-sky-500', bgLight: 'bg-sky-400', shadow: 'shadow-sky-500/30' },
  green: { bg: 'bg-green-500', bgLight: 'bg-green-400', shadow: 'shadow-green-500/30' },
  purple: { bg: 'bg-purple-500', bgLight: 'bg-purple-400', shadow: 'shadow-purple-500/30' },
  pink: { bg: 'bg-pink-500', bgLight: 'bg-pink-400', shadow: 'shadow-pink-500/30' },
}

export default function PedidosList() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  
  const { 
    pedidos, fetchPedidos, loading, isRefreshing, lastSync, secondsLeft,
    prevPath,
    clientes: globalClientes,
    activeTab, setActiveTab,
    filterID, setFilterID,
    filterCliente, setFilterCliente,
    filterVendedor, setFilterVendedor,
    filterFechaDesde, setFilterFechaDesde,
    filterFechaHasta, setFilterFechaHasta,
    selectedCliente, setSelectedCliente,
    selectedVendedor, setSelectedVendedor,
    currentPage, setCurrentPage,
    pageSize, setPageSize,
    sortConfig, setSortConfig,
    resetPedidosFilters,
    hydrateDetails
  } = useData()

  const formatCountdown = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  const clienteRef = useRef(null)
  const vendedorRef = useRef(null)
  
  // Local Data States
  const clientes = globalClientes
  const [vendedores, setVendedores] = useState([])
  
  // Visibility
  const [showClienteResults, setShowClienteResults] = useState(false)
  const [showVendedorResults, setShowVendedorResults] = useState(false)

  // Mount logic: reset filters if coming from other views, or restore if coming from subpages
  useEffect(() => {
    const cameFromPedidos = prevPath && prevPath.startsWith('/pedidos')
    if (!cameFromPedidos) {
      resetPedidosFilters(location.search)
    } else {
      // Returning from details or other /pedidos routes
      const urlTab = searchParams.get('estado') || 'Todos'
      if (urlTab !== activeTab) {
        const newParams = new URLSearchParams(searchParams)
        if (activeTab === 'Todos') {
          newParams.delete('estado')
        } else {
          newParams.set('estado', activeTab)
        }
        setSearchParams(newParams, { replace: true })
      }
    }
  }, [prevPath])

  // Sync active tab with search parameter in URL (e.g. browser back/forward buttons)
  useEffect(() => {
    const urlTab = searchParams.get('estado') || 'Todos'
    if (urlTab !== activeTab) {
      setActiveTab(urlTab)
    }
  }, [searchParams])

  useEffect(() => {
    // DataContext handles initial fetch; no need to duplicate it here

    const handleClickOutside = (e) => {
      if (clienteRef.current && !clienteRef.current.contains(e.target)) setShowClienteResults(false)
      if (vendedorRef.current && !vendedorRef.current.contains(e.target)) setShowVendedorResults(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Filtrar pedidos según permisos de vendedor calle (soloPropio)
  const myPedidos = useMemo(() => {
    if (!user) return []
    const profile = normalizePerfil(user.perfil)
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

    // Deduplicate by IDPedido to prevent key collisions and duplicate entries
    const seen = new Set()
    return list.filter(p => {
      const id = String(p.IDPedido)
      if (seen.has(id)) return false
      seen.add(id)
      return true
    })
  }, [pedidos, user])

  useEffect(() => {
    if (myPedidos.length > 0) {
      const uniqueVds = [...new Set(myPedidos.map(p => p.VendedorNombre || p['Emitido por']))].filter(Boolean).sort()
      setVendedores(uniqueVds)
    }
  }, [myPedidos])

  // Filtering Logic
  const filteredList = useMemo(() => {
    let lista = myPedidos
    
    if (activeTab !== 'Todos') {
      lista = lista.filter(p => calcEstadoBadge(p) === activeTab)
    }
    if (filterID) {
      lista = lista.filter(p => String(p.IDPedido).includes(filterID))
    }
    
    const clientQuery = (selectedCliente || filterCliente || '').trim().toLowerCase()
    if (clientQuery) {
      lista = lista.filter(p => {
        const pNombre = String(p.Nombre || p['Razón social (NO BD)'] || '').trim().toLowerCase()
        const pClienteId = String(p.Cliente || p.NRO_CLIENTE || '').trim().toLowerCase()
        return pNombre.includes(clientQuery) || pClienteId === clientQuery
      })
    }
    
    const vendorQuery = (selectedVendedor || filterVendedor || '').trim().toLowerCase()
    if (vendorQuery) {
      lista = lista.filter(p => {
        const pVendedor = String(p.VendedorNombre || p['Emitido por'] || '').trim().toLowerCase()
        const pVendedorId = String(p.Vendedor || '').trim().toLowerCase()
        return pVendedor.includes(vendorQuery) || pVendedorId === vendorQuery
      })
    }

    if (filterFechaDesde) {
      lista = lista.filter(p => p['Fecha y hora'] >= filterFechaDesde)
    }
    if (filterFechaHasta) {
      lista = lista.filter(p => p['Fecha y hora']?.split('T')[0] <= filterFechaHasta)
    }

    // Sorting Logic
    const sorted = [...lista].sort((a, b) => {
      let aVal, bVal;
      
      switch (sortConfig.key) {
        case 'IDPedido':
          aVal = parseInt(a.IDPedido) || 0;
          bVal = parseInt(b.IDPedido) || 0;
          break;
        case 'Cliente':
          aVal = (a.Nombre || a['Razón social (NO BD)'] || '').toLowerCase();
          bVal = (b.Nombre || b['Razón social (NO BD)'] || '').toLowerCase();
          break;
        case 'Total':
          aVal = parseFloat(a.Total) || 0;
          bVal = parseFloat(b.Total) || 0;
          break;
        case 'Fecha y hora':
          aVal = parseDate(a['Fecha y hora'])?.getTime() || 0;
          bVal = parseDate(b['Fecha y hora'])?.getTime() || 0;
          break;
        default:
          aVal = a[sortConfig.key];
          bVal = b[sortConfig.key];
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted
  }, [myPedidos, activeTab, filterID, selectedCliente, filterCliente, selectedVendedor, filterVendedor, filterFechaDesde, filterFechaHasta, sortConfig])

  // Cross-filtering Dropdown Logic
  const visibleClientResults = useMemo(() => {
    let base = clientes
    // If a vendor is selected, only show clients of that vendor
    if (selectedVendedor) {
      const vendorClients = new Set(
        myPedidos
          .filter(p => (p.VendedorNombre || p['Emitido por'] || '').toLowerCase() === selectedVendedor.toLowerCase())
          .map(p => p.Nombre || p['Razón social (NO BD)'])
      )
      base = base.filter(c => vendorClients.has(c.NOMBRE_CLIENTE))
    }

    if (!filterCliente) return base.slice(0, 15)
    const q = filterCliente.toLowerCase()
    return base.filter(c => 
      c.NOMBRE_CLIENTE?.toLowerCase().includes(q) || 
      String(c.NRO_CLIENTE).includes(q)
    ).slice(0, 15)
  }, [clientes, filterCliente, selectedVendedor, myPedidos])

  const visibleVendedorResults = useMemo(() => {
    let base = vendedores
    // If a client is selected, only show the vendor(s) associated with that client
    if (selectedCliente) {
      const clientVendors = new Set(
        myPedidos
          .filter(p => (p.Nombre || p['Razón social (NO BD)'] || '').toLowerCase() === selectedCliente.toLowerCase())
          .map(p => p.VendedorNombre || p['Emitido por'])
      )
      base = base.filter(v => clientVendors.has(v))
    }

    if (!filterVendedor) return base
    const q = filterVendedor.toLowerCase()
    return base.filter(v => v.toLowerCase().includes(q))
  }, [vendedores, filterVendedor, selectedCliente, myPedidos])

  // Pagination Logic
  const totalPages = Math.ceil(filteredList.length / pageSize)
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredList.slice(start, start + pageSize)
  }, [filteredList, currentPage, pageSize])

  // Hydrate order details on demand for active page items
  useEffect(() => {
    if (paginatedList.length > 0 && typeof hydrateDetails === 'function') {
      const ids = paginatedList.map(p => p.IDPedido).filter(Boolean)
      hydrateDetails(ids)
    }
  }, [paginatedList, hydrateDetails])

  useEffect(() => { 
    if (currentPage !== 1) setCurrentPage(1) 
  }, [activeTab, filterID, selectedCliente, selectedVendedor, filterFechaDesde, filterFechaHasta])

  const counts = useMemo(() => {
    const map = { Todos: myPedidos.length }
    ESTADOS_MAP.forEach(e => {
      if (e.key === 'Todos') return
      map[e.key] = myPedidos.filter(p => calcEstadoBadge(p) === e.key).length
    })
    return map
  }, [myPedidos])

  const canCreate = puedeDo(user?.perfil, 'pedidos', 'create')

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  }

  const SortArrow = ({ column }) => {
    if (sortConfig.key !== column) return <ChevronDown size={14} className="opacity-0 group-hover/th:opacity-30 transition-opacity" />
    return sortConfig.direction === 'asc' 
      ? <ChevronUp size={14} className="text-[#fe4a65]" /> 
      : <ChevronDown size={14} className="text-[#fe4a65]" />
  }

  return (
    <div className="max-w-[95%] mx-auto space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1e293b] tracking-tight">Cartera de Pedidos</h1>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full">
              <div className={`w-1.5 h-1.5 rounded-full ${isRefreshing ? 'bg-[#fe4a65] animate-ping' : 'bg-emerald-500'}`} />
              <span className="text-[9px] font-bold uppercase text-slate-500 tracking-widest">
                {isRefreshing ? 'Actualizando...' : `Próxima Sinc: ${formatCountdown(secondsLeft)}`}
              </span>
              <button 
                onClick={() => fetchPedidos(true, true)} 
                disabled={loading || isRefreshing}
                className="ml-1 p-0.5 rounded text-slate-400 hover:bg-slate-200 hover:text-[#0f5da9] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center"
                title="Forzar actualización"
              >
                <RefreshCw size={10} className={isRefreshing ? 'animate-spin text-[#0f5da9]' : ''} />
              </button>
            </div>
            <span className="text-[#0f5da9] font-bold uppercase text-[10px] tracking-widest">
               {filteredList.length} registros
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {canCreate && (
            <button onClick={() => navigate('/pedidos/nuevo')} className="flex items-center gap-3 bg-[#fe4a65] hover:bg-[#e63e58] text-white font-bold px-8 py-4 rounded-2xl shadow-xl shadow-[#fe4a65]/20 transition-all transform active:scale-95 text-xs uppercase tracking-widest">
              <Plus size={18} strokeWidth={3} />
              Emitir Pedido
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-lg shadow-black/5 p-3 overflow-x-auto no-scrollbar mx-4">
        <div className="flex items-center gap-2 min-w-max px-2 justify-start md:justify-between">
          {ESTADOS_MAP.map(e => {
            const isActive = activeTab === e.key
            const colors = COLOR_CLASSES[e.color] || COLOR_CLASSES.slate
            return (
              <button
                key={e.key}
                onClick={() => {
                  const newParams = new URLSearchParams(searchParams)
                  if (e.key === 'Todos') {
                    newParams.delete('estado')
                  } else {
                    newParams.set('estado', e.key)
                  }
                  setSearchParams(newParams, { replace: true })
                  setActiveTab(e.key)
                }}
                className={`flex group items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all border ${
                  isActive
                    ? `${colors.bg} text-white border-transparent shadow-lg ${colors.shadow} scale-105`
                    : `bg-transparent text-slate-400 border-slate-200/60 hover:bg-${colors.bg.replace('bg-', '')} hover:text-white hover:border-transparent hover:shadow-lg hover:shadow-${colors.bg.replace('bg-', '')}/30`
                }`}
              >
                <div className={`w-2 h-2 rounded-full transition-colors ${isActive ? 'bg-white' : `${colors.bgLight} group-hover:bg-white`}`} />
                {e.label}
                <span className={`px-2 py-0.5 rounded-md text-[8px] transition-colors ${isActive ? 'bg-white/20' : 'bg-slate-200 text-slate-500 group-hover:bg-white/20 group-hover:text-white'}`}>
                  {counts[e.key]}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-xl shadow-black/5 p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mx-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">ID Pedido</label>
            <div className="relative group">
              <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#0f5da9] transition-colors" />
              <input value={filterID} onChange={e => setFilterID(e.target.value)} placeholder="Ej: 99..." className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-[#1e293b] focus:ring-4 focus:ring-[#0f5da9]/5 focus:border-[#0f5da9] transition-all" />
            </div>
          </div>

          <div className="space-y-2 relative" ref={clienteRef}>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Cliente</label>
            <div className="relative group">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#0f5da9] transition-colors" />
              <input 
                value={filterCliente} 
                onChange={e => { 
                  setFilterCliente(e.target.value); 
                  setShowClienteResults(true); 
                  if (!e.target.value) setSelectedCliente(null);
                }} 
                onFocus={() => setShowClienteResults(true)}
                placeholder="Seleccionar cliente..." 
                className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 border rounded-2xl text-xs font-bold text-[#1e293b] focus:ring-4 focus:ring-[#0f5da9]/5 focus:border-[#0f5da9] transition-all ${selectedCliente ? 'border-[#0f5da9] bg-[#0f5da9]/5' : 'border-slate-200'}`} 
              />
              {showClienteResults && (
                <div className="absolute z-30 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-60 overflow-y-auto no-scrollbar py-2 animate-slide-up">
                  {visibleClientResults.map(c => (
                    <button 
                      key={c.NRO_CLIENTE} 
                      onClick={() => { 
                        setFilterCliente(c.NOMBRE_CLIENTE); 
                        setSelectedCliente(c.NOMBRE_CLIENTE);
                        setShowClienteResults(false); 
                      }} 
                      className="w-full text-left px-4 py-2 text-[10px] font-bold text-[#1e293b] hover:bg-[#0f5da9]/5 hover:text-[#0f5da9] transition-colors border-b border-slate-50 last:border-0"
                    >
                      {c.NOMBRE_CLIENTE}
                    </button>
                  ))}
                  {visibleClientResults.length === 0 && <div className="px-4 py-3 text-[9px] font-bold text-slate-400 uppercase text-center italic">Sin coincidencias</div>}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 relative" ref={vendedorRef}>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Vendedor</label>
            <div className="relative group">
              <Users size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#0f5da9] transition-colors" />
              <input 
                value={filterVendedor} 
                onChange={e => { 
                  setFilterVendedor(e.target.value); 
                  setShowVendedorResults(true);
                  if (!e.target.value) setSelectedVendedor(null);
                }} 
                onFocus={() => setShowVendedorResults(true)}
                placeholder="Seleccionar..." 
                className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 border rounded-2xl text-xs font-bold text-[#1e293b] focus:ring-4 focus:ring-[#0f5da9]/5 focus:border-[#0f5da9] transition-all ${selectedVendedor ? 'border-[#0f5da9] bg-[#0f5da9]/5' : 'border-slate-200'}`} 
              />
              {showVendedorResults && (
                <div className="absolute z-30 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-60 overflow-y-auto no-scrollbar py-2 animate-slide-up">
                  {visibleVendedorResults.map(v => (
                    <button 
                      key={v} 
                      onClick={() => { 
                        setFilterVendedor(v); 
                        setSelectedVendedor(v);
                        setShowVendedorResults(false); 
                      }} 
                      className="w-full text-left px-4 py-2 text-[10px] font-bold text-[#1e293b] hover:bg-[#0f5da9]/5 hover:text-[#0f5da9] transition-colors border-b border-slate-50 last:border-0"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 lg:col-span-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Rango de Fechas</label>
            <div className="flex items-center gap-2">
               <input type="date" value={filterFechaDesde} onChange={e => setFilterFechaDesde(e.target.value)} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-bold text-[#1e293b] focus:border-[#0f5da9] transition-all" />
               <input type="date" value={filterFechaHasta} onChange={e => setFilterFechaHasta(e.target.value)} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-bold text-[#1e293b] focus:border-[#0f5da9] transition-all" />
            </div>
          </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-2xl shadow-black/5 overflow-hidden mx-4">
        {!loading && filteredList.length > 0 && (
          <div className="px-8 py-4 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                Mostrando {paginatedList.length} de {filteredList.length} pedidos
              </p>
              
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Registros:</span>
                <select
                  value={pageSize}
                  onChange={e => {
                    setPageSize(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-[10px] font-bold text-slate-500 focus:outline-none focus:border-[#0f5da9] transition-all cursor-pointer shadow-sm"
                >
                  <option value={40}>40</option>
                  <option value={80}>80</option>
                  <option value={120}>120</option>
                </select>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-[#0f5da9] hover:text-white disabled:opacity-30 transition-all shadow-sm">
                  <ChevronLeft size={16} />
                </button>
                <div className="flex items-center gap-1 mx-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Pág. {currentPage} de {totalPages}</span>
                </div>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-[#0f5da9] hover:text-white disabled:opacity-30 transition-all shadow-sm">
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="py-24 text-center">
            <div className="w-12 h-12 border-4 border-[#0f5da9] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest italic">Sincronizando información...</p>
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/30">
                  <th onClick={() => requestSort('IDPedido')} className="group/th cursor-pointer hover:bg-slate-100/50 transition-colors text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-8 py-6">
                    <div className="flex items-center gap-2">
                      ID <SortArrow column="IDPedido" />
                    </div>
                  </th>
                  <th onClick={() => requestSort('Cliente')} className="group/th cursor-pointer hover:bg-slate-100/50 transition-colors text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-6 py-6">
                    <div className="flex items-center gap-2">
                      Cliente / Vendedor <SortArrow column="Cliente" />
                    </div>
                  </th>
                  <th onClick={() => requestSort('Fecha y hora')} className="group/th cursor-pointer hover:bg-slate-100/50 transition-colors text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-6 py-6">
                    <div className="flex items-center gap-2">
                      Fecha y Hora <SortArrow column="Fecha y hora" />
                    </div>
                  </th>
                  <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-6 py-6">Estado</th>
                  <th onClick={() => requestSort('Total')} className="group/th cursor-pointer hover:bg-slate-100/50 transition-colors text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest px-6 py-6">
                    <div className="flex items-center justify-end gap-2">
                      Total Neto <SortArrow column="Total" />
                    </div>
                  </th>
                  <th className="px-8 py-6 w-10 text-right text-slate-300"><ArrowRight size={14}/></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-24 text-slate-400">
                      <div className="flex flex-col items-center">
                        <Filter size={48} className="opacity-10 mb-4" />
                        <p className="text-xs font-bold uppercase tracking-widest">Sin resultados</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedList.map(pedido => {
                    const isTemp = Boolean(pedido.isOptimistic || String(pedido.IDPedido || '').startsWith('temp-'))
                    return (
                    <tr 
                      key={pedido.IDPedido} 
                      onClick={() => {
                        if (isTemp) return
                        navigate(`/pedidos/${pedido.IDPedido}`)
                      }}
                      className={`transition-all duration-300 border-l-4 ${isTemp ? 'opacity-75 bg-amber-50/30 border-l-amber-400 cursor-not-allowed' : 'hover:bg-[#0f5da9]/5 group border-l-transparent hover:border-l-[#0f5da9] cursor-pointer'}`}
                    >
                      <td className="px-8 py-7">
                        {isTemp ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-300 animate-pulse">
                            <RefreshCw size={11} className="animate-spin" /> Generando pedido...
                          </span>
                        ) : (
                          <span className="font-medium text-slate-500 text-sm group-hover:text-[#0f5da9] transition-colors tabular-nums">#{pedido.IDPedido}</span>
                        )}
                      </td>
                      <td className="px-6 py-7">
                        <p className="font-bold text-[#1e293b] text-sm truncate max-w-[250px]">{pedido.Nombre || pedido['Razón social (NO BD)']}</p>
                        <p className="text-[9px] font-bold text-[#fe4a65] uppercase tracking-tighter mt-0.5">{pedido.VendedorNombre || pedido['Emitido por']}</p>
                      </td>
                      <td className="px-6 py-7">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                           <Clock size={12} className="text-slate-300" />
                           {formatDateTime(pedido['Emitido Fecha'] || pedido['Fecha y hora'])}
                        </div>
                      </td>
                      <td className="px-6 py-7">
                        <StatusBadge pedido={pedido} />
                      </td>
                      <td className="px-6 py-7 text-right">
                        <span className="font-bold text-[#1e293b] text-sm tabular-nums">{formatCurrency(pedido.Total || 0)}</span>
                      </td>
                      <td className="px-8 py-7 text-right">
                        <div className="flex items-center justify-end">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm ${isTemp ? 'bg-slate-100 text-slate-300' : 'bg-slate-50 text-slate-300 group-hover:bg-[#0f5da9] group-hover:text-white'}`}>
                            <ArrowRight size={18} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )})
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredList.length > 0 && (
          <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                Mostrando {paginatedList.length} de {filteredList.length} pedidos
              </p>
              
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Registros:</span>
                <select
                  value={pageSize}
                  onChange={e => {
                    setPageSize(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-[10px] font-bold text-slate-500 focus:outline-none focus:border-[#0f5da9] transition-all cursor-pointer shadow-sm"
                >
                  <option value={40}>40</option>
                  <option value={80}>80</option>
                  <option value={120}>120</option>
                </select>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-3 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-[#0f5da9] hover:text-white disabled:opacity-30 transition-all shadow-sm">
                  <ChevronLeft size={18} />
                </button>
                <div className="flex items-center gap-1.5 mx-2">
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1
                    if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                      return (
                        <button 
                          key={i} 
                          onClick={() => setCurrentPage(page)} 
                          className={`px-3 py-1.5 text-xs transition-all ${currentPage === page ? 'text-[#0f5da9] font-black' : 'text-slate-400 font-medium hover:text-[#0f5da9]'}`}
                          style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}
                        >
                          {page}
                        </button>
                      )
                    }
                    if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={i} className="text-slate-300 text-xs">...</span>
                    }
                    return null
                  })}
                </div>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-3 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-[#0f5da9] hover:text-white disabled:opacity-30 transition-all shadow-sm">
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
