# Usuarios y Credenciales del Sistema — Distribuidora ATC

**Qué hace:**  
Este documento reúne la totalidad de los usuarios, contraseñas, cuentas predeterminadas y credenciales de servicios configuradas en el proyecto ATC Migración y en el Tablero de Control.

---

## 1. Usuarios del Sistema Principal (ATC Migración)

### 1.1 Usuario Inicial en Base de Datos PostgreSQL / Supabase
Definido en las migraciones iniciales (`server/migrations/001_atc_migracion_schema.sql`):

| Nombre de Usuario | Contraseña por Defecto | Perfil | NRO_VENDEDOR | Estado |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `1234` | `Administracion` | `NULL` | Activo |

*Nota:* Para todo usuario nuevo creado a través del ABM o migración sin especificar contraseña, el valor por defecto asignado por el esquema es `ATC123`.

### 1.2 Usuarios Mock / Desarrollo Frontend
Definidos en `client/src/data/mock.js` para desarrollo y pruebas de interfaz sin backend:

| Nombre de Usuario | Email | Perfil | NRO_VENDEDOR |
| :--- | :--- | :--- | :--- |
| **María González** | `admin@atodocolor.com` | `AdministracionA` | `NULL` |
| **Luis Pérez** | `l.perez@atodocolor.com` | `Administracion` | `NULL` |
| **Carlos Ruiz** | `c.ruiz@atodocolor.com` | `VendedorCalle` | `3` |
| **Ana Flores** | `a.flores@atodocolor.com` | `VendedorCalle` | `5` |
| **Diego Sosa** | `d.sosa@atodocolor.com` | `SuperVendedor` | `7` |

### 1.3 Usuarios de Pruebas Automatizadas (Tests)
Definidos en la suite de tests (`client/src/utils/usuariosABM.test.js`):

| Nombre de Usuario | Contraseña | Perfil | Estado |
| :--- | :--- | :--- | :--- |
| **Apsol** | `ATC123` | `Administracion` | Activo |

---

## 2. Credenciales del Tablero de Control (`Tablero-de-control-A-Todo-Color-main`)

En la aplicación react del Tablero de Control (`src/pages/Login.jsx`), el acceso se valida contra variables de entorno (`.env`):

| Usuario | Variable de Entorno para Contraseña |
| :--- | :--- |
| **admin** | `VITE_TABLERO_ADMIN_PASSWORD` |
| **eduardo** | `VITE_TABLERO_EDUARDO_PASSWORD` |
| **guillermo** | `VITE_TABLERO_GUILLERMO_PASSWORD` |
| **atc** | `VITE_TABLERO_ATC_PASSWORD` |

---

## 3. Credenciales de Servicios e Infraestructura Backend (`server/.env`)

### 3.1 Base de Datos MSSQL (Casa 29)
| Parámetro | Valor |
| :--- | :--- |
| **Host (MSSQL_HOST)** | `sj.atodocolor.com.ar` |
| **Puerto (MSSQL_PORT)** | `8888` |
| **Usuario (MSSQL_USER)** | `informesapp` |
| **Contraseña (MSSQL_PASSWORD)** | `Info$SRATCapp1309*` |
| **Base de datos (MSSQL_DATABASE)** | `Casa29` |

### 3.2 Seguridad y Firma de Tokens (JWT)
| Parámetro | Valor |
| :--- | :--- |
| **Secreto JWT (JWT_SECRET)** | `super-secret-key-change-in-production` |

### 3.3 Cuenta de Servicio Google APIs (Sheets)
| Parámetro | Valor |
| :--- | :--- |
| **Client Email** | `sheet-antigravity@n8n-apsol.iam.gserviceaccount.com` |
| **ID del Proyecto Google** | `n8n-apsol` |
| **ID Planilla Sheets** | `1vPmIkypaepScB2VE7ZPB_YnTbWD74ayfzSqXS5BLV-k` |

---

## Restricciones y Notas de Seguridad
- **Políticas de Bloqueo:** El sistema aplica bloqueo temporal de 15 minutos ante 5 intentos fallidos consecutivos de inicio de sesión.
- **Formato de Contraseñas:** Las contraseñas en el backend se almacenan y validan en la vista `atc_usuarios_v` de PostgreSQL/Supabase.
