import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  ArrowLeft, Search, Plus, Trash2, Package, User, 
  MapPin, Calendar, ClipboardList, Save, X, Info, ShoppingCart,
  Phone, Tag, Hash, Layers
} from 'lucide-react'
import { formatCurrency, parseCurrency } from '../../utils/format.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useData } from '../../context/DataContext.jsx'
import { PERFILES } from '../../utils/permisos.js'
import { matchProductSearch } from '../../utils/productSearch.js'

export default function PedidoForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { fetchPedidos, clientes, productos, setPedidos } = useData()
  const [loading, setLoading] = useState(false)
  
  const clientRef = useRef(null)
  const productRef = useRef(null)
  
  // Form State
  const [header, setHeader] = useState({
    Cliente: '',
    Nombre: '',
    'Lugar de entrega': '',
    Celular: '',
    Descuento: '',
    'Deposito que prepara': '',
    Observaciones: '',
    'Emitido por': user?.nombre || 'Admin',
    Vendedor: user?.nroVendedor || ''
  })
  
  const [items, setItems] = useState([])
  
  // Search states
  const [clientSearch, setClientSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [showClientResults, setShowClientResults] = useState(false)
  const [showProductResults, setShowProductResults] = useState(false)
  const [activeProductIndex, setActiveProductIndex] = useState(-1)
  const [activeClientIndex, setActiveClientIndex] = useState(-1)

  useEffect(() => {
    if (location.state?.edit) {
      const p = location.state.edit
      setHeader({
        Cliente: p.Cliente || '',
        Nombre: p.Nombre || p['Razón social (NO BD)'] || '',
        'Lugar de entrega': p['Lugar de entrega'] || '',
        Celular: p['Celular de contacto'] || '',
        Descuento: String(p['Porcentaje de descuento (%)'] || ''),
        'Deposito que prepara': p['Deposito que prepara'] || '',
        Observaciones: p.Observaciones || '',
        'Emitido por': p['Emitido por'] || user?.nombre || 'Admin',
        Vendedor: p.Vendedor || user?.nroVendedor || '',
        Estado: p.Estado || '0'
      })
      
      // Sanitize items with live stock from catalog
      const sanitizedItems = (p.detalles || []).map(item => {
        const itemCode = item['Codigo (más alla de si es item o nombre)'] || item['Item  codigo']
        const foundProduct = (productos || []).find(prod => String(prod.CODART || prod.CODIGO) === String(itemCode))
        const liveStock = foundProduct ? (foundProduct.stock ?? foundProduct.StockAvailable ?? 0) : parseCurrency(item['Stock al momento de cargar'] || item.StockAvailable)

        return {
          ...item,
          Precio: parseCurrency(item.Precio),
          Cantidad: parseCurrency(item.Cantidad),
          StockAvailable: liveStock,
          Descuento: parseCurrency(item.Descuento)
        }
      })
      
      setItems(sanitizedItems)
      setClientSearch(p.Nombre || p['Razón social (NO BD)'] || '')
    }

    const handleClickOutside = (e) => {
      if (clientRef.current && !clientRef.current.contains(e.target)) setShowClientResults(false)
      if (productRef.current && !productRef.current.contains(e.target)) setShowProductResults(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [location.state?.edit, user, productos])

  const filteredClients = useMemo(() => {
    let list = clientes
    const perfil = PERFILES[user?.perfil]
    if (perfil?.soloPropio) {
      list = list.filter(c => {
        const cVdorName = String(c.VENDEDOR || '').trim().toLowerCase()
        const cVdorId = String(c.NRO_VENDEDOR || '').trim().toLowerCase()
        const userVdorId = String(user?.nroVendedor || '').trim().toLowerCase()
        const userName = String(user?.nombre || '').trim().toLowerCase()
        
        return (userVdorId && cVdorId === userVdorId) || 
               (userName && cVdorName === userName)
      })
    }
    
    if (!clientSearch) return list.slice(0, 100)
    const q = clientSearch.toLowerCase()
    return list.filter(c => 
      c.NOMBRE_CLIENTE?.toLowerCase().includes(q) || 
      String(c.NRO_CLIENTE).includes(q)
    ).slice(0, 100)
  }, [clientSearch, clientes, user])

  const filteredProducts = useMemo(() => {
    if (!productSearch) return productos.slice(0, 150)
    const q = productSearch.toLowerCase()
    return productos.filter(p => {
      const nombre = p.DESCRI || p.DESCRIPCION || ''
      const codigo = p.CODART || p.CODIGO || ''
      return nombre.toLowerCase().includes(q) || String(codigo).includes(q)
    }).slice(0, 150)
  }, [productSearch, productos])

  const handleProductKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setShowProductResults(true)
      setActiveProductIndex(prev => Math.min(prev + 1, filteredProducts.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveProductIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (showProductResults && filteredProducts.length > 0) {
        const idx = activeProductIndex >= 0 ? activeProductIndex : 0
        if (filteredProducts[idx]) {
          handleAddItem(filteredProducts[idx])
          setActiveProductIndex(-1)
        }
      }
    } else if (e.key === 'Escape') {
      setShowProductResults(false)
      setActiveProductIndex(-1)
    }
  }

  const handleClientKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setShowClientResults(true)
      setActiveClientIndex(prev => Math.min(prev + 1, filteredClients.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveClientIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (showClientResults && filteredClients.length > 0) {
        const idx = activeClientIndex >= 0 ? activeClientIndex : 0
        if (filteredClients[idx]) {
          handleSelectClient(filteredClients[idx])
          setActiveClientIndex(-1)
        }
      }
    } else if (e.key === 'Escape') {
      setShowClientResults(false)
      setActiveClientIndex(-1)
    }
  }

  const handleBlurOnEnter = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.target.blur()
    }
  }

  const handleSelectClient = (client) => {
    setHeader(h => ({
      ...h,
      Cliente: client.NRO_CLIENTE,
      Nombre: client.NOMBRE_CLIENTE,
      'Lugar de entrega': client.LOCALIDAD || client.DIREC || '',
      Celular: client.TELE || client.TELEFONO || '',
      Vendedor: client.NRO_VENDEDOR || client.VENDEDOR || h.Vendedor
    }))
    setClientSearch(client.NOMBRE_CLIENTE)
    setShowClientResults(false)
  }

  const handleAddItem = (prod) => {
    const codigo = prod.CODART || prod.CODIGO
    const descri = prod.DESCRI || prod.DESCRIPCION
    const marca = prod.MARCA || prod.NombreMarca || prod.Marca || ''
    const precio = prod.CC_CIVA || prod.PRECIO_LISTA || 0
    const stock = prod.stock || 0
    
    const getItemCode = i => i['Codigo (más alla de si es item o nombre)'] || i['Item  codigo']
    const existing = items.find(i => getItemCode(i) === codigo)
    if (existing) {
      const updatedItem = { ...existing, Cantidad: existing.Cantidad + 1 }
      const otherItems = items.filter(i => getItemCode(i) !== codigo)
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

  // Handle pre-filled client from URL query param and addItem from catalog
  useEffect(() => {
    if (!clientes.length || !productos.length) return

    const params = new URLSearchParams(location.search)
    const preClient = params.get('cliente')
    if (preClient) {
      const found = clientes.find(c => String(c.NRO_CLIENTE) === String(preClient))
      if (found) {
        handleSelectClient(found)
      }
    }

    if (location.state?.addItem) {
      const prod = location.state.addItem
      const freshProd = productos.find(p => String(p.CODART) === String(prod.CODART)) || prod
      handleAddItem(freshProd)
    }
  }, [clientes, productos, location.search, location.state?.addItem])

  const handleRemoveItem = (code) => {
    setItems(items.filter(i => (i['Codigo (más alla de si es item o nombre)'] || i['Item  codigo']) !== code))
  }

  const handleUpdateQty = (code, qty) => {
    setItems(items.map(i => (i['Codigo (más alla de si es item o nombre)'] || i['Item  codigo']) === code ? { ...i, Cantidad: Math.max(1, qty) } : i))
  }

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + (parseCurrency(item.Precio) * parseCurrency(item.Cantidad)), 0)
    const discountPercent = parseCurrency(header.Descuento)
    const discountAmount = subtotal * (discountPercent / 100)
    const totalUnidades = items.reduce((sum, item) => sum + (parseCurrency(item.Cantidad) || 0), 0)
    const totalItems = items.length

    return {
      subtotal,
      discountAmount,
      total: subtotal - discountAmount,
      totalUnidades,
      totalItems
    }
  }, [items, header.Descuento])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!header.Cliente) return alert('Seleccione un cliente')
    if (items.length === 0) return alert('Agregue al menos un producto')
    
    const isEdit = !!location.state?.edit

    if (isEdit) {
      const targetId = location.state.edit.IDPedido
      const url = `${import.meta.env.VITE_API_URL}/pedidos/${targetId}`
      
      const updatedHeader = {
        ...header,
        'Porcentaje de descuento (%)': parseFloat(header.Descuento) || 0,
        Total: totals.total,
        Estado: header.Estado
      }

      if (setPedidos) {
        setPedidos(prev => prev.map(p => String(p.IDPedido) === String(targetId) ? { ...p, ...updatedHeader, detalles: items } : p))
      }

      navigate(`/pedidos/${targetId}`)

      fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.token ? { 'Authorization': `Bearer ${user.token}` } : {})
        },
        body: JSON.stringify({
          header: updatedHeader,
          detalles: items
        })
      }).then(res => {
        if (res.ok) fetchPedidos(false, true)
      }).catch(console.error)

      return
    }

    // Creating NEW pedido (Optimistic UI & Background POST)
    const tempId = `temp-${Date.now()}`
    const selectedClientObj = clientes.find(c => String(c.NRO_CLIENTE || c.id) === String(header.Cliente))
    const clientName = header.Nombre || selectedClientObj?.['Razón social'] || selectedClientObj?.['Nombre'] || header.Cliente

    const optimisticPedido = {
      IDPedido: tempId,
      isOptimistic: true,
      Cliente: header.Cliente,
      'Razón social (NO BD)': clientName,
      Nombre: clientName,
      'Emitido por': header['Emitido por'] || user?.nombre || 'Admin',
      VendedorNombre: header['Emitido por'] || user?.nombre || 'Admin',
      Vendedor: header.Vendedor || user?.nroVendedor || '',
      'Porcentaje de descuento (%)': parseFloat(header.Descuento) || 0,
      Total: totals.total,
      Estado: '0',
      'Fecha y hora': new Date().toISOString(),
      detalles: items,
      Observaciones: header.Observaciones || '',
      'Lugar de entrega': header['Lugar de entrega'] || ''
    }

    // Insert optimistic order at the top of context list
    if (setPedidos) {
      setPedidos(prev => [optimisticPedido, ...prev])
    }

    // Instant redirect to /pedidos (0ms UI latency)
    navigate('/pedidos')

    // Background POST request
    fetch(`${import.meta.env.VITE_API_URL}/pedidos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(user?.token ? { 'Authorization': `Bearer ${user.token}` } : {})
      },
      body: JSON.stringify({
        header: {
          ...header,
          'Porcentaje de descuento (%)': parseFloat(header.Descuento) || 0,
          Total: totals.total,
          Estado: '0'
        },
        detalles: items
      })
    })
      .then(async res => {
        if (res.ok) {
          const data = await res.json()
          const realId = data.IDPedido
          if (setPedidos) {
            setPedidos(prev => prev.map(p => String(p.IDPedido) === String(tempId) ? { ...p, IDPedido: realId, isOptimistic: false } : p))
          }
        } else {
          if (setPedidos) {
            setPedidos(prev => prev.filter(p => String(p.IDPedido) !== String(tempId)))
          }
          alert('Error al guardar el nuevo pedido en el servidor. Se ha removido de la lista.')
        }
      })
      .catch(err => {
        console.error('Error creating order in background:', err)
        if (setPedidos) {
          setPedidos(prev => prev.filter(p => String(p.IDPedido) !== String(tempId)))
        }
        alert('Error de conexión al crear el pedido. Se ha removido de la lista.')
      })
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <button 
          type="button"
          onClick={() => {
            if (window.history.state && window.history.state.idx > 0) {
              navigate(-1)
            } else {
              navigate('/pedidos')
            }
          }} 
          className="size-14 rounded-[1.5rem] bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#0f5da9] hover:border-[#0f5da9] hover:shadow-2xl transition-all group shrink-0"
        >
          <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
        </button>
        <div>
          <h1 className="text-4xl font-bold text-[#1e293b] tracking-tight">
            {location.state?.edit ? 'Editar Presupuesto' : 'Nuevo Pedido'}
          </h1>
          <p className="text-[#0f5da9] font-bold uppercase text-[10px] tracking-[0.2em] mt-1 flex items-center gap-2">
            <Layers size={14} />
            Creación de orden mayorista
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form Content */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Client Selection Card */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-xl shadow-black/5 p-8">
            <h2 className="text-xl font-bold text-[#1e293b] mb-10 pb-4 border-b border-slate-50 flex items-center gap-3">
              <User size={20} className="text-[#0f5da9]" />
              Ficha de Venta
            </h2>
            
            <div className="space-y-8">
              <div className="relative" ref={clientRef}>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Cliente Solicitante</label>
                <div className="relative group">
                  <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#0f5da9] transition-colors" />
                  <input
                    type="text"
                    value={clientSearch}
                    onChange={(e) => {
                      setClientSearch(e.target.value)
                      setShowClientResults(true)
                      setActiveClientIndex(-1)
                    }}
                    onFocus={() => setShowClientResults(true)}
                    onKeyDown={handleClientKeyDown}
                    placeholder="Buscar por nombre o número de cliente..."
                    className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-base font-bold text-[#1e293b] focus:ring-8 focus:ring-[#0f5da9]/5 focus:border-[#0f5da9] transition-all outline-none"
                  />
                </div>
                
                {showClientResults && (
                  <div className="absolute z-30 w-full mt-3 bg-white border border-slate-200 rounded-[2rem] shadow-2xl overflow-hidden animate-slide-up py-2 max-h-[300px] overflow-y-auto no-scrollbar">
                    {filteredClients.length > 0 ? filteredClients.map((c, index) => (
                      <button
                        key={c.NRO_CLIENTE}
                        type="button"
                        onClick={() => handleSelectClient(c)}
                        className={`w-full text-left px-8 py-5 flex items-center justify-between border-b border-slate-50 last:border-0 transition-colors group ${index === activeClientIndex ? 'bg-[#0f5da9]/10' : 'hover:bg-[#0f5da9]/5'}`}
                      >
                        <div>
                          <p className="font-bold text-[#1e293b] text-[15px] group-hover:text-[#0f5da9] transition-colors">{c.NOMBRE_CLIENTE}</p>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">ID: {c.NRO_CLIENTE} · {c.LOCALIDAD || 'Sin localidad'}</p>
                        </div>
                        <Plus size={20} className="text-[#0f5da9] opacity-0 group-hover:opacity-100 transition-all transform group-hover:rotate-90" />
                      </button>
                    )) : (
                       <div className="px-8 py-5 text-[15px] font-bold text-slate-400 italic text-center">No se encontraron clientes</div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="group">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1 group-focus-within:text-[#0f5da9] transition-colors">Lugar de Entrega</label>
                  <div className="relative">
                    <MapPin size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input
                      type="text"
                      value={header['Lugar de entrega']}
                      onChange={(e) => setHeader({...header, 'Lugar de entrega': e.target.value})}
                      onKeyDown={handleBlurOnEnter}
                      className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-[15px] font-bold text-[#1e293b] focus:border-[#0f5da9] transition-all outline-none"
                    />
                  </div>
                </div>
                <div className="group">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1 group-focus-within:text-[#0f5da9] transition-colors">Celular de Contacto</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input
                      type="text"
                      value={header.Celular}
                      onChange={(e) => setHeader({...header, Celular: e.target.value})}
                      onKeyDown={handleBlurOnEnter}
                      placeholder="Ej: +54 9 341..."
                      className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-[15px] font-bold text-[#1e293b] focus:border-[#0f5da9] transition-all outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Selection Card */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-xl shadow-black/5 p-8">
            <h2 className="text-xl font-bold text-[#1e293b] mb-10 pb-4 border-b border-slate-50 flex items-center gap-3">
              <Package size={20} className="text-[#0f5da9]" />
              Selección de Artículos
            </h2>

            <div className="relative mb-10" ref={productRef}>
              <div className="relative group">
                <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#0f5da9] transition-colors" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value)
                    setShowProductResults(true)
                    setActiveProductIndex(-1)
                  }}
                  onFocus={() => setShowProductResults(true)}
                  onKeyDown={handleProductKeyDown}
                  placeholder="Código o descripción del producto..."
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-[15px] font-bold text-[#1e293b] focus:ring-8 focus:ring-[#0f5da9]/5 focus:border-[#0f5da9] transition-all outline-none"
                />
              </div>
              
              {showProductResults && (
                <div className="absolute z-30 w-full mt-3 bg-white border border-slate-200 rounded-[2rem] shadow-2xl overflow-hidden py-2 animate-slide-up max-h-[400px] overflow-y-auto no-scrollbar">
                  {filteredProducts.length > 0 ? filteredProducts.map((p, index) => {
                    const desc = p.DESCRI || p.DESCRIPCION || ''
                    const marca = p.MARCA || p.NombreMarca || p.Marca || ''
                    const title = (marca && !desc.toLowerCase().includes(marca.toLowerCase())) ? `${desc} - ${marca}` : desc
                    return (
                    <button
                      key={p.CODART || p.CODIGO}
                      type="button"
                      onClick={() => handleAddItem(p)}
                      className={`w-full text-left px-8 py-5 flex items-center justify-between border-b border-slate-50 last:border-0 group transition-colors ${index === activeProductIndex ? 'bg-[#0f5da9]/10' : 'hover:bg-[#0f5da9]/5'}`}
                    >
                      <div className="flex-1 pr-4">
                        <p className="font-bold text-[#1e293b] text-base group-hover:text-[#0f5da9] transition-colors leading-snug">{title}</p>
                        <div className="flex flex-wrap items-center gap-4 mt-2">
                          <p className="text-sm font-bold text-slate-500 uppercase">Cód: {p.CODART || p.CODIGO}</p>
                          <p className={`text-sm font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg ${p.stock > 0 ? 'text-emerald-700 bg-emerald-100 font-extrabold border border-emerald-300/60' : 'text-red-600 bg-red-100 font-bold border border-red-200'}`}>Stock: {p.stock || 0}</p>
                          <p className="text-[15px] font-bold text-[#0f5da9] uppercase">{formatCurrency(p.CC_CIVA || p.PRECIO_LISTA || 0)}</p>
                        </div>
                      </div>
                      <Plus size={20} className="text-[#0f5da9] opacity-0 group-hover:opacity-100 transition-all" />
                    </button>
                  )}) : (
                    <div className="px-8 py-5 text-[15px] font-bold text-slate-400 italic text-center">No se encontraron productos</div>
                  )}
                </div>
              )}
            </div>

            {/* Selected Items Table */}
            <div className="space-y-6">
              {items.length === 0 ? (
                <div className="py-24 border-4 border-dashed border-slate-50 rounded-[3rem] flex flex-col items-center justify-center text-slate-300">
                  <ShoppingCart size={64} strokeWidth={1} className="mb-6 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-[0.2em]">El carrito está vacío</p>
                  <p className="text-[10px] font-bold mt-2 uppercase text-slate-400">Busca productos para agregarlos</p>
                </div>
              ) : (
                <div className="overflow-hidden border border-slate-100 rounded-[2rem]">
                  <table className="w-full">
                    <thead className="bg-slate-50/50">
                      <tr>
                        <th className="text-left text-xs font-bold text-slate-400 uppercase tracking-widest px-8 py-5">Descripción</th>
                        <th className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest px-4 py-5">Stock</th>
                        <th className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest px-4 py-5">Cant.</th>
                        <th className="text-right text-xs font-bold text-slate-400 uppercase tracking-widest px-4 py-5">Unitario</th>
                        <th className="text-right text-xs font-bold text-slate-400 uppercase tracking-widest px-8 py-5">Total</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {items.map(item => {
                        const code = item['Codigo (más alla de si es item o nombre)'] || item['Item  codigo']
                        const name = item['Nombre (más alla de si es item o nombre)'] || item['Nombre item']
                        const itemMarca = item.Marca || item.MARCA || item.NombreMarca || ''
                        const title = (itemMarca && !name.toLowerCase().includes(itemMarca.toLowerCase())) ? `${name} - ${itemMarca}` : name
                        return (
                        <tr key={code} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="px-8 py-5">
                            <p className="text-base font-bold text-[#1e293b] leading-snug">{title}</p>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-tighter mt-1">SKU: {code}</p>
                          </td>
                          <td className="px-4 py-5 text-center">
                            <span className={`text-sm font-extrabold uppercase px-2.5 py-1 rounded-lg ${item.StockAvailable > 0 ? 'text-emerald-700 bg-emerald-100 border border-emerald-300/60 font-black' : 'text-red-600 bg-red-100 font-bold'}`}>
                              {item.StockAvailable}
                            </span>
                          </td>
                          <td className="px-4 py-5">
                            <div className="flex items-center justify-center">
                              <input
                                type="number"
                                min="1"
                                value={item.Cantidad}
                                onChange={(e) => handleUpdateQty(code, parseInt(e.target.value))}
                                onKeyDown={handleBlurOnEnter}
                                className="w-20 text-center py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-[#1e293b] focus:border-[#0f5da9] transition-all outline-none"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-5 text-right text-xs font-bold text-slate-500 tabular-nums">{formatCurrency(item.Precio)}</td>
                          <td className="px-8 py-5 text-right">
                            <span className="text-base font-bold text-[#1e293b] tabular-nums">{formatCurrency(item.Precio * item.Cantidad)}</span>
                          </td>
                          <td className="pr-8 py-5 text-right">
                            <button type="button" onClick={() => handleRemoveItem(code)} className="size-10 rounded-xl flex items-center justify-center text-slate-300 hover:bg-red-50 hover:text-[#fe4a65] transition-all">
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                  
                  {/* Table Footer Stats */}
                  <div className="bg-slate-50 px-8 py-5 flex items-center justify-between border-t border-slate-100">
                    <div className="flex gap-8">
                       <div className="flex items-center gap-3">
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Items</span>
                         <span className="text-sm font-bold text-[#1e293b]">{totals.totalItems}</span>
                       </div>
                       <div className="flex items-center gap-3">
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Unidades</span>
                         <span className="text-sm font-bold text-[#1e293b]">{totals.totalUnidades}</span>
                       </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Summary Card */}
        <div className="space-y-8">
          <div className="bg-gradient-to-br from-[#0f5da9] to-[#0b4885] rounded-[2.5rem] p-10 text-white shadow-2xl sticky top-8 relative overflow-hidden border-4 border-white/10">
            <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-white/10 rounded-full blur-2xl" />
            
            <h2 className="text-xl font-bold mb-10 border-b border-white/5 pb-5 flex items-center gap-3">
              <ClipboardList size={24} className="text-[#fe4a65]" />
              Consolidado
            </h2>
            
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-white/60">
                  <span className="text-xs font-extrabold uppercase tracking-[0.2em]">Subtotal</span>
                  <span className="text-base font-black text-white tabular-nums">{formatCurrency(totals.subtotal)}</span>
                </div>
                
                <div className="space-y-3">
                   <div className="flex items-center justify-between">
                     <label className="text-xs font-extrabold text-white/60 uppercase tracking-[0.2em]">Descuento (%)</label>
                     <div className="relative w-28">
                        <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                        <input 
                          type="number"
                          value={header.Descuento}
                          onChange={(e) => setHeader({...header, Descuento: e.target.value})}
                          onFocus={(e) => { if (e.target.value === '0') setHeader({...header, Descuento: ''}) }}
                          onKeyDown={handleBlurOnEnter}
                          placeholder="0"
                          className="w-full pl-9 pr-3 py-2 bg-white/10 border border-white/20 rounded-xl text-sm font-extrabold text-white outline-none focus:border-[#fe4a65]"
                        />
                     </div>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-[11px] font-extrabold text-[#fe4a65] uppercase">Monto Descontado</span>
                     <span className="text-sm font-black text-[#fe4a65] tabular-nums">-{formatCurrency(totals.discountAmount)}</span>
                   </div>
                </div>
              </div>
              
              <div className="pt-8 border-t border-white/10">
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] mb-2">Importe Neto Final</p>
                <p className="text-5xl font-bold text-white tracking-tighter tabular-nums">{formatCurrency(totals.total)}</p>
              </div>
              
              <div className="pt-6">
                <label className="block group">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4 block group-focus-within:text-[#fe4a65] transition-colors">Observaciones Internas</span>
                  <textarea
                    value={header.Observaciones}
                    onChange={(e) => setHeader({...header, Observaciones: e.target.value})}
                    rows="4"
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-[1.5rem] text-sm font-bold text-white placeholder-white/10 focus:outline-none focus:border-[#fe4a65] transition-all resize-none"
                    placeholder="Escriba notas relevantes..."
                  />
                </label>
              </div>

              <div className="space-y-4 pt-6">
                <button
                  type="submit"
                  disabled={loading || items.length === 0}
                  className="w-full flex items-center justify-center gap-4 bg-[#fe4a65] hover:bg-[#e63e58] disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold py-6 rounded-[1.5rem] shadow-2xl shadow-[#fe4a65]/40 transition-all transform active:scale-95 text-xs uppercase tracking-[0.2em]"
                >
                  {loading ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={22} strokeWidth={3} />}
                  {loading ? 'Procesando...' : 'Generar Pedido'}
                </button>
                
                <button
                  type="button"
                  onClick={() => navigate('/pedidos')}
                  className="w-full flex items-center justify-center gap-2 text-white/20 hover:text-white/60 font-bold text-[9px] uppercase tracking-[0.3em] transition-all py-2"
                >
                  <X size={14} />
                  Cancelar Todo
                </button>
              </div>
            </div>
            
            <div className="mt-12 flex items-start gap-4 p-5 bg-white/5 border border-white/5 rounded-[1.5rem]">
              <Info size={18} className="text-[#fe4a65] mt-0.5 shrink-0" />
              <p className="text-[10px] text-white/40 leading-relaxed font-bold uppercase tracking-tight">
                Al confirmar, se generará una nueva orden de venta.<br/>
                Verificá que el stock sea suficiente antes de proceder.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
