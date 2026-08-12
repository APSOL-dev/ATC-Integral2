import { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Calendar, User, MapPin, Phone,
  Tag, Clock, ChevronRight, FileText, Download,
  MessageSquare, ShoppingBag, Info, Printer,
  CheckCircle2, AlertCircle, X, CreditCard, Layers,
  Truck, Check, Play, PackageCheck, FileSpreadsheet, Package,
  Ban, ShieldAlert, Edit2, Trash2, Eye, RefreshCw
} from 'lucide-react'
import { formatCurrency, formatDateTime, formatDate, getStatusConfig, calcEstadoBadge, parseCurrency } from '../../utils/format.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useData } from '../../context/DataContext.jsx'
import { PERFILES, normalizePerfil, puedeDo } from '../../utils/permisos.js'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import html2pdf from 'html2pdf.js'
import EditPedidoModal from './EditPedidoModal.jsx'

export default function PedidoDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { pedidos, fetchPedidos, setPedidos, hydrateDetails } = useData()

  const [pedido, setPedido] = useState(null)
  const [loading, setLoading] = useState(true)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [vendorName, setVendorName] = useState('')
  const [showOriginalModal, setShowOriginalModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [confirmConfig, setConfirmConfig] = useState(null)
  const [isSending, setIsSending] = useState(false)
  const printableRef = useRef(null)

  useEffect(() => {
    if (!pedidos || pedidos.length === 0) return

    const found = pedidos.find(p => String(p.IDPedido) === String(id))

    if (!found) {
      // Pedido no encontrado en contexto — fallback de red
      setLoading(true)
      fetch(`${import.meta.env.VITE_API_URL}/pedidos/${id}`, {
        headers: { ...(user?.token ? { 'Authorization': `Bearer ${user.token}` } : {}) }
      })
        .then(res => { if (!res.ok) throw new Error('No encontrado'); return res.json() })
        .then(data => {
          setPedido(data)
          setLoading(false)
          if (data?.detalles && setPedidos) {
            setPedidos(prev => prev.map(p => String(p.IDPedido) === String(id) ? { ...p, detalles: data.detalles } : p))
          }
        })
        .catch(() => { setPedido(null); setLoading(false) })
      return
    }

    // Pedido encontrado — mostrarlo inmediatamente aunque no tenga detalles
    setPedido(found)
    setLoading(false)

    const hasDetails = found.detalles && Array.isArray(found.detalles) && found.detalles.length > 0
    if (!hasDetails) {
      // Detalles aún no hidratados — disparar hydrateDetails (usa /details-batch, rápido)
      setDetailsLoading(true)
      if (typeof hydrateDetails === 'function') {
        hydrateDetails([id]).finally(() => setDetailsLoading(false))
      } else {
        setDetailsLoading(false)
      }
    }
  }, [id, pedidos])

  // Resolve vendor name (VendedorNombre is already mapped by the server)
  useEffect(() => {
    if (!pedido) return
    setVendorName(pedido.VendedorNombre || pedido.Vendedor || '')
  }, [pedido])

  const isTemp = useMemo(() => {
    const pId = String(pedido?.IDPedido || id || '')
    return Boolean(pedido?.isOptimistic || pId.startsWith('temp-'))
  }, [pedido, id])

  const handleUpdateEstado = (nuevoEstado) => {
    if (isTemp) return
    const execute = () => {
      setConfirmConfig(null)
      setIsSending(true)

      // Background PATCH request
      fetch(`${import.meta.env.VITE_API_URL}/pedidos/${id}/estado`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.token ? { 'Authorization': `Bearer ${user.token}` } : {})
        },
        body: JSON.stringify({ estado: nuevoEstado })
      })
        .then(async res => {
          setIsSending(false)
          if (res.ok) {
            // Update local + global state ONLY after successful server confirmation
            setPedido(prev => prev ? ({ ...prev, Estado: nuevoEstado }) : null)
            if (setPedidos) {
              setPedidos(prev => prev.map(p => String(p.IDPedido) === String(id) ? { ...p, Estado: nuevoEstado } : p))
            }
            fetchPedidos(false, true)
          } else {
            alert('No se pudo cambiar el estado en el servidor. El pedido se mantiene en su estado actual.')
          }
        })
        .catch(error => {
          console.error('Error updating state:', error)
          setIsSending(false)
          alert('Error de conexión al cambiar el estado. El pedido se mantiene en su estado actual.')
        })
    }

    if (nuevoEstado === '1') {
      setConfirmConfig({
        title: '¿Confirmar Pedido?',
        message: '¿Estás seguro de que deseas confirmar este pedido? Se enviará automáticamente para su preparación.',
        action: execute,
        confirmText: 'Sí, Confirmar',
        type: 'primary'
      })
      return
    }

    if (nuevoEstado === '0.0.99') {
      setConfirmConfig({
        title: '¿Anular Presupuesto?',
        message: 'Esta acción marcará el presupuesto como anulado. ¿Deseas continuar?',
        action: execute,
        confirmText: 'Sí, Anular',
        type: 'danger'
      })
      return
    }

    execute()
  }

  const handleDeletePedido = () => {
    if (isTemp || isSending) return
    setConfirmConfig({
      title: '¿Eliminar Pedido?',
      message: '¿Estás seguro de que deseas eliminar este pedido permanentemente? Esta acción no se puede deshacer.',
      confirmText: 'Sí, Eliminar',
      type: 'danger',
      onConfirm: () => {
        const backupPedido = pedido ? { ...pedido } : null

        // 1. Optimistic removal & instant redirect (0ms delay)
        if (setPedidos) {
          setPedidos(prev => prev.filter(p => String(p.IDPedido) !== String(id)))
        }
        setConfirmConfig(null)
        navigate('/pedidos', { replace: true })

        // 2. Background DELETE request
        fetch(`${import.meta.env.VITE_API_URL}/pedidos/${id}`, {
          method: 'DELETE',
          headers: {
            ...(user?.token ? { 'Authorization': `Bearer ${user.token}` } : {})
          }
        })
          .then(async res => {
            if (res.ok) {
              fetchPedidos(false, true)
            } else {
              if (backupPedido && setPedidos) {
                setPedidos(prev => [backupPedido, ...prev])
              }
              alert(`Error al eliminar el pedido #${id}. Se ha restaurado en el listado.`)
            }
          })
          .catch(error => {
            console.error('Error deleting pedido:', error)
            if (backupPedido && setPedidos) {
              setPedidos(prev => [backupPedido, ...prev])
            }
            alert(`Error de conexión al eliminar el pedido #${id}. Se ha restaurado en el listado.`)
          })
      }
    })
  }

  const handleSaveEditOptimistic = (updatedData) => {
    const backupPedido = pedido ? { ...pedido } : null
    setShowEditModal(false)

    // Merged state for optimistic UI update
    const mergedPedido = {
      ...pedido,
      ...updatedData.header,
      Total: updatedData.Total,
      'Porcentaje de descuento (%)': updatedData['Porcentaje de descuento (%)'],
      Observaciones: updatedData.Observaciones,
      'Lugar de entrega': updatedData['Lugar de entrega'],
      detalles: updatedData.detalles
    }

    // Optimistic UI updates
    setPedido(mergedPedido)
    if (setPedidos) {
      setPedidos(prev => prev.map(p => String(p.IDPedido) === String(id) ? mergedPedido : p))
    }

    // Background PUT request
    fetch(`${import.meta.env.VITE_API_URL}/pedidos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(user?.token ? { 'Authorization': `Bearer ${user.token}` } : {})
      },
      body: JSON.stringify({
        header: updatedData.header,
        detalles: updatedData.detalles
      })
    })
      .then(async res => {
        if (res.ok) {
          fetchPedidos(false, true)
        } else {
          // Rollback on error
          if (backupPedido) {
            setPedido(backupPedido)
            if (setPedidos) {
              setPedidos(prev => prev.map(p => String(p.IDPedido) === String(id) ? backupPedido : p))
            }
          }
          alert('Error al guardar las modificaciones en el servidor. Se han restaurado los datos anteriores.')
        }
      })
      .catch(err => {
        console.error('Error updating pedido in background:', err)
        if (backupPedido) {
          setPedido(backupPedido)
          if (setPedidos) {
            setPedidos(prev => prev.map(p => String(p.IDPedido) === String(id) ? backupPedido : p))
          }
        }
        alert('Error de conexión al guardar el pedido. Se han restaurado los datos anteriores.')
      })
  }

  const originalPedido = useMemo(() => {
    if (!pedido || !pedido.Nro_PedidoReferencia || !pedidos) return null
    return pedidos.find(p => String(p.IDPedido) === String(pedido.Nro_PedidoReferencia))
  }, [pedido, pedidos])

  const originalSubtotal = useMemo(() => {
    if (!originalPedido || !originalPedido.detalles) return 0
    return originalPedido.detalles.reduce((acc, item) => acc + (parseCurrency(item.Precio) * parseCurrency(item.Cantidad)), 0)
  }, [originalPedido])

  const handleDownloadPDF = async () => {
    if (!printableRef.current) return
    setIsGeneratingPDF(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      const element = printableRef.current
      const filenameType = (pedido.Estado === '6' || pedido.Estado === '6.') ? 'FACTURA' : 'PRESUPUESTO'

      const opt = {
        margin: 10, // Let's use 10mm margins for proper page breaking and printable space!
        filename: `${filenameType}_Pedido_${pedido.IDPedido}.pdf`,
        image: { type: 'png' },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          logging: false, 
          backgroundColor: '#ffffff',
          width: 800
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: 'css' }
      }

      await html2pdf().set(opt).from(element).save()
    } catch (err) {
      console.error('Error generating PDF:', err)
      alert('Error al generar el PDF')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const handleWhatsAppBudget = () => {
    if (!pedido) return
    const clientName = pedido.Nombre || pedido['Razón social (NO BD)']
    const subtotal = pedido.detalles && pedido.detalles.length > 0
      ? pedido.detalles.reduce((acc, item) => acc + (parseCurrency(item.Precio) * parseCurrency(item.Cantidad)), 0)
      : parseCurrency(pedido.Total)
    const discount = parseCurrency(pedido['Porcentaje de descuento (%)'])
    const discountAmount = subtotal * (discount / 100)
    const finalTotal = subtotal - discountAmount

    let intro = (pedido.Estado === '99' || pedido.Estado === '99.')
      ? `❌ *ATENCIÓN: ESTE PEDIDO HA SIDO ANULADO*\n\n`
      : `Hola *${clientName}*! Te compartimos los detalles de tu pedido en *A TODO COLOR*:\n\n`

    let statusMsg = ""
    if (pedido.Estado === '0' || pedido.Estado === '0.') statusMsg = `Presupuesto enviado para confirmación.\n`
    else if (['1', '1.', '2', '2.'].includes(pedido.Estado)) statusMsg = `Tu pedido está siendo procesado.\n`
    else if (pedido.Estado === '6' || pedido.Estado === '6.') statusMsg = `Tu pedido ya fue facturado.\n`

    let msg = intro + `*Pedido:* #${pedido.IDPedido}\n*Fecha:* ${formatDate(pedido['Fecha y hora'])}\n${statusMsg}\n`
    msg += `----------------------------------\n`
    pedido.detalles.forEach(item => {
      const p = parseCurrency(item.Precio)
      const c = parseCurrency(item.Cantidad)
      const name = item['Nombre (más alla de si es item o nombre)'] || item['Nombre item']
      msg += `• ${name} x${c} -> ${formatCurrency(p * c)}\n`
    })
    msg += `----------------------------------\n*Subtotal:* ${formatCurrency(subtotal)}\n`
    if (discount > 0) {
      msg += `*Descuento (${discount}%):* -${formatCurrency(discountAmount)}\n*TOTAL NETO: ${formatCurrency(finalTotal)}*\n`
    } else msg += `*TOTAL: ${formatCurrency(finalTotal)}*\n`
    msg += `\n_Quedo a disposición por cualquier consulta. Saludos_`
    const phone = (pedido['Celular de contacto'] || '').replace(/\D/g, '')
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const totalsSummary = useMemo(() => {
    if (!pedido || !pedido.detalles) return { items: 0, products: 0 }
    return {
      items: pedido.detalles.length,
      products: pedido.detalles.reduce((acc, item) => acc + parseCurrency(item.Cantidad), 0)
    }
  }, [pedido])

  const isPropio = useMemo(() => {
    if (!pedido || !user) return true
    const profile = normalizePerfil(user.perfil)
    const soloPropio = PERFILES[profile]?.soloPropio
    if (!soloPropio) return true
    
    const userVdor = String(user.nroVendedor || '').trim().toLowerCase()
    const userName = String(user.nombre || '').trim().toLowerCase()
    
    const pVendedor = String(pedido.Vendedor || '').trim().toLowerCase()
    const pEmitido = String(pedido['Emitido por'] || '').trim().toLowerCase()
    const pVdorNombre = String(pedido.VendedorNombre || '').trim().toLowerCase()
    
    return (userVdor && pVendedor === userVdor) || 
           (userName && pEmitido === userName) ||
           (userName && pVdorNombre === userName)
  }, [pedido, user])

  const canEdit = puedeDo(user?.perfil, 'pedidos', 'edit')
  const canApprove = puedeDo(user?.perfil, 'pedidos', 'approve')
  const canDelete = puedeDo(user?.perfil, 'pedidos', 'delete')
  const canAnular = puedeDo(user?.perfil, 'pedidos', 'anular')
  const hasActions = canEdit || canApprove || canDelete || canAnular

  const subtotal = useMemo(() => {
    if (!pedido || !pedido.detalles) return 0
    return pedido.detalles.reduce((acc, item) => acc + (parseCurrency(item.Precio) * parseCurrency(item.Cantidad)), 0)
  }, [pedido])

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-200" />
        <div className="space-y-2">
          <div className="h-6 w-48 bg-slate-200 rounded-xl" />
          <div className="h-3 w-32 bg-slate-100 rounded-xl" />
        </div>
      </div>
      {/* Card skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-100 p-8 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex justify-between items-center gap-4">
              <div className="flex gap-3 items-center flex-1">
                <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 bg-slate-200 rounded w-3/4" />
                  <div className="h-2.5 bg-slate-100 rounded w-1/3" />
                </div>
              </div>
              <div className="h-6 w-20 bg-slate-100 rounded-lg" />
            </div>
          ))}
        </div>
        <div className="bg-slate-100 rounded-[2rem] h-64" />
      </div>
    </div>
  )

  if (!pedido || !isPropio) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <ShoppingBag size={48} className="text-slate-200 mb-6" />
      <h3 className="text-xl font-bold text-[#1e293b]">Pedido no encontrado o sin acceso</h3>
      <button onClick={() => navigate('/pedidos')} className="mt-4 text-[#0f5da9] font-bold uppercase text-xs tracking-widest hover:underline">← Volver al listado</button>
    </div>
  )

  const badge = calcEstadoBadge(pedido)
  const config = getStatusConfig(badge)
  const discPct = parseCurrency(pedido['Porcentaje de descuento (%)'])
  const discAmt = subtotal * (discPct / 100)
  const totalNeto = subtotal - discAmt
  // Only count faltantes when Preparado field has a value AND is less than Cantidad
  const hasFaltantes = pedido.detalles?.some(item => {
    const rawPrep = item.Preparado
    if (!rawPrep || String(rawPrep).trim() === '') return false
    return parseCurrency(rawPrep) < parseCurrency(item.Cantidad)
  })

  const emitidoPor = pedido['Emitido por'] || pedido['Creado por'] || user?.nombre || '—'
  const emitidoFecha = pedido['Emitido Fecha'] || pedido['Fecha y hora']
  const ultimaModif = pedido['Fecha y Hora de Última Modificación'] || pedido['Fecha_Ultima_Modificacion']

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 px-4 print:p-0">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              if (window.history.state && window.history.state.idx > 0) {
                navigate(-1)
              } else {
                navigate('/pedidos')
              }
            }} 
            className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#0f5da9] hover:border-[#0f5da9] transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#1e293b] tracking-tight">Pedido #{pedido.IDPedido}</h1>
              <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${config.bg} ${config.text}`}>{config.label}</span>
              {isTemp && (
                <span className="px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest bg-amber-100 text-amber-700 animate-pulse flex items-center gap-1.5">
                  <RefreshCw size={12} className="animate-spin" /> Generando pedido...
                </span>
              )}
            </div>
            <p className="text-[#0f5da9] font-bold uppercase text-[10px] tracking-widest mt-1">
              {pedido.Nombre || pedido['Razón social (NO BD)']} · {formatDateTime(emitidoFecha)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleDownloadPDF} disabled={isGeneratingPDF} className="flex items-center gap-2 bg-white border border-slate-200 hover:border-[#0f5da9] hover:text-[#0f5da9] text-slate-500 font-bold px-5 py-3 rounded-xl transition-all text-[10px] uppercase tracking-widest shadow-sm disabled:opacity-50">
            {isGeneratingPDF ? <div className="w-4 h-4 border-2 border-slate-200 border-t-[#0f5da9] rounded-full animate-spin" /> : <Download size={16} />}
            {isGeneratingPDF ? 'Generando...' : 'Generar PDF'}
          </button>
          <button onClick={handleWhatsAppBudget} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-3 rounded-xl shadow-lg shadow-emerald-600/20 transition-all text-[10px] uppercase tracking-widest">
            <MessageSquare size={16} /> Enviar WhatsApp
          </button>
        </div>
      </div>

      {/* ── Dos columnas ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start print:hidden">

        {/* ── Columna Izquierda (2/3) ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Tarjeta principal */}
          <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-xl shadow-black/5 overflow-hidden">
            <div className="p-8">
              <div className="flex gap-8">

                {/* Bloque izquierdo: cliente + dirección + contacto */}
                <div className="flex-1 space-y-4">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cliente</p>
                    <p className="text-lg font-bold text-[#1e293b] leading-tight">{pedido.Nombre || pedido['Razón social (NO BD)']}</p>
                  </div>
                  <div className="flex items-start gap-3.5">
                    <MapPin size={18} className="text-[#fe4a65] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Lugar de entrega</p>
                      <p className="text-sm font-bold text-slate-600 uppercase leading-snug">{pedido['Lugar de entrega'] || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3.5">
                    <Phone size={18} className="text-emerald-500 shrink-0" />
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Celular de contacto</p>
                      <p className="text-sm font-bold text-[#1e293b]">{pedido['Celular de contacto'] || '—'}</p>
                    </div>
                  </div>
                  {pedido.Observaciones && String(pedido.Observaciones).trim() !== '' && (
                    <div className="flex items-start gap-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 mt-2">
                      <FileText size={18} className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[9px] font-bold text-amber-700 uppercase tracking-widest">Observaciones del Pedido</p>
                        <p className="text-xs font-bold text-amber-950 leading-snug mt-0.5">{pedido.Observaciones}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Separador vertical */}
                <div className="w-px bg-slate-100 self-stretch" />

                {/* Bloque derecho: vendedor + contadores */}
                <div className="w-48 space-y-4 shrink-0">
                  <div className="flex items-center gap-3.5">
                    <User size={18} className="text-[#0f5da9] shrink-0" />
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Vendedor</p>
                      <p className="text-sm font-bold text-[#1e293b] leading-tight">{vendorName || '—'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 text-center">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ítems</p>
                      <p className="text-2xl font-bold text-[#1e293b] tabular-nums">{totalsSummary.items}</p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 text-center">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Uds.</p>
                      <p className="text-2xl font-bold text-[#1e293b] tabular-nums">{totalsSummary.products}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Línea divisora + metadatos */}
              <div className="mt-6 pt-5 border-t border-slate-100 flex justify-between items-center w-full">
                <div className="flex items-center gap-2">
                  <Clock size={13} className="text-slate-300" />
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Emitido por</p>
                    <p className="text-xs font-bold text-[#1e293b]">{emitidoPor} <span className="font-bold text-slate-400">— {formatDate(emitidoFecha)}</span></p>
                  </div>
                </div>
                {ultimaModif && (
                  <div className="flex items-center gap-2 text-right">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Última modificación</p>
                      <p className="text-xs font-bold text-slate-500">{formatDateTime(ultimaModif)}</p>
                    </div>
                    <Calendar size={13} className="text-slate-300 ml-2" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Alerta faltantes (solo si corresponde) */}
          {hasFaltantes && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-6 py-4">
              <AlertCircle size={18} className="text-amber-500 shrink-0" />
              <p className="text-sm font-bold text-amber-800">Pedido con faltantes — algunos artículos tienen cantidad preparada menor a la solicitada.</p>
            </div>
          )}

          {/* ── Artículos del Pedido ── */}
          <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center gap-3 bg-slate-50/20">
              <div className="w-10 h-10 rounded-xl bg-[#0f5da9]/10 text-[#0f5da9] flex items-center justify-center"><ShoppingBag size={20} /></div>
              <div>
                <h2 className="text-lg font-bold text-[#1e293b]">Artículos del Pedido</h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{totalsSummary.items} ítems · {totalsSummary.products} uds</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {detailsLoading ? (
                // Skeleton de artículos mientras llegan los detalles
                <div className="space-y-3 animate-pulse">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center p-4 rounded-2xl border border-slate-100">
                      <div className="flex gap-3 items-center flex-1">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0" />
                        <div className="space-y-1.5 flex-1">
                          <div className="h-3.5 bg-slate-200 rounded w-2/3" />
                          <div className="h-2.5 bg-slate-100 rounded w-1/4" />
                        </div>
                      </div>
                      <div className="flex gap-4 items-center">
                        <div className="h-6 w-16 bg-slate-100 rounded-lg" />
                        <div className="h-8 w-24 bg-slate-100 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
              pedido.detalles?.map((item, idx) => {
                const price = parseCurrency(item.Precio)
                const qty = parseCurrency(item.Cantidad)
                const rawPrep = item.Preparado
                const hasPrep = rawPrep !== undefined && rawPrep !== null && String(rawPrep).trim() !== ''
                const prep = hasPrep ? parseCurrency(rawPrep) : null
                const itemCode = item['Codigo (más alla de si es item o nombre)'] || item['Item  codigo']
                const itemName = item['Nombre (más alla de si es item o nombre)'] || item['Nombre item'] || ''
                const itemMarca = item.Marca || item.MARCA || item.NombreMarca || ''
                const title = (itemMarca && !itemName.toLowerCase().includes(itemMarca.toLowerCase())) ? `${itemName} - ${itemMarca}` : itemName

                // Stock actual — solo mostrar en estados borrador (0 y 0.0)
                const isBorrador = ['0', '0.', '0.0'].includes(String(pedido.Estado))
                const stockActual = item.StockActual
                const hasStock = isBorrador && stockActual !== undefined && stockActual !== null
                const stockNum = hasStock ? Number(stockActual) : null
                const stockColor = stockNum === null
                  ? ''
                  : stockNum >= qty
                    ? 'bg-emerald-50 text-emerald-700'
                    : stockNum > 0
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-red-50 text-red-600'

                return (
                  <div 
                    key={idx} 
                    onClick={() => itemCode && navigate(`/productos/${itemCode}`)}
                    className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-all ${itemCode ? 'cursor-pointer group' : ''}`}
                  >
                    {/* Product Name & Code */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="size-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#0f5da9] group-hover:text-white transition-all shrink-0">
                        <Package size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-bold text-[#1e293b] leading-tight group-hover:text-[#0f5da9] transition-colors truncate">
                          {title}
                        </p>
                        <p className="text-[11px] font-bold text-slate-400 uppercase mt-0.5">
                          Cód: {itemCode || idx}
                        </p>
                      </div>
                    </div>

                    {/* Quantities & Pricing */}
                    <div className="flex flex-wrap items-center gap-6 mt-3 md:mt-0 justify-between md:justify-end shrink-0">
                      {/* Quantities */}
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Solicitado</span>
                          <span className="inline-block bg-slate-100 text-[#1e293b] font-bold text-xs px-2 py-0.5 rounded-lg tabular-nums">
                            {qty} uds
                          </span>
                        </div>
                        {hasStock && (
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Stock actual</span>
                            <span className={`inline-block font-bold text-sm px-2 py-0.5 rounded-lg tabular-nums ${stockColor}`}>
                              {stockNum} uds
                            </span>
                          </div>
                        )}
                        {hasPrep && (
                          <div className="text-right">
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Preparado</span>
                            <span className={`inline-block font-bold text-xs px-2 py-0.5 rounded-lg tabular-nums ${prep >= qty ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                              {prep} uds
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Pricing */}
                      <div className="text-right min-w-[100px]">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Total</span>
                        <p className="text-sm font-bold text-[#1e293b] tabular-nums">
                          {formatCurrency(price * qty)}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 tabular-nums">
                          {formatCurrency(price)} / ud
                        </p>
                      </div>
                    </div>
                  </div>
                )
              }))
            }
            </div>
            <div className="px-6 py-4 border-t border-slate-50 flex flex-col items-end gap-1.5 bg-slate-50/30">
              <div className="flex items-center gap-6">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Subtotal</span>
                <span className="text-xs font-bold text-[#1e293b] tabular-nums w-28 text-right">{formatCurrency(subtotal)}</span>
              </div>
              {discPct > 0 && (
                <div className="flex items-center gap-6">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Dto. ({discPct}%)</span>
                  <span className="text-xs font-bold text-[#fe4a65] tabular-nums w-28 text-right">-{formatCurrency(discAmt)}</span>
                </div>
              )}
              <div className="flex items-center gap-6 border-t border-slate-200 pt-3 mt-1.5">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Total Neto</span>
                <span className="text-lg font-bold text-[#1e293b] tabular-nums w-28 text-right">{formatCurrency(totalNeto)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Columna Derecha (1/3): Liquidación + Estados ── */}
        <div className="lg:col-span-1 space-y-4">

          {/* Card de Liquidación */}
          <div className="bg-gradient-to-br from-[#0f5da9] to-[#0b4885] rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
            <div className="relative z-10 space-y-4">
              <h3 className="text-[10px] font-bold text-white/70 uppercase tracking-widest flex items-center gap-2"><CreditCard size={13} /> Liquidación</h3>
              <div className="space-y-3 border-t border-white/10 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">Subtotal</span>
                  <span className="text-base font-bold text-white tabular-nums">{formatCurrency(subtotal)}</span>
                </div>
                {discPct > 0 && (
                  <div className="flex justify-between items-center text-red-300">
                    <span className="text-[9px] font-bold uppercase tracking-widest">Dto. {discPct}%</span>
                    <span className="text-base font-bold">-{formatCurrency(discAmt)}</span>
                  </div>
                )}
              </div>
              <div className="bg-white/10 rounded-2xl border border-white/10 p-5 text-right">
                <p className="text-[9px] font-bold text-white/40 uppercase tracking-[0.3em] mb-1">Total Neto</p>
                <p className="text-4xl font-bold text-white tracking-tighter tabular-nums">{formatCurrency(totalNeto)}</p>
              </div>
            </div>
          </div>

          {/* Botones de Acción Especiales y Estados */}
          <div className="space-y-4">
            {/* Solo en 0, 0. o 0.0 */}
            {['0', '0.', '0.0'].includes(String(pedido.Estado)) && hasActions && (
              <div className="bg-white rounded-[1.5rem] border border-slate-200/60 shadow-sm p-5 space-y-3">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Acciones de Presupuesto</p>
                <div className="flex flex-col gap-2">
                  {canEdit && (
                    <button
                      onClick={() => setShowEditModal(true)}
                      disabled={isSending || isTemp}
                      className="w-full bg-slate-100 text-slate-600 px-4 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-slate-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Edit2 size={14} /> Editar
                    </button>
                  )}

                  {/* Pedirlo pasa a 1 */}
                  {canApprove && (
                    <button
                      onClick={() => handleUpdateEstado('1')}
                      disabled={isSending || isTemp}
                      className="w-full bg-[#0f5da9] text-white px-4 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-[#0d4f92] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#0f5da9]/20 disabled:opacity-50"
                    >
                      {isTemp ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" /> Generando pedido...
                        </>
                      ) : isSending ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" /> Enviando...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={14} /> Pedirlo
                        </>
                      )}
                    </button>
                  )}

                  {/* Borrar en estado 0 o 0. */}
                  {['0', '0.'].includes(String(pedido.Estado)) && canDelete && (
                    <button
                      onClick={handleDeletePedido}
                      disabled={isSending || isTemp}
                      className="w-full text-slate-400 border border-slate-200 hover:border-red-200 hover:text-red-500 hover:bg-red-50 px-4 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                    >
                      <Trash2 size={14} /> Borrar
                    </button>
                  )}

                  {/* Anular en estado 0.0 (pasa a 0.0.99) */}
                  {String(pedido.Estado) === '0.0' && canAnular && (
                    <button
                      onClick={() => handleUpdateEstado('0.0.99')}
                      disabled={isSending || isTemp}
                      className="w-full text-slate-400 border border-slate-200 hover:border-red-200 hover:text-red-500 hover:bg-red-50 px-4 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                    >
                      <Ban size={14} /> Anular
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Referencia original */}
            {pedido.Nro_PedidoReferencia && (
              <div className="bg-indigo-50 rounded-[1.5rem] border border-indigo-100 p-5 space-y-3">
                <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Pedido Base</p>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-indigo-900">Nº {pedido.Nro_PedidoReferencia}</span>
                </div>
                <button onClick={() => setShowOriginalModal(true)} className="w-full bg-white text-indigo-600 border border-indigo-200 px-4 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm">
                  <Eye size={14} /> Ver Original
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Printable Invoice (oculto) */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0, width: '800px', zIndex: -1 }}>
        <div ref={printableRef} style={{ backgroundColor: '#ffffff', padding: '36px', color: '#1e293b', fontFamily: 'sans-serif' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #0f5da9', paddingBottom: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <img
                src="/logo-atodocolor.jpg"
                alt="A Todo Color"
                style={{ height: '55px', width: 'auto', objectFit: 'contain', display: 'block' }}
              />
              <p style={{ fontSize: '8px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#94a3b8', margin: 0 }}>Distribución Mayorista</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#0f5da9', textTransform: 'uppercase', margin: '0 0 4px 0', lineHeight: 1 }}>{(pedido.Estado === '6' || pedido.Estado === '6.') ? 'FACTURA' : 'PRESUPUESTO'}</h2>
              <p style={{ fontSize: '16px', fontWeight: '900', color: '#1e293b', margin: 0 }}>PEDIDO Nº: {pedido.IDPedido}</p>
              <p style={{ fontSize: '9px', fontWeight: '900', color: '#94a3b8', margin: '4px 0 0 0', textTransform: 'uppercase' }}>FECHA: {formatDate(pedido['Fecha y hora'])}</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px', backgroundColor: '#f8fafc', padding: '16px 24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <p style={{ fontSize: '9px', fontWeight: '900', color: '#0f5da9', textTransform: 'uppercase', letterSpacing: '0.15em', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', margin: '0 0 4px 0' }}>Datos del Cliente</p>
              <p style={{ fontSize: '14px', fontWeight: '900', color: '#1e293b', margin: 0, textTransform: 'uppercase' }}>{pedido.Nombre || pedido['Razón social (NO BD)']}</p>
              <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', margin: 0, textTransform: 'uppercase' }}>{pedido['Lugar de entrega']}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <p style={{ fontSize: '9px', fontWeight: '900', color: '#0f5da9', textTransform: 'uppercase', letterSpacing: '0.15em', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', margin: '0 0 4px 0' }}>Información del Pedido</p>
              <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', margin: 0, textTransform: 'uppercase' }}>
                <span style={{ fontWeight: '900', color: '#1e293b' }}>VENDEDOR:</span> {vendorName || pedido.Vendedor || 'Admin'}
              </p>
              <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', margin: 0, textTransform: 'uppercase' }}>
                <span style={{ fontWeight: '900', color: '#1e293b' }}>TOTAL ITEMS:</span> {pedido.detalles?.length || 0}
              </p>
              <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', margin: 0, textTransform: 'uppercase' }}>
                <span style={{ fontWeight: '900', color: '#1e293b' }}>TOTAL UNIDADES:</span> {pedido.detalles?.reduce((acc, item) => acc + parseCurrency(item.Cantidad), 0) || 0}
              </p>
            </div>
          </div>
          {/* Products Header Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px 150px', color: '#0f5da9', borderBottom: '2px solid #0f5da9', padding: '10px 12px', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            <div style={{ textAlign: 'left' }}>Descripción</div>
            <div style={{ textAlign: 'center' }}>Cant.</div>
            <div style={{ textAlign: 'right' }}>Unitario</div>
            <div style={{ textAlign: 'right' }}>Subtotal</div>
          </div>
          
          {/* Products List & Totals */}
          <div style={{ marginBottom: '24px' }}>
            {pedido.detalles?.map((item, idx) => {
              const p = parseCurrency(item.Precio)
              const c = parseCurrency(item.Cantidad)
              const code = item['Codigo (más alla de si es item o nombre)'] || item['Item  codigo']
              const name = item['Nombre (más alla de si es item o nombre)'] || item['Nombre item'] || ''
              const itemMarca = item.Marca || item.MARCA || item.NombreMarca || ''
              const title = (itemMarca && !name.toLowerCase().includes(itemMarca.toLowerCase())) ? `${name} - ${itemMarca}` : name
              return (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px 150px', borderBottom: '1px solid #e2e8f0', padding: '8px 12px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontWeight: '900', fontSize: '11px', color: '#1e293b', margin: 0 }}>{title}</p>
                    <p style={{ fontSize: '8px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', margin: '2px 0 0 0' }}>Cód: {code}</p>
                  </div>
                  <div style={{ textAlign: 'center', fontWeight: '900', fontSize: '11px', color: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{c}</div>
                  <div style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>{formatCurrency(p)}</div>
                  <div style={{ textAlign: 'right', fontWeight: '900', fontSize: '11px', color: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>{formatCurrency(p * c)}</div>
                </div>
              )
            })}
            
            {/* Totals Section */}
            <div style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
              {/* Subtotal Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px', borderTop: '2px solid #0f5da9', padding: '10px 12px' }}>
                <div style={{ textAlign: 'right', fontWeight: '900', fontSize: '9px', textTransform: 'uppercase', color: '#64748b' }}>
                  Subtotal
                </div>
                <div style={{ textAlign: 'right', fontWeight: '900', fontSize: '11px', color: '#1e293b' }}>
                  {formatCurrency(subtotal)}
                </div>
              </div>
              {/* Discount Row */}
              {discPct > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px', padding: '8px 12px' }}>
                  <div style={{ textAlign: 'right', fontWeight: '900', fontSize: '9px', textTransform: 'uppercase', color: '#fe4a65' }}>
                    Descuento ({discPct}%)
                  </div>
                  <div style={{ textAlign: 'right', fontWeight: '900', fontSize: '11px', color: '#fe4a65' }}>
                    -{formatCurrency(discAmt)}
                  </div>
                </div>
              )}
              {/* Total Neto Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px', borderBottom: '2px solid #0f5da9', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', padding: '12px 12px' }}>
                <div style={{ textAlign: 'right', fontWeight: '900', fontSize: '10px', textTransform: 'uppercase', color: '#0f5da9', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  Total Neto
                </div>
                <div style={{ textAlign: 'right', fontWeight: '900', fontSize: '16px', color: '#0f5da9', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  {formatCurrency(totalNeto)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Original Pedido Modal */}
      {showOriginalModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md print:hidden animate-fade-in">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <Eye size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-indigo-900 uppercase tracking-tight leading-none">
                    Pedido Original #{pedido.Nro_PedidoReferencia}
                  </h2>
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Vista Previa del Pedido Base</p>
                </div>
              </div>
              <button onClick={() => setShowOriginalModal(false)} className="text-slate-400 hover:text-[#fe4a65] transition-colors p-2"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
              {originalPedido ? (
                <>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-1">Cliente</p>
                      <p className="text-lg font-bold text-[#1e293b] leading-tight">{originalPedido.Nombre || originalPedido['Razón social (NO BD)']}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-1">Fecha Original</p>
                      <p className="text-sm font-bold text-slate-600">{formatDate(originalPedido['Fecha y hora'])}</p>
                    </div>
                  </div>

                  {/* Detalle de productos */}
                  <div className="bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Item</th>
                          <th className="px-3 py-3 text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest">Cant.</th>
                          <th className="px-3 py-3 text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest">Prep.</th>
                          <th className="px-4 py-3 text-right text-[9px] font-bold text-slate-400 uppercase tracking-widest">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {originalPedido.detalles?.map((item, i) => {
                          const p = parseCurrency(item.Precio)
                          const q = parseCurrency(item.Cantidad)
                          const prep = parseCurrency(item.Preparado || 0)
                          const code = item['Codigo (más alla de si es item o nombre)'] || item['Item  codigo']
                          const name = item['Nombre (más alla de si es item o nombre)'] || item['Nombre item']
                          return (
                            <tr key={i} className="text-xs font-bold text-slate-600">
                              <td className="px-4 py-3">
                                <p className="font-bold text-[#1e293b] leading-tight">{name}</p>
                                <p className="text-[9px] text-slate-400 uppercase">{code}</p>
                              </td>
                              <td className="px-3 py-3 text-center tabular-nums">{q}</td>
                              <td className="px-3 py-3 text-center tabular-nums">
                                <span className={prep < q ? 'text-amber-500' : 'text-emerald-500'}>{prep}</span>
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(p * q)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-400 uppercase tracking-wider text-[10px]">Total Original</span>
                    <span className="text-indigo-600 font-extrabold text-base">{formatCurrency(originalSubtotal)}</span>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center">
                  <AlertCircle size={40} className="text-slate-300 mx-auto mb-4" />
                  <p className="text-sm font-bold text-slate-500">El pedido original no se encuentra en la base de datos actual o fue purgado.</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 shrink-0">
              <button
                onClick={() => setShowOriginalModal(false)}
                className="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-colors"
              >
                Cerrar Vista
              </button>
              {originalPedido && (
                <button
                  onClick={() => {
                    setShowOriginalModal(false)
                    navigate(`/pedidos/${originalPedido.IDPedido}`)
                  }}
                  className="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                >
                  <ArrowLeft size={16} /> Ir al Pedido
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Pedido Modal */}
      {showEditModal && (
        <EditPedidoModal
          pedido={pedido}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveEditOptimistic}
        />
      )}

      {/* Confirmation Modal */}
      {confirmConfig && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="p-8 text-center">
              <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 ${confirmConfig.type === 'danger' ? 'bg-red-50 text-red-500' : 'bg-indigo-50 text-indigo-600'}`}>
                {confirmConfig.type === 'danger' ? <AlertCircle size={32} /> : <CheckCircle2 size={32} />}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{confirmConfig.title}</h3>
              <p className="text-sm font-medium text-slate-500 leading-relaxed">
                {confirmConfig.message}
              </p>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => !isDeleting && setConfirmConfig(null)}
                disabled={isDeleting}
                className="flex-1 px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest text-slate-400 hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmConfig.onConfirm || confirmConfig.action}
                disabled={isDeleting}
                className={`flex-1 px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest text-white transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 ${confirmConfig.type === 'danger'
                    ? 'bg-red-500 hover:bg-red-600 shadow-red-200'
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                  }`}
              >
                {isDeleting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Borrando...
                  </>
                ) : (
                  confirmConfig.confirmText || 'Confirmar'
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
