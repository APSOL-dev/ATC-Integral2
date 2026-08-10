import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Building2, MapPin, Phone, Mail, 
  Calendar, Hash, Globe, CreditCard, Clock, ChevronRight, ExternalLink, User, Tag, MessageSquare, Search,
  Check, ShoppingBag, Plus, Minus, X, FileText, Download, List, DollarSign
} from 'lucide-react'
import { formatCurrency, formatDateTime, formatDate, getStatusConfig, calcEstadoBadge, parseCurrency } from '../../utils/format.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useData } from '../../context/DataContext.jsx'
import StatusBadge from '../../components/shared/StatusBadge.jsx'
import { puedeDo } from '../../utils/permisos.js'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default function ClienteDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { pedidos, productos: globalProductos, preloadedClientes, hydrateDetails } = useData()
  
  const [cliente, setCliente] = useState(() => (preloadedClientes && preloadedClientes[id]) || null)
  const [loading, setLoading] = useState(() => !(preloadedClientes && preloadedClientes[id]))
  const [historialPedidos, setHistorialPedidos] = useState([])
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const reportRef = useRef(null)

  useEffect(() => {
    if (preloadedClientes && preloadedClientes[id]) {
      setCliente(preloadedClientes[id])
      setLoading(false)
    }

    fetch(`${import.meta.env.VITE_API_URL}/clientes/${id}`)
      .then(res => res.json())
      .then(data => {
        setCliente(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching cliente detail:', err)
        if (!(preloadedClientes && preloadedClientes[id])) {
          setLoading(false)
        }
      })
  }, [id, preloadedClientes])

  useEffect(() => {
    // We filter history from global state
    const filtered = (pedidos || []).filter(p => 
      String(p.NRO_CLIENTE || p.Cliente || '').trim() === String(id).trim()
    )
    const sorted = filtered.sort((a, b) => new Date(b['Fecha y hora']) - new Date(a['Fecha y hora']))
    setHistorialPedidos(sorted)

    if (sorted.length > 0 && typeof hydrateDetails === 'function') {
      const ids = sorted.slice(0, 30).map(p => p.IDPedido).filter(Boolean)
      hydrateDetails(ids)
    }
  }, [pedidos, id, hydrateDetails])

  // WhatsApp Product Share Feature
  const [showProductShare, setShowProductShare] = useState(false)
  const availableProducts = globalProductos
  const [selectedProducts, setSelectedProducts] = useState([])
  const [shareComment, setShareComment] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [generalDiscount, setGeneralDiscount] = useState(0)

  const filteredProducts = availableProducts.filter(p => 
    (p.DESCRI || '').toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.CODART || '').toLowerCase().includes(productSearch.toLowerCase())
  ).slice(0, 50)

  const toggleProduct = (prod) => {
    const prodId = prod.CODART
    if (selectedProducts.find(p => p.CODART === prodId)) {
      setSelectedProducts(selectedProducts.filter(p => p.CODART !== prodId))
    } else {
      setSelectedProducts([...selectedProducts, prod])
    }
  }

  const handleSendWhatsAppProducts = () => {
    if (selectedProducts.length === 0) return alert('Seleccioná al menos un producto')
    
    let msg = `*LISTA DE PRECIOS - A TODO COLOR*\n\nHola *${cliente.NOMBRE_CLIENTE || cliente.NOMBRE}*! Te compartimos los precios solicitados:\n\n`
    let totalNet = 0
    const disc = parseFloat(generalDiscount) || 0
    
    selectedProducts.forEach(p => {
      const basePrice = parseFloat(p.CC_CIVA || p.PRECIO || 0)
      const discountVal = disc > 0 ? (basePrice * (disc / 100)) : 0
      const finalPrice = basePrice - discountVal
      totalNet += finalPrice
      
      msg += `• *${p.DESCRI}*\n`
      msg += `  Código: ${p.CODART}\n`
      if (disc > 0) {
        msg += `  Precio Lista: ${formatCurrency(basePrice)}\n`
        msg += `  *Precio Final (-${disc}%): ${formatCurrency(finalPrice)}*\n\n`
      } else {
        msg += `  *Precio: ${formatCurrency(basePrice)}*\n\n`
      }
    })
    
    if (selectedProducts.length > 1) {
      msg += `*TOTAL ESTIMADO: ${formatCurrency(totalNet)}*\n\n`
    }
    
    if (shareComment) {
      msg += `*Nota:* ${shareComment}\n\n`
    }
    msg += `_Quedo a disposición por cualquier consulta. Saludos_`

    const phone = (cliente.TELE || cliente.TELEFONO || '').replace(/\D/g, '')
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
    setShowProductShare(false)
    setSelectedProducts([])
    setShareComment('')
    setGeneralDiscount(0)
  }

  const handleDownloadHistoryPDF = async () => {
    if (!reportRef.current) return
    setIsGeneratingPDF(true)
    
    try {
      // Small timeout to ensure everything is rendered
      await new Promise(resolve => setTimeout(resolve, 500))

      const element = reportRef.current
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 800 // Consistent width for report
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgProps = pdf.getImageProperties(imgData)
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`Historial_${cliente.NOMBRE_CLIENTE || cliente.NOMBRE}.pdf`)
    } catch (err) {
      console.error('Error generating PDF:', err)
      alert('Error al generar el PDF')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  if (loading) return (
    <div className="py-24 text-center space-y-4">
      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest italic">Cargando ficha del cliente...</p>
    </div>
  )

  if (!cliente) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Building2 size={48} className="text-slate-200 mb-6" />
      <h3 className="text-xl font-bold text-[#1e293b]">Cliente no encontrado</h3>
      <button onClick={() => navigate('/clientes')} className="mt-4 text-[#0f5da9] font-bold uppercase text-xs tracking-widest hover:underline">
        ← Volver al listado
      </button>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 px-4 print:p-0">
      
      {/* Header & Main Info Section */}
      <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-xl shadow-black/5 overflow-hidden print:hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (window.history.state && window.history.state.idx > 0) {
                  navigate(-1)
                } else {
                  navigate('/clientes')
                }
              }}
              className="size-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#0f5da9] hover:border-[#0f5da9] transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-[#1e293b] tracking-tight">{cliente.NOMBRE_CLIENTE || cliente.NOMBRE}</h1>
                <div className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[9px] font-bold uppercase tracking-widest">Activo</div>
              </div>
              <p className="text-[#0f5da9] font-bold uppercase text-[10px] tracking-widest mt-1">ID Cuenta: #{cliente.NRO_CLIENTE}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Ocultado temporalmente - Compartir Precios */}
            {false && (
              <button 
                onClick={() => setShowProductShare(true)}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-3 rounded-xl shadow-lg shadow-emerald-600/20 transition-all text-[10px] uppercase tracking-widest"
              >
                <MessageSquare size={16} />
                Compartir Precios
              </button>
            )}
            {puedeDo(user?.perfil, 'pedidos', 'create') && (
              <button 
                onClick={() => navigate(`/pedidos/nuevo?cliente=${cliente.NRO_CLIENTE}`)} 
                className="flex items-center gap-2 bg-[#0f5da9] hover:bg-[#0d4d8c] text-white font-bold px-5 py-3 rounded-xl shadow-lg shadow-[#0f5da9]/20 transition-all text-[10px] uppercase tracking-widest"
              >
                <Plus size={16} />
                Nuevo Pedido
              </button>
            )}
          </div>
        </div>

        {/* Data Grid */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-6">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <User size={14} className="text-[#0f5da9]" />
              Datos de Contacto
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3.5">
                <Phone size={18} className="text-emerald-500 shrink-0" />
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Teléfono / WhatsApp</p>
                  <p className="text-sm font-bold text-[#1e293b]">{cliente.TELE || cliente.TELEFONO || '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3.5">
                <MapPin size={18} className="text-[#fe4a65] shrink-0" />
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Dirección Comercial</p>
                  <p className="text-sm font-bold text-slate-600 uppercase leading-tight">{cliente.DIREC || cliente.DOMICILIO || '—'}, {cliente.LOCALIDAD || ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-3.5">
                <User size={18} className="text-[#0f5da9] shrink-0" />
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Vendedor Asignado</p>
                  <p className="text-sm font-bold text-[#1e293b] uppercase tracking-tight">{cliente.VENDEDOR_NOMBRE || cliente.VENDEDOR || 'No asignado'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Building2 size={14} className="text-[#0f5da9]" />
              Identificación Fiscal
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">CUIT / Identificador</p>
                <p className="text-base font-bold text-[#1e293b]">{cliente.CUIT || '—'}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Localidad</p>
                <p className="text-sm font-bold text-slate-600 uppercase">{cliente.LOCALIDAD || 'No especificada'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-[#0f5da9] to-[#0b4885] rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 bg-white/10 rounded-full blur-xl" />
               <div className="space-y-4 relative z-10">
                 <div className="flex justify-between items-center">
                   <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Saldo Actual</span>
                   <span className={`text-2xl font-bold ${Number(cliente.SALDO) > 0 ? 'text-red-300' : 'text-emerald-300'}`}>
                     {formatCurrency(cliente.SALDO || 0)}
                   </span>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
        
      {/* Order History Section (Below Client Data) */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-xl shadow-black/5 overflow-hidden print:hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0f5da9]/10 text-[#0f5da9] flex items-center justify-center overflow-visible">
                <List size={20} className="overflow-visible !overflow-visible" style={{ overflow: 'visible' }} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#1e293b]">Últimos Pedidos</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{historialPedidos.length} registros</p>
              </div>
            </div>
            <button 
              onClick={handleDownloadHistoryPDF} 
              disabled={isGeneratingPDF}
              className="px-5 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-bold text-slate-400 hover:text-[#0f5da9] hover:border-[#0f5da9] transition-all uppercase tracking-[0.2em] flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isGeneratingPDF ? (
                <div className="w-4 h-4 border-2 border-slate-200 border-t-[#0f5da9] rounded-full animate-spin" />
              ) : (
                <FileText size={16} />
              )}
              {isGeneratingPDF ? 'Generando...' : 'Descargar Historial (PDF)'}
            </button>
        </div>

        <div className="p-6">
          {historialPedidos.length === 0 ? (
            <div className="text-center py-12 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
              <p className="text-slate-400 font-bold text-sm">Sin actividad reciente registrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {historialPedidos.map(p => (
                <div 
                  key={p.IDPedido} 
                  onClick={() => navigate(`/pedidos/${p.IDPedido}`)} 
                  className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="size-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#0f5da9] group-hover:text-white transition-all shrink-0">
                      <ShoppingBag size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-[#1e293b] truncate group-hover:text-[#0f5da9] transition-colors">
                        #{p.IDPedido}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                        {formatDateTime(p['Fecha y hora'])}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 shrink-0">
                    <StatusBadge pedido={p} />
                    <div className="text-right min-w-[100px]">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Total</span>
                      <p className="text-sm font-bold text-[#1e293b] tabular-nums">
                        {formatCurrency(p.Total || 0)}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-[#0f5da9] opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                      Ver Pedido →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp Product Share Modal */}
      {showProductShare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in print:hidden">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-slide-up">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
              <div>
                <h3 className="text-xl font-bold text-[#1e293b]">Enviar Lista de Precios</h3>
                <p className="text-[10px] font-bold text-[#0f5da9] uppercase tracking-widest">Selección de productos y descuentos</p>
              </div>
              <button onClick={() => setShowProductShare(false)} className="size-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-100 transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row divide-x divide-slate-100">
              {/* Product Selector */}
              <div className="flex-1 p-8 flex flex-col min-h-0">
                <div className="relative mb-6">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input 
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    placeholder="Buscar productos por nombre o código..."
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-[#1e293b] focus:border-[#0f5da9] focus:bg-white transition-all"
                  />
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-1 gap-2 pr-2">
                  {filteredProducts.map(p => {
                    const selected = selectedProducts.find(s => s.CODART === p.CODART)
                    return (
                      <div 
                        key={p.CODART}
                        onClick={() => toggleProduct(p)}
                        className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${selected ? 'bg-[#0f5da9]/5 border-[#0f5da9] shadow-sm' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${selected ? 'bg-[#0f5da9] text-white' : 'bg-slate-50 text-slate-300'}`}>
                            {selected ? <Check size={18} /> : <Plus size={18} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-[#1e293b] line-clamp-1">{p.DESCRI}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">{p.CODART} • {formatCurrency(p.CC_CIVA || p.PRECIO || 0)}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Composition & Final Step */}
              <div className="w-full md:w-80 bg-slate-50/50 p-8 flex flex-col">
                <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar">
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Configuración del Mensaje</h4>
                    
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Descuento General (%)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0f5da9] font-bold text-xs">%</span>
                          <input 
                            type="number"
                            value={generalDiscount}
                            onChange={e => setGeneralDiscount(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-[#1e293b] focus:outline-none focus:border-[#0f5da9]"
                          />
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Comentario Extra</label>
                        <textarea 
                          value={shareComment}
                          onChange={e => setShareComment(e.target.value)}
                          placeholder="Ej: Solo por esta semana..."
                          className="w-full h-24 p-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-[#1e293b] resize-none focus:outline-none focus:border-[#0f5da9]"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Seleccionados ({selectedProducts.length})</h4>
                    <div className="space-y-2">
                      {selectedProducts.map(p => (
                        <div key={p.CODART} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 text-[10px] font-bold text-[#1e293b]">
                          <span className="truncate">{p.DESCRI}</span>
                          <button onClick={(e) => { e.stopPropagation(); toggleProduct(p); }} className="text-red-400 hover:text-red-600"><X size={14} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleSendWhatsAppProducts}
                  disabled={selectedProducts.length === 0}
                  className="w-full mt-8 py-5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-30 text-white font-bold uppercase text-xs tracking-widest rounded-[1.5rem] shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-3 group"
                >
                  <MessageSquare size={18} className="group-hover:scale-110 transition-transform" />
                  Enviar WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Printable History Report Container */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0, width: '800px', zIndex: -1 }}>
        <div ref={reportRef} className="bg-white p-12 text-slate-900">
          <div className="flex justify-between items-start border-b-8 border-[#0f5da9] pb-10 mb-12">
            <div className="space-y-4">
              <div className="bg-[#0f5da9] text-white px-6 py-4 rounded-xl inline-block">
                <h1 className="text-4xl font-bold tracking-tighter">A TODO COLOR</h1>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">REPORTE DE HISTORIAL DE PEDIDOS</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-[#1e293b] uppercase leading-none mb-2">{cliente?.NOMBRE_CLIENTE || cliente?.NOMBRE}</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID Cuenta: #{cliente?.NRO_CLIENTE}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Generado: {formatDate(new Date())}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 mb-12">
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
              <p className="text-[10px] font-bold text-[#0f5da9] uppercase tracking-widest mb-2">Vendedor Asignado</p>
              <p className="text-lg font-bold text-[#1e293b] uppercase">{cliente?.VENDEDOR_NOMBRE || cliente?.VENDEDOR || 'No especificado'}</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
              <p className="text-[10px] font-bold text-[#0f5da9] uppercase tracking-widest mb-2">Resumen de Actividad</p>
              <p className="text-lg font-bold text-[#1e293b] uppercase">{historialPedidos.length} Pedidos Registrados</p>
            </div>
          </div>

          <table className="w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-[#0f5da9]">
                <th className="text-left py-4 px-6 text-[10px] font-bold uppercase tracking-widest border-b-2 border-[#0f5da9]">Nº Pedido</th>
                <th className="text-left py-4 px-4 text-[10px] font-bold uppercase tracking-widest border-b-2 border-[#0f5da9]">Fecha</th>
                <th className="text-left py-4 px-4 text-[10px] font-bold uppercase tracking-widest border-b-2 border-[#0f5da9]">Estado</th>
                <th className="text-right py-4 px-6 text-[10px] font-bold uppercase tracking-widest border-b-2 border-[#0f5da9]">Monto Total</th>
              </tr>
            </thead>
            <tbody>
              {historialPedidos.map(p => {
                const badge = calcEstadoBadge(p);
                return (
                  <tr key={p.IDPedido} className="bg-slate-50/50">
                    <td className="py-5 px-6 rounded-l-2xl border-y border-l border-slate-100">
                      <span className="font-bold text-sm">#{p.IDPedido}</span>
                    </td>
                    <td className="py-5 px-4 text-xs font-bold text-slate-500 border-y border-slate-100">
                      {formatDateTime(p['Fecha y hora'])}
                    </td>
                    <td className="py-5 px-4 text-xs font-bold uppercase border-y border-slate-100">
                      {getStatusConfig(badge).label}
                    </td>
                    <td className="py-5 px-6 text-right font-bold text-sm text-[#1e293b] rounded-r-2xl border-y border-r border-slate-100">
                      {formatCurrency(p.Total || 0)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div className="mt-20 pt-10 border-t border-slate-100 text-center">
            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.5em]">Fin del Reporte Histórico — A TODO COLOR</p>
          </div>
        </div>
      </div>
    </div>
  )
}
