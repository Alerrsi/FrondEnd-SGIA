# REQ-09: Pre-reservas y Solicitud Remota de Préstamos para Docentes

> **Código:** `REQ-09` | **Módulo:** `FU-04` (Gestión y Control de Préstamos)  
> **Plataformas:** Mobile (`apps/mobile`) y Web (`apps/web`)  
> **Roles:** Docente / Profesor (`PRO-01`) y Pañolero (`PAN-01`)

---

> **Web del profesor (REQ-21):** `PRO-01` también crea y sigue sus solicitudes desde la web (`/profesor/catalogo`, `/profesor/solicitudes`), con carrera, asignatura, fecha, horario, laboratorio, pañol e insumos. Ver [REQ-21](./REQ-21-PROFESOR-WEB.md).

---

## 🎯 Objetivo

Permitir a los docentes (`PRO-01`) solicitar insumos, herramientas y equipos con antelación desde la aplicación móvil para sus clases y talleres prácticos, validando disponibilidad de inventario en el bloque horario correspondiente.

---

## 📡 Endpoints del Backend (`ENDPOINTS.md`)

| Método | Endpoint | Roles | Descripción | Estado API |
|---|---|---|---|:---:|
| `POST` | `/api/loans/requests` | `PRO-01` | Pre-reserva remota (`items`, `subject`, `room`, `loan_date`, `time_block`). Valida disponibilidad. | 🟢 Implementado en cliente |
| `GET` | `/api/loans/my-requests` | `PRO-01` | Listado de solicitudes propias (`pendiente`, `preparado`, `entregado`, `rechazado`). | 🟢 Implementado en cliente |
| `DELETE` | `/api/loans/requests/{id}` | `PRO-01` | Cancelación de solicitud mientras esté en estado `pendiente`. | 🟢 Implementado en cliente |

---

## 📋 Lista de Tareas Desglosada

### 1. App Móvil Docente (`apps/mobile`)
> **Móvil verificado el 2026-11-09 contra el código** (`apps/mobile/src/app/(app)/index.tsx` y `explore.tsx`), con typecheck y lint. Sin tests propios y sin probar en un dispositivo.

- [x] **Pantalla de Nueva Solicitud de Préstamo:**
  - [x] Pañol a solicitar (`storeroom_id`, lista desplegable con `GET /api/storerooms`). Se elige primero porque define las existencias y los laboratorios.
  - [x] Buscador de productos del catálogo disponibles para préstamo. _(Busca en el servidor con `search`; muestra 6 resultados e indica el total.)_
  - [x] Existencias del pañol elegido en cada producto y en el carrito (`available_in_storeroom` de `GET /api/products?storeroom_id={id}`). Sin existencias no se puede agregar, y la cantidad no supera lo disponible.
  - [x] Selector interactivo de cantidad por ítem agregado al carrito de solicitud.
  - [x] Campos requeridos:
    - Carrera (`career_id`, lista desplegable vertical con `GET /api/careers`).
    - Asignatura.
    - Laboratorio (`location_id`, lista desplegable con las salas y talleres del pañol, `GET /api/locations?storeroom_id={id}`). Al cambiar de pañol se vuelve a elegir.
    - Fecha requerida (campo de tipo fecha con selector nativo; hoy o futura, se envía como `AAAA-MM-DD`).
    - Bloque horario de clase (lista desplegable vertical, ej. "Bloque 1-2: 08:30 - 10:00"); se envía como `start_time` y `end_time`.
  - [x] Validación antes de enviar: al menos 1 ítem y datos de aula completos.
- [x] **Confirmación Visual:**
  - [x] Pantalla o modal de éxito "Solicitud enviada a Pañol" con número de solicitud generado.
  - [x] Indicación de que el pañolero preparará los insumos antes del inicio del bloque.
- [x] **Historial y Estado de Mis Solicitudes:**
  - [x] Renderizado con `FlatList` optimizado para rendimiento en móvil.
  - [x] Badges de estado: `pendiente` (amarillo), `preparado` (azul), `entregado` (verde), `rechazado` (rojo).
  - [x] Visualización del motivo de rechazo si la solicitud fue declinada por pañol.
  - [x] Botón para cancelar solicitud si aún está `pendiente` (`DELETE /api/loans/requests/{id}`).

### 2. Panel Web Pañol (`apps/web`)
- [x] **Notificación de Solicitudes Entrantes:**
  - [x] Alerta en tiempo real o sondeo de nuevas solicitudes para el día con refetch periódico.
  - [x] Enlace directo a la cola de despacho de pañol (`REQ-10` en `/prestamos/cola`).

---

## 🧪 Pruebas Requeridas

- [x] Unit test: hooks `useCreatePrestamo` y `useMyLoanRequests` en `@sgia/api-client`.
- [x] Component test: renderizado de cola y validación de campos obligatorios.
