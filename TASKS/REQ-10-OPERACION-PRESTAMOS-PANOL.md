# REQ-10: Operación de Pañol — Despacho, Préstamo Presencial y Devoluciones

> **Código:** `REQ-10` | **Módulo:** `FU-04` (Gestión y Control de Préstamos)  
> **Plataforma:** Web (`apps/web`)  
> **Roles:** Pañolero (`PAN-01`) y Administrador (`AD-01`)

---

## 🎯 Objetivo

Optimizar el flujo de mesón del pañol. Permitir el despacho de solicitudes remotas pendientes (aceptar o rechazar con motivo) y la atención de préstamos presenciales ultrarrápidos mediante lector de código de barras USB/Bluetooth, junto con la recepción y verificación de devoluciones.

---

## 📡 Endpoints del Backend (`ENDPOINTS.md`)

| Método | Endpoint | Roles | Descripción | Estado API |
|---|---|---|---|:---:|
| `GET` | `/api/loans/pending` | `PAN-01`, `AD-01` | Solicitudes remotas pendientes por despachar con stock disponible y ubicación física. | 🟢 Implementado en cliente |
| `POST` | `/api/loans/{id}/approve` | `PAN-01` | Aprueba solicitud remota, reserva stock y notifica al docente. | 🟢 Implementado en cliente |
| `POST` | `/api/loans/{id}/reject` | `PAN-01` | Rechaza solicitud indicando motivo obligatorio (`rejection_reason`). | 🟢 Implementado en cliente |
| `POST` | `/api/loans/checkout` | `PAN-01` | Préstamo presencial directo (credencial docente + códigos de barra de ítems). | 🟢 Implementado en cliente |
| `POST` | `/api/loans/checkin` | `PAN-01` | Devolución de préstamo mediante escaneo de ítems. Reintegra stock o marca en reparación. | 🟢 Implementado en cliente |

---

## 📋 Lista de Tareas Desglosada

### 1. Cola de Despacho de Solicitudes Remotas (`apps/web`)
- [x] **Bandeja de Pendientes (`/prestamos/cola`):**
  - [x] Tarjetas de solicitud con docente, asignatura, sala y hora requerida.
  - [x] Desglose de cada ítem solicitado mostrando:
    - Cantidad requerida vs stock actual en pañol.
    - Ubicación física exacta (Sala, Estante, Cajón) para preparación ágil.
- [x] **Aprobación de Solicitud:**
  - [x] Botón "Preparar / Aprobar" que llama a `POST /api/loans/{id}/approve`.
  - [x] Descuento atómico del stock disponible.
- [x] **Rechazo con Motivo Obligatorio:**
  - [x] Diálogo modal accesible exigiendo texto en `rejection_reason` (ej. "Sin stock de multímetros", "Docente con préstamo atrasado").
  - [x] Envío vía `POST /api/loans/{id}/reject`.

### 2. Préstamo Presencial Directo con Lector de Código de Barras
- [x] **Modo Mostrador / Checkout Rápido (`/prestamos/mostrador`):**
  - [x] Captura de credencial de docente mediante escáner o tipeo de RUN con autocompletado reactivo.
  - [x] Input de captura rápida para pistola lectora de código de barras (opera como teclado estándar sin requerir drivers).
  - [x] Auto-foco permanente en el campo de lectura con sonido sintetizado (Web Audio API) e indicador visual de ítem agregado.
  - [x] Tabla de ítems escaneados con cantidad acumulada y descripción del producto.
  - [x] Botón de confirmación "Registrar Entrega de Préstamo" (`POST /api/loans/checkout`).

### 3. Devolución y Check-in de Materiales
- [x] **Flujo de Devolución (`/prestamos/mostrador` tab checkin):**
  - [x] Búsqueda de préstamo activo por docente o por código de barras de cualquier ítem entregado.
  - [x] Verificación de cada producto recibido.
  - [x] Opción "Reportar daño o falla" por ítem: cambia estado a `en_revision`/`en_reparacion` y abre reporte hacia `REQ-13`.
  - [x] Botón "Completar Devolución" (`POST /api/loans/checkin`) que reincorpora el stock al pañol.

---

## 🧪 Pruebas Requeridas

- [x] Unit test: hooks `useAprobarPrestamo`, `useRechazarPrestamo` y validación de `rejection_reason`.
- [x] Component test: captura secuencial de código de barras desde input de teclado con pistola, checkout y devolución.
