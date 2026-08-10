import { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { User, Shield, Key, CheckCircle2, Lock } from 'lucide-react'

export default function Perfil() {
  const { user } = useAuth()
  const [passwordMode, setPasswordMode] = useState(false)
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })


  const handleUpdatePassword = () => {
    if (passwords.new !== passwords.confirm) return alert('Las contraseñas no coinciden')
    alert('Contraseña actualizada con éxito (Simulado)')
    setPasswordMode(false)
    setPasswords({ current: '', new: '', confirm: '' })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="flex items-center gap-4">
        <div className="size-16 rounded-[2rem] bg-[#0f5da9] text-white flex items-center justify-center shadow-xl shadow-[#0f5da9]/20">
          <User size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#1e293b] tracking-tight">Mi Perfil</h1>
          <p className="text-[#0f5da9]/60 font-bold uppercase text-[10px] tracking-widest mt-1">
            Gestión de datos personales y seguridad
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Col: Avatar & Badge */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-xl shadow-black/5 p-8 text-center">
            <div className="size-24 rounded-full bg-slate-50 border border-slate-100 mx-auto mb-6 flex items-center justify-center text-[#0f5da9]/20 overflow-hidden">
               <img src={`https://ui-avatars.com/api/?name=${user?.nombre || 'User'}&background=random&size=128`} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <h3 className="text-lg font-bold text-[#1e293b] capitalize">{user?.nombre || 'Usuario'}</h3>
            <div className="mt-4 px-4 py-1.5 bg-[#0f5da9]/5 text-[#0f5da9] rounded-full text-[9px] font-bold uppercase tracking-widest inline-block border border-[#0f5da9]/10">
              {user?.perfil || 'Perfil'}
            </div>
            
            <div className="mt-8 pt-8 border-t border-slate-50 space-y-4">
               <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                 <span>Estado</span>
                 <span className="text-emerald-500 flex items-center gap-1.5">
                   <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   Activo
                 </span>
               </div>
            </div>
          </div>
        </div>

        {/* Right Col: Forms */}
        <div className="md:col-span-2 space-y-6">


          {/* Password Settings */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-xl shadow-black/5 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Key size={20} />
                </div>
                <h2 className="text-lg font-bold text-[#1e293b]">Seguridad</h2>
              </div>
              {!passwordMode && (
                <button onClick={() => setPasswordMode(true)} className="flex items-center gap-2 text-amber-600 hover:text-amber-700 font-bold text-[10px] uppercase tracking-widest px-4 py-2 bg-amber-50 rounded-xl transition-all">
                  Cambiar Contraseña
                </button>
              )}
            </div>
            <div className="p-8">
              {passwordMode ? (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest pl-1">Nueva Contraseña</label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                        <input 
                          type="password"
                          value={passwords.new}
                          onChange={e => setPasswords({...passwords, new: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-6 py-4 text-sm font-bold text-[#1e293b] focus:ring-4 focus:ring-[#0f5da9]/10 focus:border-[#0f5da9] transition-all outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest pl-1">Confirmar Nueva Contraseña</label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                        <input 
                          type="password"
                          value={passwords.confirm}
                          onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-6 py-4 text-sm font-bold text-[#1e293b] focus:ring-4 focus:ring-[#0f5da9]/10 focus:border-[#0f5da9] transition-all outline-none"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setPasswordMode(false)} className="flex-1 py-4 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-100 transition-colors">Cancelar</button>
                    <button onClick={handleUpdatePassword} className="flex-1 py-4 bg-amber-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95">Actualizar Seguridad</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 text-slate-400 italic text-sm font-medium p-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <Shield size={20} className="shrink-0" />
                  Tu contraseña es privada y está encriptada. Te recomendamos cambiarla cada 90 días.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
