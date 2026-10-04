# REQ-11: Historial, Auditoría y Exportación de Préstamos

> **Código:** `REQ-11` | **Módulo:** `FU-04` (Gestión y Control de Préstamos)  
> **Plataforma:** Web (`apps/web`)  
> **Roles:** Pañolero (`PAN-01`), Director de Carrera (`DIR-01`) y Administrador (`AD-01`)

---

## 🎯 Objetivo

Proveer una vista histórica completa y auditable de todos los préstamos cursados en el sistema (presenciales y remotos), con filtros avanzados, distinción visual de estado y exportación de reportes en PDF y Excel para análisis de fin de semestre o inventario.

---

## 📡 Endpoints del Backend (`ENDPOINTS.md`)

| Método | Endpoint | Roles | Descripción | Estado API |
|---|---|---|---|:---:|
| `GET` | `/api/loans` | `PAN-01`, `DIR-01`, `AD-01` | Listado general con filtros (`docente`, `asignatura`, `sala`, `estado`, `per_page`). | 🟡 Planificado |
| `GET` | `/api/loans/{id}` | `PAN-01`, `DIR-01`, `AD-01` | Detalle completo de préstamo, bitácora de eventos y observaciones. | 🟡 Planificado |
| `GET` | `/api/loans/export` | `DIR-01`, `PAN-01`, `AD-01` | Descarga de reporte en formato PDF o Excel por rango de fechas (`start_date`, `end_date`, `format`). | 🟡 Planificado |

---

## 📋 Lista de Tareas Desglosada

### 1. Historial y Tabla Avanzada (`apps/web`)
- [ ] **Tabla Histórica de Préstamos (`/prestamos/historial`):**
  - [ ] Columnas: Código Préstamo, Docente Solicitante, Asignatura, Sala/Taller, Cantidad de Ítems, Fecha Préstamo, Fecha Devolución, Estado.
  - [ ] Paginación y ordenamiento con TanStack Table.
- [ ] **Jerarquía Visual y Distinción de Estados:**
  - [ ] Préstamos `en proceso` o `activos` destacados con mayor contraste y badge ámbar/azul.
  - [ ] Préstamos `procesados` o `devueltos` atenuados (`opacity-70` o texto secundario) para no saturar visualmente.
  - [ ] Préstamos `atrasados` destacados con indicador de alerta rojo y conteo de días de retraso.
- [ ] **Filtros Avanzados:**
  - [ ] Selector por Docente (búsqueda por nombre o RUN).
  - [ ] Filtro por Asignatura o Carrera.
  - [ ] Selector por Sala o Taller de uso.
  - [ ] Selector de rango de fechas con `react-day-picker`.

### 2. Detalle y Bitácora de Préstamo
- [ ] **Modal / Página de Detalle (`/prestamos/:id`):**
  - [ ] Línea de tiempo (Timeline) con los hitos: Fecha de solicitud, Aprobación por pañolero, Entrega física, Devolución o Reporte de novedades.
  - [ ] Registro del usuario pañolero que tramitó la entrega y recepción.

### 3. Exportación de Reportes
- [ ] **Botones de Descarga:**
  - [ ] "Exportar a Excel" (`format=excel`) con descarga directa en el navegador.
  - [ ] "Exportar a PDF" (`format=pdf`) con encabezados institucionales para auditoría interna de carrera.

---

## 🧪 Pruebas Requeridas

- [ ] Unit test: hook `useLoans` con filtros de estado y rango temporal.
- [ ] Integration test: descarga de blob de exportación y verificación del nombre de archivo.
