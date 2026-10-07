# REQ-05: Gestión y Filtrado por Ubicación Física en Pañol

> **Código:** `REQ-05` | **Módulo:** `FU-02` (Gestión de Inventario y Almacenamiento)  
> **Plataforma:** Web (`apps/web`)  
> **Roles:** Pañolero (`PAN-01`), Director (`DIR-01`) y Administrador (`AD-01`)

---

## 🎯 Objetivo

Garantizar la trazabilidad y rápida localización física de cada activo o insumo dentro de las dependencias del pañol mediante la estructura jerárquica de Sala, Estantería/Módulo y Cajón, consumiendo las listas desplegables dinámicas entregadas por los endpoints de `/api/locations` y `/api/cajones`.

---

## 📡 Endpoints del Backend (`ENDPOINTS.md`)

| Método | Endpoint | Roles | Descripción | Estado API |
|---|---|---|---|:---:|
| `GET` | `/api/products/{id}/location` | Auth | Obtiene la sala, cajón y descripción física asignada al producto. | ✅ Listo |
| `PATCH` | `/api/products/{id}/location` | `AD-01`, `DIR-01`, `PAN-01` | Asigna o reubica el producto (`location_id`, `cajon_id` o combinación de `sala`, `cajon` y `descripcion`). | ✅ Listo |
| `GET` | `/api/products` | Auth | Admite query params `location_id`, `sala` y `cajon` para filtrar inventario por ubicación. | ✅ Listo |

### 2.1 Ubicaciones Físicas y Cajones (`FU-02` / `REQ-05`)

| Método | Endpoint | Roles Permitidos | Descripción / Parámetros | Estado |
|---|---|---|---|:---:|
| `GET` | `/api/locations` | Todos (`auth`) | Listado paginado de ubicaciones (salas, pañoles, talleres). Soporta filtros por `tipo` (`sala`, `panol`, `taller`, `bodega`) y búsqueda por texto (`search`). Incluye conteo y lista de cajones, más auditoría (`created_by`, `updated_by`). | ✅ Implementado |
| `POST` | `/api/locations` | `AD-01`, `DIR-01`, `PAN-01` | Crea una nueva ubicación física.<br>**Body:** `nombre`, `tipo` (`sala`, `panol`, `taller`, `bodega`), `descripcion`. Registra automáticamente `created_by` y `updated_by`. | ✅ Implementado |
| `GET` | `/api/locations/{id}` | Todos (`auth`) | Detalle de ubicación con todos sus cajones registrados y auditoría. | ✅ Implementado |
| `PUT / PATCH` | `/api/locations/{id}` | `AD-01`, `DIR-01`, `PAN-01` | Actualiza nombre, tipo o descripción de la ubicación. Actualiza `updated_by`. | ✅ Implementado |
| `DELETE` | `/api/locations/{id}` | `AD-01`, `DIR-01` | Elimina una ubicación y sus cajones asociados. | ✅ Implementado |
| `GET` | `/api/cajones` | Todos (`auth`) | Listado de cajones/gavetas/compartimientos. Soporta filtros por `location_id` y búsqueda por código/descripción (`search`). Incluye relación de ubicación y auditoría. | ✅ Implementado |
| `POST` | `/api/cajones` | `AD-01`, `DIR-01`, `PAN-01` | Crea un nuevo cajón dentro de una ubicación.<br>**Body:** `location_id`, `codigo`, `descripcion`. Valida código único por ubicación y registra `created_by` / `updated_by`. | ✅ Implementado |
| `GET` | `/api/cajones/{id}` | Todos (`auth`) | Detalle del cajón con su ubicación padre y total de productos almacenados. | ✅ Implementado |
| `PUT / PATCH` | `/api/cajones/{id}` | `AD-01`, `DIR-01`, `PAN-01` | Actualiza código, descripción o mueve el cajón de ubicación. Actualiza `updated_by`. | ✅ Implementado |
| `DELETE` | `/api/cajones/{id}` | `AD-01`, `DIR-01` | Elimina un cajón. | ✅ Implementado |

---

## 📋 Lista de Tareas Desglosada

### 1. Interfaz y Componentes Web (`apps/web`)
- [x] **Selector de Ubicación en Formularios de Producto (`ProductoFormDialog`):**
  - [x] Selector desplegable de Sala/Ubicación consumiendo `GET /api/locations` (`useLocations`).
  - [x] Selector dependiente de Cajón/Gaveta consumiendo `GET /api/cajones?location_id={id}` (`useCajones`).
  - [x] Opción para alternar entre selección de la API y entrada manual de Sala y Cajón.
  - [x] Sincronización automática de `location_id`, `cajon_id`, `sala` y `cajon` en el payload de creación y edición.
- [x] **Modal de Reubicación Rápida (`ReubicarProductoModal`):**
  - [x] Botón de acción rápida en la tabla de inventario "Reubicar en pañol" (`MapPin`).
  - [x] Visualización de la ubicación actual registrada con tipografía mono-espaciada.
  - [x] Selector dinámico de Sala entregado por la API con conteo de cajones.
  - [x] Selector dinámico de Cajón dependiente entregado por la API filtrado por la sala seleccionada.
  - [x] Mutación vía `PATCH /api/products/{id}/location` con `useUpdateProductLocation` e invalidación inmediata de queries.
  - [x] Modo manual con entrada de texto libre y nota de referencia opcional.
- [x] **Filtro de Inventario por Ubicación en Tabla (`InventarioTable`):**
  - [x] Selector de filtro por Sala alimentado dinámicamente por la API.
  - [x] Selector de filtro dependiente por Cajón alimentado dinámicamente por la API.
  - [x] Visualización de ubicación en cada fila con badge distintivo `Sala · Cajón` (estilo mono-espaciado zed.dev).
  - [x] Conexión de query params `sala` y `cajon` a `useProducts` en `ProductosListPage`.

---

## 🧪 Pruebas Requeridas

- [x] Unit test: hook `useUpdateProductLocation` y ciclo de vida de mutación `PATCH /api/products/{id}/location`.
- [x] Integration test modal: `reubicar-producto-modal.test.tsx` verificando opciones entregadas por la API, reubicación vía `location_id`/`cajon_id` y modo manual.
- [x] Integration test tabla: `inventario-table.test.tsx` verificando renderizado de ubicaciones, botón de reubicación y filtrado por sala/cajón.
