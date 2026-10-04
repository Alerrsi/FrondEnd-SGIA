# REQ-09: Pre-reservas y Solicitud Remota de Préstamos para Docentes

> **Código:** `REQ-09` | **Módulo:** `FU-04` (Gestión y Control de Préstamos)  
> **Plataformas:** Mobile (`apps/mobile`) y Web (`apps/web`)  
> **Roles:** Docente / Profesor (`PRO-01`) y Pañolero (`PAN-01`)

---

## 🎯 Objetivo

Permitir a los docentes (`PRO-01`) solicitar insumos, herramientas y equipos con antelación desde la aplicación móvil para sus clases y talleres prácticos, validando disponibilidad de inventario en el bloque horario correspondiente.

---

## 📡 Endpoints del Backend (`ENDPOINTS.md`)

| Método | Endpoint | Roles | Descripción | Estado API |
|---|---|---|---|:---:|
| `POST` | `/api/loans/requests` | `PRO-01` | Pre-reserva remota (`items`, `subject`, `room`, `loan_date`, `time_block`). Valida disponibilidad. | 🟡 Planificado |
| `GET` | `/api/loans/my-requests` | `PRO-01` | Listado de solicitudes propias (`pendiente`, `preparado`, `entregado`, `rechazado`). | 🟡 Planificado |
| `DELETE` | `/api/loans/requests/{id}` | `PRO-01` | Cancelación de solicitud mientras esté en estado `pendiente`. | 🟡 Planificado |

---

## 📋 Lista de Tareas Desglosada

### 1. App Móvil Docente (`apps/mobile`)
- [ ] **Pantalla de Nueva Solicitud de Préstamo:**
  - [ ] Buscador de productos del catálogo disponibles para préstamo.
  - [ ] Selector interactivo de cantidad por ítem agregado al carrito de solicitud.
  - [ ] Campos requeridos:
    - Asignatura / Carrera.
    - Sala, Taller o Laboratorio de destino.
    - Fecha requerida (Selector de fecha nativo de Expo).
    - Bloque horario de clase (ej. "Bloque 1-2: 08:30 - 10:00").
  - [ ] Validación antes de enviar: al menos 1 ítem y datos de aula completos.
- [ ] **Confirmación Visual:**
  - [ ] Pantalla o modal de éxito "Solicitud enviada a Pañol" con número de solicitud generado.
  - [ ] Indicación de que el pañolero preparará los insumos antes del inicio del bloque.
- [ ] **Historial y Estado de Mis Solicitudes:**
  - [ ] Renderizado con `FlatList` optimizado para rendimiento en móvil.
  - [ ] Badges de estado: `pendiente` (amarillo), `preparado` (azul), `entregado` (verde), `rechazado` (rojo).
  - [ ] Visualización del motivo de rechazo si la solicitud fue declinada por pañol.
  - [ ] Botón para cancelar solicitud si aún está `pendiente` (`DELETE /api/loans/requests/{id}`).

### 2. Panel Web Pañol (`apps/web`)
- [ ] **Notificación de Solicitudes Entrantes:**
  - [ ] Alerta en tiempo real o sondeo de nuevas solicitudes para el día.
  - [ ] Enlace directo a la cola de despacho de pañol (`REQ-10`).

---

## 🧪 Pruebas Requeridas

- [ ] Unit test: hooks `useCreatePrestamo` y `useMyLoanRequests`.
- [ ] Component test (Mobile): formulario de pre-reserva con validación de campos obligatorios.
