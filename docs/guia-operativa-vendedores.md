# ATC — Aplicación Vendedores Mayoristas
## GUÍA OPERATIVA · SISTEMA DE GESTIÓN DE PEDIDOS Y VENTAS (v2.5)
**Documentación APSOL**

---

### PROPÓSITO DE ESTE DOCUMENTO
Guía práctica para el uso diario del Sistema de Pedidos y Ventas: cómo cargar pedidos, consultar stock en tiempo real, aplicar descuentos en cascada, gestionar presupuestos y trabajar con la cartera de clientes, según el perfil de cada usuario.

---

## 1. Visión General y Perfiles de Usuario

El sistema administra la toma de pedidos, la consulta de catálogo e inventario en tiempo real, la cartera de clientes y la cobranza de saldos comerciales. Al ingresar con usuario y contraseña, la aplicación adapta las opciones y permisos disponibles según el rol asignado.

| Perfil | Acceso | Permisos |
| :--- | :--- | :--- |
| **Vendedor Calle**<br>`Vendedor` | Limitado a los clientes asignados a su propia cartera comercial. | Emisión de nuevos pedidos (Estado 0), retoma y modificación de sus propios presupuestos, consulta de stock y saldos de su cartera. |
| **Super Vendedor**<br>`SuperVendedor` | Cartera ampliada / global. | Visualización y edición de pedidos de múltiples vendedores; facilita cobertura de zonas o reemplazos temporales. |
| **Depósito**<br>`Deposito` | Vista de preparación y despacho de pedidos. | Visualización de pedidos confirmados para armar mercadería, control de cantidades preparadas y gestión de despachos. |
| **Administración Operativa / Full**<br>`Administracion` / `AdministracionA` | Control total de la aplicación. | Visualización de todos los clientes (incluye Canal Directo sin vendedor asignado), gestión global de pedidos, configuración de Descuentos por Marca (hasta 4 decimales y baja lógica) y autorización de anulaciones o borrados. |

---

## 2. ¿Cómo Cargar un Pedido Nuevo?

Para iniciar una venta, seleccioná la opción **Nuevo Pedido** en el menú de la aplicación. El proceso se completa en cuatro pasos:

1. **Seleccionar cliente:** Buscá por Razón Social, CUIT o Número de Cliente y elegí el cliente en la lista desplegable.
2. **Buscar y agregar productos:** Mediante selector de pestañas: *Por Nombre / Rubro* (búsqueda flexible por múltiples palabras desordenadas) o *Por Código SKU exacto*. Se agregan con `+ Agregar`.
3. **Revisar resumen y descuentos:** Se muestran los artículos cargados con el descuento de marca correspondiente y el Descuento General fijado al 19% constante.
4. **Notas y guardado:** Observaciones opcionales y botón rosado **"Guardar pedido"** (pasa siempre a Estado 0 - Presupuesto).

### 2.1. Indicadores de Stock
- 🟢 **En Stock** — mercadería disponible en depósito para agregar al pedido.
- 🔴 **Agotado** — producto sin stock disponible en este momento.

### 2.2. Reglas de Precios y Descuentos
- **Descuento por Marca:** Si la marca tiene un descuento promocional activo configurado por Administración, sus productos se agregan automáticamente con la etiqueta `Desc. Marca`. Admite hasta **4 decimales** (ej. `10.5%`, `15.2534%`) y este porcentaje está protegido para vendedores.
- **Descuento General:** Porcentaje fijado de forma automática y obligatoria en un **19% constante** para toda la orden (campo bloqueado en modo solo lectura).

> ### CÓMO SE COMBINAN LOS DESCUENTOS (CÁLCULO EN CASCADA — OPCIÓN 2)
> Los descuentos se aplican de forma escalonada:
> 1. Primero se calcula el **Subtotal Bruto** con todos los productos a precio de lista.
> 2. Sobre ese total completo se resta el **Descuento General (19%)** (aplica al 100% del subtotal bruto).
> 3. Para los productos con marca en promoción, el **Descuento por Marca** se calcula **sobre el importe ya rebajado con el 19%** (`Base con 19% = Bruto del ítem × 0,81`).
> 4. El **Total Neto** resulta de restar al Subtotal Bruto el Descuento General del 19% y los Descuentos por Marca resultantes.

### 2.3. Ejemplo: Detalle y Liquidación de un Pedido

#### Artículos del Pedido (3 items · 3 uds)
1. **Barniz Marino Bte. Netcolor-1** (Cód: 7378) | Solicitado: 1 uds | Stock: 1 uds | Bruto: \$ 14.519  
   *Desc. Marca (10.5% en cascada): – \$ 1.235*
2. **1K All Plastic Primer Aer. Sikk-410** (Cód: 11020) | Solicitado: 1 uds | Stock: 0 uds | Bruto: \$ 37.689  
   *Sin descuento de marca*
3. **Barniz Marino Bte. Netcolor-1/2** (Cód: 7377) | Solicitado: 1 uds | Stock: 0 uds | Bruto: \$ 8.592  
   *Desc. Marca (10.5% en cascada): – \$ 731*

#### Liquidación
| Concepto | Importe |
| :--- | :--- |
| **Subtotal Bruto** | \$ 60.799 |
| **Dto. General 19%** | – \$ 11.552 |
| **Desc. por Marca** | – \$ 1.966 |
| **TOTAL NETO** | **\$ 47.282** |

*Explicación del cálculo:* El Descuento General (19%) se calculó sobre los \$60.799 del Subtotal Bruto completo (\$11.552). Luego, para los dos productos Netcolor, la base neta rebajada (\$14.519 × 0,81 = \$11.760,39 y \$8.592 × 0,81 = \$6.959,52) recibió el 10.5% de Descuento por Marca (\$1.234,84 + \$730,75 = \$1.965,59 ≈ \$1.966) para llegar al Total Neto final de **\$47.282**.

---

## 3. Trabajo sobre Pedidos: Estados y Flujo Completo

Todo pedido recorre una serie de estados numerados. Los dos primeros (**0** y **0.0**) son presupuestos que el vendedor todavía puede modificar o ajustar; a partir del **Estado 1**, el pedido ya está confirmado y su avance pasa a depósito y facturación.

### 3.1. ESTADO 0 — PRESUPUESTO NUEVO
Es el estado en el que ingresa todo pedido recién creado al hacer clic en "Guardar pedido".

| Acción | Qué hace |
| :--- | :--- |
| **Editar** | Abre el modal de edición para modificar cantidades (ingresando el número por teclado directamente en el renglón o mediante botones `-`/`+`). Las filas se editan *in-place* sin perder su orden. |
| **Pedirlo (Confirmar Venta)** | Confirma la venta y transfiere el pedido a **Estado 1**, guardándolo en las bases transaccionales para preparación y facturación. Requiere al menos 1 producto cargado. |
| **Borrar** | Elimina el pedido físicamente del sistema. Solo disponible mientras está en Estado 0 (no queda historial). |
| **Generar PDF** | Descarga el comprobante formal en PDF con el desglose en cascada, porcentaje de marca, descuento general del 19% y observaciones. |
| **Enviar por WhatsApp** | Prepara un mensaje estructurado con el resumen del pedido. El texto es **100% editable por el vendedor antes de enviar** para agregar notas personalizadas. |

### 3.2. ESTADO 0.0 — PRESUPUESTO GENERADO EN EL SISTEMA
Es un presupuesto derivado a partir de un pedido original existente. Al abrirlo, muestra a qué pedido original refiere y **sincroniza en tiempo real el stock actual disponible**.

| Acción | Qué hace |
| :--- | :--- |
| **Editar** | Ajusta cantidades, productos u observaciones. Cruza en tiempo real cada artículo con el stock actualizado del catálogo. |
| **Pedirlo (Confirmar Venta)** | Confirma la venta y hace pasar el pedido a **Estado 1**, igual que desde Estado 0. |
| **Anular** | Pasa a **Estado 0.0.99**. A diferencia del Estado 0, aquí **no se borra**: se conserva la trazabilidad histórica de la operación. |

### 3.3. ESTADO 1 EN ADELANTE — PEDIDO CONFIRMADO
Al confirmar un presupuesto pasa a **Estado 1 (Nuevo)**. A partir de allí avanza por las etapas operativas y el vendedor ya no puede modificarlo:

| Estado | Significa |
| :--- | :--- |
| **1 · Nuevo** | El pedido acaba de confirmarse; listo para iniciar preparación en depósito. |
| **1.1 · En gestión** | El pedido está siendo armado o en verificación de stock. |
| **2 · Preparado** | La mercadería ya fue armada y está lista para despacho. |
| **4 · Facturado** | Operación cerrada comercialmente con comprobante fiscal emitido. |

> **ANULACIÓN DE PEDIDOS CONFIRMADOS (ESTADO 99):**  
> Una vez que un pedido está en Estado 1 o superior (1, 1.1, 2 o 4), **únicamente el perfil de Administración** puede anularlo. Al realizarlo, el pedido pasa a **Estado 99 (Anulado)**, conservando el historial de auditoría.

---

## 4. Catálogo de Productos e Inventario

En la sección **Catálogo**:
- **Búsqueda Flexible:** Por palabras clave múltiples desordenadas (ej. `sintetico satinado 4l`) o conmutador a **Código SKU exacto**.
- **Solo con Stock:** Filtro para visualizar únicamente artículos disponibles en depósito.
- **Filtros por Atributos:** Proveedor, Familia, Marca o **Rubro**.
- **Información de Embalaje:** Informa la cantidad de unidades por bulto/caja para agilizar ventas por bulto cerrado.

> **FICHA DE PRODUCTO Y VENTA DIRECTA:**  
> Al ingresar a un producto en particular se ven sus datos, stock actual, embalaje y los últimos pedidos en los que se incluyó ese artículo. Dispone de un botón de **"Venta Directa"** que carga automáticamente un pedido nuevo con dicho producto ya seleccionado.

---

## 5. Cartera de Clientes y Saldos

En la sección **Clientes** y **Saldos**:
- **Buscador Multicriterio:** Localizá clientes por **Razón Social**, **CUIT** o **Número de Cliente**.
- **Filtro por Vendedor:** Agrupa clientes según la cartera asignada.
- **Filtro por Localidad:** Agrupa clientes por municipio para planificar recorridas o llamados.
- **Consulta de Deuda:** Permite verificar la cuenta corriente y comprobantes pendientes antes de emitir un nuevo pedido.

> **FICHA DE CLIENTE:**  
> Al ingresar a un cliente se visualizan sus datos fiscales, número de cuenta, límite crediticio, saldo y el historial completo de pedidos. Incluye el botón para generarle un **"Nuevo Pedido"** directamente desde su ficha.

---

## 6. Novedades y Resumen de Versión (v2.5)

- **Descuento General Fijo al 19%:** Precargado y bloqueado en toda orden.
- **Cálculo en Cascada (Opción 2):** Descuento de marca aplicado sobre base neta con 19% aplicado.
- **Hasta 4 Decimales en Descuentos:** Precisión exacta en promociones por marca (ej. `15.2534%`).
- **Selector de Modo de Búsqueda:** Pestañas para Código SKU exacto y Descripción/Marca/Rubro flexible.
- **Edición In-Place:** Ingreso directo de cantidades por teclado sin saltos de fila.
- **Baja Lógica en Supabase:** Trazabilidad e historial protegido en deshabilitación de marcas.
