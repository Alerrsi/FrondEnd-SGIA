# REQ-12: Fichas Técnicas de Equipos, Especificaciones y Manuales

> **Código:** `REQ-12` | **Módulo:** `FU-05` (Fichas Técnicas e Informes de Novedades)  
> **Plataforma:** Web (`apps/web`)  
> **Roles:** Director de Carrera (`DIR-01`), Administrador (`AD-01`) y Pañolero (`PAN-01`)

---

## 🎯 Objetivo

Centralizar la información técnica de los activos de mayor valor (servidores, routers, switches, osciloscopios, workstations). Disponer de fichas técnicas descargables en PDF, enlaces a manuales de usuario alojados en almacenamiento en la nube (S3), cálculo de vida útil estimada e historial de mantenciones.

---

## 📡 Endpoints del Backend (`ENDPOINTS.md`)

| Método | Endpoint | Roles | Descripción | Estado API |
|---|---|---|---|:---:|
| `GET` | `/api/equipment/{id}/specs` | Auth | Especificaciones técnicas, URL de manual, fecha de compra, vida útil estimada. | 🟢 Implementado en Cliente HTTP |
| `PUT` | `/api/equipment/{id}/specs` | `DIR-01`, `AD-01` | Actualizar especificaciones técnicas y enlace al manual. | 🟢 Implementado en Cliente HTTP |
| `GET` | `/api/equipment/{id}/technical-sheet` | Auth | Genera y descarga la ficha técnica formal en PDF. | 🟢 Implementado en Cliente HTTP (Blob) |
| `GET` | `/api/equipment/{id}/reports` | `DIR-01`, `PAN-01`, `AD-01` | Historial de hojas de vida y mantenciones en PDF. | 🟢 Implementado en Cliente HTTP (Blob) |

---

## 📋 Lista de Tareas Desglosada

### 1. Interfaz y Componentes Web (`apps/web`)
- [x] **Módulo de Equipamiento Crítico (`/equipos`):**
  - [x] Listado de equipos y dispositivos principales con su estado operativo.
  - [x] Acceso directo a la ficha técnica de cada equipo.
- [x] **Vista de Especificaciones Técnicas y Hoja de Vida (`/equipos/:id` o Drawer Lateral Sheet):**
  - [x] Tabla de características técnicas (procesador, memoria, puertos, potencia, etc.).
  - [x] Enlace para abrir o descargar el manual oficial de usuario en PDF desde S3.
  - [x] Indicador de ciclo de vida: Fecha de adquisición, años de vida útil estimada y tiempo de operación restante con barra semántica.
- [x] **Edición de Especificaciones (`DIR-01`, `AD-01`):**
  - [x] Formulario con campos clave-valor dinámicos para especificaciones personalizadas.
  - [x] Carga o actualización de la URL del manual en S3.
  - [x] Mutación vía `PUT /api/equipment/{id}/specs`.
- [x] **Descarga de Ficha Técnica Institucional:**
  - [x] Botón "Descargar Ficha Técnica (PDF)" que consulta `GET /api/equipment/{id}/technical-sheet` con nombre dinámico `ficha-tecnica-[codigo].pdf`.
  - [x] Botón "Descargar Hoja de Vida / Mantenciones (PDF)" que invoca `GET /api/equipment/{id}/reports` con nombre dinámico `hoja-vida-mantenciones-[codigo].pdf`.

---

## Mantenciones por carrera (plan en `BackEnd-SGIA/docs/mantenciones-por-carrera.md`, implementado y verificado contra la API)

- [x] Tipos y cliente: `career_id` y `sin_carrera` en `MaintenanceRecordQueryParams`.
- [x] `/mantenciones`: cifras con `Metric`, una celda por carrera con barra apilada por estado, tocarla filtra la bandeja, aviso de vencidas con tokens `warn`, bandeja en `TableFrame` con filas para teléfono.
- [x] Tests (`mantenciones-page.test.tsx`, `lib/career-filter.test.ts`) y recorrido en Chromium contra la API (PAN-01 y DIR-01, 1440 y 390 px, 28/28).

## 🧪 Pruebas Requeridas

- [x] Unit test: hooks `useEquipmentSpecs` y `useUpdateEquipmentSpecs` (`apps/web/src/features/equipos/equipment-specs-hooks.test.tsx`).
- [x] Integration test: descarga de PDF de ficha técnica como blob con nombre de archivo dinámico (`apps/web/src/features/equipos/equipos-page.test.tsx`).
