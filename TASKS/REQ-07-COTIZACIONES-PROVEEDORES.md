# REQ-07: Gestión de Proveedores y Cotizaciones Múltiples Automáticas

> **Código:** `REQ-07` | **Módulo:** `FU-03` (Adquisiciones y Proveedores)  
> **Plataforma:** Web (`apps/web`)  
> **Roles:** Director de Carrera (`DIR-01`) y Administrador (`AD-01`)

---

## 🎯 Objetivo

Digitalizar la solicitud de cotizaciones de insumos y equipos. Permitir seleccionar múltiples productos con sus cantidades requeridas y emitir formalmente la solicitud vía email a **al menos 3 proveedores registrados simultáneamente**, gestionando además el catálogo de empresas proveedoras.

---

## 📡 Endpoints del Backend (`ENDPOINTS.md`)

### Catálogo de Proveedores
| Método | Endpoint | Roles | Descripción | Estado API |
|---|---|---|---|:---:|
| `GET` | `/api/suppliers` | `AD-01`, `DIR-01`, `PAN-01` | Listado paginado de empresas proveedoras con filtros por categoría y estado. | 🟡 Planificado |
| `POST` | `/api/suppliers` | `AD-01`, `DIR-01` | Crear proveedor (`name`, `contact_name`, `email`, `phone`, `category`). | 🟡 Planificado |
| `GET` | `/api/suppliers/{id}` | `AD-01`, `DIR-01`, `PAN-01` | Detalle del proveedor e historial de productos suministrados. | 🟡 Planificado |
| `PUT / PATCH` | `/api/suppliers/{id}` | `AD-01`, `DIR-01` | Actualizar datos del proveedor. | 🟡 Planificado |
| `DELETE` | `/api/suppliers/{id}` | `AD-01` | Eliminar proveedor (o desactivar si tiene productos vinculados). | 🟡 Planificado |
| `PATCH` | `/api/suppliers/{id}/status` | `AD-01`, `DIR-01` | Activar o suspender proveedor. | 🟡 Planificado |

### Cotizaciones
| Método | Endpoint | Roles | Descripción | Estado API |
|---|---|---|---|:---:|
| `POST` | `/api/quotations` | `DIR-01`, `AD-01` | Genera y despacha solicitud a **al menos 3 proveedores** (`products`, `supplier_ids`, `notes`). | 🟡 Planificado |
| `GET` | `/api/quotations` | `DIR-01`, `AD-01` | Historial de cotizaciones emitidas con fechas y estados. | 🟡 Planificado |
| `GET` | `/api/quotations/{id}` | `DIR-01`, `AD-01` | Detalle de cotización y respuestas recibidas. | 🟡 Planificado |

---

## 📋 Lista de Tareas Desglosada

### 1. CRUD de Proveedores (`apps/web`)
- [x] **Módulo de Proveedores (`/proveedores`):**
  - [x] Tabla de proveedores con nombre, contacto, correo, teléfono y categoría.
  - [x] Formulario modal de creación y edición (`CreateSupplierPayload`).
  - [x] Activación/suspensión con confirmación visual.
  - [x] Selector rápido de proveedores para usar en cotizaciones y órdenes de compra.

### 2. Flujo de Nueva Cotización Múltiple (`apps/web`)
- [x] **Selector Dinámico de Productos:**
  - [x] Buscador de productos existentes en pañol con sugerencia de stock actual.
  - [x] Lista dinámica de ítems con selector de cantidades a cotizar.
- [x] **Selector de Proveedores Obligatorio (Mínimo 3):**
  - [x] Componente multi-select con validación en formulario: exige la selección de al menos 3 proveedores para habilitar el envío (regla institucional INACAP).
  - [x] Mensaje explicativo visual si se seleccionan menos de 3.
  - [x] Campo de notas o especificaciones adicionales para los proveedores.
- [x] **Historial y Detalle de Cotizaciones (`/cotizaciones`):**
  - [x] Listado con badges de estado (`pendiente`, `en_camino`, `completa`).
  - [x] Vista detallada de cada cotización mostrando ítems y proveedores contactados.
  - [x] Botón de acción para "Aprobar y Generar Orden de Compra" hacia `REQ-08`.

---

## 🧪 Pruebas Requeridas

- [x] Unit test: validación del formulario de cotizaciones (restricción `>= 3` proveedores).
- [x] Integration test: hook `useCreateCotizacion` y manejo de errores cuando el backend rechaza por proveedores insuficientes.
