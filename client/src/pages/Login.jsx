// src/pages/Login.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { normalizePerfil } from '../utils/permisos.js'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const userData = await login(username, password)
      const normPerfil = normalizePerfil(userData.perfil)
      if (normPerfil === 'Administracion' || normPerfil === 'AdministracionA') {
        navigate('/selector')
      } else {
        navigate('/')
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-[#f8fafc] overflow-hidden">

      {/* Right panel - Decorative Background (Blue Brand style) */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden bg-[#0f5da9]">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 -mr-20 -mt-20 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 -ml-20 -mb-20 bg-[#fe4a65]/20 rounded-full blur-2xl" />

        {/* Large Brand Card */}
        <div className="relative z-10 text-center px-12 animate-fade-in">
          <div className="bg-white/95 p-10 rounded-[3rem] shadow-2xl shadow-black/20 mb-10 max-w-sm mx-auto transform hover:scale-105 transition-transform duration-500">
            <img src="/logo.png" alt="A Todo Color" className="w-full h-auto object-contain mx-auto" />
          </div>

          <h1 className="text-4xl font-bold text-white tracking-tight">Plataforma Mayorista</h1>
        </div>
      </div>

      {/* Login form Panel */}
      <div className="flex-1 lg:max-w-xl flex items-center justify-center p-8 bg-white relative">
        <div className="w-full max-w-md space-y-10 animate-fade-in">

          {/* Mobile logo */}
          <div className="flex justify-center lg:hidden mb-12">
            <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 max-w-[180px]">
              <img src="/logo.png" alt="Logo" className="w-full h-auto" />
            </div>
          </div>

          <div className="text-center lg:text-left space-y-2">
            <h2 className="text-3xl font-bold text-[#1e293b] tracking-tight">¡Bienvenido!</h2>
            <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Ingresá a tu cuenta mayorista</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              {/* Username */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Nombre de Usuario
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Ej. JuanPerez"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-[#1e293b] placeholder-slate-400 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5da9]/20 focus:border-[#0f5da9] transition-all"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 pr-14 text-[#1e293b] placeholder-slate-400 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5da9]/20 focus:border-[#0f5da9] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#0f5da9] transition-colors p-1"
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl p-4 animate-shake">
                <AlertCircle size={20} className="text-[#fe4a65] shrink-0" />
                <p className="text-[#fe4a65] text-xs font-bold uppercase tracking-wide">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0f5da9] hover:bg-[#0d5296] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl px-6 py-4 flex items-center justify-center gap-3 text-sm shadow-xl shadow-[#0f5da9]/20 transition-all duration-300 transform active:scale-95"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  <span>Iniciar Sesión</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
