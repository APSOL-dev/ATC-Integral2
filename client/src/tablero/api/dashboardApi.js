const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/tablero` : '/api/tablero';

function buildQuery(params) {
  if (!params) return '';
  const q = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val) {
      if (Array.isArray(val)) {
        val.forEach(v => {
          if (v) q.append(key, v);
        });
      } else {
        q.append(key, val);
      }
    }
  }
  const str = q.toString();
  return str ? `?${str}` : '';
}

async function fetchJSON(endpoint, params) {
  const queryStr = buildQuery(params);
  let url = `${API_BASE}${endpoint}`;
  
  if (queryStr) {
    url += endpoint.includes('?') ? `&${queryStr.substring(1)}` : queryStr;
  }
  
  // Add cache buster
  url += (url.includes('?') ? '&' : '?') + `t=${Date.now()}`;
  
  console.log(`[FETCH] ${url}`);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Error ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchKpis(filters = {}) {
  return fetchJSON('/kpis', filters);
}

export async function fetchClientesSaldos(limit = 15, filters = {}) {
  return fetchJSON(`/clientes/saldos?limit=${limit}`, filters);
}

export async function fetchVendedores(filters = {}) {
  return fetchJSON('/vendedores', filters);
}

export async function fetchGeoLocalidades(limit = 8, filters = {}) {
  return fetchJSON(`/geo/localidades?limit=${limit}`, filters);
}

export async function fetchProductosFamilias(filters = {}) {
  return fetchJSON('/productos/familias', filters);
}

export async function fetchProductosProveedores(limit = 10, filters = {}) {
  return fetchJSON(`/productos/proveedores?limit=${limit}`, filters);
}

export async function fetchProductosTop(limit = 10, filters = {}) {
  return fetchJSON(`/productos/top?limit=${limit}`, filters);
}

export async function fetchProductosMarcas(limit = 10, filters = {}) {
  return fetchJSON(`/productos/marcas?limit=${limit}`, filters);
}

export async function fetchFiltrosProductos() {
  return fetchJSON('/filters/productos');
}

export async function fetchFiltrosClientes() {
  return fetchJSON('/filters/clientes');
}

export async function fetchClientesPorLocalidad(limit = 10) {
  return fetchJSON(`/clientes/por-localidad?limit=${limit}`);
}

export async function fetchClientesPorProvincia(filters = {}) {
  return fetchJSON(`/clientes/por-provincia`, filters);
}

export async function fetchHealth() {
  return fetchJSON('/health');
}

export async function fetchPedidos() {
  return fetchJSON('/pedidos');
}

export async function fetchDetalles() {
  return fetchJSON('/detalles');
}

// Fetch all dashboard data in parallel
export async function fetchAllDashboardData() {
  const [kpis, clientesSaldos, vendedores, geo, familias, proveedores, productosTop] = 
    await Promise.all([
      fetchKpis(),
      fetchClientesSaldos(),
      fetchVendedores(),
      fetchGeoLocalidades(),
      fetchProductosFamilias(),
      fetchProductosProveedores(),
      fetchProductosTop(),
    ]);

  return { kpis, clientesSaldos, vendedores, geo, familias, proveedores, productosTop };
}
