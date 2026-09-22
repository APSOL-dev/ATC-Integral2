## Descuentos por Marca y Regla de Cálculo en Pedidos

**Qué hace:**  
Permite definir porcentajes de descuento específicos por Marca (administrados únicamente por el perfil Administrador). Al armar o editar un pedido, los artículos pertenecientes a una marca con descuento promocional activo reciben dicho porcentaje precargado de forma bloqueada (no modificable por vendedores). El **Descuento General del pedido está fijado en un 19% constante** y aplica sobre el **100% de los productos del pedido (Subtotal Bruto)**. Los **descuentos de marca aplican de forma escalonada / en cascada (Opción 2)** sobre el importe ya rebajado con el descuento general del 19%.

**Escenarios cubiertos:**
- **Configuración por Administrador y Baja Lógica (Soft Delete):** El Administrador asigna o retira descuentos por marca a través del modal en la sección de Catálogo o la API `/api/descuentos-marca`. La eliminación mediante el ícono de papelera (🗑️) realiza una **baja lógica** (`activo = false`, `estado = 'deshabilitado'`, `fecha_baja = NOW()`), conservando la fila histórica inmutable en la base de datos Supabase.
- **Nuevos Ciclos de Descuento por Marca:** Si a futuro se vuelve a activar un descuento para una marca anteriormente deshabilitada, la base de datos inserta un **nuevo registro con un nuevo ID** (`activo = true`, `estado = 'activo'`), garantizando trazabilidad histórica y respetando la restricción de un único descuento activo por marca a la vez.
- **Descuento General Fijo al 19% y Bloqueado:** En `PedidoForm` y `EditPedidoModal`, el campo de Porcentaje de Descuento General se encuentra fijado en **19%** en modo de solo lectura (`readOnly` y `disabled`), imposibilitando modificaciones manuales.
- **Cálculo de Totales Desglosado en Cascada (Opción 2):**
  - `Subtotal Bruto`: suma de `Precio * Cantidad` de todos los ítems del pedido.
  - `Monto Desc. General (19%)`: 19% aplicado sobre el 100% del `Subtotal Bruto` (`Subtotal Bruto * 0.19`).
  - `Base Rebajada del Ítem`: `Subtotal Bruto del Ítem * (1 - 0.19)`.
  - `Descuento por Marca`: suma de los importes descontados aplicando el `% de Marca` sobre la base ya rebajada con el 19% (`Base Rebajada * (% Marca / 100)`).
  - `Total Neto Final`: `Subtotal Bruto - Monto Desc. General (19%) - Descuento por Marca`.
- **Persistencia en Pedidos Históricos:** Los pedidos guardados mantienen intactos los descuentos asignados a sus líneas y su total calculado.

**Casos borde conocidos:**
- **Productos con Descuento por Marca y Descuento General (Cálculo en Cascada):** El descuento de marca se calcula sobre el importe neto del 19%. Por ejemplo, en un pedido de $20.000 bruto ($10.000 Netcolor con 25% desc. marca + $10.000 marca genérica):
  - Descuento General (19% de $20.000): $3.800
  - Base Netcolor con 19% aplicado ($10.000 * 0.81): $8.100
  - Descuento de Marca (25% de $8.100): $2.025
  - Total Neto Final: $20.000 - $3.800 - $2.025 = $14.175.
- **Registro Histórico de Descuentos Deshabilitados:** Las marcas con baja lógica no se pueden reactivar modificando el mismo registro; la base de datos deshabilita la fila precedente y crea una nueva fila con ID autogenerado al reasignar un porcentaje.
- **Marca escrita en diferente formato (Mayúsculas/Minúsculas):** El sistema realiza la comparación de marcas ignorando diferencias entre mayúsculas y minúsculas y espacios sobrantes (ej: "Sinteplast" coincide con "sinteplast").
- **ID de Marca Numérico e Identificación Híbrida (`IdMarca` / `Marca`):** Los renglones almacenan tanto el nombre como el ID numérico del ERP (`IdMarca`), garantizando autonomía en los pedidos.
- **Visualización de Subtotal Bruto y Ahorro por Renglón:** En las vistas del carrito, edición y detalle del pedido, cada renglón promocionado exhibe su importe bruto original junto con el ahorro obtenido.

**Restricciones o supuestos:**
- El Descuento General del 19% es fijo y obligatorio para todas las órdenes emitidas desde la aplicación.
- Los descuentos por marca se administran exclusivamente por perfiles con rol Administrador (`Administracion` o `AdministracionA`).
- En Supabase (`"atc_migración".descuentos_marca`), la vista pública `atc_descuentos_marca_v` filtra únicamente los registros con `activo = true`, mientras que los registros dados de baja persisten permanentemente con su timestamp en `fecha_baja`.

