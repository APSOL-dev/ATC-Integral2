// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { DataProvider } from './context/DataContext.jsx'
import AppLayout from './components/layout/AppLayout.jsx'

// Pages
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import PedidosList from './pages/pedidos/PedidosList.jsx'
import PedidoDetail from './pages/pedidos/PedidoDetail.jsx'
import PedidoForm from './pages/pedidos/PedidoForm.jsx'
import ClientesList from './pages/clientes/ClientesList.jsx'
import ClienteDetail from './pages/clientes/ClienteDetail.jsx'
import ProductosCatalog from './pages/productos/ProductosCatalog.jsx'
import ProductoDetail from './pages/productos/ProductoDetail.jsx'
import PresupuestosStock from './pages/productos/PresupuestosStock.jsx'
import Usuarios from './pages/admin/Usuarios.jsx'
import Perfil from './pages/perfil/Perfil.jsx'

// Selector and Tablero imports
import Selector from './pages/Selector.jsx'
import TableroDashboard from './tablero/Dashboard.jsx'
import { useAuth } from './context/AuthContext.jsx'
import { normalizePerfil } from './utils/permisos.js'

// ProtectedRoute helper for custom page guards
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#f8fafc]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#0f5da9] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#1e293b] font-bold text-sm uppercase tracking-widest">Cargando...</p>
      </div>
    </div>
  )

  if (!user) return <Navigate to="/login" replace />

  if (allowedRoles) {
    const norm = normalizePerfil(user.perfil)
    const isAllowed = allowedRoles.some(role => norm.toLowerCase() === role.toLowerCase())
    if (!isAllowed) {
      return <Navigate to="/" replace />
    }
  }

  return children
}

// Placeholders para páginas aún no construidas
function PlaceholderPage({ title }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-400 animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <span className="text-2xl">🚧</span>
      </div>
      <h2 className="text-lg font-600 text-slate-600 mb-1">{title}</h2>
      <p className="text-sm">Página en construcción</p>
    </div>
  )
}

function RootRedirect() {
  const { user } = useAuth()
  const normPerfil = normalizePerfil(user?.perfil)
  if (normPerfil === 'Administracion' || normPerfil === 'AdministracionA') {
    return <Navigate to="/selector" replace />
  }
  return <Navigate to="/atc" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />

            {/* Admin Selector & Tablero (Outside main layout) */}
            <Route path="/selector" element={
              <ProtectedRoute allowedRoles={['Administracion', 'AdministracionA']}>
                <Selector />
              </ProtectedRoute>
            } />
            <Route path="/tablero" element={
              <ProtectedRoute allowedRoles={['Administracion', 'AdministracionA']}>
                <TableroDashboard />
              </ProtectedRoute>
            } />

            {/* Protected — dentro del layout */}
            <Route element={<AppLayout />}>
              <Route index element={<RootRedirect />} />
              <Route path="atc" element={<Dashboard />} />

              {/* Pedidos */}
              <Route path="pedidos" element={<PedidosList />} />
              <Route path="pedidos/:id" element={<PedidoDetail />} />
              <Route path="pedidos/nuevo" element={<PedidoForm />} />
              <Route path="pedidos/:id/editar" element={<PlaceholderPage title="Editar Pedido" />} />

              {/* Clientes */}
              <Route path="clientes" element={<ClientesList />} />
              <Route path="clientes/:id" element={<ClienteDetail />} />

              {/* Productos */}
              <Route path="productos" element={<ProductosCatalog />} />
              <Route path="productos/:id" element={<ProductoDetail />} />
              <Route path="productos/presupuestos" element={<PresupuestosStock />} />


              {/* Admin */}
              <Route path="admin/usuarios" element={
                <ProtectedRoute allowedRoles={['Administracion', 'AdministracionA']}>
                  <Usuarios />
                </ProtectedRoute>
              } />
              
              {/* Personal */}
              <Route path="perfil" element={<Perfil />} />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
