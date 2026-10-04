# REQ-13: Informes de Novedades, Daños y Solicitudes de Reposición

> **Código:** `REQ-13` | **Módulo:** `FU-05` (Fichas Técnicas e Informes de Novedades)  
> **Plataformas:** Mobile (`apps/mobile`) y Web (`apps/web`)  
> **Roles:** Docente (`PRO-01`), Pañolero (`PAN-01`) y Director de Carrera (`DIR-01`)

---

## 🎯 Objetivo

Canalizar de forma estructurada los reportes de incidentes durante clases o devoluciones (equipos averiados, cables rotos, insumos agotados). Permitir adjuntar fotografías de evidencia y coordinar la derivación técnica del activo (`en_revision` ➔ `en_reparacion` ➔ `reparado` / `dado_de_baja`).

---

## 📡 Endpoints del Backend (`ENDPOINTS.md`)

| Método | Endpoint | Roles | Descripción | Estado API |
|---|---|---|---|:---:|
| `POST` | `/api/incident-reports` | `PRO-01`, `PAN-01` | Crea reporte (`product_id`, `description`, `severity: 'leve'\|'media'\|'critica'`, `photo`). Cambia ítem a `en_revision`/`en_reparacion`. | 🟡 Planificado |
| `GET` | `/api/incident-reports` | `DIR-01`, `PAN-01`, `AD-01` | Listado de novedades reportadas con filtros por gravedad y estado. | 🟡 Planificado |
| `PATCH` | `/api/incident-reports/{id}/status` | `PAN-01`, `DIR-01` | Actualiza estado (`en_revision`, `en_reparacion`, `reparado`, `dado_de_baja`). | 🟡 Planificado |

---

## 📋 Lista de Tareas Desglosada

### 1. App Móvil Docente (`apps/mobile`)
- [ ] **Formulario de Reporte de Novedad / Falla:**
  - [ ] Selector del producto o equipo afectado (con opción de escaneo de código de barras con la cámara o búsqueda manual).
  - [ ] Selector de severidad del incidente: `leve` (detalle estético o cable suelto), `media` (falla parcial), `critica` (equipo inoperativo).
  - [ ] Campo descriptivo del problema observado en la sesión de clase.
  - [ ] Captura fotográfica con la cámara o selección de imagen desde la galería usando `expo-image-picker`.
  - [ ] Envío multipart (`FormData`) hacia `POST /api/incident-reports`.
- [ ] **Feedback al Docente:**
  - [ ] Notificación de confirmación de recepción del reporte.
  - [ ] Historial de reportes enviados por el docente con estado de resolución.

### 2. Panel Web Pañol y Dirección (`apps/web`)
- [ ] **Bandeja de Novedades y Fallas (`/novedades`):**
  - [ ] Vista en lista o kanban organizada por estado: `en_revision`, `en_reparacion`, `reparado`, `dado_de_baja`.
  - [ ] Badges distintivos por nivel de severidad (`critica` en rojo parpadeante o destacado).
  - [ ] Vista modal con la fotografía adjunta ampliada y datos del docente que reportó.
- [ ] **Gestión y Transición de Estados:**
  - [ ] Acciones para pañolero y director:
    - Enviar a taller de reparación (`status: 'en_reparacion'`).
    - Declarar reparado y reintegrar a stock disponible (`status: 'reparado'`).
    - Dar de baja definitiva con justificación para posterior cotización de reemplazo (`status: 'dado_de_baja'`).

---

## 🧪 Pruebas Requeridas

- [ ] Unit test: hook `useCreateNovedad` con envío de `FormData`.
- [ ] Integration test: actualización de estado de incidencia `PATCH /api/incident-reports/:id/status`.
