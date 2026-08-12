import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, DollarSign, ShoppingCart, Package, BarChart3, Search, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { fetchPedidos, fetchDetalles } from '../api/dashboardApi';
import StatusChart from '../components/StatusChart';
import SimpleBarChart from '../components/SimpleBarChart';
import LineChart from '../components/LineChart';
import { calcEstadoBadge, parseCurrency } from '../../utils/format.js';

const PedidosDashboard = ({ onUpdate, filters, onFilterChange, setOptionsForFilters, triggerRefresh }) => {
  const [loading, setLoading] = useState(true);
  const [pedidosData, setPedidosData] = useState([]);
  const [detallesData, setDetallesData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [tableSearchTerm, setTableSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('fecha');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [selectedPedidoId, setSelectedPedidoId] = useState(null);
  const [manualGroupingMode, setManualGroupingMode] = useState(null); // 'day', 'week', 'month' or null for auto

  useEffect(() => {
    const loadData = async () => {
      if (!pedidosData.length) setLoading(true);
      else setRefreshing(true);
      try {
        const [pedidosReq, detallesReq] = await Promise.all([
          fetchPedidos(),
          fetchDetalles()
        ]);
        setPedidosData(pedidosReq.data || []);
        setDetallesData(detallesReq.data || []);
        if (onUpdate) onUpdate();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };
    loadData();
  }, [onUpdate, triggerRefresh]);

  // Correct calculation of filter options (done once per processing)
  const filterOptions = useMemo(() => {
    if (!pedidosData.length) return null;
    const cleanPedidos = pedidosData.filter(p => p.IDPedido && p.IDPedido.toString().trim() !== '');
    const cleanDetalles = detallesData.filter(d => d.IDPedido && d.IDPedido.toString().trim() !== '');
    
    const getEstadoSimple = (p) => {
      const badge = calcEstadoBadge(p);
      const BADGE_TO_LABEL = {
        budget_sys: "Presupuesto generado",
        budget_anul: "Presupuesto anulado",
        budget: "Presupuesto",
        new: "Pedido nuevo",
        management: "En gestión",
        prepared: "Preparado",
        invoiced: "Facturado",
        shipping: "En viaje",
        finished: "Finalizado",
        anulado: "Anulado"
      };
      return BADGE_TO_LABEL[badge] || "Pedido nuevo";
    };

    return {
      clientes: Array.from(new Set(cleanPedidos.map(p => p.Nombre).filter(Boolean))).sort(),
      vendedores: Array.from(new Set(cleanPedidos.map(p => p.VendedorNombre || p.Vendedor || p['Emitido por']).filter(Boolean))).sort(),
      estados: Array.from(new Set(cleanPedidos.map(p => getEstadoSimple(p)).filter(Boolean))).sort(),
      articulos: Array.from(new Set(cleanDetalles.map(d => d['Nombre (más alla de si es item o nombre)'] || d['Nombre item']).filter(Boolean))).sort()
    };
  }, [pedidosData, detallesData]);

  useEffect(() => {
    if (filterOptions && setOptionsForFilters) {
      setOptionsForFilters(filterOptions);
    }
  }, [filterOptions, setOptionsForFilters]);

  const processedData = useMemo(() => {
    if (!pedidosData.length) return null;

    const getEstado = (p) => {
      const badge = calcEstadoBadge(p);
      const BADGE_TO_LABEL = {
        budget_sys: "Presupuesto generado",
        budget_anul: "Presupuesto anulado",
        budget: "Presupuesto",
        new: "Pedido nuevo",
        management: "En gestión",
        prepared: "Preparado",
        invoiced: "Facturado",
        shipping: "En viaje",
        finished: "Finalizado",
        anulado: "Anulado"
      };
      return BADGE_TO_LABEL[badge] || "Pedido nuevo";
    };

    // Robust date parsing for filtering and sorting
    const parsePedidoDate = (dateStr) => {
      if (!dateStr) return 0;
      const str = dateStr.toString().trim();
      if (!str) return 0;
      try {
        if (str.includes('/')) {
          const parts = str.split(' ')[0].split('/');
          if (parts.length === 3) {
            let [d, m, y] = parts;
            if (y.length === 2) y = '20' + y;
            const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
            return isNaN(date.getTime()) ? 0 : date.getTime();
          }
        }
        const d = new Date(str);
        if (isNaN(d.getTime())) {
          // Try manual parse for "YYYY-MM-DD HH:mm:ss"
          const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
          if (isoMatch) {
             const rd = new Date(isoMatch[1], isoMatch[2]-1, isoMatch[3]);
             return isNaN(rd.getTime()) ? 0 : rd.getTime();
          }
          return 0;
        }
        return d.getTime();
      } catch (e) {
        return 0;
      }
    };

    // Cleanup: Filter out empty rows from the sheet
    const cleanPedidos = pedidosData.filter(p => p.IDPedido && p.IDPedido.toString().trim() !== '');
    const cleanDetalles = detallesData.filter(d => d.IDPedido && d.IDPedido.toString().trim() !== '');

    let filteredPedidos = cleanPedidos.map(p => ({ ...p, EstadoCalculado: getEstado(p) }));

    // Apply global date range filter
    if (filters.dateRange?.start || filters.dateRange?.end) {
      filteredPedidos = filteredPedidos.filter(p => {
        const pDate = parsePedidoDate(p['Fecha y hora']);
        if (pDate === 0) return false;
        
        if (filters.dateRange.start && filters.dateRange.start.trim() !== '') {
          const startDate = new Date(filters.dateRange.start + 'T00:00:00');
          if (!isNaN(startDate.getTime()) && pDate < startDate.getTime()) return false;
        }
        if (filters.dateRange.end && filters.dateRange.end.trim() !== '') {
          const endDate = new Date(filters.dateRange.end + 'T23:59:59');
          if (!isNaN(endDate.getTime()) && pDate > endDate.getTime()) return false;
        }
        return true;
      });
    }

    if (filters.cliente?.length) filteredPedidos = filteredPedidos.filter(p => filters.cliente.includes(p.Nombre));
    if (filters.vendedor?.length) {
      filteredPedidos = filteredPedidos.filter(p => {
        const vName = p.VendedorNombre || p.Vendedor || p['Emitido por'] || '';
        return filters.vendedor.includes(vName);
      });
    }
    if (filters.estado?.length) filteredPedidos = filteredPedidos.filter(p => filters.estado.includes(p.EstadoCalculado));

    const filteredPedidosIds = new Set(filteredPedidos.map(p => p.IDPedido));
    let filteredDetalles = cleanDetalles.filter(d => filteredPedidosIds.has(d.IDPedido));

    if (filters.articulo?.length) {
      filteredDetalles = filteredDetalles.filter(d => filters.articulo.includes(d['Nombre (más alla de si es item o nombre)'] || d['Nombre item']));
      const validIds = new Set(filteredDetalles.map(d => d.IDPedido));
      filteredPedidos = filteredPedidos.filter(p => validIds.has(p.IDPedido));
    }

    // Calculate individual order totals using unified parseCurrency
    const pedidoTotalsMap = {};
    cleanPedidos.forEach(p => {
      const id = p.IDPedido;
      pedidoTotalsMap[id] = parseCurrency(p.Total || p.total || 0);
    });

    // Apply table search (client name)
    if (tableSearchTerm) {
      filteredPedidos = filteredPedidos.filter(p => 
        (p.Nombre || '').toLowerCase().includes(tableSearchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filteredPedidos.sort((a,b) => {
      if (sortBy === 'fecha') {
        const da = parsePedidoDate(a['Fecha y hora']);
        const db = parsePedidoDate(b['Fecha y hora']);
        return sortOrder === 'ASC' ? da - db : db - da;
      }
      return 0;
    });

    // If an order is selected, we filter EVERYTHING by that order
    let finalPedidosForCalculations = filteredPedidos;
    if (selectedPedidoId) {
      finalPedidosForCalculations = filteredPedidos.filter(p => p.IDPedido === selectedPedidoId);
    }

    const montoTotal = finalPedidosForCalculations.reduce((acc, curr) => acc + (pedidoTotalsMap[curr.IDPedido] || 0), 0);

    const porVendedor = {};
    finalPedidosForCalculations.forEach(p => {
      const v = p.VendedorNombre || p.Vendedor || p['Emitido por'] || 'Sin Vendedor';
      porVendedor[v] = (porVendedor[v] || 0) + 1;
    });

    const porProducto = {};
    let cantidadesPedidasTotal = 0;
    
    // If a pedido is selected, we only show its products. 
    // Otherwise, we show the global top 10.
    const detallesToProcess = selectedPedidoId 
      ? cleanDetalles.filter(d => d.IDPedido === selectedPedidoId)
      : filteredDetalles;

    detallesToProcess.forEach(d => {
      const n = d['Nombre (más alla de si es item o nombre)'] || d['Nombre item'] || 'Desc. N/A';
      const c = parseInt(d.Cantidad || 0);
      cantidadesPedidasTotal += c;
      if (!porProducto[n]) porProducto[n] = { nombre: n, cantidad: 0 };
      porProducto[n].cantidad += c;
    });
    const productosMasPedidos = Object.values(porProducto).sort((a,b) => b.cantidad - a.cantidad);
    const displayedProducts = selectedPedidoId ? productosMasPedidos : productosMasPedidos.slice(0, 10);

    const porEstado = {};
    finalPedidosForCalculations.forEach(p => {
      const e = p.EstadoCalculado;
      porEstado[e] = (porEstado[e] || 0) + 1;
    });

    // INTELLIGENT TEMPORAL SCALING
    // Use filters as primary bounds, data as fallback
    let minTs, maxTs;
    if (filters.dateRange?.start) {
      minTs = new Date(filters.dateRange.start + 'T00:00:00').getTime();
    } else {
      const timestamps = filteredPedidos.map(p => parsePedidoDate(p['Fecha y hora'])).filter(t => t > 0);
      minTs = timestamps.length > 0 ? Math.min(...timestamps) : Date.now() - (30 * 24 * 60 * 60 * 1000);
    }

    if (filters.dateRange?.end) {
      maxTs = new Date(filters.dateRange.end + 'T23:59:59').getTime();
    } else {
      const timestamps = filteredPedidos.map(p => parsePedidoDate(p['Fecha y hora'])).filter(t => t > 0);
      maxTs = timestamps.length > 0 ? Math.max(...timestamps) : Date.now();
    }

    const deltaDays = (maxTs - minTs) / (1000 * 60 * 60 * 24);

    let groupingMode = manualGroupingMode;
    if (!groupingMode) {
      if (deltaDays > 1 && deltaDays <= 31) groupingMode = 'day';
      else if (deltaDays > 31 && deltaDays <= 180) groupingMode = 'week';
      else groupingMode = 'month';
    }

    const porTiempo = {};
    const timeSlots = [];
    let chartTitleScale = 'Mensual';

    const hasDataRange = maxTs >= minTs;
    if (hasDataRange) {
      const current = new Date(minTs);
      if (groupingMode === 'day') {
        current.setHours(0,0,0,0);
        const endDay = new Date(maxTs);
        endDay.setHours(23,59,59,999);
        while (current <= endDay) {
          const key = current.toISOString().split('T')[0];
          porTiempo[key] = 0;
          timeSlots.push({ key, label: current.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }) });
          current.setDate(current.getDate() + 1);
        }
        chartTitleScale = 'Diaria';
      } else if (groupingMode === 'week') {
        const day = current.getDay();
        const diff = current.getDate() - day + (day === 0 ? -6 : 1); // Monday
        current.setDate(diff);
        current.setHours(0,0,0,0);
        while (current.getTime() <= maxTs) {
          const key = current.toISOString().split('T')[0];
          porTiempo[key] = 0;
          timeSlots.push({ key, label: 'Sem ' + current.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }) });
          current.setDate(current.getDate() + 7);
        }
        chartTitleScale = 'Semanal';
      } else {
        current.setDate(1);
        current.setHours(0,0,0,0);
        while (current.getTime() <= maxTs) {
          const key = `${current.getFullYear()}-${(current.getMonth() + 1).toString().padStart(2, '0')}-01`;
          porTiempo[key] = 0;
          timeSlots.push({ key, label: current.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' }).replace('.', '') });
          current.setMonth(current.getMonth() + 1);
        }
        chartTitleScale = 'Mensual';
      }

      finalPedidosForCalculations.forEach(p => {
        const ts = parsePedidoDate(p['Fecha y hora']);
        if (ts === 0) return;
        const d = new Date(ts);
        let key = '';
        if (groupingMode === 'day') {
          key = d.toISOString().split('T')[0];
        } else if (groupingMode === 'week') {
          const day = d.getDay();
          const diff = d.getDate() - day + (day === 0 ? -6 : 1);
          const mon = new Date(d);
          mon.setDate(diff);
          key = mon.toISOString().split('T')[0];
        } else {
          key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-01`;
        }
        if (porTiempo.hasOwnProperty(key)) {
          porTiempo[key]++;
        }
      });
    }

    const evolutionLabels = timeSlots.map(s => s.label);
    const evolutionValues = timeSlots.map(s => porTiempo[s.key]);
    const chartTitle = `Tendencia ${chartTitleScale} de Pedidos`;

    return {
      filteredPedidos, montoTotal, cantidadPedidos: finalPedidosForCalculations.length, porVendedor,
      productosMasPedidos: displayedProducts, articulosDistintos: Object.keys(porProducto).length,
      cantidadesPedidasTotal, porEstado, evolutionLabels, evolutionValues, pedidoTotalsMap, chartTitle,
      groupingMode
    };
  }, [pedidosData, detallesData, filters, tableSearchTerm, sortBy, sortOrder, manualGroupingMode, selectedPedidoId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '400px' }}>
        <Loader2 className="animate-spin" size={40} color="#E6007E" />
      </div>
    );
  }

  if (!processedData) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#EF4444', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', margin: '20px' }}>
        <h3 style={{ fontFamily: 'Outfit', fontSize: '20px', marginBottom: '10px' }}>Error de Conexión o Datos no disponibles</h3>
        <p style={{ color: '#64748B', maxWidth: '500px', margin: '0 auto 20px' }}>
          No se pudieron obtener los datos de los pedidos desde Google Sheets. Por favor, verifica las credenciales de Google Sheets (`GOOGLE_CREDENTIALS`) y que el ID de la planilla sea correcto.
        </p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px', borderRadius: '8px', 
            background: '#E6007E', color: 'white', border: 'none', cursor: 'pointer',
            fontWeight: '600', fontFamily: 'Outfit', boxShadow: '0 4px 6px -1px rgba(230,0,126,0.3)'
          }}
        >
          Reintentar conexión
        </button>
      </div>
    );
  }

  const {
    filteredPedidos, montoTotal, cantidadPedidos, porVendedor,
    productosMasPedidos, articulosDistintos, cantidadesPedidasTotal,
    porEstado, evolutionLabels, evolutionValues, pedidoTotalsMap, chartTitle, groupingMode
  } = processedData;

  const formatCurrency = (val) => {
    return `$${Math.round(val).toLocaleString('es-AR')}`;
  };

  const ESTADO_COLOR_MAP = {
    "Presupuesto generado": { hex: "#3b82f6", bg: "#3b82f620" },
    "Presupuesto anulado": { hex: "#ef4444", bg: "#ef444420" },
    "Presupuesto": { hex: "#0ea5e9", bg: "#0ea5e920" },
    "Pedido nuevo": { hex: "#f59e0b", bg: "#f59e0b20" },
    "En gestión": { hex: "#ec4899", bg: "#ec489920" },
    "Preparado": { hex: "#6366f1", bg: "#6366f120" },
    "Facturado": { hex: "#10b981", bg: "#10b98120" },
    "En viaje": { hex: "#0ea5e9", bg: "#0ea5e920" },
    "Finalizado": { hex: "#10b981", bg: "#10b98120" },
    "Anulado": { hex: "#ef4444", bg: "#ef444420" }
  };

  const getStatusColor = (estado) => {
    const config = ESTADO_COLOR_MAP[estado];
    if (config) {
      return { bg: config.bg, text: config.hex };
    }
    return { bg: '#F1F5F9', text: '#64748B' };
  };

  const KpiStat = ({ icon: Icon, label, value, color, bg }) => (
    <div className="card" style={{ 
      padding: '8px 12px', 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center',
      gap: '4px',
      background: 'white',
      borderLeft: `4px solid ${color}`,
      boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.05)',
      borderRadius: '10px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ 
          background: bg, 
          padding: '4px', 
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon size={12} color={color} />
        </div>
        <div style={{ fontSize: '9.5px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{label}</div>
      </div>
      <div style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', lineHeight: 1.1 }}>{value}</div>
    </div>
  );

  return (
    <div id="pedidos-report" className="dashboard-grid-pedidos" style={{ 
      display: 'grid', 
      gridTemplateColumns: 'minmax(320px, 640px) minmax(0, 1.2fr) minmax(0, 1fr)', 
      gridTemplateRows: '125px 1fr 200px',
      gap: '10px', 
      height: '100%', 
      overflow: 'hidden'
    }}>
      
      {/* ROW 1: Table & KPIs */}
      <div className="card" style={{ gridRow: '1 / span 2', padding: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <div className="card-title" style={{ color: '#E6007E', margin: 0, fontSize: '13px' }}>Historial de Pedidos</div>
            <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 'bold' }}>({filteredPedidos.length} filas)</span>
          </div>
          <div style={{ position: 'relative', width: '150px' }}>
            <input 
              type="text"
              placeholder="Buscar cliente..."
              value={tableSearchTerm}
              onChange={(e) => setTableSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '4px 8px 4px 25px',
                borderRadius: '6px',
                border: '1px solid #E2E8F0',
                fontSize: '10px',
                outline: 'none'
              }}
            />
            <Search size={12} color="#94A3B8" style={{ position: 'absolute', left: '8px', top: '6px' }} />
          </div>
        </div>
        <div style={{ flexGrow: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', fontSize: '10px', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
              <tr style={{ background: '#F1F5F9', textAlign: 'left' }}>
                <th style={{ padding: '6px', width: '40px' }}>ID</th>
                <th 
                  style={{ padding: '6px', width: '80px', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => {
                    if (sortBy === 'fecha') setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
                    else { setSortBy('fecha'); setSortOrder('DESC'); }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    Fecha
                    {sortBy === 'fecha' ? (
                      sortOrder === 'ASC' ? <ArrowUp size={10} /> : <ArrowDown size={10} />
                    ) : <ArrowUpDown size={10} color="#CBD5E1" />}
                  </div>
                </th>
                <th style={{ padding: '6px' }}>Cliente</th>
                <th style={{ padding: '6px', width: '60px' }}>Vend.</th>
                <th style={{ padding: '6px', width: '80px' }}>Estado</th>
                <th style={{ padding: '6px', width: '80px', textAlign: 'right' }}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {filteredPedidos.slice(0, 50).map((p, i) => (
                <tr 
                  key={i} 
                  onClick={() => setSelectedPedidoId(selectedPedidoId === p.IDPedido ? null : p.IDPedido)}
                  style={{ 
                    borderBottom: '1px solid #F1F5F9',
                    cursor: 'pointer',
                    background: selectedPedidoId === p.IDPedido ? '#F0F9FF' : 'transparent',
                    transition: 'background 0.2s ease'
                  }}
                >
                  <td style={{ padding: '6px' }}>{p.IDPedido}</td>
                  <td style={{ padding: '6px' }}>{p['Fecha y hora']?.split(' ')[0]}</td>
                  <td style={{ padding: '6px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.Nombre}</td>
                  <td style={{ padding: '6px' }}>{(p.VendedorNombre || p.Vendedor || p['Emitido por'])?.split(' ')[0]?.slice(0, 8)}</td>
                  <td style={{ padding: '6px' }}>
                    <span style={{ 
                      fontSize: '8px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px',
                      background: getStatusColor(p.EstadoCalculado).bg,
                      color: getStatusColor(p.EstadoCalculado).text,
                      display: 'inline-block', width: '100%', textAlign: 'center', whiteSpace: 'nowrap'
                    }}>
                      {p.EstadoCalculado}
                    </span>
                  </td>
                  <td style={{ padding: '6px', textAlign: 'right', fontWeight: 'bold' }}>
                    {formatCurrency(pedidoTotalsMap[p.IDPedido] || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }} className="kpi-grid-mobile">
        <KpiStat 
          icon={DollarSign} 
          label="Monto Total" 
          value={formatCurrency(montoTotal)} 
          color="#00ADEF" 
          bg="#00ADEF15" 
        />
        <KpiStat 
          icon={ShoppingCart} 
          label="Pedidos" 
          value={cantidadPedidos} 
          color="#E6007E" 
          bg="#E6007E15" 
        />
        <KpiStat 
          icon={Package} 
          label="Art. Distintos" 
          value={articulosDistintos} 
          color="#10B981" 
          bg="#10B98115" 
        />
        <KpiStat 
          icon={BarChart3} 
          label="Unidades Total" 
          value={cantidadesPedidasTotal.toLocaleString('es-AR')} 
          color="#6366F1" 
          bg="#6366F115" 
        />
      </div>

      {/* RIGHT PANEL: Charts */}
      <div style={{ gridRow: '1 / span 2', display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
        <div style={{ flex: 0.95 }}>
          <SimpleBarChart 
            title="Desempeño Vendedores" 
            labels={Object.keys(porVendedor).sort((a,b) => porVendedor[b] - porVendedor[a]).slice(0, 8)} 
            data={Object.keys(porVendedor).sort((a,b) => porVendedor[b] - porVendedor[a]).slice(0, 8).map(v => porVendedor[v])} 
            color="#E6007E" 
            indexAxis="y" 
            selectedValue={filters.vendedor}
            onClick={(label) => {
              const current = filters.vendedor || [];
              const newValue = current.includes(label) ? current.filter(v => v !== label) : [...current, label];
              onFilterChange({ vendedor: newValue });
            }}
          />
        </div>
        <div className="card" style={{ flex: 1.25, padding: '12px', display: 'flex', flexDirection: 'column' }}>
          <div className="card-title" style={{ color: '#E6007E', fontSize: '13px', marginBottom: '8px' }}>Distribución de Estados</div>
          <div style={{ flexGrow: 1, minHeight: 0 }}>
            <StatusChart 
              labels={Object.keys(porEstado).sort()} 
              data={Object.keys(porEstado).sort().map(e => porEstado[e])} 
              colors={Object.keys(porEstado).sort().map(e => {
                return ESTADO_COLOR_MAP[e]?.hex || '#94A3B8';
              })} 
              legendPosition="left"
              selectedValue={filters.estado}
              onClick={(label) => {
                const current = filters.estado || [];
                const newValue = current.includes(label) ? current.filter(e => e !== label) : [...current, label];
                onFilterChange({ estado: newValue });
              }}
            />
          </div>
        </div>
      </div>

      {/* ROW 2 MIDDLE: Products */}
      <div style={{ minHeight: 0 }}>
         <SimpleBarChart 
            title={selectedPedidoId ? `Detalle Pedido #${selectedPedidoId}` : "Productos más vendidos"} 
            labels={productosMasPedidos.map(p => p.nombre)} 
            data={productosMasPedidos.map(p => p.cantidad)} 
            color="#00ADEF" 
            indexAxis="y" 
            selectedValue={filters.articulo}
            onClick={(label) => {
              const current = filters.articulo || [];
              const newValue = current.includes(label) ? current.filter(a => a !== label) : [...current, label];
              onFilterChange({ articulo: newValue });
            }}
          />
      </div>

      {/* ROW 3: Temporal Chart */}
      <div style={{ gridColumn: '1 / span 3', minHeight: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: '15px', right: '15px', display: 'flex', gap: '4px', zIndex: 10 }}>
          {['day', 'week', 'month'].map(mode => (
            <button
              key={mode}
              onClick={() => setManualGroupingMode(mode)}
              style={{
                padding: '2px 8px',
                fontSize: '9px',
                borderRadius: '4px',
                border: '1px solid #E2E8F0',
                background: groupingMode === mode ? 'var(--magenta)' : 'white',
                color: groupingMode === mode ? 'white' : '#64748B',
                cursor: 'pointer',
                fontWeight: '600',
                textTransform: 'capitalize'
              }}
            >
              {mode === 'day' ? 'Días' : mode === 'week' ? 'Sem' : 'Mes'}
            </button>
          ))}
          <button
            onClick={() => setManualGroupingMode(null)}
            style={{
              padding: '2px 8px',
              fontSize: '9px',
              borderRadius: '4px',
              border: '1px solid #E2E8F0',
              background: !manualGroupingMode ? '#F1F5F9' : 'white',
              color: '#64748B',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Auto
          </button>
        </div>
        <div style={{ height: '100%' }}>
          <LineChart 
            title={chartTitle} 
            labels={evolutionLabels} 
            data={evolutionValues} 
            color="#E6007E" 
            fill={true} 
          />
        </div>
      </div>
    </div>
  );
};

export default PedidosDashboard;

