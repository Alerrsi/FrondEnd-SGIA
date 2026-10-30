# Índice Maestro de Requisitos y Especificaciones Técnicas (SGIA Frontend)

Este directorio contiene las especificaciones detalladas para cada módulo funcional y no funcional del frontend de SGIA (Web y Mobile), desglosadas en tareas técnicas implementables para agentes y desarrolladores.

---

## 🧭 Índice de Requisitos y Tareas

| Archivo | Requisito | Funcionalidad | Plataforma | Roles | Estado General |
|---|---|---|---|---|:---:|
| [REQ-01](./REQ-01-AUTENTICACION-SESIONES.md) | `REQ-01` | Autenticación, Sesiones y Seguridad | Web + Mobile | Todos | 🟢 Completado (100%) — web y móvil, cambio de contraseña y sesiones |
| [REQ-02](./REQ-02-ADMINISTRACION-USUARIOS.md) | `REQ-02` | Administración de Usuarios y Cuentas | Web | AD-01 | 🟢 Completado (100%) — 24/24; `usuarios-lifecycle.test.tsx` |
| [REQ-03-04](./REQ-03-REQ-04-INVENTARIO-PRODUCTOS.md) | `REQ-03`, `REQ-04` | Catálogo de Productos y OCR Facturas | Web | DIR-01, PAN-01, AD-01 | 🟢 Completado (23/23) — `features/inventario/` con tabla, formulario, factura y 5 tests |
| [REQ-05](./REQ-05-UBICACION-FISICA.md) | `REQ-05` | Ubicación Física (Salas y Cajones) | Web | PAN-01, DIR-01, AD-01 | 🟢 Completado (20/20) — `features/ubicaciones/`; sin test propio |
| [REQ-06](./REQ-06-ALERTAS-STOCK-CRITICO.md) | `REQ-06` | Alertas de Stock Crítico y Preventivo | Web | AD-01, PAN-01 | 🟢 Completado (15/15) — `features/alertas/` y 2 tests |
| [REQ-07](./REQ-07-COTIZACIONES-PROVEEDORES.md) | `REQ-07` | Proveedores y Cotizaciones Múltiples | Web | DIR-01, AD-01 | 🟢 Completado (18/18) — `features/cotizaciones/` y `proveedores/` con tests |
| [REQ-08](./REQ-08-COMPRAS-ADQUISICIONES.md) | `REQ-08` | Órdenes de Compra y Recepción | Web | DIR-01, PAN-01, AD-01 | 🔴 Pendiente (0/14) — solo hooks de compras en `api-client`, sin UI |
| [REQ-09](./REQ-09-PRESTAMOS-REMOTOS.md) | `REQ-09` | Pre-reservas Remotas de Préstamos | Mobile + Web | PRO-01, PAN-01 | 🟡 Parcial (5/18) — `api-client` y cola web; sin pantallas en `apps/mobile` |
| [REQ-10](./REQ-10-OPERACION-PRESTAMOS-PANOL.md) | `REQ-10` | Operación en Pañol (Pistola Barcode) | Web | PAN-01 | 🟢 Completado (22/22) — `prestamos/mostrador` y `cola` con tests |
| [REQ-11](./REQ-11-HISTORIAL-AUDITORIA-PRESTAMOS.md) | `REQ-11` | Historial y Auditoría de Préstamos | Web | PAN-01, DIR-01, AD-01 | 🟢 Completado (20/20) — `prestamos/historial` con test |
| [REQ-12](./REQ-12-FICHAS-TECNICAS-EQUIPOS.md) | `REQ-12` | Fichas Técnicas y Manuales PDF | Web | DIR-01, AD-01, PAN-01 | 🟢 Completado (16/16) — `features/equipos/` con tests |
| [REQ-13](./REQ-13-INFORMES-NOVEDADES-FALLAS.md) | `REQ-13` | Reportes de Novedades e Incidentes | Mobile + Web | PRO-01, PAN-01, DIR-01 | 🔴 Pendiente (0/17) — sin código |
| [REQ-14](./REQ-14-DASHBOARDS-ANALITICA.md) | `REQ-14` | Analítica y Dashboards Ejecutivos | Web | DIR-01, AD-01 | 🟡 Casi completo — GraphQL real conectado (`/api/metrics`); falta previsualización en vivo en el menú |
| [REQ-CONFIG](./REQ-CONFIG.md) | `REQ-CONFIG` | Configuración de Sistema y Paletas de Color | Web | Todos | 🟢 Completado (8/8) |
| [REQ-NF](./REQ-NF-CALIDAD-ACCESIBILIDAD-PERFORMANCE.md) | `REQ-NF` | Accesibilidad AA, Performance y Offline | Web + Mobile | Todos | 🟡 En Progreso (17%) — 5/29 tareas |

> Estado calculado el 2026-10-27 con las casillas `[x]`/`[ ]` de cada archivo y la presencia de código en `apps/` y `packages/`. `REQ-DISEÑO` (14/14) no figura en la tabla.
