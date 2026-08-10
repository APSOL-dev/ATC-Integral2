# Autenticación, Permisos y Visibilidad de Usuarios

## Qué hace
Gestiona el control de acceso al sistema, la autenticación mediante tokens firmados JWT, la persistencia del ABM de usuarios en Google Sheets (`Usuarios`) y las políticas de visibilidad de datos para los perfiles operativos de la distribuidora ATC. Asegura que los perfiles jerárquicos vean toda la información comercial de forma global, mientras que los perfiles comerciales de calle estén restringidos de forma estricta únicamente a sus propios datos asignados.

---

## Escenarios cubiertos

### 1. Autenticación e Inicio de Sesión
- **Caso de éxito:** El usuario proporciona credenciales válidas en el Login. El servidor genera y firma un token JWT de 24 horas que contiene el nombre del usuario, su perfil de acceso y su legajo de vendedor asociado.
  - *Verificado por:* [usuariosABM.test.js](file:///c:/Users/Renata%20Morano/OneDrive/Documentos/Antigravity/ATC%20Migraci%C3%B3n/client/src/utils/usuariosABM.test.js)
- **Caso de error por credenciales incorrectas:** Se ingresan contraseñas inválidas o usuarios inexistentes, y el servidor deniega el token devolviendo un código `401 Unauthorized`.
  - *Verificado por:* [usuariosABM.test.js](file:///c:/Users/Renata%20Morano/OneDrive/Documentos/Antigravity/ATC%20Migraci%C3%B3n/client/src/utils/usuariosABM.test.js)
- **Caso de error por cuenta inactiva:** Un usuario con legajo inactivo en Sheets intenta iniciar sesión, y la API bloquea el login respondiendo con un `403 Forbidden`.
  - *Verificado por:* [usuariosABM.test.js](file:///c:/Users/Renata%20Morano/OneDrive/Documentos/Antigravity/ATC%20Migraci%C3%B3n/client/src/utils/usuariosABM.test.js)

### 2. Gestión de Usuarios (ABM)
- **Caso de éxito:** El administrador abre el formulario de "Alta de Usuario", rellena el nombre, perfil, legajo opcional y contraseña temporal, guarda los cambios y la lista de la interfaz se refresca automáticamente agregando al nuevo usuario.
  - *Verificado por:* [Usuarios.test.jsx](file:///c:/Users/Renata%20Morano/OneDrive/Documentos/Antigravity/ATC%20Migraci%C3%B3n/client/src/pages/admin/Usuarios.test.jsx)
- **Baja Lógica / Desactivación:** Permite desactivar/activar cuentas en caliente mediante peticiones `PATCH` sobre Sheets que alternan la propiedad `Activo` entre `TRUE` y `FALSE`.
  - *Verificado por:* [Usuarios.test.jsx](file:///c:/Users/Renata%20Morano/OneDrive/Documentos/Antigravity/ATC%20Migraci%C3%B3n/client/src/pages/admin/Usuarios.test.jsx)

### 3. Restricciones de Visibilidad de Datos (Scoping)
- **Acceso Restringido (Vendedor Calle):** Un usuario con el perfil `VendedorCalle` (ej: legajo `3`) solo puede ver sus propios pedidos y clientes asociados en el listado de la interfaz. Los pedidos y clientes de otros legajos comerciales quedan completamente invisibilizados y bloqueados.
  - *Verificado por:* [visibilidadVendedor.test.jsx](file:///c:/Users/Renata%20Morano/OneDrive/Documentos/Antigravity/ATC%20Migraci%C3%B3n/client/src/pages/pedidos/visibilidadVendedor.test.jsx)
- **Acceso Global (Admin / Depósito):** Los usuarios que tienen perfiles globales (como `Administracion` o `Deposito`) y no están asociados a ningún legajo de ventas comercial (`nroVendedor: null`) pueden ver todos los clientes y pedidos del sistema de forma global y sin restricciones.
  - *Verificado por:* [visibilidadVendedor.test.jsx](file:///c:/Users/Renata%20Morano/OneDrive/Documentos/Antigravity/ATC%20Migraci%C3%B3n/client/src/pages/pedidos/visibilidadVendedor.test.jsx)

### 4. Permisos de Edición, Aprobación, Anulación y Borrado en Borradores
- **Acciones en Borrador (0 / 0.0):** Los usuarios con perfil `VendedorCalle` y `SuperVendedor` tienen plenos derechos de edición (`edit`), borrado (`delete`) y confirmación (`approve`) en los pedidos borrador de sus clientes. Al hacer clic en "Pedirlo", el estado del pedido se actualiza a `1` a través de un `PATCH` del backend.
  - *Verificado por:* [visibilidadAprobacion.test.jsx](file:///c:/Users/Renata%20Morano/OneDrive/Documentos/Antigravity/ATC%20Migraci%C3%B3n/client/src/pages/pedidos/visibilidadAprobacion.test.jsx)
- **Anulación de Presupuestos en 0.0 por Administrador:** Tanto el perfil `Administracion` (Administración Operativa) como `AdministracionA` (Administración Full) tienen habilitado el permiso de anulación (`anular: true`), lo que les permite ver el botón "Anularlo" y cambiar el estado de un presupuesto `0.0` a `0.0.99` mediante confirmación.
  - *Verificado por:* [permisos.test.js](file:///c:/Users/Renata%20Morano/OneDrive/Documentos/Antigravity/ATC%20Migraci%C3%B3n/client/src/utils/permisos.test.js), [pedidoEstado.test.jsx](file:///c:/Users/Renata%20Morano/OneDrive/Documentos/Antigravity/ATC%20Migraci%C3%B3n/client/src/pages/pedidos/pedidoEstado.test.jsx)
- **Acciones Bloqueadas en Confirmado (1):** Una vez que un pedido transiciona al estado `1` (confirmado/enviado a SQL), se bloquean todas las acciones de edición, borrado o aprobación para todos los perfiles de venta. Los botones correspondientes desaparecen de la vista del detalle del pedido.
  - *Verificado por:* [visibilidadAprobacion.test.jsx](file:///c:/Users/Renata%20Morano/OneDrive/Documentos/Antigravity/ATC%20Migraci%C3%B3n/client/src/pages/pedidos/visibilidadAprobacion.test.jsx)

### 5. Helper de Permisos
- **Validaciones unitarias de perfiles:** Mapea el perfil del usuario de forma segura mediante `normalizePerfil` y resuelve los alcances de permisos de lectura y escritura para cada pestaña por dominio mediante `puedeDo`.
  - *Verificado por:* [permisos.test.js](file:///c:/Users/Renata%20Morano/OneDrive/Documentos/Antigravity/ATC%20Migraci%C3%B3n/client/src/utils/permisos.test.js)

---

## Casos borde conocidos

- **Usuarios Duplicados:** La creación de un usuario con un nombre que ya se encuentra registrado en Google Sheets (insensible a mayúsculas/minúsculas) se rechaza con un código `400 Bad Request` y el mensaje `"El nombre de usuario ya está registrado"`, el cual se alerta en pantalla.
  - *Verificado por:* [Usuarios.test.jsx](file:///c:/Users/Renata%20Morano/OneDrive/Documentos/Antigravity/ATC%20Migraci%C3%B3n/client/src/pages/admin/Usuarios.test.jsx)
- **Vendedor Calle sin Legajo Asignado:** Si un vendedor calle tiene configurado su perfil pero su `nroVendedor` en Sheets es nulo o vacío, la interfaz filtra sus clientes y pedidos devolviendo una lista vacía por seguridad, en lugar de arruinar el filtrado o filtrar erróneamente de forma global.
  - *Verificado por:* [visibilidadVendedor.test.jsx](file:///c:/Users/Renata%20Morano/OneDrive/Documentos/Antigravity/ATC%20Migraci%C3%B3n/client/src/pages/pedidos/visibilidadVendedor.test.jsx)
- **Normalización Dinámica de Columnas en Sheets:** Si faltan las columnas `'NRO_VENDEDOR'` o `'Activo'` en la hoja de Sheets debido a modificaciones externas manuales, el backend detecta su ausencia al cargar o escribir y las crea dinámicamente antes de procesar el ABM para evitar corrupciones.

---

## Restricciones o supuestos

- **Unicidad:** La clave de identidad del usuario es su nombre (insensible a mayúsculas/minúsculas y normalizado de espacios).
- **Vigencia:** El token JWT tiene una duración de validez estricta de 24 horas. Expirado este lapso, la app obliga al usuario a autenticarse de nuevo.
