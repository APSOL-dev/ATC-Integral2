# Gestión de Clientes

## Qué hace
Brinda a los administradores y vendedores de calle el listado completo de clientes activos en la distribuidora. Permite buscar clientes por razón social o CUIT, filtrar por localidad de radicación o segmentar por vendedor asignado para agilizar la gestión de cobranza y ruteo de visitas comerciales.

---

## Escenarios cubiertos

### 1. Búsqueda de Clientes
- **Búsqueda por Razón Social o CUIT:** Permite ingresar un fragmento del nombre o CUIT en el buscador y devuelve los clientes coincidentes aplicando un debounce de 400ms para evitar parpadeos y solicitudes reiteradas al DOM.
  - *Verificado por:* [clientesFiltros.test.jsx](file:///c:/Users/Renata%20Morano/OneDrive/Documentos/Antigravity/ATC%20Migraci%C3%B3n/client/src/pages/clientes/clientesFiltros.test.jsx)

### 2. Filtros Dinámicos
- **Filtrado por Localidad:** Permite buscar y seleccionar una localidad (ej. "Tandil", "La Plata") mediante el buscador predictivo y acotar la grilla solo a los clientes ubicados en esa zona geográfica.
  - *Verificado por:* [clientesFiltros.test.jsx](file:///c:/Users/Renata%20Morano/OneDrive/Documentos/Antigravity/ATC%20Migraci%C3%B3n/client/src/pages/clientes/clientesFiltros.test.jsx)
- **Filtrado por Vendedor:** Permite seleccionar un vendedor sugerido del desplegable de búsqueda y renderizar exclusivamente las cuentas comerciales asignadas a su cartera de clientes.
  - *Verificado por:* [clientesFiltros.test.jsx](file:///c:/Users/Renata%20Morano/OneDrive/Documentos/Antigravity/ATC%20Migraci%C3%B3n/client/src/pages/clientes/clientesFiltros.test.jsx)

---

## Casos borde conocidos

- **Clientes sin Vendedor Asignado (Canal Directo):** Si un cliente no posee vendedor registrado en Sheets (ej. venta directa de fábrica), las celdas de vendedor muestran el valor `—` de forma segura. Estos clientes quedan excluidos en el scoping de los vendedores calle, pero son visibles para el perfil de administración.
- **Clientes sin Localidad Registrada:** Se renderizan con localidad `"—"` y se excluyen limpiamente de los listados de filtros geográficos para evitar que el selector predictivo ofrezca opciones vacías o nulas.

---

## Restricciones o supuestos

- **Datos de Origen:** La información se lee e integra desde la pestaña `Clientes` de las hojas de Google Sheets, la cual se actualiza periódicamente mediante sincronizaciones con el sistema de gestión interna (ERP).
