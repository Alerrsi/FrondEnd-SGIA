# REQ-22: Mapa de salas con estantes arrastrables

> **Código:** `REQ-22` | **Módulo:** `FU-02` (Gestión de Inventario y Activos) — amplía [REQ-05](./REQ-05-UBICACION-FISICA.md)
> **Plataforma:** Web (`apps/web`)
> **Roles:** Pañolero (`PAN-01`, en Ubicaciones) y Director (`DIR-01`, en `/mapa-salas`) ven y editan; Administrador (`AD-01`, en `/mapa-salas`) solo ve
> **Plan:** [`docs/mapa-salas.md`](../docs/mapa-salas.md) · **Contrato API:** `BackEnd-SGIA/docs/mapa-salas.md` · **Prompt backend:** [`REQ-22-PROMPT-BACKEND.md`](./REQ-22-PROMPT-BACKEND.md) · **Rama:** `mapa-salas` (ambos repos)

---

## 🎯 Objetivo

Cada sala tiene su propio plano en SVG con muros, zonas y estantes. Se ve un mapa por sala. El pañolero crea estantes y los arrastra dentro de la sala donde los creó. Al pulsar un estante se abre un pop-up con los nombres de los elementos que guarda. El dibujo prioriza la velocidad sin perder el estilo «Trazo».

## ✅ Criterios de aceptación

1. Toda ubicación tiene un mapa en `/mapa-salas/:locationId`; el selector de sala cambia de mapa sin recargar la página.
2. El mapa muestra el muro, las zonas con su nombre y los estantes con su código y sus cajones como celdas.
3. `PAN-01` y `DIR-01` crean un estante desde el mapa; queda en esa sala, aparece seleccionado y se arrastra a su lugar. Al recargar sigue donde se dejó.
4. Un estante no se puede soltar fuera de los muros ni encima de otro; vuelve a su lugar con un aviso. La API también lo rechaza (`422`).
5. Clic, toque o `Enter` sobre un estante abre un pop-up con los productos y unidades de cada cajón, por nombre (unidades por estado: disponible, prestado, en reparación).
6. `AD-01` ve el mapa y el pop-up, pero no los controles de edición. `PRO-01` no tiene acceso.
7. Arrastrar con 200 estantes en la sala se mantiene fluido (sin renders de React durante el movimiento).
8. Funciona de 320 a 1440 px, en claro y oscuro, con teclado y con puntero táctil.

---

## 📡 Endpoints del Backend

Contrato completo en `BackEnd-SGIA/docs/mapa-salas.md`.

| Método | Endpoint | Roles | Descripción | Estado API |
|---|---|---|---|:---:|
| `GET` | `/api/locations/{id}/map` | Auth | Medidas de la sala, zonas, estantes con cajones resumidos y `cajones_sin_estante_count`. | ✅ Implementado |
| `PATCH` | `/api/locations/{id}` | `DIR-01`, `PAN-01` | Suma `map_width_cm` y `map_height_cm`. | ✅ Implementado |
| `GET` | `/api/estantes` | Auth | Filtro `location_id`. | ✅ Implementado |
| `POST` | `/api/estantes` | `DIR-01`, `PAN-01` | Crea estante; sin `x`/`y` lo ubica en el primer hueco libre. | ✅ Implementado |
| `PATCH` | `/api/estantes/{id}` | `DIR-01`, `PAN-01` | Mueve, gira o edita. `422` por límites o superposición. | ✅ Implementado |
| `DELETE` | `/api/estantes/{id}` | `DIR-01`, `PAN-01` | `422` si tiene cajones. | ✅ Implementado |
| `GET` | `/api/estantes/{id}/contents` | Auth | Cajones con productos y unidades por nombre. | ✅ Implementado |
| `GET/POST/PATCH/DELETE` | `/api/zonas` | Auth / `DIR-01`, `PAN-01` | Zonas de la sala. | ✅ Implementado |
| `PATCH` | `/api/cajones/{id}` | `DIR-01`, `PAN-01` | Suma `estante_id`. | ✅ Implementado |
| `GET` | `/api/cajones` | Auth | Filtros `estante_id` y `sin_estante=1`. | ✅ Implementado |

---

## 📋 Lista de tareas

### Fase 0 · Documentación
- [x] Plan en `docs/mapa-salas.md` con decisiones, arquitectura, fases y pruebas.
- [x] Este requisito y el prompt del backend.
- [x] Índice `TASKS/README.md`, `CLAUDE.md`, `AGENTS.md` y filas en «Endpoints Pendientes» de `ENDPOINTS.md`.
- [x] Revisión contra el código: estados de unidad reales, conteo sin duplicar equipos, sin restricción por pañol, `?cajon_id=` en inventario, rutas por rol.
- [x] Contrato en `BackEnd-SGIA/docs/mapa-salas.md`, casillas en `BackEnd-SGIA/TASKS/Productos.md`, nota en `BackEnd-SGIA/TASKS/front-end.md` y rama `mapa-salas` en el backend.

### Fase 1 · Backend (`BackEnd-SGIA`)
Casillas detalladas en `BackEnd-SGIA/TASKS/Productos.md` (REQ-22).
- [x] Migraciones, modelos, `RoomMapService`, form requests y endpoints con tests de feature (`RoomMapServiceTest`, `RoomMapTest`, `EstanteCrudTest`, `ZonaCrudTest`, `LocationAndCajonCrudTest`).
- [x] `ENDPOINTS.md` de ambos repos a ✅ (sección 2.2).

### Fase 2 · Tipos y cliente (`packages/`)
- [x] `packages/types/src/mapa-sala.ts` (`Zona`, `Estante`, `EstanteRotation`, `SalaMapa`, `EstanteContenido`, payloads) exportados en `index.ts`.
- [x] `CajonEntity` con `estante_id` y `estante`; quitar el `estante_id` sin uso del payload de producto.
- [x] `services/room-map.ts` con normalizadores tipados (sin `any`); filtros `estante_id` y `sin_estante` en `fetchCajones`.
- [x] `hooks/room-map.ts`: `useSalaMapa`, `useEstanteContenido`, `usePrefetchEstanteContenido`, mutaciones de estante y zona; `useUpdateEstante` optimista con vuelta atrás.
- [x] Tests de servicio y del hook optimista (`features/mapa-salas/room-map-hooks.test.tsx`; `api-client` no tiene runner propio).

### Fase 3 · Mapa en modo vista (`apps/web/src/features/mapa-salas/`)
- [x] `lib/map-geometry.ts` (snap, clamp, rotación, superposición, zona por centro, primer hueco) con tests.
- [x] Ruta `/mapa-salas/:locationId` con `React.lazy`, redirección desde `/mapa-salas`, permiso en `ROUTE_PERMISSIONS` (`PAN-01`, `DIR-01`, `AD-01`) y entrada «Mapa de salas» en `nav-config.ts`.
- [x] `SalaSelector` en el `PageHeader`; última sala vista recordada en local (con `try/catch`).
- [x] `SalaSvg`, `SalaWalls`, `ZonaShape`, `EstanteShape` con estilo «Trazo», líneas `non-scaling-stroke` y textos ≥ 12 px en pantalla (`useMapScale`).
- [x] `EstanteContenidoDialog` con cajones, productos y unidades por nombre; vacío, carga y error.
- [x] Lista alternativa «Estantes de la sala» bajo el mapa.
- [x] Acceso «Ver mapa» por sala en `/ubicaciones`.
- [x] Tests de dibujo y pop-up.

### Fase 4 · Edición
- [x] Botón «Editar distribución» (solo `PAN-01`/`DIR-01`), rejilla de 50 cm.
- [x] `useSvgDrag` (Pointer Events, `ref` + `requestAnimationFrame`, umbral de 4 px entre clic y arrastre).
- [x] Al soltar: snap a 10 cm, validación, `zona_id` por centro y `PATCH` optimista; aviso y vuelta atrás si falla.
- [x] Teclado (flechas, `Shift`, `R`, `Escape`) y `MovePad` para puntero táctil.
- [x] `EstanteFormDialog` y `ZonaFormDialog` (RHF + Zod); el estante nuevo queda seleccionado en modo edición.
- [x] Mover y redimensionar zonas.
- [x] `SalaDimensionesDialog` y aviso de sala sin medidas.
- [x] Selector de estante en `cajon-form-dialog.tsx` y aviso de cajones sin estante.
- [x] «Asignar cajones» desde el pop-up (cajones sin estante de la sala).
- [x] `/inventario` lee `?cajon_id=` para «Ver en inventario» (solo `PAN-01`/`DIR-01`).
- [x] Tests de arrastre, teclado y roles.

### Fase 5 · Pulido y cierre
- [x] Zoom (botones, `Ctrl` + rueda, «Ajustar») y desplazamiento del fondo (`use-map-viewport.ts`, `lib/map-viewport.test.ts`).
- [x] Marcador de búsqueda («Buscar en la sala»: fondo burdeo suave por código, cajón o producto) y de stock crítico (punto rojo).
- [x] Revisión a 320, 390, 768, 1024 y 1440 px en claro y oscuro (componentes reales con datos de prueba y Chromium con emulación de dispositivo).
- [x] Recorrido de punta a punta contra la API real con PAN-01, DIR-01 y AD-01 (30/30).
- [x] Prueba de fluidez con 200 estantes (`mapa-sala-performance.test.tsx`: ningún render de React mientras se mueve el puntero).
- [x] Entrada en `FIXES/CHANGELOG-FIXES.md` (FIX-048) y estado final en `TASKS/README.md`.

---

### Fase 6 · Mapa en Ubicaciones, edición en modal y datos de prueba (plan en `docs/mapa-salas.md` §12)
- [x] Backend: `MapaSalasDemoSeeder` repetible (8 ubicaciones, zonas A/B/C, siete estantes, todos los cajones asignados) con test; corrido en la base de desarrollo.
- [x] `SalaMapaPanel` (modo vista reutilizable) y `SalaMapaEditorDialog` (edición en `Dialog size="2xl"`).
- [x] `Escape` en el modal: cancela arrastre o deselecciona antes de cerrar (`onEscapeKeyDown` en `Dialog`); un movimiento de teclado pendiente se guarda al cerrar.
- [x] `/mapa-salas` solo para `DIR-01` y `AD-01` (rutas, menú y test del menú).
- [x] Ubicaciones (`PAN-01`): mapa a la derecha de las salas y cajones debajo, con su estante; sin «Ver mapa».
- [ ] Recorrido contra la API real y capturas a 390 y 1440 px.

---

## 🧪 Pruebas requeridas

- [x] `features/mapa-salas/lib/map-geometry.test.ts`
- [x] Servicio y hook optimista en `packages/api-client` (`features/mapa-salas/room-map-hooks.test.tsx`)
- [x] `features/mapa-salas/sala-svg.test.tsx`
- [x] `features/mapa-salas/estante-contenido-dialog.test.tsx`
- [x] `features/mapa-salas/mapa-sala-drag.test.tsx`
- [x] `features/mapa-salas/mapa-sala-page.test.tsx`
