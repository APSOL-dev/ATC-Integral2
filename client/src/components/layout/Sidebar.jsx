// src/components/layout/Sidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ShoppingCart, Users, Package,
  CreditCard, BarChart2, Settings, LogOut, FileSpreadsheet
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { getSidebarItems } from '../../utils/permisos.js'

const NAV_ITEMS = [
  { key: 'dashboard',  label: 'Principal',   icon: LayoutDashboard, path: '/atc' },
  { key: 'pedidos',    label: 'Pedidos',      icon: ShoppingCart,    path: '/pedidos' },
  { key: 'clientes',   label: 'Clientes',     icon: Users,           path: '/clientes' },
  { key: 'productos',  label: 'Productos',    icon: Package,         path: '/productos' },
  { key: 'usuarios',   label: 'Usuarios',     icon: Settings,        path: '/admin/usuarios' },
  { key: 'selector',   label: 'Cambiar App',  icon: BarChart2,       path: '/selector' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const allowed = getSidebarItems(user?.perfil || 'VendedorCalle')

  const visibleItems = NAV_ITEMS.filter(item => allowed.includes(item.key))

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const avatarUrl = `https://ui-avatars.com/api/?name=${user?.nombre || 'User'}&background=random`

  return (
    <aside className="w-[220px] bg-[#0f5da9] text-white hidden lg:flex flex-col h-screen sticky top-0 shrink-0 z-40 transition-all shadow-xl shadow-[#0f5da9]/20">
      <div className="p-4 flex flex-col h-full">
        
        {/* Branding - Compact Pod */}
        <div className="mb-8 mt-2 px-1">
          <div className="bg-white/95 p-3 rounded-[1.5rem] shadow-xl shadow-black/10 transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-sm">
            <img src="/logo.png" alt="A Todo Color" className="w-full h-auto object-contain mx-auto" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 flex-1 overflow-y-auto no-scrollbar">
          {visibleItems.map((item) => (
            <NavLink
              key={item.key}
              to={item.path}
              end={item.path === '/atc'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 font-bold group ${
                  isActive
                    ? 'bg-white text-[#0f5da9] shadow-lg shadow-black/10'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`size-4.5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                  <span className="text-[13px] tracking-tight">{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#fe4a65]" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Card */}
        <div className="mt-auto pt-4 border-t border-white/10">
          <button 
            onClick={() => navigate('/perfil')}
            className="w-full bg-white/5 rounded-2xl p-3 flex items-center gap-2.5 backdrop-blur-sm transition-all hover:bg-white/10 group mb-2 text-left"
          >
            <div className="size-8 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-white/20">
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold truncate capitalize group-hover:text-[#fe4a65] transition-colors">{user?.nombre || 'Usuario'}</span>
              <span className="text-[9px] text-white/60 uppercase tracking-wider truncate">{user?.perfil || 'Perfil'}</span>
            </div>
          </button>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-red-200 hover:bg-red-500/10 hover:text-red-100 transition-all font-bold group"
          >
            <LogOut className="size-4.5" />
            <span className="text-xs">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
