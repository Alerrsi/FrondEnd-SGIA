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
| `GET` | `/api/equipment/{id}/specs` | Auth | Especificaciones técnicas, URL de manual, fecha de compra, vida útil estimada. | 🟡 Planificado |
| `PUT` | `/api/equipment/{id}/specs` | `DIR-01`, `AD-01` | Actualizar especificaciones técnicas y enlace al manual. | 🟡 Planificado |
| `GET` | `/api/equipment/{id}/technical-sheet` | Auth | Genera y descarga la ficha técnica formal en PDF. | 🟡 Planificado |
| `GET` | `/api/equipment/{id}/reports` | `DIR-01`, `PAN-01`, `AD-01` | Historial de hojas de vida y mantenciones en PDF. | 🟡 Planificado |

---

## 📋 Lista de Tareas Desglosada

### 1. Interfaz y Componentes Web (`apps/web`)
- [ ] **Módulo de Equipamiento Crítico (`/equipos`):**
  - [ ] Listado de equipos y dispositivos principales con su estado operativo.
  - [ ] Acceso directo a la ficha técnica de cada equipo.
- [ ] **Vista de Especificaciones Técnicas y Hoja de Vida (`/equipos/:id`):**
  - [ ] Tabla de características técnicas (procesador, memoria, puertos, potencia, etc.).
  - [ ] Enlace para abrir o descargar el manual oficial de usuario en PDF.
  - [ ] Indicador de ciclo de vida: Fecha de adquisición, años de vida útil estimada y tiempo de operación restante.
- [ ] **Edición de Especificaciones (`DIR-01`, `AD-01`):**
  - [ ] Formulario con campos clave-valor dinámicos para especificaciones personalizadas.
  - [ ] Carga o actualización de la URL del manual en S3.
  - [ ] Mutación vía `PUT /api/equipment/{id}/specs`.
- [ ] **Descarga de Ficha Técnica Institucional:**
  - [ ] Botón "Descargar Ficha Técnica (PDF)" que consulta `GET /api/equipment/{id}/technical-sheet`.
  - [ ] Botón "Descargar Hoja de Vida / Mantenciones (PDF)" que invoca `GET /api/equipment/{id}/reports`.

---

## 🧪 Pruebas Requeridas

- [ ] Unit test: hooks `useEquipmentSpecs` y `useUpdateEquipmentSpecs`.
- [ ] Integration test: descarga de PDF de ficha técnica como blob con nombre de archivo dinámico.
