# REQ-02: Administración de Usuarios y Cuentas de Acceso

> **Código:** `REQ-02` | **Módulo:** `FU-01` (Gestión de Usuarios)  
> **Plataforma:** Web (`apps/web`)  
> **Roles:** Exclusivo Administrador (`AD-01`)

---

## 🎯 Objetivo

Proveer al rol Administrador (`AD-01`) una interfaz completa para dar de alta, consultar, editar y activar/desactivar cuentas de usuario del sistema (docentes, pañoleros y directores), garantizando la unicidad de correo y RUN chileno válido.

---

## 📡 Endpoints del Backend (`ENDPOINTS.md`)

| Método | Endpoint | Roles | Descripción | Estado API |
|---|---|---|---|:---:|
| `GET` | `/api/users` | `AD-01` | Listado paginado con filtros (`role`, `area`, `is_active`, `search`, `per_page`). | ✅ Listo |
| `POST` | `/api/users` | `AD-01` | Alta de nuevo usuario (`name`, `email`, `role`, `area`, `password`, `is_active`). | ✅ Listo |
| `GET` | `/api/users/{id}` | `AD-01` | Detalle completo de un usuario. | ✅ Listo |
| `PUT / PATCH` | `/api/users/{id}` | `AD-01` | Actualización de datos del usuario. | ✅ Listo |
| `DELETE` | `/api/users/{id}` | `AD-01` | Eliminación permanente con cascada de tokens. | ✅ Listo |
| `PATCH` | `/api/users/{id}/status` | `AD-01` | Activa o desactiva la cuenta (`is_active: boolean`). Al desactivar, revoca sesiones. | ✅ Listo |

---

## 📋 Lista de Tareas Desglosada

### 1. Interfaz y Componentes Web (`apps/web`)
- [x] **Tabla de Usuarios (`TanStack Table`):**
  - [x] Columnas: RUN, Nombre, Correo Institucional, Rol (Badge neutral), Estado (Badge success/danger), Fecha de Creación.
  - [x] Búsqueda en tiempo real con debounce sobre RUN, nombre y email.
  - [x] Filtro desplegable por Rol (`AD-01`, `DIR-01`, `PAN-01`, `PRO-01`).
  - [x] Filtro desplegable por Estado (Todos, Activos, Inactivos).
  - [x] Ordenamiento ascendente/descendente por columnas.
  - [x] Paginación con selector de filas por página (10, 25, 50) y navegación anterior/siguiente.
- [x] **Formulario Modal de Alta y Edición (`React Hook Form`):**
  - [x] Modal accesible con Radix UI Dialog.
  - [x] Validación y formateo de RUN chileno (algoritmo módulo 11).
  - [x] Bloqueo de modificación del RUN en modo edición.
  - [x] Validación de formato de correo institucional (`@inacap.cl`).
  - [x] Selector tipado de rol con etiquetas legibles.
  - [x] Campo de contraseña inicial con validación de largo mínimo.
- [x] **Activación y Desactivación de Cuenta:**
  - [x] Modal de confirmación `ConfirmDialog` antes de cambiar el estado de un usuario.
  - [x] Disparo de mutación hacia `PATCH /api/users/{id}/status` con `{ is_active: boolean }`.
  - [x] Notificaciones toast de éxito o error descriptivo retornado por la API.
- [ ] **Eliminación y Casos Borde:**
  - [ ] Opción de borrado con alerta crítica (protección en UI contra auto-eliminación del propio admin conectado).
  - [ ] Paginación en servidor conectada directamente a los query params de `GET /api/users`.

---

## 🧪 Pruebas Requeridas

- [x] Unit test: algoritmo de validación de RUN chileno (`validateRun`, `normalizeStoredRun`, `formatRun`).
- [ ] Integration test: render de tabla y filtrado de usuarios.
- [ ] E2E: ciclo de alta de usuario, edición y cambio de estado activo/inactivo.
