# REQ-05: Gestión y Filtrado por Ubicación Física en Pañol

> **Código:** `REQ-05` | **Módulo:** `FU-02` (Gestión de Inventario y Almacenamiento)  
> **Plataforma:** Web (`apps/web`)  
> **Roles:** Pañolero (`PAN-01`), Director (`DIR-01`) y Administrador (`AD-01`)

---

## 🎯 Objetivo

Garantizar la trazabilidad y rápida localización física de cada activo o insumo dentro de las dependencias del pañol mediante la estructura jerárquica de Sala, Estantería/Módulo y Cajón.

---

## 📡 Endpoints del Backend (`ENDPOINTS.md`)

| Método | Endpoint | Roles | Descripción | Estado API |
|---|---|---|---|:---:|
| `GET` | `/api/products/{id}/location` | Auth | Obtiene la sala, cajón y descripción física asignada al producto. | ✅ Listo |
| `PATCH` | `/api/products/{id}/location` | `AD-01`, `DIR-01`, `PAN-01` | Asigna o reubica el producto (`location_id` o combinación de `sala`, `cajon` y `descripcion`). | ✅ Listo |
| `GET` | `/api/products` | Auth | Admite query params `location_id`, `sala` y `cajon` para filtrar inventario por ubicación. | ✅ Listo |

---

## 📋 Lista de Tareas Desglosada

### 1. Interfaz y Componentes Web (`apps/web`)
- [ ] **Selector de Ubicación en Formularios de Producto:**
  - [ ] Componente con selector de Sala (ej. "Pañol Central", "Laboratorio 301", "Taller de Redes").
  - [ ] Campo dependiente para identificación de Cajón/Estante (ej. "Cajón A-12", "Estante 3 - Nivel B").
  - [ ] Campo opcional de descripción o referencia (ej. "Contenedor azul antiestático").
- [ ] **Modal de Reubicación Rápida:**
  - [ ] Botón de acción rápida en la tabla de inventario "Cambiar ubicación".
  - [ ] Mutación vía `PATCH /api/products/{id}/location` con confirmación inmediata e invalidación de query.
- [ ] **Filtro de Inventario por Ubicación:**
  - [ ] Barra de filtros en el listado de inventario con selectores dinámicos de sala y cajón.
  - [ ] Visualización en listado con badge distintivo: `Sala · Cajón` (con estilo mono-espaciado).
- [ ] **Mapa o Vista Esquemática de Pañol (Opcional UX):**
  - [ ] Selector visual por salas para visualizar qué productos residen en cada estante.

---

## 🧪 Pruebas Requeridas

- [ ] Unit test: hook `useProductLocation` y mutación de actualización.
- [ ] Integration test: filtrado de productos por combinación de sala y cajón.
