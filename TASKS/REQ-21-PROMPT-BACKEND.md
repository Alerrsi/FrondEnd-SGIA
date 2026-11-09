# REQ-21 · Prompt de modificación para la API (`sgia-backend`, Laravel)

> Para pegar en el repositorio del backend. Complementa [REQ-21](./REQ-21-PROFESOR-WEB.md).
> Decisiones tomadas: **Laboratorio** se elige de la API (selector); **Profesor** es solo el usuario autenticado (`PRO-01`).

---

## Prompt

```text
Contexto
Eres un desarrollador del backend de SGIA (Laravel, API REST bajo /api, auth con Sanctum).
El frontend web y móvil del profesor (rol PRO-01) crea solicitudes remotas de préstamo con
POST /api/loans/requests. Necesitamos ampliar ese endpoint y sus lecturas. Antes de escribir
código, lee el controlador, el FormRequest, el modelo Loan, su resource y los tests de
/api/loans/requests, y respeta las convenciones existentes (422 con `message` + `errors`,
fechas ISO 8601 en UTC, `loan_date` como YYYY-MM-DD).

Objetivo
Una solicitud remota debe registrar estos datos:

| Dato              | Campo de la API          | Reglas |
|-------------------|--------------------------|--------|
| Profesor          | (token)                  | Siempre el usuario autenticado con rol PRO-01. NO se acepta `user_id`/`teacher_id` en el body; si llega, se ignora. |
| Carrera           | career_id                | Obligatorio. Debe existir en `careers`. NO se restringe a las carreras del profesor: un profesor puede pedir para cualquier carrera (en emergencias puede no estar asignado a ninguna). |
| Asignatura        | subject (alias asignatura) | Obligatorio, string, máx. 255. |
| Fecha de actividad| loan_date (alias fecha)  | Obligatorio, YYYY-MM-DD, hoy o futura. |
| Hora de inicio    | start_time               | Obligatorio, formato HH:MM (24 h). |
| Hora de término   | end_time                 | Obligatorio, HH:MM, estrictamente posterior a start_time. |
| Laboratorio       | location_id              | Obligatorio. Debe existir en `locations`, ser de tipo `sala` o `taller` y pertenecer al pañol indicado en storeroom_id. |
| Pañol a solicitar | storeroom_id             | Obligatorio. Debe existir en `storerooms`. Es el pañol que prepara la solicitud. |
| Lista de insumos  | items[].product_id, items[].quantity | Mínimo 1 ítem, product_id único dentro de la solicitud, quantity entero >= 1. El producto debe existir, estar activo y tener stock suficiente (misma validación actual). |
| Notas             | notes                    | Opcional, texto. |

Trabajo a realizar

1. Migración
   - Tabla de préstamos: agregar career_id (FK nullable a careers, nullOnDelete), storeroom_id
     (FK al pañol, mismo tipo de dato que storerooms.id), location_id (FK nullable a locations),
     start_time (time) y end_time (time). Nullable para no romper préstamos antiguos y
     préstamos presenciales.
   - Conservar `time_block` y `room`: al crear la solicitud, rellenarlos automáticamente
     (`time_block` = "HH:MM - HH:MM", `room` = nombre de la ubicación) para que el panel del
     pañol, la cola y las exportaciones actuales sigan funcionando sin cambios.
   - Backfill opcional: para filas existentes con time_block "HH:MM - HH:MM", poblar
     start_time y end_time.

2. Validación (FormRequest de POST /api/loans/requests)
   - Aplicar la tabla anterior con mensajes en español, igual que el resto de la API.
   - Retrocompatibilidad: si llega solo `time_block` (clientes antiguos) y no start_time/end_time,
     derivar las horas de ahí; si llegan start_time/end_time, ignorar `time_block` y generarlo.
     Si llega `room` sin location_id, aceptarlo como hoy (texto libre) SOLO para clientes
     antiguos; el cliente nuevo siempre envía location_id.
   - Validar que location_id pertenezca a storeroom_id (locations.storeroom_id).
   - Detectar solapamiento de stock: la disponibilidad de cada producto debe validarse como hasta
     ahora; documentar si se considera el rango horario o solo la fecha.

3. Autorización
   - POST /api/loans/requests, GET /api/loans/requests (alias my-requests) y
     DELETE /api/loans/requests/{id}: solo PRO-01 (los demás roles reciben 403, salvo las
     lecturas de PAN-01/AD-01 que ya existan para la cola).
   - El profesor solo ve y cancela sus propias solicitudes (403 si es ajena, 422 si ya no
     está pendiente), igual que hoy.

4. Respuestas (Resource del préstamo)
   - Incluir: career_id y career {id, name, code}, storeroom_id y storeroom {id, name, code},
     location_id y location {id, nombre, tipo}, start_time, end_time (HH:MM), time_block,
     room, teacher {id, name} (el profesor autenticado, solo lectura) e items con producto
     {id, name, barcode} y quantity.
   - POST responde 201 con "Solicitud enviada correctamente." y las claves `data` y `loan`
     como hoy, ahora con los campos nuevos.

5. Listados y cola del pañol
   - GET /api/loans/requests: nuevos filtros opcionales storeroom_id, career_id y
     loan_date (además de estado/status).
   - La cola del pañol (PAN-01) solo debe mostrar las solicitudes del pañol del pañolero
     (`user.storeroom_id`), salvo AD-01 que ve todas. Confirmar cómo se filtra hoy y ajustarlo.

6. Catálogos de apoyo para los selectores del profesor
   - GET /api/storerooms ya existe (todos los roles autenticados): verificar que PRO-01 puede
     leerlo.
   - GET /api/locations?tipo=sala|taller&storeroom_id={id}: agregar el filtro storeroom_id
     y confirmar que PRO-01 puede leerlo. Debe devolver id, nombre, tipo y storeroom_id.
   - GET /api/careers: hoy es AD-01/DIR-01/PAN-01. Permitir a PRO-01 leer el listado completo
     de carreras (solo lectura), porque el selector no depende de las carreras asignadas.
   - GET /api/products: confirmar que PRO-01 puede listar productos activos con su stock
     disponible para armar la lista de insumos.

7. Tests (Pest/PHPUnit)
   - Crea una solicitud válida con todos los campos: 201 y campos nuevos persistidos.
   - 422 por cada regla: falta carrera, carrera inexistente, hora de término <= inicio,
     fecha pasada, location_id de otro pañol, location_id de tipo pañol/bodega, items vacío,
     product_id repetido, stock insuficiente.
   - Un profesor sin carreras asignadas puede crear la solicitud con cualquier carrera válida.
   - El body no puede fijar el profesor: enviar user_id/teacher_id no cambia el solicitante.
   - Retrocompatibilidad: solicitud antigua con solo time_block y room sigue funcionando.
   - Autorización: PAN-01/DIR-01/AD-01 reciben 403 al crear; el profesor no ve ni cancela
     solicitudes ajenas.
   - Filtros storeroom_id, career_id y loan_date en el listado.

8. Documentación
   - Actualizar ENDPOINTS.md (POST/GET/DELETE /api/loans/requests, /api/locations,
     /api/careers) y el changelog: campos nuevos, reglas, retrocompatibilidad y ejemplos
     de request/response.

Entregables
   - Migración, FormRequest, modelo/relaciones, resource, controlador, tests y ENDPOINTS.md.
   - Al terminar, lista los cambios de contrato (campos nuevos, alias, comportamiento de
     compatibilidad) para que el frontend los refleje en packages/types y packages/api-client.

Criterios de aceptación
   - Un PRO-01 puede crear una solicitud con carrera, asignatura, fecha, hora de inicio y término,
     laboratorio (location_id), pañol (storeroom_id) y lista de insumos; el profesor queda
     registrado solo desde el token.
   - Todas las reglas anteriores responden 422 con `message` + `errors` por campo.
   - Los clientes antiguos que envían solo `time_block` y `room` siguen funcionando.
   - La cola del pañol muestra el pañol, laboratorio, horario y carrera de cada solicitud.
   - Los tests pasan.
```

---

## Cambios de contrato que el frontend debe reflejar al terminar

- [x] `packages/types/src/prestamo.ts`: `start_time`, `end_time`, `storeroom_id`, `location_id` y los objetos relacionados (`career`, `storeroom`, `location`, `teacher`) en `CreatePrestamoPayload` y `Prestamo`.
- [x] `packages/api-client`: filtros `storeroom_id`, `career_id` y `loan_date` en `LoanRequestQueryParams`; filtro `storeroom_id` en `LocationQueryParams`.
- [x] `ENDPOINTS.md` del frontend: sincronizar con el del backend.
