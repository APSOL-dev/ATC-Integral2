import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Package, Tag, Layers, 
  ShoppingCart, Info, TrendingUp,
  CheckCircle, AlertCircle, ShoppingBag, Clock
} from 'lucide-react'
import { formatCurrency, formatDateTime, getStatusConfig, calcEstadoBadge } from '../../utils/format.js'
import { useData } from '../../context/DataContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { puedeDo } from '../../utils/permisos.js'
import StatusBadge from '../../components/shared/StatusBadge.jsx'

export default function ProductoDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { pedidos, productos, loading: globalLoading } = useData()
  const [producto, setProducto] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!globalLoading && Array.isArray(productos)) {
      const item = productos.find(p => String(p.CODART) === String(id))
      setProducto(item || null)
      setLoading(false)
    }
  }, [id, productos, globalLoading])

  const hasStock = useMemo(() => {
    if (!producto) return false
    const s = parseFloat(producto.stock || producto.STOCK_ACTUAL || producto.Stock01 || 0)
    return s > 0
  }, [producto])

  const pedidosRecientes = useMemo(() => {
    if (!Array.isArray(pedidos) || !producto) return []
    const matching = []
    pedidos.forEach(p => {
      if (Array.isArray(p.detalles)) {
        const hasItem = p.detalles.some(d => {
          const itemCode = String(d['Item  codigo'] || d['Codigo (más alla de si es item o nombre)'] || '')
          return itemCode === String(id)
        })
        if (hasItem) matching.push(p)
      }
    })
    return matching.sort((a, b) => new Date(b['Fecha y hora']) - new Date(a['Fecha y hora'])).slice(0, 5)
  }, [pedidos, producto, id])

  if (loading) return (
    <div className="py-24 text-center space-y-4">
      <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest italic">Cargando ficha técnica...</p>
    </div>
  )

  if (!producto) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Package size={48} className="text-slate-200 mb-6" />
      <h3 className="text-xl font-bold text-[#1e293b]">Producto no encontrado</h3>
      <button onClick={() => navigate('/productos')} className="mt-4 text-[#0f5da9] font-bold uppercase text-xs tracking-widest hover:underline">
        ← Volver al catálogo
      </button>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 px-4">
      
      {/* Top Bar */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            if (window.history.state && window.history.state.idx > 0) {
              navigate(-1)
            } else {
              navigate('/productos')
            }
          }}
          className="size-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#0f5da9] hover:border-[#0f5da9] transition-all transform active:scale-90"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-[#1e293b] tracking-tight">{producto.DESCRI || 'Sin descripción'}</h1>
          <p className="text-[#0f5da9] font-bold uppercase text-[10px] tracking-widest mt-1">CÓDIGO: {producto.CODART || id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-xl shadow-black/5 p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 -mr-16 -mt-16 bg-[#0f5da9]/5 rounded-full blur-3xl" />
            
            <div className="flex items-center gap-3 mb-12 relative z-10">
               <div className="size-10 rounded-xl bg-[#0f5da9]/10 flex items-center justify-center text-[#0f5da9]">
                 <Info size={20} />
               </div>
               <h2 className="text-xl font-bold text-[#1e293b]">Ficha Técnica</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 relative z-10">
              <div className="space-y-8">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Descripción</p>
                  <p className="text-lg font-bold text-[#1e293b] leading-tight">{producto.DESCRI || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Marca</p>
                  <div className="flex items-center gap-2 text-[#1e293b] font-bold">
                    <Tag size={16} className="text-indigo-500" />
                    <span>{producto.NombreMarca || 'Genérica'}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Familia / Categoría</p>
                  <div className="flex items-center gap-2 text-[#1e293b] font-bold">
                    <Layers size={16} className="text-sky-500" />
                    <span>{producto.NombreFamilia || 'Sin categoría'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Precio Lista (Con IVA)</p>
                  <p className="text-3xl font-bold text-[#0f5da9] tracking-tighter">
                    {formatCurrency(producto.CC_CIVA || producto.PRECIO || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Disponibilidad</p>
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${hasStock ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'} w-fit`}>
                    {hasStock ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    <span className="text-sm font-bold uppercase tracking-widest">{hasStock ? 'En Stock' : 'Sin Stock'}</span>
                    <span className="ml-2 font-bold text-lg">{producto.stock || producto.STOCK_ACTUAL || 0}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Proveedor</p>
                  <div className="flex items-center gap-2 text-[#1e293b] font-bold">
                    <Layers size={16} className="text-slate-400" />
                    <span>{producto.Proveedor || 'ATC'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Analysis Placeholder */}
          {/* Recent Orders for this product */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-xl shadow-black/5 p-10">
            <div className="flex items-center gap-3 mb-10">
              <div className="size-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Clock size={20} />
              </div>
              <h2 className="text-xl font-bold text-[#1e293b]">Últimos Pedidos con este Artículo</h2>
            </div>

            {pedidosRecientes.length > 0 ? (
              <div className="space-y-4">
                {pedidosRecientes.map(p => (
                  <div key={p.IDPedido} onClick={() => navigate(`/pedidos/${p.IDPedido}`)} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all cursor-pointer group">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="size-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#0f5da9] group-hover:text-white transition-all">
                        <Package size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#1e293b] truncate">#{p.IDPedido} — {p.Nombre || p['Razón social (NO BD)']}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{formatDateTime(p['Fecha y hora'])}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <StatusBadge pedido={p} />
                      <span className="text-xs font-bold text-[#0f5da9] opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">Ver Pedido →</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                <p className="text-slate-400 font-bold text-sm">No hay pedidos recientes registrados para este artículo.</p>
              </div>
            )}
          </div>
        </div>

         {/* Sidebar Actions */}
         {puedeDo(user?.perfil, 'pedidos', 'create') && (
           <div className="space-y-8">
              <div className="bg-[#fe4a65] rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700" />
                 <ShoppingBag size={48} className="text-white/10 absolute bottom-6 right-6" />
                 
                 <h3 className="text-2xl font-bold mb-2">Venta Directa</h3>
                 <p className="text-white/60 text-xs font-bold leading-relaxed mb-10">
                   Agregá este producto a un nuevo pedido inmediatamente.
                 </p>
  
                 <button 
                  onClick={() => navigate('/pedidos/nuevo', { state: { addItem: producto } })}
                  className="w-full py-5 bg-white text-[#fe4a65] rounded-2xl font-bold uppercase text-xs tracking-widest shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-3"
                 >
                    <ShoppingCart size={18} />
                    Crear Pedido con Item
                 </button>
              </div>
           </div>
         )}

      </div>
    </div>
  )
}
