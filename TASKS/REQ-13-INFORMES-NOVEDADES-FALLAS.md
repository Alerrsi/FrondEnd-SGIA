# REQ-13: Informes de Novedades, Daños y Solicitudes de Reposición

> **Código:** `REQ-13` | **Módulo:** `FU-05` (Fichas Técnicas e Informes de Novedades)  
> **Plataformas:** Mobile (`apps/mobile`) y Web (`apps/web`)  
> **Roles:** Docente (`PRO-01`), Pañolero (`PAN-01`) y Director de Carrera (`DIR-01`)  
> **Crean informes:** `PRO-01` (móvil y web) y `PAN-01` (web). **Atienden:** `PAN-01`, `AD-01` y `DIR-01`.

---

> **Web del profesor (REQ-21):** `PRO-01` crea y sigue sus informes también desde la web (`/profesor/novedades`), con firma en `<canvas>` y foto. Ver [REQ-21](./REQ-21-PROFESOR-WEB.md).

---

## 🎯 Objetivo

Canalizar de forma estructurada los reportes de incidentes durante clases o devoluciones (equipos averiados, cables rotos, insumos agotados). Permitir adjuntar fotografías de evidencia y coordinar la derivación técnica del activo (`en_revision` ➔ `en_reparacion` ➔ `reparado` / `dado_de_baja`).

---

## 📡 Endpoints del Backend (`ENDPOINTS.md`)

> **Tabla histórica.** El contrato cambió: el informe es un formulario por laboratorio con casillas de problema y firma, y lo crean `PRO-01` y `PAN-01`. El vigente está en [`ENDPOINTS.md`](../ENDPOINTS.md) y en `docs/cambios-frontend-noviembre-2026.md` del backend.

| Método | Endpoint | Roles | Descripción | Estado API |
|---|---|---|---|:---:|
| `POST` | `/api/incident-reports` | `PRO-01`, `PAN-01` | Crea reporte (`product_id`, `description`, `severity: 'leve'\|'media'\|'critica'`, `photo`). Cambia ítem a `en_revision`/`en_reparacion`. | 🟡 Planificado |
| `GET` | `/api/incident-reports` | `DIR-01`, `PAN-01`, `AD-01` | Listado de novedades reportadas con filtros por gravedad y estado. | 🟡 Planificado |
| `PATCH` | `/api/incident-reports/{id}/status` | `PAN-01`, `DIR-01` | Actualiza estado (`en_revision`, `en_reparacion`, `reparado`, `dado_de_baja`). | 🟡 Planificado |

---

## 📋 Lista de Tareas Desglosada

### 1. App Móvil Docente (`apps/mobile`)
> **Solo `PRO-01`.** El pañolero crea sus informes desde la web. **Verificado el 2026-11-09** con typecheck, lint y `expo export` para Android, iOS y web. Sin tests propios y sin probar en un dispositivo.

> **Controles del formulario:** los campos con opciones usan lista desplegable vertical (`SelectField` y `MultiSelectField`) y las fechas, campo de tipo fecha (`DateField`), como en REQ-09.

- [x] **Formulario de Informe de Novedades** (`features/novedades/components/new-incident-form.tsx`):
  - [x] Asignatura, fecha (hoy o anterior) y laboratorio (`GET /api/locations`).
  - [x] Problemas en lista desplegable de selección múltiple (`falla_equipo`, `falta_equipamiento`, `falta_insumo`, `otros`), cada uno con su descripción.
  - [x] Sugerencia opcional.
  - [x] Foto opcional con la cámara o desde la galería usando `expo-image-picker`.
  - [x] Firma dibujada con el dedo, enviada como PNG en base64.
  - [x] Código del equipo opcional, escrito a mano.
  - [x] Envío en JSON, o multipart (`FormData`) si lleva foto, a `POST /api/incident-reports`.
  - [ ] Escaneo del código del equipo con la cámara.
- [x] **Seguimiento del Docente** (pestaña Novedades, `app/(app)/novedades.tsx`):
  - [x] Confirmación con el código del informe al enviarlo.
  - [x] Historial de informes propios con su estado, paginado (`GET /api/incident-reports/mine`).
  - [x] Detalle de solo lectura de cada informe.
  - [ ] Descarga del PDF y vista de la firma y la foto desde el móvil. _(Disponible en la web.)_

> La severidad del formulario anterior ya no existe en el contrato vigente.

### 2. Panel Web Pañol y Dirección (`apps/web`)
- [x] **Creación por el pañolero:** botón Nuevo informe en `/novedades`, solo para `PAN-01`, con el mismo formulario y firma. La etiqueta es "Asignatura o actividad" (`novedades-page.test.tsx`).
- [ ] **Bandeja de Novedades y Fallas (`/novedades`):**
  - [x] Vista en lista o kanban organizada por estado: `en_revision`, `en_reparacion`, `reparado`, `dado_de_baja`. _(Lista con filtro por estado, en `features/novedades/`; sin kanban.)_
  - [ ] Badges distintivos por nivel de severidad (`critica` en rojo parpadeante o destacado). _(Hoy la severidad es texto en el detalle; no hay badge en la lista.)_
  - [x] Vista modal con la fotografía adjunta ampliada y datos del docente que reportó. _(`incident-detail-sheet.tsx`.)_
- [ ] **Gestión y Transición de Estados:**
  - [ ] Acciones para pañolero y director: _(Los botones salen de `allowed_transitions`; la baja no pide justificación.)_
    - Enviar a taller de reparación (`status: 'en_reparacion'`).
    - Declarar reparado y reintegrar a stock disponible (`status: 'reparado'`).
    - Dar de baja definitiva con justificación para posterior cotización de reemplazo (`status: 'dado_de_baja'`).

---

## 🧪 Pruebas Requeridas

- [x] Unit test: hook `useCreateNovedad` con envío de `FormData`. _(Cubierto a nivel de servicio en `incident-reports-api.test.ts`.)_
- [x] Integration test: actualización de estado de incidencia `PATCH /api/incident-reports/:id/status`. _(`incident-reports-api.test.ts`.)_
