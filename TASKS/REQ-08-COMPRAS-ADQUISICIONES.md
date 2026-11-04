# REQ-08: Gestión de Compras, Órdenes de Adquisición y Recepción en Stock

> **Código:** `REQ-08` | **Módulo:** `FU-03` (Adquisiciones y Compras)  
> **Plataforma:** Web (`apps/web`)  
> **Roles:** Director de Carrera (`DIR-01`), Administrador (`AD-01`) y Pañolero (`PAN-01`)

---

## 🎯 Objetivo

Gestionar el ciclo de vida de las compras y adquisiciones derivadas de cotizaciones aprobadas. Controlar la transición de estados (`pendiente` ➔ `en_camino` ➔ `completa`) y la recepción física de mercancía mediante factura de llegada que incrementa el stock de inventario.

---

## 📡 Endpoints del Backend (`ENDPOINTS.md`)

| Método | Endpoint | Roles | Descripción | Estado API |
|---|---|---|---|:---:|
| `GET` | `/api/purchases` | `DIR-01`, `AD-01`, `PAN-01` | Listado de órdenes de compra con filtros por estado (`pendiente`, `en_camino`, `completa`). | ✅ Implementado |
| `POST` | `/api/purchases` | `DIR-01`, `AD-01` | Registra nueva orden de compra a partir de una cotización aprobada o proveedor directo. | ✅ Implementado |
| `GET` | `/api/purchases/{id}` | `DIR-01`, `AD-01`, `PAN-01` | Detalle completo de orden de compra, montos e ítems adquiridos. | ✅ Implementado |
| `PATCH` | `/api/purchases/{id}/status` | `AD-01`, `DIR-01`, `PAN-01` | Transición de estado (`en_camino` ➔ `completa`). Gatilla notificación de recepción física. | ✅ Implementado |
| `POST` | `/api/purchases/{id}/arrival-scan` | `AD-01`, `DIR-01`, `PAN-01` | Guía/factura de llegada (OCR): marca `completa` y notifica al pañolero. | ✅ Implementado |
| `GET` | `/api/purchases/{id}/arrival-document` | `AD-01`, `DIR-01`, `PAN-01` | Descarga autenticada del documento de llegada. | ✅ Implementado |

---

## 📋 Lista de Tareas Desglosada

### 1. Panel de Órdenes de Compra (`apps/web`)
- [x] **Bandeja de Compras (`/compras`):**
  - [x] Tabla de órdenes de compra con ID, Proveedor, Total estimado, Estado y Fecha.
  - [x] Filtro por estado: `pendiente`, `en_camino`, `completa`.
  - [x] Badges visuales con colores según estado institucional.
- [x] **Generación de Orden de Compra:**
  - [x] Formulario de creación a partir de una cotización (`quotation_id`) o creación manual.
  - [x] Selección de proveedor adjudicado y desglose de ítems con precios unitarios acordados.
- [x] **Recepción de Mercancía e Ingreso a Stock:**
  - [x] Vista de detalle para pañolero (`PAN-01`) con verificación de ítems recibidos.
  - [x] Botón de "Confirmar Llegada / Marcar Completa" que dispara `PATCH /api/purchases/{id}/status` con `status: 'completa'`.
  - [ ] Escaneo de la guía/factura de llegada vía `POST /api/purchases/{id}/arrival-scan` (OCR en backend; marca la orden `completa`).
  - [x] Notificación automática al pañolero para proceder a la ubicación física de los nuevos productos.

---

## 🧪 Pruebas Requeridas

- [x] Unit test: hooks `usePurchases` y `useUpdatePurchaseStatus` (`features/compras/purchase-hooks.test.tsx`).
- [x] Integration test: transición de orden de compra `en_camino` a `completa`.
