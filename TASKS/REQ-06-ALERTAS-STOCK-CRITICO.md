# REQ-06: Alertas de Stock Crítico y Preventivo

> **Código:** `REQ-06` | **Módulo:** `FU-02` (Gestión de Inventario y Almacenamiento)  
> **Plataforma:** Web (`apps/web`)  
> **Roles:** Administrador (`AD-01`), Director (`DIR-01`) y Pañolero (`PAN-01`)

---

## 🎯 Objetivo

Monitorear en tiempo real los niveles de existencias para anticipar quiebres de stock. Disparar avisos automáticos clasificados en Preventivos (`warning` cuando `stock <= stock_minimo + 5`) y Críticos (`critical` cuando `stock <= stock_minimo`), con centro de notificaciones y resolución manual o por reposición.

---

## 📡 Endpoints del Backend (`ENDPOINTS.md`)

| Método | Endpoint | Roles | Descripción | Estado API |
|---|---|---|---|:---:|
| `GET` | `/api/alerts/critical-stock` | Auth | Listado paginado de alertas activas (`alert_type: 'warning' \| 'critical'`, `is_resolved: boolean`). | ✅ Listo |
| `PATCH` | `/api/alerts/{id}/resolve` | `AD-01`, `PAN-01` | Marca manualmente una alerta de stock como resuelta. | ✅ Listo |

---

## 📋 Lista de Tareas Desglosada

### 1. Interfaz y Componentes Web (`apps/web`)
- [x] **Indicadores Visuales en Catálogo de Inventario:**
  - [x] Badge en rojo tenue/destacado para stock en nivel crítico (`<= stock_minimo`).
  - [x] Badge en amarillo/ámbar para nivel de advertencia (`stock_minimo + 5`).
  - [x] Filtro rápido en la barra de inventario: "Solo stock crítico" (`critical_only=1`).
- [x] **Centro de Notificaciones en Barra Superior (Header):**
  - [x] Icono de campana con contador flotante (badge) indicando la cantidad de alertas no resueltas.
  - [x] Menú desplegable tipo popover con las alertas más recientes y su severidad.
  - [x] Enlace directo desde la alerta hacia la bandeja y ficha técnica del producto afectado.
- [x] **Bandeja Completa de Alertas de Stock:**
  - [x] Vista dedicada `/alertas` para administradores, directores y pañoleros.
  - [x] Filtros por tipo de alerta (`warning` vs `critical`) y estado (`resueltas` vs `activas`).
  - [x] Botón de acción "Marcar como resuelta / Atendida" (`PATCH /api/alerts/{id}/resolve`).
  - [x] Botón de acción directa "Iniciar Cotización" para solicitar reposición hacia `REQ-07`.

---

## 🧪 Pruebas Requeridas

- [x] Unit test: hooks `useCriticalStockAlerts` y mutación `useResolveStockAlert`.
- [x] Integration test: cálculo visual del badge de alerta según stock y stock_minimo, renderizado de campana, filtrado y resolución de alertas.
