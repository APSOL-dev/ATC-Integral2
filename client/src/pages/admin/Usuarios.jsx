import { useState, useMemo, useEffect } from 'react'
import { 
  Users, UserPlus, Shield, User, 
  Search, X, MoreVertical, Edit2, Trash2, Key,
  Eye, EyeOff, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, Ban
} from 'lucide-react'
import { PERFILES, normalizePerfil } from '../../utils/permisos.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useData } from '../../context/DataContext.jsx'

const PAGE_SIZE = 25

export default function Usuarios() {
  const [search, setSearch] = useState('')
  const { user } = useAuth()
  const { usuarios: globalUsuarios, loading: globalLoading, setUsuarios: setGlobalUsuarios } = useData()
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasInitialized, setHasInitialized] = useState(false)

  const reloadUsers = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/usuarios`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      })
      if (res.ok) {
        const data = await res.json()
        setUsuarios(data)
        if (typeof setGlobalUsuarios === 'function') {
          setGlobalUsuarios(data)
        }
      }
    } catch (err) {
      console.error('Error reloading users:', err)
    }
  }

  useEffect(() => {
    if (!globalLoading && !hasInitialized) {
      setUsuarios(globalUsuarios)
      setLoading(false)
      setHasInitialized(true)
    }
  }, [globalUsuarios, globalLoading, hasInitialized])

  // Modal states
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create') // 'create', 'edit', 'password'
  const [selectedUser, setSelectedUser] = useState(null)
  const [formData, setFormData] = useState({ nombre: '', perfil: 'VendedorCalle', legajo: '', password: '' })
  
  // Filters
  const [filterStatus, setFilterStatus] = useState('all') // 'all', 'active', 'inactive'
  const [filterProfile, setFilterProfile] = useState('all') // 'all', 'Administracion', etc.
  const [confirmConfig, setConfirmConfig] = useState(null)

  const handleOpenModal = (mode, user = null) => {
    setModalMode(mode)
    setSelectedUser(user)
    if (user) {
      setFormData({
        nombre: user['Nombre de usuario'] || '',
        perfil: normalizePerfil(user.Perfil) || 'VendedorCalle',
        legajo: user.NRO_VENDEDOR || '',
        password: ''
      })
    } else {
      setFormData({ nombre: '', perfil: 'VendedorCalle', legajo: '', password: '' })
    }
    setModalOpen(true)
  }

  const handleSave = async () => {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${user.token}`
    }
    
    try {
      if (modalMode === 'create') {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/usuarios`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            nombre: formData.nombre,
            perfil: formData.perfil,
            legajo: formData.legajo,
            password: formData.password || 'ATC123'
          })
        })
        
        if (!res.ok) {
          const errData = await res.json()
          alert(errData.message || 'Error al crear el usuario')
          return
        }
        
        await reloadUsers()
      } else if (modalMode === 'edit') {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/usuarios/${selectedUser['Nombre de usuario']}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            nombre: formData.nombre,
            perfil: formData.perfil,
            legajo: formData.legajo
          })
        })
        
        if (!res.ok) {
          const errData = await res.json()
          alert(errData.message || 'Error al actualizar el usuario')
          return
        }
        
        await reloadUsers()
      } else if (modalMode === 'password') {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/usuarios/${selectedUser['Nombre de usuario']}/password`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            password: formData.password
          })
        })
        
        if (!res.ok) {
          const errData = await res.json()
          alert(errData.message || 'Error al actualizar la contraseña')
          return
        }
        
        alert(`Contraseña actualizada con éxito para ${selectedUser['Nombre de usuario']}.`)
      }
      setModalOpen(false)
    } catch (error) {
      console.error('Error saving user:', error)
      alert('Error de red al intentar guardar los cambios')
    }
  }

  const handleToggleActive = (userToToggle) => {
    setConfirmConfig({
      title: 'Cambiar Estado de Usuario',
      message: `¿Deseas cambiar el estado de ${userToToggle['Nombre de usuario']}? actualmente está ${userToToggle.Activo !== false ? 'ACTIVO' : 'INACTIVO'}.`,
      confirmText: userToToggle.Activo !== false ? 'Dar de Baja' : 'Activar Usuario',
      type: userToToggle.Activo !== false ? 'danger' : 'primary',
      action: async () => {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/usuarios/${userToToggle['Nombre de usuario']}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify({
              activo: !userToToggle.Activo
            })
          })
          
          if (!res.ok) {
            alert('Error al cambiar el estado del usuario')
          } else {
            await reloadUsers()
          }
        } catch (err) {
          console.error(err)
          alert('Error de conexión al cambiar el estado')
        }
        setConfirmConfig(null)
      }
    })
  }

  const filtrados = useMemo(() => {
    let list = usuarios.filter(u => ['Administracion', 'VendedorCalle', 'SuperVendedor', 'Deposito'].includes(normalizePerfil(u.Perfil)))
    
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(u => 
        u['Nombre de usuario']?.toLowerCase().includes(q) || 
        u.Perfil?.toLowerCase().includes(q)
      )
    }

    if (filterStatus !== 'all') {
      list = list.filter(u => filterStatus === 'active' ? u.Activo !== false : u.Activo === false)
    }

    if (filterProfile !== 'all') {
      list = list.filter(u => normalizePerfil(u.Perfil) === filterProfile)
    }

    return list
  }, [search, usuarios, filterStatus, filterProfile])

  // Pagination Logic
  const totalPages = Math.ceil(filtrados.length / PAGE_SIZE)
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filtrados.slice(start, start + PAGE_SIZE)
  }, [filtrados, currentPage])

  useEffect(() => { setCurrentPage(1) }, [search])

  const getProfileColor = (perfil) => {
    const map = {
      'AdministracionA': 'bg-[#fe4a65]/10 text-[#fe4a65] border-[#fe4a65]/20',
      'Administracion': 'bg-[#fe4a65]/10 text-[#fe4a65] border-[#fe4a65]/20',
      'SuperVendedor': 'bg-[#0f5da9]/10 text-[#0f5da9] border-[#0f5da9]/20',
      'VendedorCalle': 'bg-emerald-50 text-emerald-600 border-emerald-100',
      'Deposito': 'bg-orange-50 text-orange-600 border-orange-100',
    }
    return map[perfil] || 'bg-slate-50 text-slate-500 border-slate-100'
  }

  const getProfileIconBg = (perfil) => {
    const map = {
      'AdministracionA': 'bg-[#fe4a65]',
      'Administracion': 'bg-[#fe4a65]',
      'SuperVendedor': 'bg-[#0f5da9]',
      'VendedorCalle': 'bg-emerald-500',
      'Deposito': 'bg-orange-500',
    }
    return map[perfil] || 'bg-slate-400'
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1e293b] tracking-tight">Personal y Accesos</h1>
          <p className="text-[#0f5da9]/60 font-bold uppercase text-[10px] tracking-widest mt-1">
            Gestión de perfiles y niveles de visibilidad del sistema
          </p>
        </div>
        <button
          onClick={() => handleOpenModal('create')}
          className="flex items-center gap-3 bg-[#fe4a65] hover:bg-[#e63e58] text-white font-bold px-6 py-3.5 rounded-2xl shadow-xl shadow-[#fe4a65]/20 transition-all transform active:scale-95 text-sm uppercase tracking-widest"
        >
          <UserPlus size={18} strokeWidth={2.5} />
          Alta de Usuario
        </button>
      </div>

      {/* Profile Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(PERFILES).filter(([key]) => ['Administracion', 'SuperVendedor', 'VendedorCalle', 'Deposito'].includes(key)).map(([key, p]) => (
          <div key={key} className="bg-white rounded-[2rem] border border-slate-200/60 p-6 shadow-sm flex flex-col h-full hover:shadow-lg transition-all duration-500">
            <div className={`size-10 rounded-xl mb-4 flex items-center justify-center text-white shadow-lg ${getProfileIconBg(key)}`}>
              <Shield size={20} />
            </div>
            <h4 className="text-sm font-bold text-[#1e293b] uppercase tracking-tight mb-1">{p.label}</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">ID: {key}</p>
            
            <div className="space-y-3 mt-auto pt-4 border-t border-slate-50">
              <div className="flex items-center gap-2">
                {p.soloPropio ? <EyeOff size={14} className="text-amber-500" /> : <Eye size={14} className="text-[#0f5da9]" />}
                <span className="text-[10px] font-bold uppercase text-slate-600 tracking-tighter">
                  {p.soloPropio ? 'Solo Ve sus Pedidos' : 'Vista Global de Datos'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {p.pedidos?.approve ? <CheckCircle2 size={14} className="text-emerald-500" /> : <AlertCircle size={14} className="text-slate-300" />}
                <span className="text-[10px] font-bold uppercase text-slate-600 tracking-tighter">
                  {p.pedidos?.approve ? 'Puede Aprobar' : 'Sin Autorización'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search and User List */}
      <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-xl shadow-black/5 p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="relative flex-1 max-w-xl">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar personal por nombre, email o cargo..."
              className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-[#1e293b] placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#0f5da9]/10 focus:border-[#0f5da9] transition-all"
            />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <select 
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#1e293b] focus:outline-none focus:border-[#0f5da9]"
            >
              <option value="all">Todos los Estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>

            <select 
              value={filterProfile}
              onChange={e => setFilterProfile(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#1e293b] focus:outline-none focus:border-[#0f5da9]"
            >
              <option value="all">Todos los Perfiles</option>
              <option value="Administracion">Administración</option>
              <option value="SuperVendedor">SuperVendedor</option>
              <option value="VendedorCalle">Vendedor Calle</option>
              <option value="Deposito">Depósito</option>
            </select>

            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-auto">
              {filtrados.length} Usuarios Registrados
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {paginatedList.map(user => (
            <div 
              key={user.id}
              className="bg-slate-50/50 rounded-2xl border border-slate-100 p-5 hover:bg-white hover:shadow-xl hover:-translate-y-0.5 transition-all duration-500 group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="size-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-200 group-hover:bg-[#0f5da9] group-hover:text-white transition-all duration-500">
                    <User size={20} />
                  </div>
                  <div className={`px-2.5 py-1 rounded-full text-[7px] font-bold uppercase tracking-widest border ${getProfileColor(user.Perfil)}`}>
                    {user.Perfil}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#1e293b] group-hover:text-[#0f5da9] transition-colors leading-tight truncate">
                      {user['Nombre de usuario']}
                    </h3>
                  </div>

                  {user.NRO_VENDEDOR && (
                    <div className="flex items-center gap-1.5 text-[8px] font-bold text-[#0f5da9] uppercase tracking-widest bg-[#0f5da9]/5 px-2.5 py-1 rounded-lg w-fit">
                      Legajo #{user.NRO_VENDEDOR}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 mt-6 border-t border-slate-200/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => handleOpenModal('edit', user)} title="Editar" className="text-slate-300 hover:text-[#0f5da9] transition-all p-1 hover:scale-110"><Edit2 size={16} /></button>
                  <button onClick={() => handleOpenModal('password', user)} title="Cambiar Contraseña" className="text-slate-300 hover:text-amber-500 transition-all p-1 hover:scale-110"><Key size={16} /></button>
                  <button onClick={() => handleToggleActive(user)} title={user.Activo === false ? "Dar de alta" : "Dar de baja"} className={`transition-all p-1 hover:scale-110 ${user.Activo === false ? 'text-emerald-500 hover:text-emerald-600' : 'text-slate-300 hover:text-[#fe4a65]'}`}>
                    <Ban size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  {user.Activo === false ? (
                    <>
                      <span className="text-[7px] font-bold text-red-500 uppercase tracking-widest">Inactivo</span>
                      <div className="size-1.5 rounded-full bg-red-400 shadow-sm shadow-red-400/50" />
                    </>
                  ) : (
                    <>
                      <span className="text-[7px] font-bold text-emerald-500 uppercase tracking-widest">Activo</span>
                      <div className="size-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Mostrando {paginatedList.length} de {filtrados.length} registros — Página {currentPage} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-[#0f5da9] hover:text-white disabled:opacity-30 transition-all shadow-sm flex items-center justify-center"
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="flex items-center gap-1 mx-2">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1.5 text-xs font-bold transition-all ${
                      currentPage === i + 1 
                        ? 'text-[#0f5da9] font-black scale-110' 
                        : 'text-slate-400 hover:text-[#0f5da9]'
                    }`}
                    style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-[#0f5da9] hover:text-white disabled:opacity-30 transition-all shadow-sm flex items-center justify-center"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-bold text-[#1e293b] uppercase tracking-tight">
                {modalMode === 'create' ? 'Alta de Usuario' : modalMode === 'edit' ? 'Editar Usuario' : 'Cambiar Contraseña'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-[#fe4a65] transition-colors p-2"><X size={20} /></button>
            </div>
            
            <div className="p-6 space-y-4">
              {modalMode !== 'password' ? (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest pl-1">Nombre Completo</label>
                    <input 
                      type="text"
                      value={formData.nombre}
                      onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                      placeholder="Ej. Juan Pérez"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-[#1e293b] focus:ring-4 focus:ring-[#0f5da9]/10 focus:border-[#0f5da9] transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest pl-1">Perfil de Acceso</label>
                    <select 
                      value={formData.perfil}
                      onChange={e => setFormData({ ...formData, perfil: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-[#1e293b] focus:ring-4 focus:ring-[#0f5da9]/10 focus:border-[#0f5da9] transition-all outline-none appearance-none"
                    >
                      {Object.keys(PERFILES).map(k => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest pl-1">Legajo Vendedor (Opcional)</label>
                    <input 
                      type="text"
                      value={formData.legajo}
                      onChange={e => setFormData({ ...formData, legajo: e.target.value })}
                      placeholder="Ej. 1234"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-[#1e293b] focus:ring-4 focus:ring-[#0f5da9]/10 focus:border-[#0f5da9] transition-all outline-none"
                    />
                  </div>
                  {modalMode === 'create' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest pl-1">Contraseña Temporal</label>
                      <input 
                        type="password"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        placeholder="******"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-[#1e293b] focus:ring-4 focus:ring-[#0f5da9]/10 focus:border-[#0f5da9] transition-all outline-none"
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest pl-1">Nueva Contraseña para {selectedUser?.['Nombre de usuario']}</label>
                  <input 
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Escriba la nueva contraseña..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-[#1e293b] focus:ring-4 focus:ring-[#0f5da9]/10 focus:border-[#0f5da9] transition-all outline-none"
                  />
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
              <button 
                onClick={() => setModalOpen(false)}
                className="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                disabled={modalMode === 'password' && !formData.password}
                className="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-white bg-[#0f5da9] hover:bg-[#0d4f92] transition-colors shadow-lg shadow-[#0f5da9]/20 disabled:opacity-50"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmConfig && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="p-8 text-center">
              <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 ${confirmConfig.type === 'danger' ? 'bg-red-50 text-red-500' : 'bg-[#0f5da9]/10 text-[#0f5da9]'}`}>
                {confirmConfig.type === 'danger' ? <AlertCircle size={32} /> : <CheckCircle2 size={32} />}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{confirmConfig.title}</h3>
              <p className="text-sm font-medium text-slate-500 leading-relaxed">
                {confirmConfig.message}
              </p>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => setConfirmConfig(null)}
                className="flex-1 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmConfig.action}
                className={`flex-1 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-white transition-all shadow-lg ${
                  confirmConfig.type === 'danger' 
                    ? 'bg-red-500 hover:bg-red-600 shadow-red-200' 
                    : 'bg-[#0f5da9] hover:bg-[#0d4f92] shadow-[#0f5da9]/20'
                }`}
              >
                {confirmConfig.confirmText || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
