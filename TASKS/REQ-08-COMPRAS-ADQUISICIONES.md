# REQ-08: Gestión de Compras, Órdenes de Adquisición y Recepción en Stock

> **Código:** `REQ-08` | **Módulo:** `FU-03` (Adquisiciones y Compras)  
> **Plataforma:** Web (`apps/web`)  
> **Roles:** Director de Carrera (`DIR-01`), Administrador (`AD-01`) y Pañolero (`PAN-01`)

---

## 🎯 Objetivo

Gestionar el ciclo de vida de las compras y adquisiciones derivadas de cotizaciones aprobadas. Controlar la transición de estados (`pendiente` ➔ `en_camino` ➔ `completa` / `rechazada`) y la recepción física de mercancía mediante factura de llegada que incrementa el stock de inventario.

---

## 📡 Endpoints del Backend (`ENDPOINTS.md`)

| Método | Endpoint | Roles | Descripción | Estado API |
|---|---|---|---|:---:|
| `GET` | `/api/purchases` | `DIR-01`, `AD-01`, `PAN-01` | Listado de órdenes de compra con filtros por estado (`pendiente`, `en_camino`, `completa`, `rechazada`). | 🟡 Planificado |
| `POST` | `/api/purchases` | `DIR-01`, `AD-01` | Registra nueva orden de compra a partir de una cotización aprobada o proveedor directo. | 🟡 Planificado |
| `GET` | `/api/purchases/{id}` | `DIR-01`, `AD-01`, `PAN-01` | Detalle completo de orden de compra, montos e ítems adquiridos. | 🟡 Planificado |
| `PATCH` | `/api/purchases/{id}/status` | `DIR-01`, `PAN-01` | Transición de estado (`en_camino` ➔ `completa`). Gatilla notificación de recepción física. | 🟡 Planificado |

---

## 📋 Lista de Tareas Desglosada

### 1. Panel de Órdenes de Compra (`apps/web`)
- [ ] **Bandeja de Compras (`/compras`):**
  - [ ] Tabla de órdenes de compra con ID, Proveedor, Total estimado, Estado y Fecha.
  - [ ] Filtro por estado: `pendiente`, `en_camino`, `completa`, `rechazada`.
  - [ ] Badges visuales con colores según estado institucional.
- [ ] **Generación de Orden de Compra:**
  - [ ] Formulario de creación a partir de una cotización (`quotation_id`) o creación manual.
  - [ ] Selección de proveedor adjudicado y desglose de ítems con precios unitarios acordados.
- [ ] **Recepción de Mercancía e Ingreso a Stock:**
  - [ ] Vista de detalle para pañolero (`PAN-01`) con verificación de ítems recibidos.
  - [ ] Botón de "Confirmar Llegada / Marcar Completa" que dispara `PATCH /api/purchases/{id}/status` con `status: 'completa'`.
  - [ ] Opción integrada para escanear la factura de llegada vía OCR (`POST /api/invoices/scan`) para cotejar cantidades reales contra la orden de compra.
  - [ ] Notificación automática al pañolero para proceder a la ubicación física de los nuevos productos.

---

## 🧪 Pruebas Requeridas

- [ ] Unit test: hooks `usePurchases` y `useUpdatePurchaseStatus`.
- [ ] Integration test: transición de orden de compra `en_camino` a `completa`.
