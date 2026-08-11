# Gestión de Pedidos

## Qué hace
Permite la emisión, visualización y edición de los pedidos y presupuestos en el sistema de la distribuidora. Los pedidos cargados se listan en una grilla con filtros dinámicos por ID, cliente, vendedor, estados (pestañas) y fecha. Al editar o crear un pedido, permite buscar y agregar productos visualizando el stock disponible para evitar promesas de entrega insatisfechas, calcular subtotales y aplicar descuentos globales antes de emitirlos.

---

## Escenarios cubiertos

### 1. Creación de Nuevos Pedidos
- **Selección de Cliente:** Permite buscar y asociar un cliente respetando el scoping de visibilidad del vendedor autenticado.
  - *Verificado por:* [PedidoForm.test.jsx](file:///c:/Users/Renata%20Morano/OneDrive/Documentos/Antigravity/ATC%20Migraci%C3%B3n/client/src/pages/pedidos/PedidoForm.test.jsx)
- **Cálculo de Subtotales y Totales:** Calcula dinámicamente el precio de cada fila (Cantidad x Precio) y actualiza el Importe Neto Final en tiempo real.
  - *Verificado por:* [PedidoForm.test.jsx](file:///c:/Users/Renata%20Morano/OneDrive/Documentos/Antigravity/ATC%20Migraci%C3%B3n/client/src/pages/pedidos/PedidoForm.test.jsx)
- **Descuentos Globales:** Permite ingresar un porcentaje de descuento (ej: 10%), calculando el monto descontado y actualizando el Importe Neto Final.
  - *Verificado por:* [PedidoForm.test.jsx](file:///c:/Users/Renata%20Morano/OneDrive/Documentos/Antigravity/ATC%20Migraci%C3%B3n/client/src/pages/pedidos/PedidoForm.test.jsx)
- **Envío en Segundo Plano:** El formulario serializa un JSON estructurado con la cabecera del pedido (`header`) y el desglose de productos (`detalles`) enviándolo a la API (`POST /pedidos`).
  - *Verificado por:* [PedidoForm.test.jsx](file:///c:/Users/Renata%20Morano/OneDrive/Documentos/Antigravity/ATC%20Migraci%C3%B3n/client/src/pages/pedidos/PedidoForm.test.jsx)

### 2. Visualización y Legibilidad de Stock en Edición y Selección
- **Tipografía y Escala Visual:** Los listados desplegables y las fichas de selección de productos y clientes utilizan una escala tipográfica fijada en `15px` (`text-[15px]`) para los nombres y `12px` (`text-xs`) para detalles de código, precio y ubicación para maximizar la legibilidad.
- **Formato de Nombre del Producto:** En las listas desplegables de búsqueda (para crear o editar pedidos) y en las tablas de detalles del pedido, el título del producto se presenta concatenando la descripción y la marca (`Descripción - Marca`), facilitando la distinción inmediata por parte del usuario.
- **Insignia de Stock Resaltada:** El indicador y la cifra de stock disponible se destacan con fondo verde y texto en negrita intensa (`text-emerald-700 bg-emerald-100 font-extrabold border border-emerald-300`) cuando hay unidades en existencia, o en rojo si está agotado (`text-red-600 bg-red-100 font-bold`).
  - *Verificado por:* [editStock.test.jsx](file:///c:/Users/Renata%20Morano/OneDrive/Documentos/Antigravity/COPIA%20ATC%20Migraci%C3%B3n/client/src/pages/pedidos/editStock.test.jsx)
- **Sincronización de Stock en Tiempo Real al Editar (Pedidos 0.0):** Al ingresar a editar un pedido en estado `0.0` (o borrador), el sistema cruza en tiempo real cada artículo cargado con la información actualizada del catálogo de la base de datos (`productos`), mostrando la existencia actual disponible en lugar de valores `0` o estáticos archivados.
  - *Verificado por:* [editStock.test.jsx](file:///c:/Users/Renata%20Morano/OneDrive/Documentos/Antigravity/COPIA%20ATC%20Migraci%C3%B3n/client/src/pages/pedidos/editStock.test.jsx)
- **Sección Consolidado del Formulario de Pedido:** En la columna de Consolidado (`PedidoForm.jsx`), las etiquetas y valores de Subtotal, Descuento y Monto Descontado incrementaron su tamaño visual 2 puntos e incorporan peso en negrita resaltado (`font-extrabold` / `font-black`).
- **Visualización de Observaciones del Pedido:** Las notas u observaciones especificadas al crear o editar el pedido se presentan en una tarjeta destacada con icono de texto en el detalle del pedido (`/pedidos/:id`), se incluyen en el mensaje para compartir por WhatsApp y se imprimen formalmente en la vista/PDF del comprobante.
- **Acciones de Borrado y Anulación por Estado y Perfil:**
  - **En Estado 0 y 0.:** Se habilita el botón **"Borrar"** (elimina el pedido directamente del sistema).
  - **En Estado 0.0:** Se habilita el botón **"Anular"** (cambia el estado del pedido a `0.0.99`).
  - **Perfiles autorizados:** Vendedor Calle (sobre sus propios pedidos), Super Vendedor (sobre todos los pedidos) y Administración Operativa / Full (sobre todos los pedidos).
  - *Verificado por:* [visibilidadAprobacion.test.jsx](file:///c:/Users/Renata%20Morano/OneDrive/Documentos/Antigravity/COPIA%20ATC%20Migraci%C3%B3n/client/src/pages/pedidos/visibilidadAprobacion.test.jsx) y [pedidoEstado.test.jsx](file:///c:/Users/Renata%20Morano/OneDrive/Documentos/Antigravity/COPIA%20ATC%20Migraci%C3%B3n/client/src/pages/pedidos/pedidoEstado.test.jsx)

### 3. Filtros de la Cartera de Pedidos
- **Búsqueda por ID:** Permite filtrar y aislar un pedido escribiendo su identificador numérico (ID de pedido) en el campo de texto.
  - *Verificado por:* [pedidosFiltros.test.jsx](file:///c:/Users/Renata%20Morano/OneDrive/Documentos/Antigravity/ATC%20Migraci%C3%B3n/client/src/pages/pedidos/pedidosFiltros.test.jsx)
- **Filtrado por Estado:** Permite hacer clic en las distintas pestañas de estados (ej. "Presupuesto (0)", "Nuevo (1)", "Preparado (2)") y renderizar exclusivamente aquellos pedidos cuyo estado coincida con la categoría seleccionada.
  - *Verificado por:* [pedidosFiltros.test.jsx](file:///c:/Users/Renata%20Morano/OneDrive/Documentos/Antigravity/ATC%20Migraci%C3%B3n/client/src/pages/pedidos/pedidosFiltros.test.jsx)

---

## Casos borde conocidos

- **Intento de Envío sin Cliente:** Al presionar "Generar Pedido" sin seleccionar un cliente, el formulario bloquea el envío y muestra la alerta del navegador `"Seleccione un cliente"`.
  - *Verificado por:* [PedidoForm.test.jsx](file:///c:/Users/Renata%20Morano/OneDrive/Documentos/Antigravity/ATC%20Migraci%C3%B3n/client/src/pages/pedidos/PedidoForm.test.jsx)
- **Descuento Vacío o No Numérico:** Si el campo de descuento se vacía o contiene un valor inválido, el sistema procesa el total utilizando un descuento del `0%` por defecto de forma segura.
  - *Verificado por:* [PedidoForm.test.jsx](file:///c:/Users/Renata%20Morano/OneDrive/Documentos/Antigravity/ATC%20Migraci%C3%B3n/client/src/pages/pedidos/PedidoForm.test.jsx)
- **Baja Lógica sin ID Asignado:** Si un pedido temporal (u optimista) no posee ID asignado por Sheets todavía, la grilla del listado muestra el mensaje parpadeante `"Guardando..."` para advertir al vendedor que se está sincronizando con el servidor.
- **Rango de Fechas Invertido:** Si el vendedor ingresa un filtro donde la "fecha desde" es posterior a la "fecha hasta", el listado filtra y devuelve una grilla vacía de forma limpia en lugar de colapsar la renderización.

---

## Restricciones o supuestos

- **Edición restringida:** Solo se permite la modificación de ítems, cantidades y descuentos para pedidos que se encuentren en estado **Borrador o Presupuesto (Estado 0)**. Una vez confirmados o facturados (Estados superiores), los pedidos quedan bloqueados para su edición.
- **Sincronización híbrida Supabase & SQL Server:**
  - Los borradores y modificaciones se guardan inmediatamente en las vistas públicas de Supabase (`public.atc_pedidos_v` y `public.atc_detalles_pedidos_v`), ejecutando los triggers de esquema privado `"atc_migración"`.
  - El backend sanitiza automáticamente cualquier campo no presente en la vista o cadenas vacías `""` enviadas en fechas o enteros (`Fecha de envio`, `Nro_PedidoGestion`, `Nro_PedidoReferencia`, `Cliente`, `Vendedor`), convirtiéndolas en valores `NULL` seguros para PostgreSQL.
  - Al confirmarse el pedido (Estado 1), se persiste automáticamente en las tablas transaccionales de SQL Server (`AppTransacciones.PedidoAppCabe` y `PedidoAppDeta`).
