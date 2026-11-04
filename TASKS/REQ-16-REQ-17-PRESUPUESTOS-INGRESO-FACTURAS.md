# REQ-16 / REQ-17: Presupuestos Anuales e Ingreso de Facturas con Descuento de Presupuesto

> **Código:** `REQ-16`, `REQ-17` | **Módulo:** `FU-03` (Adquisiciones y Compras)  
> **Plataforma:** Web (`apps/web`)  
> **Roles:** Administrador (`AD-01`) y Director de Carrera (`DIR-01`, solo carreras propias vía `career_user`)

---

## 🎯 Objetivo

Controlar el presupuesto anual de cada carrera y su ejecución. Cada carrera tiene un presupuesto por año (`initial_amount`) que se **reserva** al crear una orden de compra y se **consume** al confirmar la factura de ingreso, que también suma el stock. Toda variación queda registrada en un ledger de movimientos (`asignacion_inicial`, `ajuste`, reserva, consumo, `reposicion`).

Fórmula que el backend mantiene (el cliente solo la muestra, nunca la calcula como verdad):

```
available_amount = initial_amount − consumed_amount − reserved_amount
```

Flujo completo:

1. `AD-01`/`DIR-01` crea el presupuesto de la carrera para el año → movimiento `asignacion_inicial`.
2. Se crea una orden de compra con `annual_budget_id` → el total queda **reservado**.
3. Llega la factura: se sube (`POST /api/invoice-intakes`, opcionalmente ligada con `purchase_id`) → borrador con ítems detectados por OCR.
4. Se revisa y confirma el borrador → se libera la reserva, se **consume** el monto real (la diferencia vuelve al disponible) y entra el stock (insumos suman cantidad; equipos/maquetas crean unidades en el cajón indicado).
5. Si hubo un error, se anula: un borrador se anula sin efecto; un confirmado se revierte completo (stock, unidades y monto con movimiento `reposicion`).
6. Cancelar una compra `pendiente`/`en_camino` libera su reserva.

---

## ✅ Decisiones (2026-11-03)

| Tema | Decisión |
|---|---|
| Alta por factura del inventario | **Se reemplaza.** Todo ingreso por factura pasa por `/api/invoice-intakes`; se retira `factura-upload-modal` (`POST /api/invoices/scan`) del inventario. |
| Navegación | **Dos rutas sueltas** en el sidebar: `/presupuestos` y `/ingresos-factura` (solo `AD-01`, `DIR-01`). |
| Orden de entrega | **Compras primero** (fase 1) para que `POST /api/purchases` no falle; luego presupuestos (fase 2) e ingresos de factura (fase 3). |
| Tipos del ledger | Confirmados en el backend (`app/Models/BudgetMovement.php`): `asignacion_inicial`, `ajuste`, `reserva`, `liberacion_reserva`, `consumo`, `reposicion`. `amount` siempre es positivo; el signo lo da el tipo. |

---

## 📐 Contratos (Resources del backend)

Los montos llegan como **string decimal** (`"150000.00"`) y hay que normalizarlos a `number` en `api-client`.

```ts
AnnualBudget {
  id, career_id, career?: Career, year,
  initial_amount, available_amount, reserved_amount, consumed_amount,
  invoice_intakes?: InvoiceIntake[],
  created_by, updated_by, created_at, updated_at
}

BudgetSummaryRow {
  id, career_id, career?: Career, year,
  initial_amount, reserved_amount, consumed_amount, available_amount,
  execution_percent // (consumido + reservado) / inicial × 100
}

BudgetMovement {
  id, annual_budget_id,
  type: 'asignacion_inicial' | 'ajuste' | 'reserva' | 'liberacion_reserva' | 'consumo' | 'reposicion',
  amount, purchase_id | null, invoice_intake_id | null,
  user_id, user?: Usuario, notes | null, created_at
}

InvoiceIntake {
  id, user_id, annual_budget_id, purchase_id | null, annual_budget?: AnnualBudget,
  document_number | null, status: 'borrador' | 'confirmado' | 'anulado',
  total_deducted, has_file, raw_ocr_payload, items?: InvoiceIntakeItem[],
  received_at, created_at, updated_at
}

InvoiceIntakeItem {
  id, invoice_intake_id, product_id, product?: Producto,
  detected_name | null, quantity, unit_price, subtotal
}
```

---

## 📡 Endpoints del Backend (`ENDPOINTS.md` §4.1, §4.2 y §6)

### Presupuestos (§4.1)

| Método | Endpoint | Roles | Descripción | Estado API |
|---|---|---|---|:---:|
| `GET` | `/api/budgets` | `AD-01`, `DIR-01` | Lista paginada. Filtros `year`, `career_id`, `per_page`. DIR-01 solo sus carreras. | ✅ Implementado |
| `GET` | `/api/budgets/summary` | `AD-01`, `DIR-01` | Ejecución por carrera/año sin paginar: `initial_amount`, `reserved_amount`, `consumed_amount`, `available_amount`, `execution_percent`. Filtros `year`, `career_id`. | ✅ Implementado |
| `GET` | `/api/budgets/{id}` | `AD-01`, `DIR-01` | Detalle con `career`, `reserved_amount`, `consumed_amount` e `invoice_intakes` confirmados. `403` si la carrera es ajena. | ✅ Implementado |
| `GET` | `/api/budgets/{id}/movements` | `AD-01`, `DIR-01` | Ledger paginado (más reciente primero). Filtros `type`, `from`, `to`, `purchase_id`, `invoice_intake_id`. | ✅ Implementado |
| `GET` | `/api/budgets/{id}/spending` | `AD-01`, `DIR-01` | Gasto confirmado agrupado por `group_by=product` (defecto) \| `product_type` \| `supplier`. Respuesta `{annual_budget_id, group_by, total, data:[{id, label, quantity, amount}]}`. | ✅ Implementado |
| `GET` | `/api/budgets/{id}/monthly` | `AD-01`, `DIR-01` | 12 meses: `{annual_budget_id, year, data:[{month, reserved, consumed, restored}]}`. `year` opcional. | ✅ Implementado |
| `POST` | `/api/budgets` | `AD-01`, `DIR-01` (carreras propias) | `career_id`, `year`, `initial_amount` (> 0). `422` si ya existe carrera + año; `403` si la carrera es ajena. | ✅ Implementado |
| `PATCH` | `/api/budgets/{id}` | `AD-01`, `DIR-01` (carreras propias) | `initial_amount`. `422` si no cubre consumido + reservado. Registra movimiento `ajuste`. | ✅ Implementado |
| `DELETE` | `/api/budgets/{id}` | `AD-01`, `DIR-01` (carreras propias) | `204`. `422` si tiene ingresos de facturas o compras. | ✅ Implementado |

### Ingreso de facturas (§4.2)

| Método | Endpoint | Roles | Descripción | Estado API |
|---|---|---|---|:---:|
| `POST` | `/api/invoice-intakes` | `AD-01`, `DIR-01` | `multipart`: `file` (PDF/PNG/JPG/WEBP, 10 MB), `annual_budget_id`, `purchase_id` opcional (misma compra del presupuesto, no cancelada, con reserva vigente). Crea `borrador` con `raw_ocr_payload.items`. Límite 10/min (`429`). | ✅ Implementado |
| `GET` | `/api/invoice-intakes` | `AD-01`, `DIR-01` | Filtros `status` (`borrador`/`confirmado`/`anulado`), `annual_budget_id`, `from`, `to`, `per_page`. | ✅ Implementado |
| `GET` | `/api/invoice-intakes/{id}` | `AD-01`, `DIR-01` | Detalle con `annual_budget` e `items` (con `product`). | ✅ Implementado |
| `GET` | `/api/invoice-intakes/{id}/file` | `AD-01`, `DIR-01` | Descarga autenticada del archivo (enviar token, no URL directa). `404` si no tiene. | ✅ Implementado |
| `POST` | `/api/invoice-intakes/{id}/confirm` | `AD-01`, `DIR-01` | `document_number`, `items: [{product_id, quantity, unit_price, detected_name?, cajon_id?}]`. `cajon_id` obligatorio en `equipo`/`maqueta`. `422` si el total supera el disponible (+ reserva liberada), si no es `borrador` o falta `cajon_id`. | ✅ Implementado |
| `POST` | `/api/invoice-intakes/{id}/cancel` | `AD-01`, `DIR-01` | `borrador` → `anulado`, o `confirmado` → `anulado` con reversa total. `422` en `items` si la reversa no es posible (stock bajo 0, unidad no `disponible`/con préstamos/anterior a la trazabilidad); `422` en `status` si ya está anulado. | ✅ Implementado |

### Cambios en Compras que dependen del presupuesto (§6)

| Método | Endpoint | Cambio |
|---|---|---|
| `POST` | `/api/purchases` | **`annual_budget_id` obligatorio**; el total se reserva (`422` en `total` si supera `available_amount`, `403` si la carrera es ajena). **`items.*.unit_price` obligatorio**; desde cotización sale de la oferta del proveedor (`422` en `items.N.unit_price` si falta). |
| `GET` | `/api/purchases` | `status` acepta `cancelada`. |
| `POST` | `/api/purchases/{id}/cancel` | **Nuevo.** Cancela `pendiente`/`en_camino` y libera la reserva. `422` desde `completa`/`cancelada`. `PATCH .../status` no acepta `cancelada`. |

> También cambió §2.0: `GET /api/careers` y `GET /api/categories` ahora permiten `PAN-01`.

---

## 📋 Lista de Tareas Desglosada

> **Estado (2026-11-03):** fases 1, 2 y 3 implementadas — ver `FIXES/CHANGELOG-FIXES.md` (FIX-010).
>
> Orden de entrega: **fase 1** = bloque 5 (Compras) + lo mínimo de los bloques 1 y 2 (`AnnualBudget`, `useBudgets`, `useCancelPurchase`); **fase 2** = bloque 3 (Presupuestos); **fase 3** = bloque 4 (Ingresos de factura). Cerrar cada fase con `pnpm typecheck` y `pnpm --filter @sgia/web test` en verde.

### 1. Tipos compartidos (`packages/types`)
- [x] Nuevo `presupuesto.ts`: `AnnualBudget`, `BudgetSummaryRow`, `BudgetMovement` + `BudgetMovementType` (ver Contratos), `BudgetSpending` (+ `BudgetSpendingGroupBy`), `BudgetMonthly`. Etiquetas en español por tipo de movimiento y su signo (`+` para `asignacion_inicial`, `liberacion_reserva`, `reposicion`; `−` para `reserva`, `consumo`; `ajuste` sin signo: el backend guarda `abs(nuevo − anterior)` y la dirección solo viene en `notes`, p. ej. `Monto inicial: $X → $Y`; mostrar `notes` tal cual y pedir al backend un campo `direction` si se necesita el signo).
- [x] Nuevo `ingreso-factura.ts`: `InvoiceIntake`, `InvoiceIntakeStatus` (`borrador` \| `confirmado` \| `anulado`), `InvoiceIntakeItem`, `InvoiceIntakeOcrPayload` (`items`, `ocr_available`), `ConfirmInvoiceIntakePayload`.
- [x] Actualizar `Purchase` / `CreatePurchasePayload` en `cotizacion.ts`: `annual_budget_id`, `unit_price` obligatorio en ítems y estado `cancelada` en el enum de compras.
- [x] Exportar todo desde `index.ts`.

### 2. Cliente de API (`packages/api-client`)
- [x] `services/budgets.ts` + `hooks/budgets.ts`: `useBudgets`, `useBudgetSummary`, `useBudget`, `useBudgetMovements`, `useBudgetSpending`, `useBudgetMonthly`, `useCreateBudget`, `useUpdateBudget`, `useDeleteBudget`.
- [x] `services/invoice-intakes.ts` + `hooks/invoice-intakes.ts`: `useInvoiceIntakes`, `useInvoiceIntake`, `useUploadInvoiceIntake` (multipart), `useConfirmInvoiceIntake`, `useCancelInvoiceIntake`, descarga autenticada del archivo (blob).
- [x] Compras: `useCancelPurchase` y `annual_budget_id` en `useCreatePurchase`.
- [x] Invalidaciones: crear/cancelar compra y confirmar/anular ingreso invalidan `budgets`, `budgets/summary`, `movements`, `monthly`, `spending`; confirmar/anular ingreso invalidan además `products` y `units`.
- [x] Normalizar montos (`string` → `number`) como ya se hace en compras.

### 3. Presupuestos (`apps/web/src/features/presupuestos/`)
- [x] **Ruta `/presupuestos`** como ítem propio del sidebar, visible solo para `AD-01` y `DIR-01`.
- [x] **Resumen de ejecución** (`/api/budgets/summary`): tarjetas o tabla por carrera con inicial, reservado, consumido, disponible y barra de `execution_percent`. Selector de año (por defecto el actual).
- [x] **Tabla de presupuestos** (TanStack Table) con filtros `year` y `career_id`; montos en CLP alineados a la derecha.
- [x] **Crear presupuesto** (RHF + Zod): carrera, año, monto inicial > 0. DIR-01 solo ve sus carreras. Mostrar el `422` de duplicado en el campo. _(El selector lista todas las carreras: `UserResource` no expone las de DIR-01; el backend responde `403`.)_
- [x] **Editar monto inicial**: validar en cliente que no baje de consumido + reservado (UX); mostrar el `422` del backend si ocurre.
- [x] **Eliminar**: confirmación; mostrar `message` del `422` si tiene ingresos o compras.
- [x] **Detalle del presupuesto** con pestañas:
  - [x] Movimientos (ledger paginado, filtros `type`, `from`, `to`; enlaces a la compra o ingreso de origen).
  - [x] Gasto agrupado (`spending`) con selector `product` / `product_type` / `supplier`.
  - [x] Evolución mensual (`monthly`): gráfico de 12 meses con reservado, consumido y repuesto (seguir el skill `dataviz`).
  - [x] Ingresos de factura confirmados.

### 4. Ingreso de facturas (`apps/web/src/features/ingresos-factura/`)
- [x] **Bandeja `/ingresos-factura`** (ítem propio del sidebar, `AD-01`/`DIR-01`): tabla con número de documento, presupuesto/carrera, compra ligada, total, estado (`Badge`) y fecha; filtros `status`, `annual_budget_id`, rango de fechas.
- [x] **Subir factura**: dropzone (PDF/PNG/JPG/WEBP, 10 MB), selector de presupuesto y compra opcional (solo compras del mismo presupuesto, no canceladas). Manejar `429` y `ocr_available = false` (borrador vacío → carga manual de ítems).
- [x] **Revisión del borrador**: vista lado a lado del archivo (descarga autenticada) y la tabla editable de ítems precargada desde `raw_ocr_payload.items`:
  - [x] Asociar cada ítem a un producto existente (`product_id`), con `detected_name` como referencia.
  - [x] Cantidad y precio unitario editables; subtotal y total calculados en vivo.
  - [x] Selector de cajón obligatorio para `equipo`/`maqueta`.
  - [x] Mostrar disponible del presupuesto (y la reserva de la compra ligada) frente al total; aviso si lo supera.
- [x] **Confirmar**: `document_number` obligatorio; mostrar errores `422` por ítem (`items.N.*`) y de monto.
- [x] **Anular**: diálogo distinto para borrador (sin efecto) y confirmado (advertir la reversa de stock, unidades y monto); mostrar los `422` en `items`.
- [x] **Retirar `factura-upload-modal`** del inventario (`POST /api/invoices/scan`): el botón de alta por factura redirige a `/ingresos-factura`. Reutilizar lo que sirva del modal (dropzone, tabla de borradores, selección de categoría/carrera/tipo) y borrar el resto junto con su test (`factura-upload-modal.test.tsx`).

### 5. Ajustes en Compras (`apps/web/src/features/compras/`)
- [x] `purchase-form-dialog`: selector de presupuesto obligatorio y disponible visible; `unit_price` obligatorio en el schema Zod; error `422` en `total` cuando supera el disponible.
- [x] Botón **Cancelar compra** en el detalle (solo `pendiente`/`en_camino`, roles `AD-01`/`DIR-01`) con `POST /api/purchases/{id}/cancel`.
- [x] Estado `cancelada` en filtros y `Badge`.
- [x] Desde el detalle de una compra `completa`, acción "Registrar factura" que abre la subida con `purchase_id` y su presupuesto preseleccionados.

### 6. Documentación
- [x] Actualizar `TASKS/README.md` y `REQ-08` con el estado.
- [x] Registrar los cambios en `FIXES/CHANGELOG-FIXES.md`.
- [x] Corregir en `ENDPOINTS.md` la nota "Aún sin API" (REQ-15 a REQ-20), ya que REQ-16 y REQ-17 sí tienen endpoints.

---

## 🧪 Pruebas Requeridas

- [x] Unit: normalización de montos en hooks de presupuesto e ingresos.
- [x] Unit: schema Zod del formulario de compra (presupuesto y `unit_price` obligatorios).
- [x] Integration: crear presupuesto y mostrar el `422` de duplicado.
- [x] Integration: revisar borrador → confirmar con un insumo y un equipo (exige cajón) → invalida resumen y productos.
- [x] Integration: anular un ingreso confirmado y mostrar el `422` en `items` cuando la reversa no es posible.
- [x] Integration: cancelar una compra `pendiente` y ver que el disponible se actualiza. _(Cubierto a nivel de hook: `/cancel` + invalidación de `budgets`.)_
- [ ] Acceso: DIR-01 no ve carreras ajenas (lo filtra el backend, sin test en el front).
- [x] Acceso: PAN-01 no ve el módulo (`app-layout.test.tsx`).
