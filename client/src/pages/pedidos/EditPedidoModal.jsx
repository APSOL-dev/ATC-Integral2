import { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Search, Plus, Trash2, Save, ShoppingCart, Tag, MapPin, AlignLeft } from 'lucide-react'
import { formatCurrency, parseCurrency } from '../../utils/format.js'
import { useData } from '../../context/DataContext.jsx'

export default function EditPedidoModal({ pedido, onClose, onSave }) {
  const [loading, setLoading] = useState(false)
  const { productos } = useData()
  const [productSearch, setProductSearch] = useState('')
  const [showProductResults, setShowProductResults] = useState(false)
  const [activeProductIndex, setActiveProductIndex] = useState(-1)
  const productRef = useRef(null)

  // Local state for edits
  const [header, setHeader] = useState({
    Nombre: pedido.Nombre || pedido['Razón social (NO BD)'] || '',
    'Lugar de entrega': pedido['Lugar de entrega'] || '',
    Observaciones: pedido.Observaciones || '',
    Descuento: pedido['Porcentaje de descuento (%)'] || 0
  })

  // Deep copy and sanitize details to avoid mutating the original until save
  const [items, setItems] = useState([])

  useEffect(() => {
    if (pedido?.detalles) {
      const sanitized = (pedido.detalles || []).map(item => {
        const itemCode = item['Codigo (más alla de si es item o nombre)'] || item['Item  codigo']
        const foundProduct = (productos || []).find(p => String(p.CODART || p.CODIGO) === String(itemCode))
        const liveStock = foundProduct ? (foundProduct.stock ?? foundProduct.StockAvailable ?? 0) : parseCurrency(item['Stock al momento de cargar'] || item.StockAvailable)

        return {
          ...item,
          Precio: parseCurrency(item.Precio),
          Cantidad: parseCurrency(item.Cantidad),
          StockAvailable: liveStock,
          Descuento: parseCurrency(item.Descuento)
        }
      })
      setItems(sanitized)
    }
  }, [pedido, productos])

  // Handle outside click for product search
  useEffect(() => {
    function handleClickOutside(event) {
      if (productRef.current && !productRef.current.contains(event.target)) {
        setShowProductResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredProductos = useMemo(() => {
    if (!productSearch) return productos.slice(0, 150)
    const lower = productSearch.toLowerCase()
    return productos.filter(p => 
      String(p.CODART || p.CODIGO || '').toLowerCase().includes(lower) || 
      String(p.DESCRI || p.DESCRIPCION || '').toLowerCase().includes(lower)
    ).slice(0, 150) // Limitar a 150 para rendimiento
  }, [productSearch, productos])

  const handleProductKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setShowProductResults(true)
      setActiveProductIndex(prev => Math.min(prev + 1, filteredProductos.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveProductIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (showProductResults && filteredProductos.length > 0) {
        const idx = activeProductIndex >= 0 ? activeProductIndex : 0
        if (filteredProductos[idx]) {
          handleAddItem(filteredProductos[idx])
          setActiveProductIndex(-1)
        }
      }
    } else if (e.key === 'Escape') {
      setShowProductResults(false)
      setActiveProductIndex(-1)
    }
  }

  const handleBlurOnEnter = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.target.blur()
    }
  }

  const handleAddItem = (prod) => {
    const codigo = prod.CODART || prod.CODIGO
    const descri = prod.DESCRI || prod.DESCRIPCION
    const marca = prod.MARCA || prod.NombreMarca || prod.Marca || ''
    const precio = prod.CC_CIVA || prod.PRECIO_LISTA || 0
    const stock = prod.stock || 0
    
    const getItemCode = i => i['Codigo (más alla de si es item o nombre)'] || i['Item  codigo']
    const existing = items.find(i => String(getItemCode(i)) === String(codigo))
    if (existing) {
      const updatedItem = { ...existing, Cantidad: existing.Cantidad + 1 }
      const otherItems = items.filter(i => String(getItemCode(i)) !== String(codigo))
      setItems([updatedItem, ...otherItems])
    } else {
      const newItem = {
        'Codigo (más alla de si es item o nombre)': codigo,
        'Nombre (más alla de si es item o nombre)': descri,
        'Item  codigo': codigo,
        'Nombre item': descri,
        Marca: marca,
        Precio: precio,
        Cantidad: 1,
        StockAvailable: stock,
        Descuento: 0,
        Proveedor: prod.Proveedor || ''
      }
      setItems([newItem, ...items])
    }
    setProductSearch('')
    setShowProductResults(false)
  }

  const handleRemoveItem = (code) => {
    setItems(items.filter(i => String(i['Codigo (más alla de si es item o nombre)'] || i['Item  codigo']) !== String(code)))
  }

  const handleUpdateQty = (code, qty) => {
    setItems(items.map(i => String(i['Codigo (más alla de si es item o nombre)'] || i['Item  codigo']) === String(code) ? { ...i, Cantidad: Math.max(1, qty) } : i))
  }

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + (parseCurrency(item.Precio) * parseCurrency(item.Cantidad)), 0)
    const discountPercent = parseCurrency(header.Descuento)
    const discountAmount = subtotal * (discountPercent / 100)
    
    return {
      subtotal,
      discountAmount,
      total: subtotal - discountAmount,
      totalUnidades: items.reduce((sum, item) => sum + (parseCurrency(item.Cantidad) || 0), 0)
    }
  }, [items, header.Descuento])

  const handleSave = () => {
    if (items.length === 0) return alert('El pedido debe tener al menos un producto.')
    
    const updatedHeader = {
      'Lugar de entrega': header['Lugar de entrega'],
      Observaciones: header.Observaciones,
      'Porcentaje de descuento (%)': parseFloat(header.Descuento) || 0,
      Total: totals.total,
    }

    onSave({
      header: updatedHeader,
      detalles: items,
      Total: totals.total,
      'Porcentaje de descuento (%)': parseFloat(header.Descuento) || 0,
      Observaciones: header.Observaciones,
      'Lugar de entrega': header['Lugar de entrega']
    })
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }} className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in border border-slate-200">
        
        {/* Header Modal */}
        <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-2xl font-bold text-[#1e293b] tracking-tight">Editar Pedido #{pedido.IDPedido}</h2>
            <p className="text-xs font-bold uppercase text-slate-500 tracking-widest mt-1">
              Cliente: <span className="text-[15px] text-[#1e293b] font-black ml-1">{header.Nombre}</span>
            </p>
          </div>
          <button type="button" onClick={onClose} className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-[#fe4a65] hover:border-red-100 hover:bg-red-50 flex items-center justify-center transition-all shadow-sm">
            <X size={20} />
          </button>
        </div>

        {/* Body Modal */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-white custom-scrollbar">
          
          {/* Fila de Datos Generales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2"><MapPin size={12}/> Lugar de entrega</label>
              <input 
                type="text" 
                value={header['Lugar de entrega']} 
                onChange={e => setHeader({...header, 'Lugar de entrega': e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 text-[#1e293b] px-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f5da9]/20 focus:border-[#0f5da9] transition-all font-bold text-base"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2"><AlignLeft size={12}/> Observaciones</label>
              <input 
                type="text" 
                value={header.Observaciones} 
                onChange={e => setHeader({...header, Observaciones: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 text-[#1e293b] px-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f5da9]/20 focus:border-[#0f5da9] transition-all font-bold text-base"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#fe4a65] uppercase tracking-widest flex items-center gap-2 mb-2"><Tag size={12}/> % Descuento Global</label>
              <input 
                type="number" 
                min="0" max="100" step="0.1"
                value={header.Descuento} 
                onChange={e => setHeader({...header, Descuento: e.target.value})}
                className="w-full bg-red-50 border border-red-100 text-[#fe4a65] px-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-bold text-base tabular-nums"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 my-4"></div>

          {/* Buscador de Productos */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-[#0f5da9] uppercase tracking-widest flex items-center gap-2"><ShoppingCart size={14}/> Agregar Productos</label>
            <div className="relative" ref={productRef}>
              <div className="relative">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por código o descripción..."
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value)
                    setShowProductResults(true)
                    setActiveProductIndex(-1)
                  }}
                  onFocus={() => setShowProductResults(true)}
                  onKeyDown={handleProductKeyDown}
                  className="w-full bg-slate-50 border border-slate-200 text-[#1e293b] pl-12 pr-4 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f5da9]/20 focus:border-[#0f5da9] transition-all font-bold text-base"
                />
              </div>

              {showProductResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 max-h-[350px] overflow-y-auto z-50 py-2 custom-scrollbar">
                  {filteredProductos.length > 0 ? (
                    filteredProductos.map((prod, index) => {
                      const desc = prod.DESCRI || prod.DESCRIPCION || ''
                      const marca = prod.MARCA || prod.NombreMarca || prod.Marca || ''
                      const title = (marca && !desc.toLowerCase().includes(marca.toLowerCase())) ? `${desc} - ${marca}` : desc
                      return (
                      <div key={prod.CODART || prod.CODIGO} className={`px-5 py-4 flex items-center justify-between group cursor-pointer transition-colors border-b border-slate-50 last:border-0 ${index === activeProductIndex ? 'bg-[#0f5da9]/10' : 'hover:bg-slate-50'}`} onClick={() => handleAddItem(prod)}>
                        <div className="space-y-1 flex-1 pr-4">
                          <p className="font-bold text-[15px] text-[#1e293b] group-hover:text-[#0f5da9] transition-colors leading-snug">{title}</p>
                          <div className="flex flex-wrap items-center gap-4 mt-1.5">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cód: {prod.CODART || prod.CODIGO}</span>
                            <span className={`text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg ${(prod.stock || 0) > 0 ? 'text-emerald-700 bg-emerald-100 font-extrabold border border-emerald-300/60' : 'text-red-600 bg-red-100 font-bold border border-red-200'}`}>
                              Stock: {prod.stock || 0}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <p className="font-bold text-[15px] text-[#0f5da9] tabular-nums">{formatCurrency(prod.CC_CIVA || prod.PRECIO_LISTA)}</p>
                          <button type="button" className="size-9 rounded-full bg-slate-100 text-[#0f5da9] flex items-center justify-center group-hover:bg-[#0f5da9] group-hover:text-white transition-colors shadow-sm">
                            <Plus size={18} />
                          </button>
                        </div>
                      </div>
                    )})
                  ) : (
                    <div className="p-6 text-center text-slate-400 font-bold text-[15px]">
                      No se encontraron productos
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tabla de Artículos */}
          <div className="bg-white rounded-[1.5rem] border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left py-4 px-6 text-xs font-bold uppercase tracking-widest text-slate-400 w-1/2">Artículo</th>
                    <th className="text-center py-4 px-4 text-xs font-bold uppercase tracking-widest text-slate-400">Precio Unit.</th>
                    <th className="text-center py-4 px-4 text-xs font-bold uppercase tracking-widest text-slate-400">Cantidad</th>
                    <th className="text-right py-4 px-6 text-xs font-bold uppercase tracking-widest text-slate-400">Subtotal</th>
                    <th className="w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {items.map((item, idx) => {
                    const code = item['Codigo (más alla de si es item o nombre)'] || item['Item  codigo']
                    const name = item['Nombre (más alla de si es item o nombre)'] || item['Nombre item']
                    const itemMarca = item.Marca || item.MARCA || item.NombreMarca || ''
                    const title = (itemMarca && !name.toLowerCase().includes(itemMarca.toLowerCase())) ? `${name} - ${itemMarca}` : name
                    return (
                    <tr key={`${code}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-bold text-[15px] text-[#1e293b] leading-snug">{title}</p>
                        <div className="flex items-center gap-4 mt-1.5">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Cód: {code}</span>
                          <span className={`text-xs font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-lg ${(item.StockAvailable || 0) > 0 ? 'text-emerald-700 bg-emerald-100 border border-emerald-300/60 font-black' : 'text-red-600 bg-red-100 font-bold'}`}>
                            Stock: {item.StockAvailable || 0}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="font-bold text-slate-500 tabular-nums">{formatCurrency(item.Precio)}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-3">
                          <button 
                            type="button"
                            onClick={() => handleUpdateQty(code, parseCurrency(item.Cantidad) - 1)}
                            className="size-7 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors font-bold"
                          >-</button>
                          <span className="font-bold text-sm w-8 text-center tabular-nums">{parseCurrency(item.Cantidad)}</span>
                          <button 
                            type="button"
                            onClick={() => handleUpdateQty(code, parseCurrency(item.Cantidad) + 1)}
                            className="size-7 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 flex items-center justify-center transition-colors font-bold"
                          >+</button>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="font-bold text-[#1e293b] tabular-nums">{formatCurrency(parseCurrency(item.Precio) * parseCurrency(item.Cantidad))}</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button 
                          type="button"
                          onClick={() => handleRemoveItem(code)}
                          className="size-8 rounded-xl bg-red-50 text-[#fe4a65] hover:bg-[#fe4a65] hover:text-white flex items-center justify-center transition-all ml-auto"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  )})}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-12 text-center">
                        <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto mb-4 border border-slate-100">
                          <ShoppingCart size={24} className="text-slate-300" />
                        </div>
                        <p className="text-slate-400 font-bold text-sm">El pedido no tiene artículos. Buscá arriba para agregar.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Resumen Final dentro de la tabla */}
            {items.length > 0 && (
              <div className="bg-slate-50 p-6 border-t border-slate-100 flex justify-end">
                <div className="w-72 space-y-3">
                  <div className="flex justify-between items-center text-slate-500">
                    <span className="text-[10px] font-bold uppercase tracking-widest">Subtotal ({totals.totalUnidades} u.)</span>
                    <span className="font-bold tabular-nums">{formatCurrency(totals.subtotal)}</span>
                  </div>
                  {totals.discountAmount > 0 && (
                    <div className="flex justify-between items-center text-[#fe4a65]">
                      <span className="text-[10px] font-bold uppercase tracking-widest">Desc. {header.Descuento}%</span>
                      <span className="font-bold tabular-nums">-{formatCurrency(totals.discountAmount)}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-[#0f5da9] uppercase tracking-[0.2em]">Total Neto</span>
                    <span className="text-2xl font-bold text-[#1e293b] tracking-tighter tabular-nums">{formatCurrency(totals.total)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="px-8 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest text-white bg-[#0f5da9] hover:bg-[#0d4f92] transition-colors shadow-lg shadow-[#0f5da9]/20 flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Guardando...' : <><Save size={14} /> Guardar Cambios</>}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
