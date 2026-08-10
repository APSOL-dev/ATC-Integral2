import React, { useState, useEffect } from 'react';
import StatusChart from '../components/StatusChart';
import SimpleBarChart from '../components/SimpleBarChart';
import ClientesSaldosTable from '../components/ClientesSaldosTable';
import { Loader2 } from 'lucide-react';
import { 
  fetchKpis,
  fetchClientesSaldos,
  fetchVendedores,
  fetchGeoLocalidades,
  fetchClientesPorProvincia
} from '../api/dashboardApi';

const ClientesDashboard = ({ onUpdate, filters, onFilterChange, triggerRefresh }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [sortBy, setSortBy] = useState('value'); // default is value (Saldo)
  const [sortOrder, setSortOrder] = useState('DESC');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!data) setLoading(true);
      else setRefreshing(true);
      try {
        const [kpis, saldos, vendedores, geo, provincias] = await Promise.all([
          fetchKpis(filters),
          fetchClientesSaldos(250, { ...filters, sortBy, sortOrder }),
          fetchVendedores({ ...filters, vendedor: '' }),
          fetchGeoLocalidades(15, { ...filters, localidad: '' }),
          fetchClientesPorProvincia({ ...filters, provincia: '' })
        ]);
        
        setData({ kpis, saldos, vendedores, geo, provincias });
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
        <Loader2 className="animate-spin" size={40} color="var(--magenta)" />
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#EF4444', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', margin: '20px' }}>
        <h3 style={{ fontFamily: 'Outfit', fontSize: '20px', marginBottom: '10px' }}>Error de Conexión</h3>
        <p style={{ color: '#64748B', maxWidth: '500px', margin: '0 auto 20px' }}>
          No se pudieron obtener los datos de los clientes desde el servidor. Por favor, verifica que la base de datos SQL Server sea accesible desde tu servidor de Easypanel y que las credenciales del entorno sean correctas.
        </p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px', borderRadius: '8px', 
            background: 'var(--magenta)', color: 'white', border: 'none', cursor: 'pointer',
            fontWeight: '600', fontFamily: 'Outfit', boxShadow: '0 4px 6px -1px rgba(230,0,126,0.3)'
          }}
        >
          Reintentar conexión
        </button>
      </div>
    );
  }

  const formatCurrency = (val) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}m`;
    return `$${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  const geoLabels = data.geo.map(g => g.label.split(',')[0]);
  const geoValues = data.geo.map(g => g.value / 1000000);

  const vendLabels = data.vendedores.map(v => v.name);
  const vendValues = data.vendedores.map(v => v.saldoTotal);
  
  const vendorColors = [
    '#00ADEF', '#E6007E', '#F59E0B', '#10B981', '#6366F1', 
    '#F43F5E', '#8B5CF6', '#06B6D4', '#D946EF', '#84CC16',
    '#F97316', '#0EA5E9', '#A855F7', '#14B8A6', '#EF4444'
  ];

  const provLabels = data.provincias.map(p => p.label);
  const provValues = data.provincias.map(p => p.saldoTotal / 1000000);

  return (
    <div id="clientes-report" className="dashboard-grid-clientes" style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(380px, 0.8fr) 1.2fr',
      gap: '20px',
      height: '100%',
      background: '#F8FAFC'
    }}>
      {/* Columna Izquierda: Tabla */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <ClientesSaldosTable 
          data={data.saldos.clientes} 
          total={data.kpis.saldoTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
          onSearch={(s) => onFilterChange({ search: s })}
          initialSearch={filters.search}
          sortConfig={{ sortBy, sortOrder }}
          onSortChange={(key) => {
            if (sortBy === key) {
              setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
            } else {
              setSortBy(key);
              setSortOrder('DESC');
            }
          }}
        />
      </div>

      {/* Columna Derecha */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', minHeight: 0 }}>
        
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }} className="kpi-grid-mobile-3">
          <div className="card" style={{ padding: '15px', textAlign: 'center', borderBottom: '4px solid var(--magenta)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Saldo General</span>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--magenta)', marginTop: '5px' }}>
              {formatCurrency(data.kpis.saldoTotal)}
            </div>
          </div>
          <div className="card" style={{ padding: '15px', textAlign: 'center', borderBottom: '4px solid var(--cyan)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Deudores</span>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--cyan)', marginTop: '5px' }}>
              {data.kpis.clientesConSaldo}
            </div>
          </div>
          <div className="card" style={{ padding: '15px', textAlign: 'center', borderBottom: '4px solid var(--yellow)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Saldos a Favor</span>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#B5A900', marginTop: '5px' }}>
              {data.kpis.clientesConSaldoAFavor}
            </div>
          </div>
        </div>

        {/* Localidades (Full with on right) */}
        <div style={{ flex: '1.2', minHeight: '180px', height: '100%', padding: '5px' }} className="chart-container-mobile">
          <SimpleBarChart 
            title="Saldos por Localidad (En millones de pesos)" 
            labels={geoLabels}
            data={geoValues}
            color="#00ADEF"
            indexAxis="y"
            selectedValue={filters.localidad}
            onClick={(label) => {
              const cleanedLabel = label.trim();
              const current = filters.localidad || [];
              const newValue = current.includes(cleanedLabel) 
                ? current.filter(v => v !== cleanedLabel) 
                : [...current, cleanedLabel];
              onFilterChange({ localidad: newValue });
            }}
          />
        </div>

        {/* Bottom Split Row */}
        <div className="split-row-clientes" style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: '20px', flex: '1', minHeight: '200px', height: '100%' }}>
          <div className="card chart-container-mobile" style={{ display: 'flex', flexDirection: 'column', padding: '15px', height: '100%', minHeight: '180px', boxSizing: 'border-box' }}>
            <div className="card-title" style={{ marginBottom: '15px', fontSize: '14px' }}>Participación por Vendedor</div>
            <div style={{ flexGrow: 1, minHeight: 0 }}>
               <StatusChart 
                 labels={vendLabels} 
                 data={vendValues} 
                 colors={vendorColors}
                 selectedValue={filters.vendedor}
                 onClick={(label) => {
                   const current = filters.vendedor || [];
                   const newValue = current.includes(label) 
                     ? current.filter(v => v !== label) 
                     : [...current, label];
                   onFilterChange({ vendedor: newValue });
                 }}
               />
            </div>
          </div>

          <div className="chart-container-mobile" style={{ minHeight: '180px', height: '100%' }}>
            <SimpleBarChart 
              title="Deuda por Provincia (En millones de pesos)" 
              labels={provLabels}
              data={provValues}
              color="#E6007E"
              indexAxis="y"
              selectedValue={filters.provincia}
              onClick={(label) => {
                const current = filters.provincia || [];
                const newValue = current.includes(label) 
                  ? current.filter(v => v !== label) 
                  : [...current, label];
                onFilterChange({ provincia: newValue });
              }}
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default ClientesDashboard;
