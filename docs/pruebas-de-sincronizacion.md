# Pruebas de Consolidación de Pedidos

## Qué hace
Valida automáticamente la consistencia y la consolidación de pedidos del modelo híbrido (Google Sheets y SQL Server) para asegurar que el listado consolidado expuesto en la API `/api/pedidos` represente de manera exacta y completa la unión de ambas fuentes de datos sin pérdida de registros.

---

## Escenarios cubiertos

- **Reconciliación de Google Sheets a la API:**
  Verifica que todos los identificadores únicos (`IDPedido`) de pedidos válidos leídos directamente desde el Google Sheet estén presentes en la lista devuelta por la API.
- **Reconciliación de SQL Server a la API:**
  Verifica que todos los identificadores únicos (`IDPedido`) de pedidos existentes en la base de datos SQL Server estén presentes en la lista devuelta por la API.
- **Validación cuantitativa (Consistencia de Totales):**
  Comprueba que el total de pedidos únicos devueltos por la API de la aplicación coincida matemáticamente con la unión exacta (sin duplicados) de los conjuntos leídos de Google Sheets y SQL Server.

---

## Casos borde conocidos

- **Pedidos en estado '9.9' (Anulados en SQL):**
  Estos pedidos solo viven en la base de datos SQL Server y no se replican en Google Sheets. El test valida que sigan siendo devueltos correctamente por la API y no queden excluidos.
- **Pedidos Borrador (Estado '0'):**
  Estos pedidos solo existen temporalmente en Google Sheets. El test valida que la API los recupere y consolide adecuadamente antes de su persistencia en la base de datos.
- **IDs duplicados o solapados:**
  Cuando un mismo ID de pedido existe en Google Sheets y SQL Server, la API realiza una resolución de conflictos priorizando la información de la base de datos SQL. Las pruebas garantizan que este ID siga apareciendo de forma unificada en el resultado sin alterar el conteo total.

---

## Restricciones o supuestos

- **Conectividad activa:** Los tests de integración asumen conectividad a internet para consultar la API de Google Sheets y acceso a la red interna/VPN para conectarse a la instancia de SQL Server.
- **Credenciales válidas:** La prueba requiere que el archivo `.env` del servidor esté correctamente configurado con las credenciales de base de datos (`MSSQL_*`), credenciales de Sheets (`GOOGLE_CREDS_JSON` o archivo de cuenta de servicio) y la clave secreta `JWT_SECRET`.
