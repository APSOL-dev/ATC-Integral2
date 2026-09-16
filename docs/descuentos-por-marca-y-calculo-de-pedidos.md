## Descuentos por Marca y Regla de Cálculo en Pedidos

**Qué hace:**  
Permite definir porcentajes de descuento específicos por Marca (administrados únicamente por el perfil Administrador). Al armar o editar un pedido, los artículos pertenecientes a una marca con descuento promocional activo reciben dicho porcentaje precargado de forma bloqueada (no modificable por vendedores). El Descuento General del pedido (porcentaje global del pedido) aplica **únicamente a los productos que NO cuentan con descuento específico por marca**.

**Escenarios cubiertos:**
- **Configuración por Administrador:** El Administrador asigna o retira descuentos por marca a través del modal dedicado en la sección de Catálogo de Productos o mediante la API local `/api/descuentos-marca`.
- **Precarga y Bloqueo para Vendedores:** Al seleccionar un producto en el formulario de pedidos (`PedidoForm`), el sistema evalúa dinámicamente si la marca del producto posee un descuento asignado. En caso afirmativo, el ítem se agrega con la insignia `🔒 Desc. Marca (X%)`.
- **Cálculo de Totales Desglosado:**
  - `Subtotal Bruto`: suma de `Precio * Cantidad` de todos los ítems.
  - `Descuento por Marca`: suma de los descuentos aplicados exclusivamente por marca.
  - `Subtotal Sujeto a Desc. General`: suma de los importes de productos sin descuento de marca.
  - `Monto Desc. General`: porcentaje de descuento general del pedido aplicado sobre el `Subtotal Sujeto a Desc. General`.
  - `Total Neto Final`: `Subtotal Bruto - Descuentos por Marca - Monto Desc. General`.
- **Persistencia en Pedidos Históricos:** Los pedidos creados o guardados mantienen intactos los descuentos asignados a sus líneas en el momento del guardado, sin verse alterados retroactivamente si un Administrador modifica o retira el descuento de la marca a futuro.

**Casos borde conocidos:**
- **Pedido con solo productos promocionados:** Si todos los productos agregados al pedido tienen descuento específico por marca, el `Subtotal Sujeto a Desc. General` es $0 y el monto descontado por el porcentaje general será $0.
- **Marca escrita en diferente formato (Mayúsculas/Minúsculas):** El sistema realiza la búsqueda y comparación de marcas eliminando espacios sobrantes e ignorando diferencias entre mayúsculas y minúsculas (ej: "Sinteplast" coincide con "sinteplast").
- **ID de Marca Numérico e Identificación Híbrida (`IdMarca` / `Marca`):** Al agregar productos al carrito, el renglón del pedido almacena explícitamente tanto el nombre de la marca (`Marca: 'NETCOLOR'`) como su identificador numérico ERP (`IdMarca: 144`). El motor de búsqueda `getMarcaDiscount` evalúa coincidencias tanto por ID numérico como por nombre de marca en texto, garantizando máxima estabilidad y autonomía en los pedidos.
- **Visualización de Subtotal Bruto y Ahorro por Renglón (Opción 2):** En las vistas del carrito (`PedidoForm`), edición (`EditPedidoModal`) y detalle del pedido (`PedidoDetail`), cada renglón promocionado muestra debajo de su descripción el importe subtotal bruto original (ej. `Bruto: ~$51.390~`) junto con el monto exacto ahorrado por el descuento de marca (ej. `Ahorro: -$12.847,50`), otorgando transparencia contable completa antes de calcular el total neto final.

**Restricciones o supuestos:**
- Los descuentos promocionales se aplican a nivel de Marca completa (no por producto individual).
- La gestión de descuentos por marca está restringida a usuarios con perfil de Administrador (`Administracion` o `AdministracionA`).
