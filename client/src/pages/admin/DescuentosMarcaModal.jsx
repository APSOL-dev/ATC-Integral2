import React, { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Tag, Plus, Trash2, X, Lock, CheckCircle } from 'lucide-react'
import { useData } from '../../context/DataContext.jsx'

export default function DescuentosMarcaModal({ isOpen, onClose }) {
  const { productos, descuentosMarca, saveDescuentoMarca, removeDescuentoMarca } = useData()
  const [marcaInput, setMarcaInput] = useState('')
  const [porcentajeInput, setPorcentajeInput] = useState('')
  const [statusMessage, setStatusMessage] = useState('')

  // Lista única de marcas existentes en el catálogo de productos
  const marcasDisponibles = useMemo(() => {
    const set = new Set()
    if (Array.isArray(productos)) {
      productos.forEach(p => {
        const m = (p.NombreMarca || p.Marca || (typeof p.MARCA === 'string' ? p.MARCA : '') || '').trim()
        if (m) set.add(m)
      })
    }
    return Array.from(set).sort()
  }, [productos])

  if (!isOpen) return null

  const handleSave = (e) => {
    e.preventDefault()
    if (!marcaInput) return alert('Seleccione o ingrese una marca')
    const pct = parseFloat(porcentajeInput)
    if (isNaN(pct) || pct < 0 || pct > 100) return alert('Ingrese un porcentaje válido entre 0 y 100')

    saveDescuentoMarca(marcaInput, pct)
    setMarcaInput('')
    setPorcentajeInput('')
    setStatusMessage(`Descuento guardado para ${marcaInput} (${pct}%)`)
    setTimeout(() => setStatusMessage(''), 3000)
  }

  const handleRemove = (marca) => {
    if (confirm(`¿Desea eliminar el descuento asignado a la marca "${marca}"?`)) {
      removeDescuentoMarca(marca)
    }
  }

  const entries = Object.entries(descuentosMarca || {}).filter(([_, pct]) => pct > 0)

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-[#0f5da9]/10 text-[#0f5da9] flex items-center justify-center">
              <Tag size={24} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#1e293b]">Descuentos por Marca</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                Configuración exclusiva Administrador
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="size-10 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-8 overflow-y-auto space-y-8">
          {statusMessage && (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs font-bold animate-slide-down">
              <CheckCircle size={18} className="text-emerald-600" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Form Agregar/Editar Descuento */}
          <form onSubmit={handleSave} className="bg-slate-50 p-6 rounded-3xl border border-slate-200/80 space-y-4">
            <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Lock size={14} className="text-[#0f5da9]" />
              Asignar Descuento a Marca
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Marca</label>
                <input
                  type="text"
                  list="marcas-list"
                  value={marcaInput}
                  onChange={(e) => setMarcaInput(e.target.value)}
                  placeholder="Ej. Sinteplast"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#1e293b] focus:ring-4 focus:ring-[#0f5da9]/10 focus:border-[#0f5da9] outline-none"
                />
                <datalist id="marcas-list">
                  {marcasDisponibles.map(m => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">% Descuento</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={porcentajeInput}
                  onChange={(e) => setPorcentajeInput(e.target.value)}
                  placeholder="Ej. 15"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#1e293b] focus:ring-4 focus:ring-[#0f5da9]/10 focus:border-[#0f5da9] outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-[#0f5da9] hover:bg-[#0b4885] text-white text-xs font-extrabold uppercase tracking-widest py-3.5 px-6 rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Plus size={16} />
              Guardar Descuento por Marca
            </button>
          </form>

          {/* Lista de Marcas con Descuento */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
              Descuentos Activos ({entries.length})
            </h3>

            {entries.length === 0 ? (
              <div className="py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs font-bold italic">
                No hay descuentos de marca activos guardados.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                {entries.map(([marca, pct]) => (
                  <div key={marca} className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                        <Lock size={12} />
                        {marca}
                      </span>
                      <span className="text-sm font-black text-[#0f5da9]">{pct}% OFF</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemove(marca)}
                      className="size-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Eliminar descuento"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
