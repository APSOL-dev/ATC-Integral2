# 📘 Manual de Uso Práctico — Sistema de Gestión de Pedidos y Ventas
## Distribuidora de Pinturas APSOL / ATC

Bienvenido a la guía oficial del **Sistema de Pedidos y Ventas**. Este manual fue diseñado para acompañarte en tu trabajo diario, ayudándote a ingresar pedidos, consultar el stock disponible en tiempo real, gestionar presupuestos y consultar clientes de forma rápida, visual e intuitiva.

---

## 1. Visión General y Perfiles de Usuario

El sistema de gestión de la distribuidora de pinturas permite administrar la toma de pedidos, la consulta de catálogo e inventario en tiempo real, la cartera de clientes y la cobranza de saldos comerciales. 

Al ingresar a la aplicación con tu usuario y contraseña, el sistema adapta las opciones y permisos según tu rol de trabajo:

### Perfiles de Usuario y Visibilidad

1. **Vendedor Calle (`Vendedor`):**
   - **Acceso:** Limitado a los clientes asignados a su propia cartera comercial.
   - **Permisos:** Emisión de nuevos pedidos (guardado inicial en Estado 0), retoma y modificación de sus propios presupuestos, consulta de stock y saldos de su cartera.

2. **Super Vendedor (`SuperVendedor`):**
   - **Acceso:** Cartera ampliada / global.
   - **Permisos:** Visualización y edición de pedidos de múltiples vendedores, facilitando la cobertura de zonas o reemplazos temporales.

3. **Depósito:**
   - **Acceso:** Vista de preparación y despacho de pedidos.
   - **Permisos:** Visualización de pedidos confirmados para armar la mercadería, controlar las cantidades preparadas y gestionar los despachos.

4. **Administración Operativa / Full (`Administracion` / `AdministracionA`):**
   - **Acceso:** Control total de la aplicación.
   - **Permisos:** Visualización de todos los clientes (incluyendo Canal Directo sin vendedor asignado), gestión global de pedidos, configuración de Descuentos por Marca y autorización de anulaciones o borrados.

---

## 📝 2. ¿Cómo Cargar un Pedido Nuevo? (Paso a Paso)

Para iniciar una nueva venta, selecciona la opción **Nuevo Pedido** en el menú de la aplicación.

### 🖼️ Esquema Visual de la Pantalla de Carga

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│ 👤 PASO 1: SELECCIONAR CLIENTE                                                     │
│ [ Buscar cliente por Razón Social o CUIT...                      ] 🔍              │
├───────────────────────────────────────────────────────────────────────────────────┤
│ 📦 PASO 2: BUSCAR Y AGREGAR PRODUCTOS                                              │
│ Pestañas: [ (x) Por Nombre / Rubro ]   [ ( ) Por Código SKU ]                      │
│ [ Buscar producto por descripción, marca o rubro...              ] 🔍              │
│ ┌───────────────────────────────────────────────────────────────────────────────┐ │
│ │  Látex Plastecor 20L - Sinteplast   🟢 Stock: 45 un   $ 15.000    [ + Agregar ] │ │
│ └───────────────────────────────────────────────────────────────────────────────┘ │
├───────────────────────────────────────────────────────────────────────────────────┤
│ 🔒 PASO 3: REVISAR RESUMEN DE ARTÍCULOS Y DESCUENTOS                               │
│ • Producto A | 10 un | 🔒 Desc. Marca (15%)                                        │
│ • Producto B |  5 un | Desc. General (19%)                                         │
├───────────────────────────────────────────────────────────────────────────────────┤
│ 📝 PASO 4: NOTAS Y GUARDADO INICIAL                                               │
│ Observaciones: [ Escriba notas útiles o especificaciones del pedido...          ] │
│                                                                                   │
|                    💖 [ 🌸 Guardar pedido (Rosa) ]                                |
│                 (Pasa SÍ O SÍ a Estado 0 - Presupuesto)                           │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

### Paso 1: Elegir el Cliente
1. Haz clic en el campo de búsqueda de cliente.
2. Escribe el **Nombre** (Razón Social) o el número de **CUIT**.
3. Selecciona el cliente correspondiente en la lista desplegable.

---

### Paso 2: Buscar y Agregar Productos al Pedido

Dispones de **dos pestañas de búsqueda** para elegir la opción más conveniente:

#### A) Modo "Por Nombre / Marca / Rubro"
- Te permite buscar escribiendo palabras clave de la descripción, la marca o el rubro del producto.
- Ejemplo: Escribe `latex 20 sinteplast` para encontrar rápidamente el látex de 20 litros.

#### B) Modo "Por Código SKU"
- Ideal si conoces la clave o código exacto del artículo.
- Ejemplo: Al buscar el código `11`, te mostrará únicamente el producto `11` (omitirá códigos parecidos como `110` o `115`).

#### Indicadores Visuales de Stock:
- 🟢 **En Verde (`Stock: 45 un`):** Mercadería disponible en depósito para agregar al pedido.
- 🔴 **En Rojo (`Stock: 0 un`):** Producto sin stock disponible en este momento.

---

### Paso 3: Precios y Descuentos

El cálculo de montos sigue dos reglas claras:

1. 🔒 **Descuento Específico por Marca:**
   - Si la marca tiene un descuento activo, los productos de esa marca se agregan automáticamente con la etiqueta 🔒 **Desc. Marca (X%)**. Este porcentaje se encuentra protegido.

2. 🏷️ **Descuento General del Pedido:**
   - Puedes ingresar un porcentaje de Descuento General para la orden (por ejemplo, `19%`).
   - ⚠️ **REGLA DE ORO:** El Descuento General **solo se aplica a los productos que NO tienen descuento específico por marca**.

---

#### 📊 Ejemplo Gráfico de Cálculo del Total

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│ RESUMEN DE CUENTA Y TOTALES                                                       │
├─────────────────────────────────────────────────────────────┬─────────────────────┤
│ Subtotal Bruto (Suma a precio lista)                        │         $ 100.000   │
│ 🔒 Descuento por Marca (Aplica solo a marcas en promoción)  │       - $  15.000   │
├─────────────────────────────────────────────────────────────┼─────────────────────┤
│ Subtotal Sujeto a Desc. General                             │         $  85.000   │
│ 🏷️ Descuento General (19% sobre subtotal sujeto)             │       - $  16.150   │
├─────────────────────────────────────────────────────────────┼─────────────────────┤
│ 💰 IMPORTE NETO FINAL A PAGAR                               │         $  68.850   │
└─────────────────────────────────────────────────────────────┴─────────────────────┘
```

---

### Paso 4: Notas y Guardado Inicial en Estado 0

- **Observaciones:** En este campo puedes escribir notas útiles o especificaciones importantes del pedido.
- 🩷 **El Botón Rosado "Guardar pedido":**
  En la pantalla de carga de pedido nuevo existe **UN ÚNICO BOTÓN** de color **ROSADO** que dice **"Guardar pedido"**.
- 📌 **Estado Inicial 0:**
  Al hacer clic en "Guardar pedido", la orden se registra **SÍ O SÍ en Estado 0 (Presupuesto)**.

---

## 🔄 3. Trabajo sobre Pedidos: Estado 0 vs. Estado 0.0

```
  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │                           FLUJO GENERAL DE PEDIDOS                              │
  └─────────────────────────────────────────────────────────────────────────────────┘
                                           │
                                           v
                        ┌─────────────────────────────────────┐
                        │   NUEVO PEDIDO                      │
                        │   Botonazo Rosa: [Guardar pedido]   │
                        └─────────────────────────────────────┘
                                           │
                                           v
                        ┌─────────────────────────────────────┐
                        │   ESTADO 0 (Presupuesto)            │
                        └─────────────────────────────────────┘
                                   │       │       │
             ┌─────────────────────┘       │       └─────────────────────┐
             v                             v                             v
  ┌─────────────────────┐       ┌─────────────────────┐       ┌─────────────────────┐
  │  ✏️ Editar          │       │  🚀 Pedirlo         │       │  🗑️ Borrar          │
  │  📄 Generar PDF     │       │  (Pasa a depó-      │       │  (Eliminado         │
  │  💬 WhatsApp        │       │   sito/factura)     │       │   definitivo)       │
  └─────────────────────┘       └─────────────────────┘       └─────────────────────┘
                                           │
                                           v
                        ┌─────────────────────────────────────┐
                        │   ESTADO 0.0                        │
                        │   (Generado de pedido original)     │
                        └─────────────────────────────────────┘
                                           │
                                           v
                               ┌───────────────────────┐
                               │  🚫 Solo ANULAR       │
                               │  (Pasa a Estado 0.0.99)│
                               └───────────────────────┘
```

---

### 3.1. Opciones Disponibles en Estado 0 (Presupuesto)

Una vez que el pedido ha sido guardado y se encuentra en **Estado 0 (Presupuesto)**, al ingresar al detalle del mismo dispones de las siguientes herramientas:

1. ✏️ **Editarlo:** Abre el formulario de edición para ajustar cantidades, agregar nuevos productos o modificar las observaciones.
2. 🚀 **Pedirlo (Confirmar Venta):** Confirma la compra y envía el pedido para su procesamiento en depósito.
3. 🗑️ **Borrarlo:** Si la cotización no prospera, los pedidos en Estado 0 **se borran**, eliminándose físicamente del sistema.
4. 📄 **Generar PDF:** Descarga el comprobante en formato PDF listo para imprimir o guardar.
5. 💬 **Enviar por WhatsApp:** 
   - Abre un mensaje prearmado dirigido al cliente con el desglose completo del pedido (artículos, cantidades, subtotales y total neto).
   - ✍️ **Mensaje editable:** El vendedor **puede editar libremente el texto del mensaje antes de enviarlo** para incluir cualquier comentario personalizado al confirmar la compra.

---

### 3.2. Pedidos en Estado 0.0 (Generados en el Sistema)

- **¿Qué es un Pedido 0.0?**
  Es un pedido generado dentro del sistema a partir de un **pedido original** (edición o versión registrada de una orden previa).
- **Detalle del Pedido Original:**
  Al abrir un pedido en Estado 0.0, la pantalla muestra los datos de **a qué pedido original refiere y qué incluía exactamente ese pedido original**.
- 🚫 **Regla de Anulación (Paso a 0.0.99):**
  A diferencia del Estado 0, **los pedidos en Estado 0.0 NO se borran: únicamente se anulan y pasan a Estado 0.0.99**, manteniendo el historial de la operación.

---

## 📦 4. Catálogo de Productos e Inventario

En la sección **Catálogo** (`/productos`):
- **Solo con Stock:** Casilla para filtrar y visualizar únicamente los artículos disponibles en depósito.
- **Filtros por Atributos:** Permite filtrar la grilla por Proveedor, Familia, Marca o Rubro.

---

## 👥 5. Cartera de Clientes y Saldos

En las secciones **Clientes** y **Saldos**:
- **Clientes Asignados:** Muestra las cuentas comerciales pertenecientes a tu perfil de usuario.
- **Filtro por Localidad:** Permite agrupar los clientes por municipio para planificar recorridas o llamados en zona.
- **Consulta de Deuda:** Revisa la cuenta corriente del cliente antes de tomar un pedido nuevo.

---

## ❓ 6. Preguntas Frecuentes

> ❓ **¿Por qué al crear un pedido nuevo solo aparece el botón rosado "Guardar pedido"?**  
> **Respuesta:** Porque todo pedido nuevo ingresa en **Estado 0 (Presupuesto)**. De esta forma puedes revisarlo, generar el PDF o enviarlo por WhatsApp al cliente antes de enviarlo a preparar.

> ❓ **¿Cuál es la diferencia entre Borrar (Estado 0) y Anular (Estado 0.0)?**  
> **Respuesta:** Los pedidos en **Estado 0** se **borran** (se eliminan por completo del sistema). Los pedidos en **Estado 0.0** provienen de un pedido original y **se anulan pasando a 0.0.99** para guardar el historial.

> ❓ **¿Puedo modificar el mensaje de WhatsApp antes de enviarlo al cliente?**  
> **Respuesta:** Sí. Al hacer clic en el botón de WhatsApp, la aplicación prepara el resumen con el detalle completo del pedido, y tú puedes agregar o modificar cualquier texto antes de enviarlo.
