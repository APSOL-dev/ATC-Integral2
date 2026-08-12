import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { PERFILES, normalizePerfil } from '../utils/permisos.js'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [pedidos, setPedidos] = useState([])
  const [clientes, setClientes] = useState([])
  const [productos, setProductos] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true) // true by default: first render is always loading
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastSync, setLastSync] = useState(null)
  const lastSyncRef = useRef(null)
  const [secondsLeft, setSecondsLeft] = useState(30)
  const [serverHealth, setServerHealth] = useState({ status: 'ok', mssql: true, supabase: true })

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/health`)
      if (res.ok || res.status === 503) {
        const data = await res.json()
        setServerHealth(data)
      } else {
        setServerHealth({ status: 'error', mssql: false, supabase: false })
      }
    } catch (e) {
      setServerHealth({ status: 'error', mssql: false, supabase: false })
    }
  }, [])

  useEffect(() => {
    checkHealth()
    const healthInterval = setInterval(checkHealth, 15000)
    return () => clearInterval(healthInterval)
  }, [checkHealth])

  // Preloading cache for Clientes to achieve instant page transitions
  const [preloadedClientes, setPreloadedClientes] = useState({})
  const pedidosRef = useRef([])
  useEffect(() => {
    pedidosRef.current = pedidos
  }, [pedidos])

  const hydrateDetails = useCallback(async (orderIds) => {
    if (!Array.isArray(orderIds) || orderIds.length === 0) return

    const storedUser = localStorage.getItem('atc_user')
    let userObj = null
    try {
      if (storedUser) userObj = JSON.parse(storedUser)
    } catch (e) {}

    const authHeaders = userObj?.token ? { 'Authorization': `Bearer ${userObj.token}` } : {}

    const currentPedidosMap = new Map(pedidosRef.current.map(p => [String(p.IDPedido), p]))
    const missingIds = orderIds.filter(id => {
      const p = currentPedidosMap.get(String(id))
      return p && (!p.detalles || !Array.isArray(p.detalles) || p.detalles.length === 0)
    })

    if (missingIds.length === 0) return

    try {
      const res = await fetch(`${API_URL}/pedidos/details-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ ids: missingIds })
      })

      if (res.ok) {
        const batchDetails = await res.json()
        setPedidos(prev => {
          let updated = false
          const next = prev.map(p => {
            const id = String(p.IDPedido)
            if (batchDetails[id] && (!p.detalles || p.detalles.length === 0)) {
              updated = true
              return { ...p, detalles: batchDetails[id] }
            }
            return p
          })
          return updated ? next : prev
        })
      }
    } catch (err) {
      console.error('Error hydrating details batch:', err)
    }
  }, [])

  const preloadClientesList = useCallback(async (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) return
    const toFetch = ids.filter(id => !preloadedClientes[id])
    if (toFetch.length === 0) return

    const storedUser = localStorage.getItem('atc_user')
    let userObj = null
    try {
      if (storedUser) userObj = JSON.parse(storedUser)
    } catch (e) {}

    const authHeaders = userObj?.token ? { 'Authorization': `Bearer ${userObj.token}` } : {}

    try {
      const res = await fetch(`${API_URL}/clientes/batch?ids=${toFetch.join(',')}`, {
        headers: authHeaders
      })
      const data = await res.json()
      if (Array.isArray(data)) {
        setPreloadedClientes(prev => {
          const next = { ...prev }
          data.forEach(c => {
            if (c) {
              const cid = c.NRO_CLIENTE || c.id
              if (cid) next[cid] = c
            }
          })
          return next
        })
      }
    } catch (err) {
      console.error('Error preloading clients:', err)
    }
  }, [preloadedClientes])

  // Navigation tracking
  const location = useLocation()
  const [prevPath, setPrevPath] = useState(null)
  const [currentPath, setCurrentPath] = useState(location.pathname)

  useEffect(() => {
    if (location.pathname !== currentPath) {
      setPrevPath(currentPath)
      setCurrentPath(location.pathname)
    }
  }, [location.pathname, currentPath])

  // Pedidos Filters State
  const [activeTab, setActiveTab] = useState('Todos')
  const [filterID, setFilterID] = useState('')
  const [filterCliente, setFilterCliente] = useState('')
  const [filterVendedor, setFilterVendedor] = useState('')
  const [filterFechaDesde, setFilterFechaDesde] = useState('')
  const [filterFechaHasta, setFilterFechaHasta] = useState('')
  const [selectedCliente, setSelectedCliente] = useState(null)
  const [selectedVendedor, setSelectedVendedor] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(40)
  const [sortConfig, setSortConfig] = useState({ key: 'Fecha y hora', direction: 'desc' })

  const resetPedidosFilters = useCallback((searchStr) => {
    const params = new URLSearchParams(searchStr || '')
    const initialEstado = params.get('estado') || 'Todos'
    setActiveTab(initialEstado)
    setFilterID('')
    setFilterCliente('')
    setFilterVendedor('')
    setFilterFechaDesde('')
    setFilterFechaHasta('')
    setSelectedCliente(null)
    setSelectedVendedor(null)
    setCurrentPage(1)
    setPageSize(40)
    setSortConfig({ key: 'Fecha y hora', direction: 'desc' })
  }, [])

  const fetchPedidos = useCallback(async (showLoading = false, force = false) => {
    // --- Auth guard: don't fetch without a valid token ---
    const storedUser = localStorage.getItem('atc_user')
    let userObj = null
    try {
      if (storedUser) userObj = JSON.parse(storedUser)
    } catch (e) {}

    if (!userObj?.token) {
      // Not authenticated yet — show nothing, don't mark as synced
      setLoading(false)
      return
    }

    const now = new Date()
    // Skip if not forced, and lastSync is within 5 minutes
    if (!force && lastSyncRef.current && (now - lastSyncRef.current) < 5 * 60 * 1000) {
      // Data is still fresh — ensure loading spinner doesn't get stuck
      setLoading(false)
      return
    }

    if (showLoading) {
      setLoading(true)
    } else {
      setIsRefreshing(true)
    }

    const profile = userObj ? normalizePerfil(userObj.perfil) : null
    const isAdmin = profile === 'Administracion' || profile === 'AdministracionA'
    const headers = { 'Authorization': `Bearer ${userObj.token}` }

    // 1. Fetch Pedidos (Lightweight header list for instant boot)
    fetch(`${API_URL}/pedidos`, { headers })
      .then(async res => {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('atc_user')
          window.location.href = '/login'
          return
        }
        const data = res.ok ? await res.json().catch(() => []) : []
        setPedidos(Array.isArray(data) ? data : [])
        const syncDate = new Date()
        setLastSync(syncDate)
        lastSyncRef.current = syncDate
        setSecondsLeft(30) // Reset countdown on successful sync
      })
      .catch(err => {
        console.error('Error fetching pedidos:', err)
        const syncDate = new Date()
        setLastSync(syncDate)
        lastSyncRef.current = syncDate
      })
      .finally(() => {
        setLoading(false)
        setIsRefreshing(false)
      })

    // 2. Fetch Clientes in background
    fetch(`${API_URL}/clientes`, { headers })
      .then(async res => res.ok ? res.json() : [])
      .then(data => setClientes(Array.isArray(data) ? data : []))
      .catch(err => console.error('Error fetching clientes:', err))

    // 3. Fetch Productos in background
    fetch(`${API_URL}/productos`, { headers })
      .then(async res => res.ok ? res.json() : [])
      .then(data => setProductos(Array.isArray(data) ? data : []))
      .catch(err => console.error('Error fetching productos:', err))

    // 4. Fetch Usuarios in background if admin
    if (isAdmin) {
      fetch(`${API_URL}/usuarios`, { headers })
        .then(async res => res.ok ? res.json() : [])
        .then(data => setUsuarios(Array.isArray(data) ? data : []))
        .catch(err => console.error('Error fetching usuarios:', err))
    }
  }, [])

  // Reactive initial fetch when entering wholesale app routes or when token is ready
  useEffect(() => {
    const isWholesaleRoute = location.pathname.startsWith('/atc') || 
                             location.pathname.startsWith('/pedidos') || 
                             location.pathname.startsWith('/clientes') || 
                             location.pathname.startsWith('/productos')

    const storedUser = localStorage.getItem('atc_user')
    let hasToken = false
    try {
      if (storedUser) hasToken = !!JSON.parse(storedUser)?.token
    } catch {}

    if (hasToken && isWholesaleRoute && !lastSyncRef.current) {
      fetchPedidos(true, true)
    }
  }, [location.pathname, fetchPedidos])

  // Auto background sync every 30 seconds silently
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPedidos(false, true)
    }, 30 * 1000)
    return () => clearInterval(interval)
  }, [fetchPedidos])

  return (
    <DataContext.Provider value={{ 
      preloadedClientes,
      preloadClientesList,
      hydrateDetails,
      pedidos, 
      setPedidos, 
      clientes,
      setClientes,
      productos,
      setProductos,
      usuarios,
      setUsuarios,
      loading, 
      isRefreshing,
      lastSync,
      isReady: lastSync !== null, 
      fetchPedidos,
      secondsLeft,
      serverHealth,
      // Navigation
      prevPath,
      // Pedidos Filters & Page size
      activeTab,
      setActiveTab,
      filterID,
      setFilterID,
      filterCliente,
      setFilterCliente,
      filterVendedor,
      setFilterVendedor,
      filterFechaDesde,
      setFilterFechaDesde,
      filterFechaHasta,
      setFilterFechaHasta,
      selectedCliente,
      setSelectedCliente,
      selectedVendedor,
      setSelectedVendedor,
      currentPage,
      setCurrentPage,
      pageSize,
      setPageSize,
      sortConfig,
      setSortConfig,
      resetPedidosFilters
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be inside DataProvider')
  return ctx
}
