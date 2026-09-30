## Configuración y Rutas Base de la API

**Qué hace:** Provee las rutas raíz y de estado del servidor backend Node.js / Express.

**Escenarios cubiertos:**
- Escenario normal (`GET /`): Retorna un objeto JSON con el nombre de la API (`API ATC Migración`), estado `ok`, marca de tiempo ISO y enlace al endpoint de health.
- Health Check (`GET /api/health`): Endpoint para verificación de estado del servicio (`status: ok`).
- Manejo de rutas inexistentes (404): Retorna respuesta JSON con el mensaje `Ruta no encontrada: [METODO] [PATH]`.
- Bloqueo de archivos ocultos (403): Bloquea accesos a `.env` y directorios dotfile.
- Modo Estricto de SQL Server: Se deshabilitaron los datos ficticios (mocks) de contingencia para Clientes y Productos (`mssql.service.js`). En caso de falta de conexión con el servidor SQL (`Casa29`), las peticiones lanzan un error de servicio no disponible (`503` / `500`) exigiendo vinculación real con la base de datos de la distribuidora.
- Polyfill de WebSocket para Node.js < 22: En entornos de despliegue Docker/Container con Node 20 o inferior (ej. EasyPanel / VPS), `@supabase/supabase-js` requiere una implementación de WebSocket nativo para iniciar el cliente Realtime. Se inyectó la librería `ws` de forma explícita en `supabase.service.js` para asegurar compatibilidad runtime en cualquier versión de Node.js (18, 20, 22+).
- Resolución de DNS Dinámico (DDNS / CNAMEs) y Docker Slim: Se migró la imagen base de los `Dockerfile` a `node:22-slim` (Debian/glibc) y se configuró `dns.setDefaultResultOrder('ipv4first')` para resolver de forma confiable cadenas anidadas de alias CNAME (`sj.atodocolor.com.ar` -> `atc.fw-precixo.com.ar` -> `oficinapuerto01.ddns.net`) sin incurrir en timeouts por IPv6 o incompatibilidad de `musl libc`.
- Auto-recuperación del Pool de Conexiones MSSQL: Se configuró un manejador de eventos `pool.on('error')` en `mssql.js` que invalida y libera el pool ante microcortes o cambios de IP dinámica, permitiendo que la próxima solicitud reestablezca la conexión automáticamente sin requerir reinicios manuales del servidor.

**Casos borde conocidos:**
- Solicitudes a la raíz `/`: Si no hay un build estático de frontend en `client-dist`, responde 200 OK con metadatos JSON del servicio.
- Cambio de IP pública en servidor local: Ante un cambio de IP dinámica por parte del ISP en la distribuidora, el pool se auto-recupera en la siguiente consulta tras expirar el TTL del DDNS.
