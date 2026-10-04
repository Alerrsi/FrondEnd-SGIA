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
- [ ] **Componente de Carga de Factura:**
  - [ ] Zona de arrastrar y soltar (Drag and drop) con soporte para PDF, JPG y PNG (máx. 10MB).
  - [ ] Barra de progreso de carga y estado de procesamiento OCR.
- [ ] **Revisión y Edición de Borradores:**
  - [ ] Tabla interactiva para revisar los ítems extraídos por el OCR (`POST /api/invoices/scan`).
  - [ ] Edición en línea de cada producto sugerido: nombre, cantidad, precio unitario, stock mínimo y proveedor sugerido.
  - [ ] Botón de "Confirmar y Dar de Alta Todos" para crear en lote los productos confirmados vía `POST /api/products`.

### 2. CRUD y Vista de Catálogo de Productos (`REQ-04`)
- [ ] **Listado Principal de Inventario:**
  - [ ] Grid/tabla con tarjetas o filas compactas estilo zed.dev.
  - [ ] Buscador integrado para nombre, modelo o código de barras.
  - [ ] Badge de stock disponible vs stock mínimo (resaltado si stock <= stock_minimo).
  - [ ] Filtro por estado (`activo` / `inactivo`) y área académica.
- [ ] **Formulario Manual de Creación y Edición:**
  - [ ] Campos: Nombre, Descripción, Área/Carrera, Stock inicial, Stock mínimo, Proveedor, Ubicación (sala/cajón).
  - [ ] Checkbox para autogenerar código de barras si no se ingresa uno existente.
- [ ] **Ficha de Detalle de Producto:**
  - [ ] Vista del producto con especificaciones, proveedor y ubicación física.
  - [ ] Renderizado vectorial del código de barras en SVG (`GET /api/products/{id}/barcode`).
  - [ ] Botón para imprimir etiquetas con código de barras en formato térmico/adhesivo.
  - [ ] Acción de desactivación/activación (`PATCH /api/products/{id}/status`) sin eliminar el historial.

---

## 🧪 Pruebas Requeridas

- [ ] Unit test: normalización de respuesta de producto (`normalizeProducto`).
- [ ] Integration test: subida de factura y render de borradores extraídos.
- [ ] Visual regression test: renderizado de código de barras SVG en modo oscuro.
