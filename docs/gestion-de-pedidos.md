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
- **Descuentos Globales:** Se inicializa de forma preestablecida en `19%` al abrir el formulario de emisión de nuevo pedido, permitiendo al usuario modificarlo libremente o dejarlo en 0. Calcula el monto descontado y actualiza el Importe Neto Final en tiempo real.
  - *Verificado por:* [PedidoForm.test.jsx](file:///c:/Users/Renata%20Morano/OneDrive/Documentos/Antigravity/ATC%20Migraci%C3%B3n/client/src/pages/pedidos/PedidoForm.test.jsx)
- **Envío en Segundo Plano:** El formulario serializa un JSON estructurado con la cabecera del pedido (`header`) y el desglose de productos (`detalles`) enviándolo a la API (`POST /pedidos`).
  - *Verificado por:* [PedidoForm.test.jsx](file:///c:/Users/Renata%20Morano/OneDrive/Documentos/Antigravity/ATC%20Migraci%C3%B3n/client/src/pages/pedidos/PedidoForm.test.jsx)

### 2. Visualización y Legibilidad de Stock en Edición y Selección
- **Tipografía y Escala Visual:** Los listados desplegables y las fichas de selección de productos y clientes utilizan una escala tipográfica fijada en `15px` (`text-[15px]`) para los nombres y `12px` (`text-xs`) para detalles de código, precio y ubicación para maximizar la legibilidad.
- **Selector Modo de Búsqueda de Productos:** Incluye un conmutador de pestañas sobre la barra de búsqueda de productos al crear (`PedidoForm.jsx`) o editar pedidos (`EditPedidoModal.jsx`), permitiendo alternar entre el modo **Por Nombre / Marca / Rubro** (modo predeterminado) y el modo **Por Código SKU** (búsqueda por coincidencia exacta `===` del número de artículo, evitando listar prefijos parciales como `110` o `115` al buscar `11`).
  - *Verificado por:* [productSearch.test.js](file:///c:/Users/Renata%20Morano/OneDrive/Documentos/Antigravity/ATC%20Migraci%C3%B3n/client/src/utils/productSearch.test.js)
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

### 4. Sincronización Silenciosa y Preservación de Detalles
- **Fusión de Estado en Segundo Plano:** El sistema realiza una sincronización periódica cada 30 segundos llamando al endpoint `/api/pedidos` (que devuelve cabeceras sin artículos). Para evitar que los detalles de un pedido abierto en pantalla desaparezcan y provoquen un parpadeo de carga, el contexto de datos mezcla los nuevos datos de cabecera con los detalles que ya están en memoria (`detalles`).
  - *Verificado por:* [DataContext.test.jsx](file:///c:/Users/Renata%20Morano/OneDrive/Documentos/Antigravity/COPIA%20ATC%20Migraci%C3%B3n/client/src/context/DataContext.test.jsx)
- **Tolerancia a Fallos de Conexión de Base de Datos:** Si SQL Server experimenta un corte o retraso excesivo (timeout) al sincronizar, el backend propaga el error (HTTP 5xx) en lugar de ocultarlo devolviendo una lista vacía. El frontend detecta la respuesta errónea e interrumpe la actualización del estado local, reteniendo en pantalla la última versión consistente de los pedidos y alertando únicamente mediante el cartel de estado del servidor en la cabecera.
  - *Verificado por:* [DataContext.test.jsx](file:///c:/Users/Renata%20Morano/OneDrive/Documentos/Antigravity/COPIA%20ATC%20Migraci%C3%B3n/client/src/context/DataContext.test.jsx)

### 5. Integridad y Prevención de Pedidos sin Detalles
- **Generación Secuencial e Infalible de Renglones (`IDDetalle`):** Para evitar colisiones causadas por códigos de productos alfanuméricos o caracteres especiales, el identificador único de cada renglón (`IDDetalle`) se genera asignando una secuencia infalible por posición (`IDPedido + número de renglón de 3 dígitos`, p. ej. `110195001`, `110195002`).
  - *Verificado por:* [pedidos_detalles_safety.test.js](file:///c:/Users/Renata%20Morano/OneDrive/Documentos/Antigravity/ATC%20Migraci%C3%B3n/server/test/pedidos_detalles_safety.test.js)
- **Rollback Atómico en Supabase:** Si la inserción de los detalles de un pedido en Supabase falla por cualquier motivo durante la creación (`POST /pedidos`), la cabecera recién creada se elimina automáticamente para no dejar borradores huérfanos sin artículos en el sistema.
- **Bloqueo Preventivo de Envío a BD:** Al intentar cambiar el estado de un pedido a `'1'` ("Confirmar / Enviar a BD"), el servidor valida que el pedido tenga al menos 1 renglón cargado. Si carece de detalles, el envío es rechazado inmediatamente con error HTTP 400.
  - *Verificado por:* [pedidos_detalles_safety.test.js](file:///c:/Users/Renata%20Morano/OneDrive/Documentos/Antigravity/ATC%20Migraci%C3%B3n/server/test/pedidos_detalles_safety.test.js)
- **Autoreparación de Renglones en SQL Server:** Si la cabecera de un pedido ya existe en SQL Server (`PedidoAppCabe`) pero su desglose en `PedidoAppDeta` se encuentra totalmente vacío, la sincronización reinserta automáticamente los detalles faltantes en lugar de omitir la operación.

---

## Casos borde conocidos

- **Intento de Envío sin Cliente:** Al presionar "Generar Pedido" sin seleccionar un cliente, el formulario bloquea el envío y muestra la alerta del navegador `"Seleccione un cliente"`.
  - *Verificado por:* [PedidoForm.test.jsx](file:///c:/Users/Renata%20Morano/OneDrive/Documentos/Antigravity/ATC%20Migraci%C3%B3n/client/src/pages/pedidos/PedidoForm.test.jsx)
- **Intento de Enviar Pedido sin Detalles a BD:** Si un borrador no posee artículos asociados e intenta confirmarse (estado 1), la API devuelve un código de estado `400 Bad Request` indicando que no se puede enviar un pedido sin detalles.
  - *Verificado por:* [pedidos_detalles_safety.test.js](file:///c:/Users/Renata%20Morano/OneDrive/Documentos/Antigravity/ATC%20Migraci%C3%B3n/server/test/pedidos_detalles_safety.test.js)
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

