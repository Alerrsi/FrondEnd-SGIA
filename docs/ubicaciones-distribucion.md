# Ubicaciones: todo de un vistazo (salas, plano y panel lateral de cajones)

**Estado: plan, sin implementar.** Rama `feat/ubicaciones-distribucion`. Solo frontend (no cambia ningún endpoint). Pantalla `/ubicaciones` (solo `PAN-01`). Relacionado: `docs/mapa-salas.md` (REQ-22), `TASKS/REQ-05-UBICACION-FISICA.md`.

## Problema

| Hoy | Problema |
|---|---|
| Dos columnas: salas (5/12 del ancho, 2 líneas por sala) y, a la derecha, el plano, la lista «Estantes de la sala» y debajo la grilla de cajones (tarjetas de 3–4 líneas). | Para ver la sala, su plano y sus cajones hay que bajar con la rueda del mouse. El usuario tuvo que achicar el navegador al 60 % para verlo todo. |
| El plano tiene `max-h-[55vh]` y ancho completo. | En una sala ancha queda chico; en una alta, el `<svg>` se encuadra dentro (`meet`) y la escala de los textos, calculada por el ancho, deja de ser exacta. |
| Al tocar un estante se abre una ventana emergente con su contenido. | Para ver los cajones de un estante hay que cerrarla y buscarlos en la grilla. |

## Decisiones (2026-11-24, recomendaciones aprobadas por el usuario)

| # | Decisión |
|---|---|
| 1 | **Tres columnas sin desplazar la página**: salas (columna angosta), plano (todo lo que sobra) y un **panel lateral** de cajones y estantes que se abre o cierra con un botón en la barra del plano. Cada columna se desplaza por dentro. |
| 2 | **Responsivo por el ancho del área de trabajo** (no por el de la ventana, porque el menú lateral puede estar abierto, encogido o como cajón): <br>• **Angosto** (< 720 px): todo apilado y la página se desplaza; la sala se elige en un selector arriba del plano (con editar y eliminar al lado); el panel se abre como hoja (`Sheet`). <br>• **Medio** (720–1079 px): columna de salas y plano; el panel se abre como hoja sobre el plano. <br>• **Ancho** (≥ 1080 px): salas, plano y panel acoplado como tercera columna. |
| 3 | En los modos medio y ancho, la pantalla ocupa el alto de la ventana (`100dvh` menos la barra superior de 56 px y el margen del marco), con un mínimo de 560 px: en ventanas más bajas la página se desplaza en vez de aplastar el plano. |
| 4 | **Panel**: en modo ancho parte **abierto** y recuerda lo que eligió el usuario (`localStorage` `sgia-ubicaciones-panel`); como hoja (medio y angosto) parte cerrado. El botón dice «Cajones (N)», con `aria-expanded` y `aria-controls`. |
| 5 | **Salas en una línea**: chip con el código y nombre; tipo y descripción en el `title` y en el texto para lector de pantalla. Editar y eliminar aparecen al pasar el mouse o con foco dentro de la fila, y siempre en pantallas táctiles (`pointer-coarse`). Búsqueda y filtro de tipo apilados en la columna. |
| 6 | **Plano que se ajusta solo**: el `<svg>` toma el mayor tamaño que cabe en su caja manteniendo la proporción de la sala (se mide la caja con `ResizeObserver`), así se ve la sala completa al elegirla o al cambiar el tamaño de la ventana y la escala de textos (`useMapScale`) vuelve a ser exacta. Zoom, «Ajustar» y «Buscar en la sala» siguen igual. En modo angosto la caja tiene la proporción de la sala con un máximo de 60 % del alto de la ventana. |
| 7 | **Tocar un estante filtra el panel** a sus cajones (y lo abre si estaba cerrado), en vez de abrir la ventana emergente. El estante queda resaltado en el plano. Arriba del panel aparece el estante con zona, cajones y elementos, y los botones **«Ver productos»** (abre la misma ventana de contenido de siempre, con «Editar» y «Asignar cajones») y **«Quitar filtro»**. En `/mapa-salas` el clic sigue abriendo la ventana emergente. |
| 8 | **Panel con dos pestañas** (Radix Tabs): **Cajones** (filtro de texto, una fila compacta por cajón: chip con el código completo, «Lleno», estante y descripción en la segunda línea, y las acciones marcar lleno, imprimir etiqueta y eliminar; «Nuevo cajón» al pie) y **Estantes** (la lista que hoy queda bajo el plano; tocar uno filtra la pestaña Cajones). La lista «Estantes de la sala» desaparece de debajo del plano en Ubicaciones. |
| 9 | **El plano y el panel conversan**: al pasar el mouse (o el foco) por un cajón de la lista se resalta su estante en el plano. |
| 10 | «Editar distribución» sigue en la barra del plano y abre el mismo editor. Ningún endpoint, permiso ni texto de acción cambia. |

## Diseño por pantalla

```
Ancho (≥ 1080 px de área)
┌ PageHeader: Gestión de ubicaciones físicas y cajones ───── [Actualizar] [+ Nueva sala / pañol] ┐
├──────────────┬──────────────────────────────────────────────┬────────────────────┤
│ Salas (8)    │ Mapa de «Bodega Edificio E»                   │ [Cajones 14|Estantes 7]
│ [Buscar…]    │ − 100 % + Ajustar [Buscar en la sala]         │ Estante EST-A1 ×    │
│ [Tipo ▾]     │                 [Editar distribución][◧ Cajones]│ [Filtrar cajones…]  │
│▌BODEGAE Bod… │ ┌──────────────────────────────────────────┐ │ BODEGAE-A1-1  🖨 🗑   │
│ E301 Lab…    │ │            plano a la medida             │ │ Estante EST-A1      │
│ …            │ └──────────────────────────────────────────┘ │ [+ Nuevo cajón]     │
└──────────────┴──────────────────────────────────────────────┴────────────────────┘
   224 px                      flexible                              320 px

Medio (720–1079 px): igual sin la tercera columna; «◧ Cajones» abre una hoja a la derecha.
Angosto (< 720 px): [Sala ▾][✎][🗑] · plano · «◧ Cajones» abre una hoja a pantalla completa.
```

## Componentes

- `features/ubicaciones/hooks/use-element-size.ts`: ancho y alto de un elemento con `ResizeObserver` (0 sin medida).
- `features/ubicaciones/lib/workspace-mode.ts`: `workspaceMode(width)` → `'stack' | 'split' | 'wide'` (sin medida, `'wide'`).
- `features/ubicaciones/hooks/use-panel-preference.ts`: abierto/cerrado recordado en `localStorage`.
- `features/ubicaciones/components/salas-list.tsx`: columna de salas (filas de una línea) y `sala-select.tsx` para el modo angosto.
- `features/ubicaciones/components/ubicacion-panel.tsx`: pestañas Cajones/Estantes, filtro por estante y por texto; `cajon-row.tsx` es cada fila.
- `features/mapa-salas/components/sala-mapa-panel.tsx` suma props opcionales (no cambia `/mapa-salas`): `fit` (plano a la medida de su caja), `toolbarActions`, `onEstanteClick` (reemplaza el pop-up), `highlightEstanteIds`, `contentEstanteId` + `onContentEstanteChange` (pop-up de contenido controlado desde fuera) y `showEstantesList`.
- `features/mapa-salas/hooks/use-fit-size.ts`: mayor tamaño con la proporción dada que cabe en una caja.
- `features/mapa-salas/components/estantes-list.tsx` suma `collapsible` (por defecto `true`) para usarse sin `<details>` dentro del panel.

## Fases

1. [ ] Plan y documentos (este archivo, `CLAUDE.md`, `TASKS/REQ-05`, `TASKS/REQ-22`).
2. [ ] Plano a la medida (`use-fit-size`, `fit` en `SalaMapaPanel`) y props de integración del panel del mapa; tests.
3. [ ] Página: modos por ancho, columna de salas, selector angosto, panel con pestañas acoplado u hoja, filtro por estante y resaltado; tests.
4. [ ] Prueba en Chromium contra la API de desarrollo como `PAN-01`: 1440 × 900, 1280 × 720, 1024 × 768, 768 × 1024 y 390 × 844, claro y oscuro, con el menú lateral abierto y encogido, y con el layout de barra superior; sin desplazar la página en los modos medio y ancho y sin desplazamiento lateral en ninguno.

## Fuera de alcance

- Cambios en `/mapa-salas` (pantalla propia del mapa) y en el editor de distribución.
- Arrastrar cajones entre estantes desde el panel.
- Cambios de backend o de permisos.
