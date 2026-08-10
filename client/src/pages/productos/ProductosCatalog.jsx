import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Package, Filter, ShoppingCart, ChevronLeft, ChevronRight, ChevronDown, Check, FileSpreadsheet } from 'lucide-react'
import { formatCurrency } from '../../utils/format.js'
import { useData } from '../../context/DataContext.jsx'

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function ProductosCatalog() {
  const navigate = useNavigate()
  const { productos: globalProductos, loading: globalLoading } = useData()
  const [search, setSearch] = useState('')
  const [soloConStock, setSoloConStock] = useState(false)
  const loading = globalLoading
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(40)
  const [sortConfig, setSortConfig] = useState({ key: 'DESCRI', direction: 'asc' })

  const [filtroProveedor, setFiltroProveedor] = useState('')
  const [selectedProveedores, setSelectedProveedores] = useState([])
  const [showProveedorList, setShowProveedorList] = useState(false)
  const provRef = useRef(null)

  const [filtroFamilia, setFiltroFamilia] = useState('')
  const [selectedFamilias, setSelectedFamilias] = useState([])
  const [showFamiliaList, setShowFamiliaList] = useState(false)
  const famRef = useRef(null)

  const [filtroMarca, setFiltroMarca] = useState('')
  const [selectedMarcas, setSelectedMarcas] = useState([])
  const [showMarcaList, setShowMarcaList] = useState(false)
  const marcaRef = useRef(null)

  const debouncedSearch = useDebounce(search, 400)

  const productos = useMemo(() => {
    if (!debouncedSearch.trim()) return globalProductos
    const s = debouncedSearch.toLowerCase()
    return globalProductos.filter(p => 
      (p.DESCRI || '').toLowerCase().includes(s) ||
      String(p.CODART).toLowerCase().includes(s)
    )
  }, [globalProductos, debouncedSearch])

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (provRef.current && !provRef.current.contains(e.target)) setShowProveedorList(false)
      if (famRef.current && !famRef.current.contains(e.target)) setShowFamiliaList(false)
      if (marcaRef.current && !marcaRef.current.contains(e.target)) setShowMarcaList(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Flexible field resolver
  const getField = (p, ...keys) => {
    for (const k of keys) if (p[k] !== undefined && p[k] !== null) return p[k]
    return null
  }

  const filtrados = useMemo(() => {
    let result = productos;
    if (soloConStock) {
      result = result.filter(p => (parseFloat(getField(p, 'stock', 'STOCK_ACTUAL', 'Stock01', 'STOCK')) || 0) > 0)
    }
    if (selectedProveedores.length > 0) {
      result = result.filter(p => selectedProveedores.includes(getField(p, 'Proveedor', 'PROVEEDOR')))
    } else if (filtroProveedor) {
      result = result.filter(p => {
        const val = getField(p, 'Proveedor', 'PROVEEDOR')
        return val && val.toLowerCase().includes(filtroProveedor.toLowerCase())
      })
    }

    if (selectedFamilias.length > 0) {
      result = result.filter(p => selectedFamilias.includes(getField(p, 'NombreFamilia', 'FAMILIA')))
    } else if (filtroFamilia) {
      result = result.filter(p => {
        const val = getField(p, 'NombreFamilia', 'FAMILIA')
        return val && val.toLowerCase().includes(filtroFamilia.toLowerCase())
      })
    }

    if (selectedMarcas.length > 0) {
      result = result.filter(p => selectedMarcas.includes(getField(p, 'NombreMarca', 'MARCA')))
    } else if (filtroMarca) {
      result = result.filter(p => {
        const val = getField(p, 'NombreMarca', 'MARCA')
        return val && val.toLowerCase().includes(filtroMarca.toLowerCase())
      })
    }
    return result
  }, [productos, soloConStock, filtroProveedor, selectedProveedores, filtroFamilia, selectedFamilias, filtroMarca, selectedMarcas])

  // Interdependent filter helpers to avoid drop-down dead-ends
  const filteredForProveedor = useMemo(() => {
    let result = productos
    if (soloConStock) {
      result = result.filter(p => (parseFloat(getField(p, 'stock', 'STOCK_ACTUAL', 'Stock01', 'STOCK')) || 0) > 0)
    }
    if (selectedFamilias.length > 0) {
      result = result.filter(p => selectedFamilias.includes(getField(p, 'NombreFamilia', 'FAMILIA')))
    }
    if (selectedMarcas.length > 0) {
      result = result.filter(p => selectedMarcas.includes(getField(p, 'NombreMarca', 'MARCA')))
    }
    return result
  }, [productos, soloConStock, selectedFamilias, selectedMarcas])

  const filteredForFamilia = useMemo(() => {
    let result = productos
    if (soloConStock) {
      result = result.filter(p => (parseFloat(getField(p, 'stock', 'STOCK_ACTUAL', 'Stock01', 'STOCK')) || 0) > 0)
    }
    if (selectedProveedores.length > 0) {
      result = result.filter(p => selectedProveedores.includes(getField(p, 'Proveedor', 'PROVEEDOR')))
    }
    if (selectedMarcas.length > 0) {
      result = result.filter(p => selectedMarcas.includes(getField(p, 'NombreMarca', 'MARCA')))
    }
    return result
  }, [productos, soloConStock, selectedProveedores, selectedMarcas])

  const filteredForMarca = useMemo(() => {
    let result = productos
    if (soloConStock) {
      result = result.filter(p => (parseFloat(getField(p, 'stock', 'STOCK_ACTUAL', 'Stock01', 'STOCK')) || 0) > 0)
    }
    if (selectedProveedores.length > 0) {
      result = result.filter(p => selectedProveedores.includes(getField(p, 'Proveedor', 'PROVEEDOR')))
    }
    if (selectedFamilias.length > 0) {
      result = result.filter(p => selectedFamilias.includes(getField(p, 'NombreFamilia', 'FAMILIA')))
    }
    return result
  }, [productos, soloConStock, selectedProveedores, selectedFamilias])

  const proveedoresList = useMemo(() => {
    const all = [...new Set(filteredForProveedor.map(p => getField(p, 'Proveedor', 'PROVEEDOR')).filter(Boolean))].sort()
    if (!filtroProveedor) return all.slice(0, 20)
    return all.filter(p => p.toLowerCase().includes(filtroProveedor.toLowerCase())).slice(0, 20)
  }, [filteredForProveedor, filtroProveedor])

  const familiasList = useMemo(() => {
    const all = [...new Set(filteredForFamilia.map(p => getField(p, 'NombreFamilia', 'FAMILIA')).filter(Boolean))].sort()
    if (!filtroFamilia) return all.slice(0, 20)
    return all.filter(c => c.toLowerCase().includes(filtroFamilia.toLowerCase())).slice(0, 20)
  }, [filteredForFamilia, filtroFamilia])

  const marcasList = useMemo(() => {
    const all = [...new Set(filteredForMarca.map(p => getField(p, 'NombreMarca', 'MARCA')).filter(Boolean))].sort()
    if (!filtroMarca) return all.slice(0, 20)
    return all.filter(m => m.toLowerCase().includes(filtroMarca.toLowerCase())).slice(0, 20)
  }, [filteredForMarca, filtroMarca])

  const sortedProductos = useMemo(() => {
    let sortableItems = [...filtrados]
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let valA, valB;
        if (sortConfig.key === 'DESCRI') {
          valA = getField(a, 'DESCRIPCION', 'DESCRI', 'descripcion')
          valB = getField(b, 'DESCRIPCION', 'DESCRI', 'descripcion')
        } else if (sortConfig.key === 'CODART') {
          valA = getField(a, 'CODIGO', 'CODART', 'codigo')
          valB = getField(b, 'CODIGO', 'CODART', 'codigo')
        } else if (sortConfig.key === 'stock') {
          valA = getField(a, 'stock', 'STOCK_ACTUAL', 'Stock01', 'STOCK')
          valB = getField(b, 'stock', 'STOCK_ACTUAL', 'Stock01', 'STOCK')
        } else if (sortConfig.key === 'CC_CIVA') {
          valA = getField(a, 'CC_CIVA', 'PRECIO_LISTA', 'PRECIO')
          valB = getField(b, 'CC_CIVA', 'PRECIO_LISTA', 'PRECIO')
        }

        if (sortConfig.key === 'stock' || sortConfig.key === 'CC_CIVA') {
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
  const totalPages = Math.ceil(sortedProductos.length / pageSize)
  const paginatedProductos = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedProductos.slice(start, start + pageSize)
  }, [sortedProductos, currentPage, pageSize])

  const requestSort = (key) => {
    let direction = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  // Reset page on filter change
  useEffect(() => { setCurrentPage(1) }, [soloConStock, selectedProveedores, selectedFamilias, selectedMarcas, filtroProveedor, filtroFamilia, filtroMarca, pageSize])

  const tieneFiltrosActivos = search || soloConStock || selectedProveedores.length > 0 || selectedFamilias.length > 0 || selectedMarcas.length > 0 || filtroProveedor || filtroFamilia || filtroMarca

  const limpiarFiltros = () => {
    setSearch('')
    setSoloConStock(false)
    setSelectedProveedores([])
    setFiltroProveedor('')
    setSelectedFamilias([])
    setFiltroFamilia('')
    setSelectedMarcas([])
    setFiltroMarca('')
    setCurrentPage(1)
  }

  return (
    <div className="max-w-[95%] mx-auto space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b] tracking-tight">Catálogo de Productos</h1>
          <p className="text-[#0f5da9]/60 font-bold uppercase text-[9px] tracking-widest mt-0.5">
            {loading ? 'Sincronizando inventario...' : `${filtrados.length} artículos disponibles`}
          </p>
        </div>

        <button
          onClick={() => navigate('/productos/presupuestos')}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-3 rounded-xl shadow-lg shadow-amber-500/20 transition-all text-[10px] uppercase tracking-widest"
        >
          <FileSpreadsheet size={16} /> Productos en pedidos en estado 0.0
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-[1.5rem] border border-slate-200/60 shadow-lg shadow-black/5 p-4 flex flex-col md:flex-row gap-3 items-center mx-2 z-20 relative">
        <div className="flex-1 relative w-full">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar descripción o código..."
            className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-[#1e293b] placeholder-slate-400 focus:outline-none focus:border-[#0f5da9] transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#fe4a65] transition-colors">
              <X size={16} />
            </button>
          )}
        </div>

        <label className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-widest text-slate-500 cursor-pointer hover:bg-white hover:border-[#0f5da9] transition-all select-none w-full md:w-auto shrink-0 group">
          <input
            type="checkbox"
            checked={soloConStock}
            onChange={e => setSoloConStock(e.target.checked)}
            className="w-3.5 h-3.5 accent-[#0f5da9] rounded"
          />
          Stock
        </label>

        <div className="flex flex-wrap md:flex-nowrap gap-3 w-full md:w-auto">
          {/* Proveedor Searchable Dropdown */}
          <div className="relative w-full md:w-48" ref={provRef}>
            <div className="relative group">
              <input
                value={filtroProveedor}
                onChange={e => {
                  setFiltroProveedor(e.target.value)
                  setShowProveedorList(true)
                }}
                onFocus={() => setShowProveedorList(true)}
                placeholder={selectedProveedores.length > 0 ? `${selectedProveedores.length} sel. | Proveedor...` : 'Proveedor...'}
                className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-[#0f5da9] transition-all ${selectedProveedores.length > 0 ? 'border-[#0f5da9] bg-[#0f5da9]/5' : 'border-slate-200'}`}
              />
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
            </div>
            {showProveedorList && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-60 overflow-y-auto no-scrollbar py-2 animate-slide-up">
                {proveedoresList.map(p => (
                  <button
                    key={p}
                    onClick={() => {
                      if (selectedProveedores.includes(p)) {
                        setSelectedProveedores(selectedProveedores.filter(x => x !== p))
                      } else {
                        setSelectedProveedores([...selectedProveedores, p])
                      }
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-[#1e293b] hover:bg-[#0f5da9]/5 hover:text-[#0f5da9] transition-colors flex items-center justify-between border-b border-slate-50 last:border-0"
                  >
                    {p}
                    {selectedProveedores.includes(p) && <Check size={12} />}
                  </button>
                ))}
                {proveedoresList.length === 0 && <div className="px-4 py-3 text-xs font-bold text-slate-400 uppercase text-center italic">Sin resultados</div>}
              </div>
            )}
          </div>

          {/* Familia Searchable Dropdown */}
          <div className="relative w-full md:w-48" ref={famRef}>
            <div className="relative group">
              <input
                value={filtroFamilia}
                onChange={e => {
                  setFiltroFamilia(e.target.value)
                  setShowFamiliaList(true)
                }}
                onFocus={() => setShowFamiliaList(true)}
                placeholder={selectedFamilias.length > 0 ? `${selectedFamilias.length} sel. | Familia...` : 'Familia...'}
                className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-[#0f5da9] transition-all ${selectedFamilias.length > 0 ? 'border-[#0f5da9] bg-[#0f5da9]/5' : 'border-slate-200'}`}
              />
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
            </div>
            {showFamiliaList && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-60 overflow-y-auto no-scrollbar py-2 animate-slide-up">
                {familiasList.map(c => (
                  <button
                    key={c}
                    onClick={() => {
                      if (selectedFamilias.includes(c)) {
                        setSelectedFamilias(selectedFamilias.filter(x => x !== c))
                      } else {
                        setSelectedFamilias([...selectedFamilias, c])
                      }
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-[#1e293b] hover:bg-[#0f5da9]/5 hover:text-[#0f5da9] transition-colors flex items-center justify-between border-b border-slate-50 last:border-0"
                  >
                    {c}
                    {selectedFamilias.includes(c) && <Check size={12} />}
                  </button>
                ))}
                {familiasList.length === 0 && <div className="px-4 py-3 text-xs font-bold text-slate-400 uppercase text-center italic">Sin resultados</div>}
              </div>
            )}
          </div>

          {/* Marca Searchable Dropdown */}
          <div className="relative w-full md:w-48" ref={marcaRef}>
            <div className="relative group">
              <input
                value={filtroMarca}
                onChange={e => {
                  setFiltroMarca(e.target.value)
                  setShowMarcaList(true)
                }}
                onFocus={() => setShowMarcaList(true)}
                placeholder={selectedMarcas.length > 0 ? `${selectedMarcas.length} sel. | Marca...` : 'Marca...'}
                className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-[#0f5da9] transition-all ${selectedMarcas.length > 0 ? 'border-[#0f5da9] bg-[#0f5da9]/5' : 'border-slate-200'}`}
              />
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
            </div>
            {showMarcaList && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-60 overflow-y-auto no-scrollbar py-2 animate-slide-up">
                {marcasList.map(m => (
                  <button
                    key={m}
                    onClick={() => {
                      if (selectedMarcas.includes(m)) {
                        setSelectedMarcas(selectedMarcas.filter(x => x !== m))
                      } else {
                        setSelectedMarcas([...selectedMarcas, m])
                      }
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-[#1e293b] hover:bg-[#0f5da9]/5 hover:text-[#0f5da9] transition-colors flex items-center justify-between border-b border-slate-50 last:border-0"
                  >
                    {m}
                    {selectedMarcas.includes(m) && <Check size={12} />}
                  </button>
                ))}
                {marcasList.length === 0 && <div className="px-4 py-3 text-xs font-bold text-slate-400 uppercase text-center italic">Sin resultados</div>}
              </div>
            )}
          </div>
        </div>

        {tieneFiltrosActivos && (
          <button 
            onClick={limpiarFiltros}
            className="flex items-center gap-1.5 px-4 py-3 bg-red-50 text-[#fe4a65] border border-red-100 hover:bg-[#fe4a65] hover:text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shrink-0 select-none cursor-pointer w-full md:w-auto justify-center"
          >
            <X size={14} />
            <span>Limpiar Filtros</span>
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-[2rem] border border-slate-200/60 p-6 animate-pulse space-y-4 mx-2">
          <div className="h-8 bg-slate-100 rounded-xl w-full" />
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-50 rounded-xl w-full" />
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/60 py-20 text-center mx-2 animate-fade-in">
          <Package size={32} className="text-slate-200 mx-auto mb-4" />
          <h3 className="text-base font-bold text-[#1e293b]">Sin resultados</h3>
        </div>
      ) : (
        <>
          {/* Table Container with Header Pagination Inside */}
          <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-xl shadow-black/5 overflow-hidden mx-2">
            {filtrados.length > 0 && (
              <div className="px-8 py-4 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
                    Mostrando {paginatedProductos.length} de {filtrados.length} productos
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
                    <th 
                      onClick={() => requestSort('CODART')}
                      className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        Código
                        <span className="text-xs">
                          {sortConfig?.key === 'CODART' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}
                        </span>
                      </div>
                    </th>
                    <th 
                      onClick={() => requestSort('DESCRI')}
                      className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        Nombre / Descripción
                        <span className="text-xs">
                          {sortConfig?.key === 'DESCRI' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}
                        </span>
                      </div>
                    </th>
                    <th 
                      onClick={() => requestSort('stock')}
                      className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors select-none text-right"
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        Stock
                        <span className="text-xs">
                          {sortConfig?.key === 'stock' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}
                        </span>
                      </div>
                    </th>
                    <th 
                      onClick={() => requestSort('CC_CIVA')}
                      className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors select-none text-right"
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        Valor
                        <span className="text-xs">
                          {sortConfig?.key === 'CC_CIVA' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}
                        </span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Marca</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Familia</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Proveedor</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedProductos.map(p => {
                    const codigo = getField(p, 'CODIGO', 'CODART', 'codigo')
                    const nombre = getField(p, 'DESCRIPCION', 'DESCRI', 'descripcion')
                    const precio = parseFloat(getField(p, 'CC_CIVA', 'PRECIO_LISTA', 'PRECIO') || 0)
                    const stock = parseFloat(getField(p, 'stock', 'STOCK_ACTUAL', 'Stock01', 'STOCK') || 0)
                    const marca = getField(p, 'NombreMarca', 'MARCA')
                    const familia = getField(p, 'NombreFamilia', 'FAMILIA')
                    const proveedor = getField(p, 'Proveedor', 'PROVEEDOR')

                    return (
                      <tr 
                        key={codigo}
                        onClick={() => navigate(`/productos/${codigo}`)}
                        className={`hover:bg-slate-50/50 transition-colors group cursor-pointer ${stock === 0 ? 'bg-slate-50/20' : ''}`}
                      >
                        <td className="px-6 py-4 text-sm font-bold text-slate-400 tabular-nums">#{codigo}</td>
                        <td className="px-6 py-4 text-[15px] font-bold text-[#1e293b] uppercase group-hover:text-[#0f5da9] transition-colors">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all overflow-visible shrink-0 ${
                              stock === 0 
                                ? 'bg-red-50 border-red-100 text-[#fe4a65] group-hover:bg-[#fe4a65] group-hover:text-white' 
                                : 'bg-slate-50 border-slate-100 text-slate-400 group-hover:bg-[#0f5da9] group-hover:text-white'
                            }`}>
                              <Package size={14} className={`overflow-visible !overflow-visible ${
                                stock === 0 ? 'text-[#fe4a65] group-hover:text-white' : 'text-slate-400 group-hover:text-white'
                              }`} style={{ overflow: 'visible' }} />
                            </div>
                            <span>{nombre || '—'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-right tabular-nums">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${stock === 0 ? 'bg-red-50 text-[#fe4a65] border-red-100' :
                            stock <= 10 ? 'bg-amber-50 text-amber-600 border-amber-100' :
                              'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                            {stock} u
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-[#1e293b] text-right tabular-nums">{formatCurrency(precio)}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-500 uppercase">{marca || '—'}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-500 uppercase">{familia || '—'}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-500 uppercase truncate max-w-[140px]">{proveedor || '—'}</td>
                        <td className="px-6 py-4 text-center" onClick={e => e.stopPropagation()}>
                          <button 
                            onClick={() => navigate(`/productos/${codigo}`)}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-[#fe4a65]/5 hover:text-[#fe4a65] transition-all overflow-visible"
                            title="Detalles"
                          >
                            <ShoppingCart size={16} className="overflow-visible" style={{ overflow: 'visible' }} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
