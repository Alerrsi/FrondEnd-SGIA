# REQ-03 & REQ-04: Catálogo de Inventario, Alta de Productos y Escaneo OCR de Facturas

> **Códigos:** `REQ-03` (Alta vía Factura OCR) y `REQ-04` (Gestión de Productos y Códigos de Barra)  
> **Módulo:** `FU-02` (Gestión de Inventario y Almacenamiento)  
> **Plataforma:** Web (`apps/web`)  
> **Roles:** Director de Carrera (`DIR-01`), Pañolero (`PAN-01`) y Administrador (`AD-01`)

---

## 🎯 Objetivo

Digitalizar la incorporación y mantenimiento del catálogo de productos y activos del pañol. Permitir el alta rápida a partir del escaneo OCR de facturas de compra (extrayendo ítems automáticamente), la generación de códigos de barra Code128 vectoriales y el control de stock mínimo.

---

## 📡 Endpoints del Backend (`ENDPOINTS.md`)

| Método | Endpoint | Roles | Descripción | Estado API |
|---|---|---|---|:---:|
| `GET` | `/api/products` | Auth | Listado paginado con búsqueda por nombre, código de barras o descripción y filtros. | ✅ Listo |
| `POST` | `/api/products` | `AD-01`, `DIR-01`, `PAN-01` | Alta de producto. Genera código de barras `SGIA-XXXXXXXX` si no se provee. | ✅ Listo |
| `GET` | `/api/products/{id}` | Auth | Detalle completo de producto con proveedor y ubicación física. | ✅ Listo |
| `PUT / PATCH` | `/api/products/{id}` | `AD-01`, `DIR-01`, `PAN-01` | Edición de producto (nombre, stock, stock mínimo, etc.). | ✅ Listo |
| `DELETE` | `/api/products/{id}` | `AD-01`, `DIR-01` | Eliminación de producto del inventario. | ✅ Listo |
| `PATCH` | `/api/products/{id}/status` | `AD-01`, `DIR-01`, `PAN-01` | Activa o desactiva un producto (`is_active: boolean`). | ✅ Listo |
| `GET` | `/api/products/{id}/barcode` | Auth | Retorna el código de barras, representación SVG vectorial y formato HTML. | ✅ Listo |
| `POST` | `/api/invoices/scan` | `AD-01`, `DIR-01` | Procesa factura (PDF/JPG/PNG) y retorna número de factura y lista de borradores de productos. | ✅ Listo |

---

## 📋 Lista de Tareas Desglosada

### 1. Flujo de Extracción OCR de Factura (`REQ-03`)
- [x] **Componente de Carga de Factura:**
  - [x] Zona de arrastrar y soltar (Drag and drop) con soporte para PDF, JPG y PNG (máx. 10MB).
  - [x] Barra de progreso de carga y estado de procesamiento OCR.
- [x] **Revisión y Edición de Borradores:**
  - [x] Tabla interactiva para revisar los ítems extraídos por el OCR (`POST /api/invoices/scan`).
  - [x] Edición en línea de cada producto sugerido: nombre, cantidad, precio unitario, stock mínimo y proveedor sugerido.
  - [x] Botón de "Confirmar y Dar de Alta Todos" para crear en lote los productos confirmados vía `POST /api/products`.

### 2. CRUD y Vista de Catálogo de Productos (`REQ-04`)
- [x] **Listado Principal de Inventario:**
  - [x] Grid/tabla con tarjetas o filas compactas estilo zed.dev.
  - [x] Buscador integrado para nombre, modelo o código de barras.
  - [x] Badge de stock disponible vs stock mínimo (resaltado si stock <= stock_minimo).
  - [x] Filtro por estado (`activo` / `inactivo`) y área académica.
- [x] **Formulario Manual de Creación y Edición:**
  - [x] Campos: Nombre, Descripción, Área/Carrera, Stock inicial, Stock mínimo, Proveedor, Ubicación (sala/cajón).
  - [x] Checkbox para autogenerar código de barras si no se ingresa uno existente.
- [x] **Ficha de Detalle de Producto:**
  - [x] Vista del producto con especificaciones, proveedor y ubicación física.
  - [x] Renderizado vectorial del código de barras en SVG (`GET /api/products/{id}/barcode`).
  - [x] Botón para imprimir etiquetas con código de barras en formato térmico/adhesivo.
  - [x] Acción de desactivación/activación (`PATCH /api/products/{id}/status`) sin eliminar el historial.

---

## 🧪 Pruebas Requeridas

- [x] Unit test: normalización de respuesta de producto (`normalizeProducto`).
- [x] Integration test: subida de factura y render de borradores extraídos.
- [x] Visual regression test: renderizado de código de barras SVG en modo oscuro.
