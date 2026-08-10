import React, { useState, useEffect, useCallback } from 'react';
import { Package, Users, Download, Loader2, Filter, Search, LayoutGrid, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import SearchableSelect from './components/SearchableSelect';
import ProductosDashboard from './pages/ProductosDashboard';
import ClientesDashboard from './pages/ClientesDashboard';
import PedidosDashboard from './pages/PedidosDashboard';
import DateRangeSlicer from './components/DateRangeSlicer';
import { fetchHealth, fetchFiltrosProductos, fetchFiltrosClientes } from './api/dashboardApi';
import { exportToPDF } from './utils/exportUtils';
import './index.css';

const Layout = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('productos');
  const [lastUpdate, setLastUpdate] = useState('');
  const [globalLoading, setGlobalLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(300);

  const handleForceSync = () => {
    setRefreshTrigger(prev => prev + 1);
    setSecondsLeft(300);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          setRefreshTrigger(t => t + 1);
          return 300;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Filter states
  const [filtrosProductos, setFiltrosProductos] = useState({ familias: [], proveedores: [], marcas: [] });
  const [filtrosClientes, setFiltrosClientes] = useState({ vendedores: [], provincias: [], localidades: [] });
  const [filtrosPedidos, setFiltrosPedidos] = useState({ clientes: [], vendedores: [], estados: [], articulos: [] });
  
  const [selectedFilters, setSelectedFilters] = useState({ 
    provincia: [],
    localidad: [],
    familia: [],
    proveedor: [],
    marca: [],
    vendedor: [],
    cliente: [],
    estado: [],
    articulo: [],
    search: '',
    dateRange: { start: '', end: '' }
  });

  const updateTime = useCallback(() => {
    const now = new Date();
    setLastUpdate(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}; ${now.toLocaleDateString()}`);
  }, []);

  useEffect(() => {
    // Intentamos cargar la salud y los filtros
    // Usamos catch individual para que una falla no bloquee todo el dashboard
    Promise.all([
      fetchHealth().catch(err => {
        console.error('Error de salud de API:', err);
        return { status: 'error', error: err.message };
      }),
      fetchFiltrosProductos().catch(err => {
        console.error('Error cargando filtros productos:', err);
        return { familias: [], proveedores: [], marcas: [] };
      }),
      fetchFiltrosClientes().catch(err => {
        console.error('Error cargando filtros clientes:', err);
        return { vendedores: [], provincias: [], localidades: [] };
      })
    ])
      .then(([health, filtrosP, filtrosC]) => {
        setFiltrosProductos(filtrosP);
        setFiltrosClientes(filtrosC);
        setGlobalLoading(false);
        updateTime();
        
        if (health.status === 'error') {
          console.warn('El servidor respondió con error pero el dashboard cargará igual.');
        }
      })
      .catch(err => {
        console.error('Error crítico en inicialización:', err);
        setGlobalLoading(false); // Liberamos el loading de todos modos
      });
  }, []);

  // Show "Actualizando datos..." badge whenever selectedFilters change
  useEffect(() => {
    setIsUpdating(true);
    const timer = setTimeout(() => {
      setIsUpdating(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [selectedFilters, refreshTrigger]);

  const resetFilters = () => {
    setSelectedFilters({
      provincia: [],
      localidad: [],
      familia: [],
      proveedor: [],
      marca: [],
      vendedor: [],
      cliente: [],
      estado: [],
      articulo: [],
      search: '',
      dateRange: { start: '', end: '' }
    });
  };

  if (globalLoading) {
    return (
      <div className="tablero-scope app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '20px' }}>
        <Loader2 className="animate-spin" size={48} color="var(--magenta)" />
        <h2 style={{ fontFamily: 'Outfit', color: 'var(--text-main)' }}>Conectando...</h2>
      </div>
    );
  }

  return (
    <div id="dashboard-capture" className="tablero-scope app-container" style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#F8FAFC' }}>
      <header>
        <div className="logo-container" onClick={resetFilters} style={{ cursor: 'pointer' }}>
          <img src="/logo.png" alt="A TODO COLOR" />
        </div>
        
        {/* TAB NAVIGATION AREA */}
        <div data-html2canvas-ignore style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '15px',
          justifyContent: 'flex-start',
          paddingLeft: '15px'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setActiveTab('productos')}
              style={{
                width: '160px', padding: '8px 0', borderRadius: '8px', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontFamily: 'Outfit', fontWeight: '600', fontSize: '12px',
                transition: 'all 0.3s ease',
                background: activeTab === 'productos' ? 'var(--cyan)' : '#F1F5F9',
                color: activeTab === 'productos' ? 'white' : 'var(--text-secondary)',
                boxShadow: activeTab === 'productos' ? '0 4px 6px -1px rgba(0,173,239,0.3)' : 'none'
              }}
            >
              <Package size={14} />
              Productos y Stock
            </button>
            
            <button 
              onClick={() => setActiveTab('clientes')}
              style={{
                width: '160px', padding: '8px 0', borderRadius: '8px', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontFamily: 'Outfit', fontWeight: '600', fontSize: '12px',
                transition: 'all 0.3s ease',
                background: activeTab === 'clientes' ? 'var(--magenta)' : '#F1F5F9',
                color: activeTab === 'clientes' ? 'white' : 'var(--text-secondary)',
                boxShadow: activeTab === 'clientes' ? '0 4px 6px -1px rgba(230,0,126,0.3)' : 'none'
              }}
            >
              <Users size={14} />
              Clientes y Saldos
            </button>

            <button 
              onClick={() => setActiveTab('pedidos')}
              style={{
                width: '160px', padding: '8px 0', borderRadius: '8px', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontFamily: 'Outfit', fontWeight: '600', fontSize: '12px',
                transition: 'all 0.3s ease',
                background: activeTab === 'pedidos' ? '#FFF200' : '#F1F5F9',
                color: activeTab === 'pedidos' ? '#1E293B' : 'var(--text-secondary)',
                boxShadow: activeTab === 'pedidos' ? '0 4px 6px -1px rgba(255,242,0,0.3)' : 'none'
              }}
            >
              <Filter size={14} />
              Control de Pedidos
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            background: '#F1F5F9', 
            padding: '4px 9px', 
            borderRadius: '6px', 
            fontSize: '11px', 
            fontWeight: '600', 
            color: '#475569' 
          }}>
            <span style={{ 
              width: '6px', 
              height: '6px', 
              borderRadius: '50%', 
              backgroundColor: '#22C55E', 
              boxShadow: '0 0 6px #22C55E' 
            }} />
            <span>SINC: {Math.floor(secondsLeft / 60)}:{(secondsLeft % 60).toString().padStart(2, '0')}</span>
          </div>

          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontWeight: '500' }}>
            Actualizado: {lastUpdate}
          </span>
          <button
            data-html2canvas-ignore
            onClick={handleForceSync}
            title="Forzar sincronización ahora"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '50%',
              border: 'none',
              background: '#F1F5F9',
              color: '#64748B',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={e => { e.currentTarget.style.background = '#E2E8F0'; e.currentTarget.style.color = '#0F172A'; }}
            onMouseOut={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#64748B'; }}
          >
            <RefreshCw size={12} />
          </button>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              data-html2canvas-ignore
              className="export-btn" 
              onClick={() => exportToPDF('dashboard-capture', `Reporte_${activeTab}`)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#0F172A', padding: '8px 14px', fontSize: '12px', borderRadius: '8px' }}
            >
              <Download size={14} />
              Exportar
            </button>

            <button 
              data-html2canvas-ignore
              onClick={() => navigate('/selector')}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '6px', 
                background: '#0f5da9', color: 'white', border: 'none',
                padding: '8px 14px', borderRadius: '8px', cursor: 'pointer',
                fontSize: '12px', fontWeight: '600', transition: 'all 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.background = '#0d5296'}
              onMouseOut={e => e.currentTarget.style.background = '#0f5da9'}
            >
              <LayoutGrid size={14} />
              Cambiar App
            </button>

            <button 
              data-html2canvas-ignore
              onClick={() => {
                logout();
                navigate('/login');
              }}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '6px', 
                background: 'white', color: '#EF4444', border: '1px solid #FEE2E2',
                padding: '8px 14px', borderRadius: '8px', cursor: 'pointer',
                fontSize: '12px', fontWeight: '600', transition: 'all 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.background = '#FEF2F2'}
              onMouseOut={e => e.currentTarget.style.background = 'white'}
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* DEDICATED FILTERS ROW BAR */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        padding: '10px 15px', 
        background: 'white', 
        borderRadius: '12px', 
        boxShadow: 'var(--shadow-premium)',
        marginTop: '2px',
        marginBottom: '2px',
        flexWrap: 'wrap',
        minHeight: '52px',
        border: '1px solid #F1F5F9'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', marginRight: '8px' }}>
          <Filter size={15} color="var(--magenta)" />
          <span style={{ fontSize: '11px', fontWeight: '700', fontFamily: 'Outfit', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Filtros del Panel:</span>
        </div>

        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap', flexGrow: 1 }}>
          {activeTab === 'pedidos' && (
            <>
              <div style={{ width: '280px' }}>
                <DateRangeSlicer 
                  value={selectedFilters.dateRange}
                  onChange={val => setSelectedFilters({...selectedFilters, dateRange: val})}
                  compact={true}
                />
              </div>
              <div style={{ 
                width: '1px', 
                height: '24px', 
                backgroundColor: '#CBD5E1', 
                alignSelf: 'center'
              }} />
            </>
          )}
          
          {activeTab === 'productos' ? (
            <>
              <SearchableSelect 
                label="Familias"
                options={filtrosProductos.familias}
                value={selectedFilters.familia}
                onChange={val => setSelectedFilters({...selectedFilters, familia: val})}
                multiple={true}
                minWidth="180px"
              />
              <SearchableSelect 
                label="Proveedores"
                options={filtrosProductos.proveedores}
                value={selectedFilters.proveedor}
                onChange={val => setSelectedFilters({...selectedFilters, proveedor: val})}
                multiple={true}
                minWidth="180px"
              />
              <SearchableSelect 
                label="Marca"
                options={filtrosProductos.marcas}
                value={selectedFilters.marca}
                onChange={val => setSelectedFilters({...selectedFilters, marca: val})}
                multiple={true}
                minWidth="180px"
              />
            </>
          ) : activeTab === 'clientes' ? (
            <>
              <SearchableSelect 
                label="Vendedores"
                options={filtrosClientes.vendedores}
                value={selectedFilters.vendedor}
                onChange={val => setSelectedFilters({...selectedFilters, vendedor: val})}
                multiple={true}
                minWidth="180px"
              />
              <SearchableSelect 
                label="Provincias"
                options={filtrosClientes.provincias}
                value={selectedFilters.provincia}
                onChange={val => setSelectedFilters({...selectedFilters, provincia: val})}
                multiple={true}
                minWidth="180px"
              />
            </>
          ) : activeTab === 'pedidos' ? (
            <>
              <SearchableSelect 
                label="Cliente"
                options={filtrosPedidos.clientes}
                value={selectedFilters.cliente}
                onChange={val => setSelectedFilters({...selectedFilters, cliente: val})}
                multiple={true}
                minWidth="160px"
              />
              <SearchableSelect 
                label="Vendedor"
                options={filtrosPedidos.vendedores}
                value={selectedFilters.vendedor}
                onChange={val => setSelectedFilters({...selectedFilters, vendedor: val})}
                multiple={true}
                minWidth="160px"
              />
              <SearchableSelect 
                label="Estado"
                options={filtrosPedidos.estados}
                value={selectedFilters.estado}
                onChange={val => setSelectedFilters({...selectedFilters, estado: val})}
                multiple={true}
                minWidth="160px"
              />
              <SearchableSelect 
                label="Artículos"
                options={filtrosPedidos.articulos}
                value={selectedFilters.articulo}
                onChange={val => setSelectedFilters({...selectedFilters, articulo: val})}
                multiple={true}
                minWidth="160px"
              />
            </>
          ) : null}
        </div>

        <button 
          data-html2canvas-ignore
          onClick={resetFilters}
          style={{
            background: '#F1F5F9',
            color: 'var(--text-secondary)',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginLeft: 'auto'
          }}
          onMouseOver={e => { e.currentTarget.style.background = '#E2E8F0'; e.currentTarget.style.color = '#1F2937'; }}
          onMouseOut={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          Limpiar Filtros
        </button>
      </div>

      {/* RENDER ACTIVE TAB */}
      <div className="dashboard-content" style={{ flexGrow: 1, overflow: 'hidden', padding: '10px 15px', background: '#F8FAFC', position: 'relative', height: '100%' }}>
        <div style={{ display: activeTab === 'productos' ? 'block' : 'none', height: '100%' }}>
           <ProductosDashboard 
             onUpdate={updateTime} 
             filters={selectedFilters} 
             onFilterChange={(newFilters) => setSelectedFilters({...selectedFilters, ...newFilters})}
             triggerRefresh={refreshTrigger}
           />
        </div>
        <div style={{ display: activeTab === 'clientes' ? 'block' : 'none', height: '100%' }}>
           <ClientesDashboard 
             onUpdate={updateTime} 
             filters={selectedFilters}
             onFilterChange={(newFilters) => setSelectedFilters({...selectedFilters, ...newFilters})}
             triggerRefresh={refreshTrigger}
           />
        </div>
        <div style={{ display: activeTab === 'pedidos' ? 'block' : 'none', height: '100%' }}>
           <PedidosDashboard 
             onUpdate={updateTime} 
             filters={selectedFilters}
             onFilterChange={(newFilters) => setSelectedFilters({...selectedFilters, ...newFilters})}
             setOptionsForFilters={setFiltrosPedidos}
             triggerRefresh={refreshTrigger}
           />
        </div>
      </div>
    </div>
  );
};

export default Layout;
