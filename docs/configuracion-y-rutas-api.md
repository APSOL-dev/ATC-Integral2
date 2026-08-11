## Configuración y Rutas Base de la API

**Qué hace:** Provee las rutas raíz y de estado del servidor backend Node.js / Express.

**Escenarios cubiertos:**
- Escenario normal (`GET /`): Retorna un objeto JSON con el nombre de la API (`API ATC Migración`), estado `ok`, marca de tiempo ISO y enlace al endpoint de health.
- Health Check (`GET /api/health`): Endpoint para verificación de estado del servicio (`status: ok`).
- Manejo de rutas inexistentes (404): Retorna respuesta JSON con el mensaje `Ruta no encontrada: [METODO] [PATH]`.
- Bloqueo de archivos ocultos (403): Bloquea accesos a `.env` y directorios dotfile.
- Modo Estricto de SQL Server: Se deshabilitaron los datos ficticios (mocks) de contingencia para Clientes y Productos (`mssql.service.js`). En caso de falta de conexión con el servidor SQL (`Casa29`), las peticiones lanzan un error de servicio no disponible (`503` / `500`) exigiendo vinculación real con la base de datos de la distribuidora.

**Casos borde conocidos:**
- Solicitudes a la raíz `/`: Si no hay un build estático de frontend en `client-dist`, responde 200 OK con metadatos JSON del servicio.
