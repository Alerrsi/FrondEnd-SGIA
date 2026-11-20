# REQ-22: Mapa de salas con estantes arrastrables

> **Código:** `REQ-22` | **Módulo:** `FU-02` (Gestión de Inventario y Activos) — amplía [REQ-05](./REQ-05-UBICACION-FISICA.md)
> **Plataforma:** Web (`apps/web`)
> **Roles:** Pañolero (`PAN-01`) y Director (`DIR-01`) ven y editan; Administrador (`AD-01`) solo ve
> **Plan:** [`docs/mapa-salas.md`](../docs/mapa-salas.md) · **Backend:** [`REQ-22-PROMPT-BACKEND.md`](./REQ-22-PROMPT-BACKEND.md) · **Rama:** `mapa-salas`

---

## 🎯 Objetivo

Cada sala tiene su propio plano en SVG con muros, zonas y estantes. Se ve un mapa por sala. El pañolero crea estantes y los arrastra dentro de la sala donde los creó. Al pulsar un estante se abre un pop-up con los nombres de los elementos que guarda. El dibujo prioriza la velocidad sin perder el estilo «Trazo».

## ✅ Criterios de aceptación

1. Toda ubicación tiene un mapa en `/ubicaciones/mapa/:locationId`; el selector de sala cambia de mapa sin recargar la página.
2. El mapa muestra el muro, las zonas con su nombre y los estantes con su código y sus cajones como celdas.
3. `PAN-01` y `DIR-01` crean un estante desde el mapa; queda en esa sala, aparece seleccionado y se arrastra a su lugar. Al recargar sigue donde se dejó.
4. Un estante no se puede soltar fuera de los muros ni encima de otro; vuelve a su lugar con un aviso. La API también lo rechaza (`422`).
5. Clic, toque o `Enter` sobre un estante abre un pop-up con los productos y unidades de cada cajón, por nombre.
6. `AD-01` ve el mapa y el pop-up, pero no los controles de edición. `PRO-01` no tiene acceso.
7. Arrastrar con 200 estantes en la sala se mantiene fluido (sin renders de React durante el movimiento).
8. Funciona de 320 a 1440 px, en claro y oscuro, con teclado y con puntero táctil.

---

## 📡 Endpoints del Backend

Contrato completo en [`REQ-22-PROMPT-BACKEND.md`](./REQ-22-PROMPT-BACKEND.md).

| Método | Endpoint | Roles | Descripción | Estado API |
|---|---|---|---|:---:|
| `GET` | `/api/locations/{id}/map` | Auth | Medidas de la sala, zonas, estantes con cajones resumidos y `cajones_sin_estante_count`. | ⏳ Pendiente |
| `PATCH` | `/api/locations/{id}` | `DIR-01`, `PAN-01` | Suma `map_width_cm` y `map_height_cm`. | ⏳ Pendiente |
| `GET` | `/api/estantes` | Auth | Filtro `location_id`. | ⏳ Pendiente |
| `POST` | `/api/estantes` | `DIR-01`, `PAN-01` | Crea estante; sin `x`/`y` lo ubica en el primer hueco libre. | ⏳ Pendiente |
| `PATCH` | `/api/estantes/{id}` | `DIR-01`, `PAN-01` | Mueve, gira o edita. `422` por límites o superposición. | ⏳ Pendiente |
| `DELETE` | `/api/estantes/{id}` | `DIR-01`, `PAN-01` | `422` si tiene cajones. | ⏳ Pendiente |
| `GET` | `/api/estantes/{id}/contents` | Auth | Cajones con productos y unidades por nombre. | ⏳ Pendiente |
| `GET/POST/PATCH/DELETE` | `/api/zonas` | Auth / `DIR-01`, `PAN-01` | Zonas de la sala. | ⏳ Pendiente |
| `PATCH` | `/api/cajones/{id}` | `DIR-01`, `PAN-01` | Suma `estante_id`. | ⏳ Pendiente |

---

## 📋 Lista de tareas

### Fase 0 · Documentación
- [x] Plan en `docs/mapa-salas.md` con decisiones, arquitectura, fases y pruebas.
- [x] Este requisito y el prompt del backend.
- [x] Índice `TASKS/README.md`, `CLAUDE.md`, `AGENTS.md` y sección pendiente en `ENDPOINTS.md`.

### Fase 1 · Backend (`BackEnd-SGIA`)
- [ ] Migraciones: medidas en `locations`, tablas `zonas` y `estantes`, `cajones.estante_id`.
- [ ] Modelos, resources, form requests (límites, superposición, misma sala) y políticas por rol.
- [ ] Endpoints de la tabla y tests de feature.
- [ ] `ENDPOINTS.md` (front) actualizado a ✅.

### Fase 2 · Tipos y cliente (`packages/`)
- [ ] `packages/types/src/mapa-sala.ts` (`Zona`, `Estante`, `EstanteRotation`, `SalaMapa`, `EstanteContenido`, payloads) exportados en `index.ts`.
- [ ] `CajonEntity` con `estante_id` y `estante`; quitar el `estante_id` sin uso del payload de producto.
- [ ] `services/room-map.ts` con normalizadores tipados (sin `any`).
- [ ] `hooks/room-map.ts`: `useSalaMapa`, `useEstanteContenido`, `usePrefetchEstanteContenido`, mutaciones de estante y zona; `useUpdateEstante` optimista con vuelta atrás.
- [ ] Tests de servicio y del hook optimista.

### Fase 3 · Mapa en modo vista (`apps/web/src/features/mapa-salas/`)
- [ ] `lib/map-geometry.ts` (snap, clamp, rotación, superposición, zona por centro, primer hueco) con tests.
- [ ] Ruta `/ubicaciones/mapa/:locationId` con `React.lazy`, redirección desde `/ubicaciones/mapa`, permiso en `ROUTE_PERMISSIONS` (`PAN-01`, `DIR-01`, `AD-01`) y entrada «Mapa de salas» en `nav-config.ts`.
- [ ] `SalaSelector` en el `PageHeader`; última sala vista recordada en local (con `try/catch`).
- [ ] `SalaSvg`, `SalaWalls`, `ZonaShape`, `EstanteShape` con estilo «Trazo», líneas `non-scaling-stroke` y textos ≥ 12 px en pantalla (`useMapScale`).
- [ ] `EstanteContenidoDialog` con cajones, productos y unidades por nombre; vacío, carga y error.
- [ ] Lista alternativa «Estantes de la sala» bajo el mapa.
- [ ] Acceso «Ver mapa» por sala en `/ubicaciones`.
- [ ] Tests de dibujo y pop-up.

### Fase 4 · Edición
- [ ] Botón «Editar distribución» (solo `PAN-01`/`DIR-01`), rejilla de 50 cm.
- [ ] `useSvgDrag` (Pointer Events, `ref` + `requestAnimationFrame`, umbral de 4 px entre clic y arrastre).
- [ ] Al soltar: snap a 10 cm, validación, `zona_id` por centro y `PATCH` optimista; aviso y vuelta atrás si falla.
- [ ] Teclado (flechas, `Shift`, `R`, `Escape`) y `MovePad` para puntero táctil.
- [ ] `EstanteFormDialog` y `ZonaFormDialog` (RHF + Zod); el estante nuevo queda seleccionado en modo edición.
- [ ] Mover y redimensionar zonas.
- [ ] `SalaDimensionesDialog` y aviso de sala sin medidas.
- [ ] Selector de estante en `cajon-form-dialog.tsx` y aviso de cajones sin estante.
- [ ] Tests de arrastre, teclado y roles.

### Fase 5 · Pulido y cierre
- [ ] Zoom (botones, `Ctrl` + rueda, «Ajustar») y desplazamiento del fondo.
- [ ] Marcador de búsqueda («Buscar en la sala») y de stock crítico.
- [ ] Revisión a 320, 390, 768, 1024 y 1440 px en claro y oscuro.
- [ ] Prueba de fluidez con 200 estantes.
- [ ] Entrada en `FIXES/CHANGELOG-FIXES.md` y estado final en `TASKS/README.md`.

---

## 🧪 Pruebas requeridas

- [ ] `features/mapa-salas/lib/map-geometry.test.ts`
- [ ] Servicio y hook optimista en `packages/api-client`
- [ ] `features/mapa-salas/sala-svg.test.tsx`
- [ ] `features/mapa-salas/estante-contenido-dialog.test.tsx`
- [ ] `features/mapa-salas/mapa-sala-drag.test.tsx`
- [ ] `features/mapa-salas/mapa-sala-page.test.tsx`
