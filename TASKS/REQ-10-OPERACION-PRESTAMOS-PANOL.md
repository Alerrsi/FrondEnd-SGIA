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
| `GET` | `/api/loans/pending` | `PAN-01`, `AD-01` | Solicitudes remotas pendientes por despachar con stock disponible y ubicación física. | 🟡 Planificado |
| `POST` | `/api/loans/{id}/approve` | `PAN-01` | Aprueba solicitud remota, reserva stock y notifica al docente. | 🟡 Planificado |
| `POST` | `/api/loans/{id}/reject` | `PAN-01` | Rechaza solicitud indicando motivo obligatorio (`rejection_reason`). | 🟡 Planificado |
| `POST` | `/api/loans/checkout` | `PAN-01` | Préstamo presencial directo (credencial docente + códigos de barra de ítems). | 🟡 Planificado |
| `POST` | `/api/loans/checkin` | `PAN-01` | Devolución de préstamo mediante escaneo de ítems. Reintegra stock o marca en reparación. | 🟡 Planificado |

---

## 📋 Lista de Tareas Desglosada

### 1. Cola de Despacho de Solicitudes Remotas (`apps/web`)
- [ ] **Bandeja de Pendientes (`/prestamos/cola`):**
  - [ ] Tarjetas de solicitud con docente, asignatura, sala y hora requerida.
  - [ ] Desglose de cada ítem solicitado mostrando:
    - Cantidad requerida vs stock actual en pañol.
    - Ubicación física exacta (Sala, Estante, Cajón) para preparación ágil.
- [ ] **Aprobación de Solicitud:**
  - [ ] Botón "Preparar / Aprobar" que llama a `POST /api/loans/{id}/approve`.
  - [ ] Descuento atómico del stock disponible.
- [ ] **Rechazo con Motivo Obligatorio:**
  - [ ] Diálogo modal accesible exigiendo texto en `rejection_reason` (ej. "Sin stock de multímetros", "Docente con préstamo atrasado").
  - [ ] Envío vía `POST /api/loans/{id}/reject`.

### 2. Préstamo Presencial Directo con Lector de Código de Barras
- [ ] **Modo Mostrador / Checkout Rápido:**
  - [ ] Captura de credencial de docente mediante escáner o tipeo de RUN.
  - [ ] Input de captura rápida para pistola lectora de código de barras (opera como teclado estándar sin requerir drivers).
  - [ ] Auto-foco permanente en el campo de lectura con sonido/indicador visual de ítem agregado.
  - [ ] Tabla de ítems escaneados con cantidad acumulada y descripción del producto.
  - [ ] Botón de confirmación "Registrar Entrega de Préstamo" (`POST /api/loans/checkout`).

### 3. Devolución y Check-in de Materiales
- [ ] **Flujo de Devolución (`/prestamos/devolucion`):**
  - [ ] Búsqueda de préstamo activo por docente o por código de barras de cualquier ítem entregado.
  - [ ] Verificación de cada producto recibido.
  - [ ] Opción "Reportar daño o falla" por ítem: cambia estado a `en_revision`/`en_reparacion` y abre reporte hacia `REQ-13`.
  - [ ] Botón "Completar Devolución" (`POST /api/loans/checkin`) que reincorpora el stock al pañol.

---

## 🧪 Pruebas Requeridas

- [ ] Unit test: hooks `useAprobarPrestamo`, `useRechazarPrestamo` y validación de `rejection_reason`.
- [ ] Component test: captura secuencial de código de barras desde input de teclado con pistola.
