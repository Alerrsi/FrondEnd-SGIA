# Plan Maestro de Tareas — Monorepo Frontend SGIA

> **Proyecto:** Sistema de Gestión de Inventario y Activos (SGIA)  
> **Cliente:** Área de Informática y Ciberseguridad, INACAP Sede Temuco  
> **Arquitectura:** Monorepo con Turborepo, pnpm, React (Vite SPA) y React Native (Expo)  
> **Documentos de Referencia:** [`AGENTS.md`](../AGENTS.md) y [`ENDPOINTS.md`](../ENDPOINTS.md)

---

## 🧭 Índice de Requisitos y Tareas

| Archivo | Requisito | Funcionalidad | Plataforma | Roles | Estado General |
|---|---|---|---|---|:---:|
| [REQ-01](./REQ-01-AUTENTICACION-SESIONES.md) | `REQ-01` | Autenticación, Sesiones y Seguridad | Web + Mobile | Todos | 🟡 En Progreso (80%) |
| [REQ-02](./REQ-02-ADMINISTRACION-USUARIOS.md) | `REQ-02` | Administración de Usuarios y Cuentas | Web | AD-01 | 🟢 Completado (100%) |
| [REQ-03-04](./REQ-03-REQ-04-INVENTARIO-PRODUCTOS.md) | `REQ-03`, `REQ-04` | Catálogo de Productos y OCR Facturas | Web | DIR-01, PAN-01, AD-01 | 🔴 Pendiente |
| [REQ-05](./REQ-05-UBICACION-FISICA.md) | `REQ-05` | Ubicación Física (Salas y Cajones) | Web | PAN-01, DIR-01, AD-01 | 🔴 Pendiente |
| [REQ-06](./REQ-06-ALERTAS-STOCK-CRITICO.md) | `REQ-06` | Alertas de Stock Crítico y Preventivo | Web | AD-01, PAN-01 | 🔴 Pendiente |
| [REQ-07](./REQ-07-COTIZACIONES-PROVEEDORES.md) | `REQ-07` | Proveedores y Cotizaciones Múltiples | Web | DIR-01, AD-01 | 🔴 Pendiente |
| [REQ-08](./REQ-08-COMPRAS-ADQUISICIONES.md) | `REQ-08` | Órdenes de Compra y Recepción | Web | DIR-01, PAN-01, AD-01 | 🔴 Pendiente |
| [REQ-09](./REQ-09-PRESTAMOS-REMOTOS.md) | `REQ-09` | Pre-reservas Remotas de Préstamos | Mobile + Web | PRO-01, PAN-01 | 🔴 Pendiente |
| [REQ-10](./REQ-10-OPERACION-PRESTAMOS-PANOL.md) | `REQ-10` | Operación en Pañol (Pistola Barcode) | Web | PAN-01 | 🔴 Pendiente |
| [REQ-11](./REQ-11-HISTORIAL-AUDITORIA-PRESTAMOS.md) | `REQ-11` | Historial y Auditoría de Préstamos | Web | PAN-01, DIR-01, AD-01 | 🔴 Pendiente |
| [REQ-12](./REQ-12-FICHAS-TECNICAS-EQUIPOS.md) | `REQ-12` | Fichas Técnicas y Manuales PDF | Web | DIR-01, AD-01, PAN-01 | 🔴 Pendiente |
| [REQ-13](./REQ-13-INFORMES-NOVEDADES-FALLAS.md) | `REQ-13` | Reportes de Novedades e Incidentes | Mobile + Web | PRO-01, PAN-01, DIR-01 | 🔴 Pendiente |
| [REQ-14](./REQ-14-DASHBOARDS-ANALITICA.md) | `REQ-14` | Analítica y Dashboards Ejecutivos | Web | DIR-01, AD-01 | 🔴 Pendiente |
| [REQ-NF](./REQ-NF-CALIDAD-ACCESIBILIDAD-PERFORMANCE.md) | `REQ-NF` | Accesibilidad AA, Performance y Offline | Web + Mobile | Todos | 🟡 En Progreso (60%) |

---

## 👥 Matriz de Roles y Accesos

- **AD-01 (Administrador):** Acceso total al panel web, gestión de usuarios, auditoría, catálogos y configuración.
- **DIR-01 (Director de Carrera / Asesor):** Carga de facturas, cotizaciones con proveedores, compras, hojas de vida y dashboards de analítica.
- **PAN-01 (Pañolero / Encargado):** Operación diaria de pañol, inventario físico, asignación de salas/cajones, préstamos presenciales/remotos con pistola lectora y recepción con inspección de fallas.
- **PRO-01 (Docente / Profesor):** Acceso exclusivo vía aplicación móvil (Expo/React Native) para pre-reserva de materiales y reporte fotográfico de fallas.

---

## 🛠️ Convenciones de Implementación

1. **Rutas API:** Todas las rutas deben coincidir 1:1 con las documentadas en [`ENDPOINTS.md`](../ENDPOINTS.md). Base URL: `/api`.
2. **Consumo de Datos:** Todo fetch debe realizarse a través de `packages/api-client` con TanStack Query y hooks tipados.
3. **Modelos y Tipos:** Los contratos de datos residen en `packages/types`.
5. **Estilo Visual:** Inspirado en [zed.dev](https://zed.dev/), fondo oscuro (`#0d0d0d`), bordes delgados, fuentes mono para códigos/IDs y acento rojo/naranja definido en `packages/design-tokens`.
