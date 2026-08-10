import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, FileSpreadsheet, Package, Search, 
  ChevronLeft, ChevronRight, Filter, Download
} from 'lucide-react'
import { useData } from '../../context/DataContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { PERFILES, normalizePerfil } from '../../utils/permisos.js'
import { formatCurrency, formatDate, calcEstadoBadge } from '../../utils/format.js'

export default function PresupuestosStock() {
  const navigate = useNavigate()
  const { pedidos, fetchPedidos, loading: loadingPedidos, hydrateDetails } = useData()
  const { user } = useAuth()
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (pedidos && Array.isArray(pedidos) && typeof hydrateDetails === 'function') {
      const budgetSysIds = pedidos.filter(p => calcEstadoBadge(p) === 'budget_sys').map(p => p.IDPedido)
      if (budgetSysIds.length > 0) {
        hydrateDetails(budgetSysIds)
      }
    }
  }, [pedidos, hydrateDetails])

  // 1. Obtener todos los ítems de pedidos en estado "0.0"
  const itemsPresupuesto = useMemo(() => {
    if (!pedidos) return []
    
    const presupuestos = pedidos.filter(p => calcEstadoBadge(p) === 'budget_sys')
    const allItems = []
    
    presupuestos.forEach(p => {
      if (p.detalles && Array.isArray(p.detalles)) {
        p.detalles.forEach(d => {
          allItems.push({
            IDPedido: p.IDPedido,
            Fecha: p['Fecha y hora'],
            Cliente: p.Nombre || p['Razón social (NO BD)'],
            Item: d['Nombre (más alla de si es item o nombre)'] || d['Nombre item'],
            Codigo: d['Codigo (más alla de si es item o nombre)'] || d['Item  codigo'],
            Cantidad: parseFloat(d.Cantidad) || 0,
            Precio: parseFloat(d.Precio) || 0,
            Subtotal: (parseFloat(d.Cantidad) || 0) * (parseFloat(d.Precio) || 0),
            Proveedor: d.Proveedor || '—',
            NroCliente: p.Cliente || p.IDCliente || p.Nombre || p['Razón social (NO BD)']
          })
        })
      }
    })
    
    return allItems
  }, [pedidos])

  const filtrados = useMemo(() => {
    if (!search.trim()) return itemsPresupuesto
    const q = search.toLowerCase()
    return itemsPresupuesto.filter(i => 
      (i.Item && i.Item.toLowerCase().includes(q)) || 
      (i.Codigo && String(i.Codigo).toLowerCase().includes(q)) ||
      (i.Cliente && i.Cliente.toLowerCase().includes(q)) ||
      String(i.IDPedido).includes(q)
    )
  }, [itemsPresupuesto, search])

  const totals = useMemo(() => {
    const uniquePedidos = new Set(filtrados.map(i => i.IDPedido)).size
    const uniqueClientes = new Set(filtrados.map(i => i.NroCliente).filter(Boolean)).size
    const uniqueItems = new Set(filtrados.map(i => i.Codigo)).size
    const totalUnits = filtrados.reduce((acc, i) => acc + i.Cantidad, 0)
    const totalMoney = filtrados.reduce((acc, i) => acc + i.Subtotal, 0)
    const uniqueProviders = new Set(filtrados.map(i => i.Proveedor)).size

    return {
      pedidos: uniquePedidos,
      clientes: uniqueClientes,
      items: uniqueItems,
      units: totalUnits,
      money: totalMoney,
      providers: uniqueProviders
    }
  }, [filtrados])

  const handleExportExcel = () => {
    // Generate CSV content
    const headers = ['IDPedido', 'Fecha Pedido', 'Cliente', 'Item', 'Código', 'Cantidad', 'Precio', 'Subtotal', 'Proveedor']
    const rows = filtrados.map(i => [
      i.IDPedido,
      formatDate(i.Fecha),
      i.Cliente,
      i.Item,
      i.Codigo,
      i.Cantidad,
      i.Precio,
      i.Subtotal,
      i.Proveedor
    ])

    // Add footer to CSV (Single totals row)
    rows.push([
      `TOTAL: ${totals.pedidos} ped.`, 
      '', 
      `${totals.clientes} clientes`, 
      `${totals.items} items`, 
      '', 
      totals.units, 
      '', 
      totals.money, 
      `${totals.providers} prov.`
    ])

    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(";")).join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `Stock_Presupuestos_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="max-w-[95%] mx-auto space-y-6 pb-12 animate-fade-in px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              if (window.history.state && window.history.state.idx > 0) {
                navigate(-1)
              } else {
                navigate('/productos')
              }
            }} 
            className="size-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#0f5da9] transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#1e293b] tracking-tight">Presupuestos en Sistema (0.0)</h1>
            <p className="text-[#0f5da9] font-bold uppercase text-[10px] tracking-widest mt-1">
              Consolidado de stock reservado en presupuestos
            </p>
          </div>
        </div>

        <button 
          onClick={handleExportExcel}
          className="flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-4 rounded-2xl shadow-xl shadow-emerald-600/20 transition-all transform active:scale-95 text-xs uppercase tracking-widest"
        >
          <FileSpreadsheet size={18} />
          Exportar Excel
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-xl shadow-black/5 p-6 flex items-center gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filtrar por item, código, cliente o pedido..."
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-[#1e293b] focus:ring-4 focus:ring-[#0f5da9]/5 transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-xl shadow-black/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID Pedido</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cliente</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Producto / Item</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Código</th>
                <th className="px-4 py-5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cantidad</th>
                <th className="px-4 py-5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Precio</th>
                <th className="px-6 py-5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subtotal</th>
                <th className="px-6 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Proveedor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-20 text-center">
                    <Package size={48} className="text-slate-100 mx-auto mb-4" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No hay presupuestos activos en el sistema</p>
                  </td>
                </tr>
              ) : (
                filtrados.map((item, idx) => (
                  <tr key={`${item.IDPedido}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-[#1e293b]">#{item.IDPedido}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-400">{formatDate(item.Fecha)}</td>
                    <td className="px-6 py-4 text-xs font-bold text-[#1e293b] uppercase truncate max-w-[200px]" title={item.Cliente}>{item.Cliente}</td>
                    <td className="px-6 py-4 text-xs font-bold text-[#1e293b] truncate max-w-[250px]" title={item.Item}>{item.Item}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{item.Codigo}</td>
                    <td className="px-4 py-4 text-center">
                      <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg text-[10px] font-bold tabular-nums">{item.Cantidad}</span>
                    </td>
                    <td className="px-4 py-4 text-right text-xs font-bold text-slate-500 tabular-nums">{formatCurrency(item.Precio)}</td>
                    <td className="px-6 py-4 text-right text-xs font-bold text-[#1e293b] tabular-nums">{formatCurrency(item.Subtotal)}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">{item.Proveedor}</td>
                  </tr>
                ))
              )}
            </tbody>
            {filtrados.length > 0 && (
              <tfoot>
                <tr className="bg-slate-900 text-white border-t border-slate-800">
                  <td className="px-6 py-8" colSpan={2}>
                    <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-1">Total Pedidos</p>
                    <p className="text-xl font-bold">{totals.pedidos}</p>
                  </td>
                  <td className="px-6 py-8">
                    <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-1">Total Clientes</p>
                    <p className="text-xl font-bold">{totals.clientes}</p>
                  </td>
                  <td className="px-6 py-8" colSpan={2}>
                    <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-1">Items Distintos</p>
                    <p className="text-xl font-bold">{totals.items}</p>
                  </td>
                  <td className="px-4 py-8 text-center">
                    <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-1">Unidades</p>
                    <p className="text-xl font-bold">{totals.units}</p>
                  </td>
                  <td className="px-4 py-8 text-right">
                    {/* Spacer */}
                  </td>
                  <td className="px-6 py-8 text-right">
                    <p className="text-[8px] font-bold text-[#fe4a65] uppercase tracking-widest mb-1">Suma Total $</p>
                    <p className="text-3xl font-bold tracking-tighter text-white">{formatCurrency(totals.money)}</p>
                  </td>
                  <td className="px-6 py-8 text-left">
                    <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-1">Proveedores</p>
                    <p className="text-xl font-bold">{totals.providers}</p>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
