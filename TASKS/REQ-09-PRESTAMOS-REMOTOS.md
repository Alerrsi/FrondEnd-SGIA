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
| `POST` | `/api/loans/requests` | `PRO-01` | Pre-reserva remota (`items`, `subject`, `room`, `loan_date`, `time_block`). Valida disponibilidad. | 🟢 Implementado en cliente |
| `GET` | `/api/loans/my-requests` | `PRO-01` | Listado de solicitudes propias (`pendiente`, `preparado`, `entregado`, `rechazado`). | 🟢 Implementado en cliente |
| `DELETE` | `/api/loans/requests/{id}` | `PRO-01` | Cancelación de solicitud mientras esté en estado `pendiente`. | 🟢 Implementado en cliente |

---

## 📋 Lista de Tareas Desglosada

### 1. App Móvil Docente (`apps/mobile`)
- [x] **Pantalla de Nueva Solicitud de Préstamo:**
  - [x] Buscador de productos del catálogo disponibles para préstamo.
  - [x] Selector interactivo de cantidad por ítem agregado al carrito de solicitud.
  - [x] Campos requeridos:
    - Asignatura / Carrera.
    - Sala, Taller o Laboratorio de destino.
    - Fecha requerida (Selector de fecha y campo nativo).
    - Bloque horario de clase (ej. "Bloque 1-2: 08:30 - 10:00").
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
