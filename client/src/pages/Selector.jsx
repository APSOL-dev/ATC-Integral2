import React from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, ArrowRight, Layers, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useData } from '../context/DataContext.jsx'

export default function Selector() {
  const { user, logout } = useAuth()
  const { fetchPedidos } = useData()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 justify-between relative overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#0f5da9]/5 rounded-full blur-3xl -mr-40 -mt-40 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#fe4a65]/5 rounded-full blur-3xl -ml-40 -mb-40 pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between z-10">
        <div className="bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-slate-100 max-w-[150px]">
          <img src="/logo.png" alt="A Todo Color" className="w-full h-auto object-contain" />
        </div>

        <button
          onClick={() => {
            logout()
            navigate('/login')
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-500 hover:text-[#fe4a65] hover:bg-red-50 font-bold text-xs uppercase tracking-wider transition-all"
        >
          <LogOut size={16} />
          Salir
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 z-10">
        <div className="text-center max-w-xl mb-12 space-y-3">
          <span className="bg-blue-50 text-[#0f5da9] text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-blue-100">
            Panel de Administrador
          </span>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight sm:text-4xl">
            ¿A qué sistema deseas ingresar?
          </h1>
          <p className="text-slate-500 font-medium text-sm">
            Bienvenido, <strong className="text-slate-700">{user?.nombre || 'Administrador'}</strong>. Selecciona una de las plataformas para comenzar a trabajar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
          {/* Card 1: ATC Migración */}
          <div 
            onClick={() => {
              if (fetchPedidos) fetchPedidos(true, true)
              navigate('/atc')
            }}
            className="group relative bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:border-[#0f5da9] transition-all duration-300 cursor-pointer flex flex-col justify-between h-[320px] overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#0f5da9]/5 rounded-bl-[100px] group-hover:bg-[#0f5da9]/10 transition-colors" />
            
            <div className="space-y-4">
              <div className="size-14 rounded-2xl bg-blue-50 flex items-center justify-center text-[#0f5da9] group-hover:scale-110 transition-transform duration-300">
                <Layers size={28} />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-slate-800">Plataforma Mayorista</h2>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Gestión integrada de pedidos, catálogo de productos, listado de clientes y sincronización de stock.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
              <span className="text-xs font-bold uppercase tracking-widest text-[#0f5da9]">Ingresar</span>
              <div className="size-8 rounded-full bg-slate-100 group-hover:bg-[#0f5da9] group-hover:text-white flex items-center justify-center transition-all duration-300">
                <ArrowRight size={16} />
              </div>
            </div>
          </div>

          {/* Card 2: Tablero de Control */}
          <div 
            onClick={() => navigate('/tablero')}
            className="group relative bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:border-[#fe4a65] transition-all duration-300 cursor-pointer flex flex-col justify-between h-[320px] overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#fe4a65]/5 rounded-bl-[100px] group-hover:bg-[#fe4a65]/10 transition-colors" />
            
            <div className="space-y-4">
              <div className="size-14 rounded-2xl bg-red-50 flex items-center justify-center text-[#fe4a65] group-hover:scale-110 transition-transform duration-300">
                <BarChart3 size={28} />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-slate-800">Tablero de Control</h2>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Gráficas de ventas, saldos de clientes, estadísticas por vendedor y reportes gerenciales detallados.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
              <span className="text-xs font-bold uppercase tracking-widest text-[#fe4a65]">Ingresar</span>
              <div className="size-8 rounded-full bg-slate-100 group-hover:bg-[#fe4a65] group-hover:text-white flex items-center justify-center transition-all duration-300">
                <ArrowRight size={16} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-slate-400 text-[10px] font-bold uppercase tracking-wider z-10 border-t border-slate-100 bg-white/50">
        A Todo Color © {new Date().getFullYear()} — Todos los derechos reservados.
      </footer>
    </div>
  )
}
