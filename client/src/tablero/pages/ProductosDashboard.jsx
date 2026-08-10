import React, { useState, useEffect } from 'react';
import KpiSmall from '../components/KpiSmall';
import SimpleBarChart from '../components/SimpleBarChart';
import StatusChart from '../components/StatusChart';
import { Loader2, Search, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { 
  fetchKpis,
  fetchProductosFamilias,
  fetchProductosProveedores,
  fetchProductosTop,
  fetchProductosMarcas
} from '../api/dashboardApi';

const ProductosDashboard = ({ onUpdate, filters, onFilterChange, triggerRefresh }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [sortBy, setSortBy] = useState('stock'); // default is stock
  const [sortOrder, setSortOrder] = useState('DESC');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setSearchTerm(filters.search || '');
  }, [filters.search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== filters.search) {
        onFilterChange({ search: searchTerm });
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const loadData = async () => {
      if (!data) setLoading(true);
      else setRefreshing(true);
      try {
        const [kpis, familias, proveedores, top, marcas] = await Promise.all([
          fetchKpis(filters),
          fetchProductosFamilias(filters),
          fetchProductosProveedores(8, filters),
          fetchProductosTop(200, { ...filters, sortBy, sortOrder }),
          fetchProductosMarcas(5, filters)
        ]);
        
        console.log('LOADING DATA with filters:', filters, 'sortBy:', sortBy, 'sortOrder:', sortOrder);
        
        setData({ kpis, familias, proveedores, top, marcas });
        if(onUpdate) onUpdate();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };
    loadData();
  }, [onUpdate, filters, sortBy, sortOrder, triggerRefresh]);

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '400px' }}>
        <Loader2 className="animate-spin" size={40} color="var(--cyan)" />
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#EF4444', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', margin: '20px' }}>
        <h3 style={{ fontFamily: 'Outfit', fontSize: '20px', marginBottom: '10px' }}>Error de Conexión</h3>
        <p style={{ color: '#64748B', maxWidth: '500px', margin: '0 auto 20px' }}>
          No se pudieron obtener los datos de los productos desde el servidor. Por favor, verifica que la base de datos SQL Server sea accesible desde tu servidor de Easypanel y que las credenciales del entorno sean correctas.
        </p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px', borderRadius: '8px', 
            background: 'var(--cyan)', color: 'white', border: 'none', cursor: 'pointer',
            fontWeight: '600', fontFamily: 'Outfit', boxShadow: '0 4px 6px -1px rgba(0,173,239,0.3)'
          }}
        >
          Reintentar conexión
        </button>
      </div>
    );
  }

  const familiasArr = Array.isArray(data?.familias) ? data.familias : [];
  const familiasLabels = familiasArr.slice(0, 5).map(f => f.name || '');
  const familiasValues = familiasArr.slice(0, 5).map(f => f.cantidad || 0);

  const provArr = Array.isArray(data?.proveedores) ? data.proveedores : [];
  const provLabels = provArr.map(p => p.name || '');
  const provValues = provArr.map(p => p.cantProductos || 0);

  const marcasArr = Array.isArray(data?.marcas) ? data.marcas : [];
  const marcasLabels = marcasArr.map(m => m.name || '');
  const marcasValues = marcasArr.map(m => m.cantidad || 0);

  return (
    <div id="productos-report" className="dashboard-grid-productos" style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(300px, 1.15fr) 1.45fr',
      gap: '20px',
      height: '100%',
      paddingBottom: '5px',
      background: '#F8FAFC'
    }}>
      
      {/* Columna Izquierda: Tabla Top Productos */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border-color)', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '15px', color: '#334155', fontFamily: 'Outfit' }}>Productos con Stock</h3>
          <div style={{ position: 'relative', width: '220px' }}>
            <input 
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 12px 6px 32px',
                borderRadius: '6px',
                border: '1px solid #E2E8F0',
                fontSize: '12px',
                fontFamily: 'Inter',
                outline: 'none',
                transition: 'border-color 0.2s',
                background: '#FFF'
              }}
            />
            <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '8px' }} />
          </div>
        </div>
        <div style={{ overflowY: 'auto', flexGrow: 1 }}>
          <table style={{ width: '100%' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                <th style={{ width: '80px' }}>Código/Marca</th>
                <th 
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => {
                    if (sortBy === 'name') setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
                    else { setSortBy('name'); setSortOrder('ASC'); }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Descripción
                    {sortBy === 'name' ? (
                      sortOrder === 'ASC' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                    ) : <ArrowUpDown size={12} color="#CBD5E1" />}
                  </div>
                </th>
                <th>Familia</th>
                <th 
                  style={{ textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => {
                    console.log('CLICK Stock - current:', { sortBy, sortOrder });
                    if (sortBy === 'stock') setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
                    else { setSortBy('stock'); setSortOrder('DESC'); }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                    {sortBy === 'stock' ? (
                      sortOrder === 'ASC' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                    ) : <ArrowUpDown size={12} color="#CBD5E1" />}
                    Stock
                  </div>
                </th>
                <th style={{ textAlign: 'right' }}>Precio</th>
              </tr>
            </thead>
            <tbody>
              {data.top.map((p, idx) => (
                <tr key={idx}>
                  <td style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{p.marca || 'N/A'}</td>
                  <td style={{ fontWeight: 500, maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#334155' }}>{p.name}</td>
                  <td style={{ fontSize: '11px', color: '#475569' }}>{p.familia}</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#00ADEF' }}>{Number(p.stock).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  <td style={{ textAlign: 'right', color: '#E6007E' }}>${p.precio?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Columna Derecha: Gráficos y KPIs */}
      <div className="dashboard-container" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '20px', 
        height: '100%',
        opacity: refreshing ? 0.6 : 1,
        transition: 'opacity 0.2s ease-in-out',
        pointerEvents: refreshing ? 'none' : 'auto'
      }}>
        
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', flexShrink: 0 }} className="kpi-grid-mobile">
          <KpiSmall label="Total Productos" value={(data.kpis?.totalProductos || 0).toLocaleString()} color="#E6007E" />
          <KpiSmall label="Productos con Stock Actual" value={(data.kpis?.productosConStock || 0).toLocaleString()} color="#00ADEF" />
        </div>

        {/* Gráfico 1: Familias (Ocupa todo el ancho disponible para evitar cortes/inclinaciones) */}
        <div style={{ flex: 1.1, minHeight: '180px', height: '100%' }} className="chart-container-mobile">
          <SimpleBarChart 
            title="Productos por Familia" 
            labels={familiasLabels}
            data={familiasValues}
            color="#00ADEF"
            selectedValue={filters.familia}
            onClick={(label) => {
              const current = filters.familia || [];
              const newValue = current.includes(label) 
                ? current.filter(v => v !== label) 
                : [...current, label];
              onFilterChange({ familia: newValue });
            }}
          />
        </div>

        {/* Fila Dividida: Proveedores + Marcas */}
        <div className="productos-split-row" style={{ flex: 1.2, display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '20px', minHeight: '200px', height: '100%' }}>
          
          {/* Gráfico 2: Proveedores (Horizontal) */}
          <div style={{ minHeight: '180px', height: '100%' }} className="chart-container-mobile">
            <SimpleBarChart 
              title="Principales Proveedores" 
              labels={provLabels}
              data={provValues}
              color="#E6007E"
              indexAxis="y"
              selectedValue={filters.proveedor}
              onClick={(label) => {
                const current = filters.proveedor || [];
                const newValue = current.includes(label) 
                  ? current.filter(v => v !== label) 
                  : [...current, label];
                onFilterChange({ proveedor: newValue });
              }}
            />
          </div>

          {/* Gráfico 3: Marcas */}
          <div className="card chart-container-mobile" style={{ minHeight: '180px', height: '100%', display: 'flex', flexDirection: 'column', padding: '10px' }}>
            <div className="card-title" style={{ marginBottom: '8px' }}>Top 5 Marcas</div>
            <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>

              <div style={{ width: '90%', height: '90%' }}>
                <StatusChart 
                  labels={marcasLabels} 
                  data={marcasValues}
                  colors={['#00ADEF', '#E6007E', '#FFF200', '#00A651', '#94A3B8']}
                  selectedValue={filters.marca}
                  onClick={(label) => {
                    const current = filters.marca || [];
                    const newValue = current.includes(label) 
                      ? current.filter(v => v !== label) 
                      : [...current, label];
                    onFilterChange({ marca: newValue });
                  }}
                />
              </div>
            </div>
          </div>
          
        </div>

      </div>
    </div>
  );
};

export default ProductosDashboard;
