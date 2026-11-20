# REQ-22 · Prompt de modificación para la API (`BackEnd-SGIA`, Laravel)

> **Ejecutado (20 nov 2026):** la fase 1 está implementada en la rama `mapa-salas` del backend. Este prompt queda como registro.

> Complementa [REQ-22](./REQ-22-MAPA-SALAS.md). **El contrato completo (migraciones, reglas, respuestas, mensajes `422` y tests) vive en `BackEnd-SGIA/docs/mapa-salas.md`**, en la rama `mapa-salas` del backend; no se duplica aquí para que no se desincronice.

## Prompt

```text
Contexto
Eres un desarrollador del backend de SGIA (Laravel, API REST bajo /api, auth con Sanctum).
Implementa la fase 1 de docs/mapa-salas.md (REQ-22) en la rama mapa-salas: zonas y estantes
del plano de cada sala, medidas de la sala y la relación cajón → estante.

Antes de escribir código, lee docs/mapa-salas.md completo, LocationController, CajonController,
los modelos Location, Cajon, Product y EquipmentUnit, LocationResource, CajonResource, sus
FormRequest, routes/api.php (bloque REQ-05) y los tests LocationAndCajonCrudTest y
LocationCodeTest. Respeta CLAUDE.md: controladores delgados, lógica en RoomMapService,
422 con `message` + `errors` en español, `created_by`/`updated_by`, middleware
`role:DIR-01,PAN-01` para escritura, lecturas con `auth`, DELETE en 204 y un test Feature
por ruta (caso feliz, 403 por rol, 422 por validación).

Puntos que no se deben pasar por alto
- Centímetros enteros; con rotation 90 el rectángulo ocupado es (x, y, depth, width).
- Bordes que se tocan no cuentan como superposición.
- Contenido = insumos (por cajon_id) + unidades de equipo/maqueta (por equipment_units.cajon_id);
  el cajon_id de un producto equipo/maqueta no se cuenta. Sin unidades dado_de_baja ni
  productos inactivos. by_status usa los estados reales: disponible, prestado, en_reparacion.
- Sin restricción por pañol (igual que salas y cajones hoy).
- El barcode del cajón no cambia al asignarle estante.
- /api/estantes es una entidad nueva, no el alias de cajones que se retiró.

Al terminar: casillas de REQ-22 en TASKS/Productos.md, filas de ENDPOINTS.md (ambos repos) a ✅,
nota en TASKS/front-end.md, ResourceContractTest actualizado y docs/mapa-salas.md en
«implementado (fase 1)».
```
