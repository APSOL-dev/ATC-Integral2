# Catálogo de Productos

## Qué hace
Expone el catálogo de artículos disponibles en la distribuidora de pinturas. Ofrece a los vendedores herramientas de búsqueda rápida (por código o descripción) y filtros avanzados por Proveedor, Familia y Marca. Además, permite filtrar y ocultar productos que no posean stock disponible para evitar la venta de artículos sin disponibilidad real en el depósito.

---

## Escenarios cubiertos

### 1. Búsqueda y Filtrado General
- **Búsqueda por Texto Flexibilizada:** Permite ingresar palabras clave múltiples sueltas o desordenadas (separadas por espacio o por el carácter `+`), o el código de artículo. El sistema valida que todas las palabras buscadas estén presentes dentro del título/descripción, marca, proveedor o código del artículo, aplicando un debounce de 400ms.
  - *Verificado por:* [productosFiltros.test.jsx](file:///c:/Users/Renata%20Morano/OneDrive/Documentos/Antigravity/ATC%20Migraci%C3%B3n/client/src/pages/productos/productosFiltros.test.jsx) y [productSearch.test.js](file:///c:/Users/Renata%20Morano/OneDrive/Documentos/Antigravity/ATC%20Migraci%C3%B3n/client/src/utils/productSearch.test.js)

### 2. Filtro de Stock Disponible
- **Solo con Stock:** Al presionar la casilla de selección "Stock", el catálogo descarta todos aquellos productos cuya existencia actual sea igual a `0`.
  - *Verificado por:* [productosFiltros.test.jsx](file:///c:/Users/Renata%20Morano/OneDrive/Documentos/Antigravity/ATC%20Migraci%C3%B3n/client/src/pages/productos/productosFiltros.test.jsx)

### 3. Filtros Avanzados
- **Filtrado por Proveedor:** Permite desplegar la lista de proveedores sugeridos y seleccionar un fabricante en específico (ej. "Sinteplast SA"), visualizando solo los productos distribuidos por este.
  - *Verificado por:* [productosFiltros.test.jsx](file:///c:/Users/Renata%20Morano/OneDrive/Documentos/Antigravity/ATC%20Migraci%C3%B3n/client/src/pages/productos/productosFiltros.test.jsx)

---

## Casos borde conocidos

- **Carga inicial lenta:** Si la grilla de productos demora en cargarse desde la base de datos centralizada, la interfaz muestra un esqueleto de carga y un mensaje informativo de "Sincronizando información..." impidiendo que el vendedor trabaje sobre datos a medio cargar.
- **Stock Indeterminado (Valores Vacíos en Sheets):** Si en Google Sheets una celda de stock se encuentra vacía o contiene texto no numérico, el frontend interpreta la existencia como `0` de forma segura, marcando la insignia del artículo en rojo en lugar de crashear la página.

---

## Restricciones o supuestos

- **Datos de Origen:** La información se lee directamente del listado de inventario de las hojas de Google Sheets (`Articulos`), aplicando el formato de precios correspondiente (con IVA incluido) determinado para los vendedores.
