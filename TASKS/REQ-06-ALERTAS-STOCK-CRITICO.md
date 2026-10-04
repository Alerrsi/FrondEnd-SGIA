# REQ-06: Alertas de Stock Crítico y Preventivo

> **Código:** `REQ-06` | **Módulo:** `FU-02` (Gestión de Inventario y Almacenamiento)  
> **Plataforma:** Web (`apps/web`)  
> **Roles:** Administrador (`AD-01`) y Pañolero (`PAN-01`)

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
- [ ] **Indicadores Visuales en Catálogo de Inventario:**
  - [ ] Badge en rojo tenue/destacado para stock en nivel crítico (`<= stock_minimo`).
  - [ ] Badge en amarillo/ámbar para nivel de advertencia (`stock_minimo + 5`).
  - [ ] Filtro rápido en la barra de inventario: "Solo stock crítico" (`critical_only=1`).
- [ ] **Centro de Notificaciones en Barra Superior (Header):**
  - [ ] Icono de campana con contador flotante (badge) indicando la cantidad de alertas no resueltas.
  - [ ] Menú desplegable tipo popover con las alertas más recientes y su severidad.
  - [ ] Enlace directo desde la alerta hacia la ficha del producto afectado.
- [ ] **Bandeja Completa de Alertas de Stock:**
  - [ ] Vista dedicada `/alertas` para administradores y pañoleros.
  - [ ] Filtros por tipo de alerta (`warning` vs `critical`) y estado (`resueltas` vs `activas`).
  - [ ] Botón de acción "Marcar como resuelta / Atendida" (`PATCH /api/alerts/{id}/resolve`).
  - [ ] Botón de acción directa "Iniciar Cotización" para solicitar reposición hacia `REQ-07`.

---

## 🧪 Pruebas Requeridas

- [ ] Unit test: hooks `useCriticalStockAlerts` y mutación `useResolveStockAlert`.
- [ ] Integration test: cálculo visual del badge de alerta según stock y stock_minimo.
