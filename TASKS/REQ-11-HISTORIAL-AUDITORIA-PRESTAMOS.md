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
| `GET` | `/api/loans` | `PAN-01`, `DIR-01`, `AD-01` | Listado general con filtros (`docente`, `asignatura`, `sala`, `estado`, `per_page`). | 🟢 Implementado en cliente |
| `GET` | `/api/loans/{id}` | `PAN-01`, `DIR-01`, `AD-01` | Detalle completo de préstamo, bitácora de eventos y observaciones. | 🟢 Implementado en cliente |
| `GET` | `/api/loans/export` | `DIR-01`, `PAN-01`, `AD-01` | Descarga de reporte en formato PDF o Excel por rango de fechas (`start_date`, `end_date`, `format`). | 🟢 Implementado en cliente |

---

## 📋 Lista de Tareas Desglosada

### 1. Historial y Tabla Avanzada (`apps/web`)
- [x] **Tabla Histórica de Préstamos (`/prestamos/historial`):**
  - [x] Columnas: Código Préstamo, Docente Solicitante, Asignatura, Sala/Taller, Cantidad de Ítems, Fecha Préstamo, Fecha Devolución, Estado.
  - [x] Paginación y ordenamiento con TanStack Table.
- [x] **Jerarquía Visual y Distinción de Estados:**
  - [x] Préstamos `en proceso` o `activos` destacados con mayor contraste y badge ámbar/azul.
  - [x] Préstamos `procesados` o `devueltos` atenuados (`opacity-70` o texto secundario) para no saturar visualmente.
  - [x] Préstamos `atrasados` destacados con indicador de alerta rojo y conteo de días de retraso.
- [x] **Filtros Avanzados:**
  - [x] Selector por Docente (búsqueda por nombre o RUN).
  - [x] Filtro por Asignatura o Carrera.
  - [x] Selector por Sala o Taller de uso.
  - [x] Selector de rango de fechas y filtro rápido unificado.

### 2. Detalle y Bitácora de Préstamo
- [x] **Drawer / Sheet de Detalle (`/prestamos/historial`):**
  - [x] Línea de tiempo (Timeline) con los hitos: Fecha de solicitud, Aprobación por pañolero, Entrega física, Devolución o Reporte de novedades.
  - [x] Registro del operador pañolero que tramitó la entrega y recepción.

### 3. Exportación de Reportes
- [x] **Botones de Descarga:**
  - [x] "Exportar a Excel" (`format=excel`) con descarga directa en el navegador.
  - [x] "Exportar a PDF" (`format=pdf`) con encabezados institucionales para auditoría interna de carrera.

---

## 🧪 Pruebas Requeridas

- [x] Unit test: hook `useLoans` con filtros de estado y rango temporal.
- [x] Integration test: descarga de blob de exportación y verificación de generación de archivo.
