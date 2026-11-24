# Ubicaciones: todo de un vistazo (salas, plano y panel lateral de cajones)

**Estado: implementado (noviembre 2026).** Rama `feat/ubicaciones-distribucion`. Solo frontend (no cambia ningún endpoint). Pantalla `/ubicaciones` (solo `PAN-01`). Relacionado: `docs/mapa-salas.md` (REQ-22), `TASKS/REQ-05-UBICACION-FISICA.md`.

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
| 2 | **Responsivo por el ancho del área de trabajo** (no por el de la ventana, porque el menú lateral puede estar abierto, encogido o como cajón): <br>• **Angosto** (< 640 px): todo apilado y la página se desplaza; la sala se elige en un selector arriba del plano (con editar y eliminar al lado); el panel se abre como hoja (`Sheet`). <br>• **Medio** (640–939 px): columna de salas y plano; el panel se abre como hoja sobre el plano. <br>• **Ancho** (≥ 940 px): salas, plano y panel acoplado como tercera columna. <br>Para bajar de distribución el ancho debe quedar 24 px bajo el umbral (histéresis). Umbrales ajustados en la prueba real: con 720/1080 px un notebook de 1280 × 720 con el menú abierto (958 px de área) no veía el panel, y justo en 720 px la barra de desplazamiento hacía alternar las dos distribuciones. |
| 3 | En los modos medio y ancho, la pantalla ocupa el alto de la ventana (`100dvh` menos la barra superior de 56 px y el margen del marco), con un mínimo de 560 px: en ventanas más bajas la página se desplaza en vez de aplastar el plano. |
| 4 | **Panel**: en modo ancho parte **abierto** y recuerda lo que eligió el usuario (`localStorage` `sgia-ubicaciones-panel`); como hoja (medio y angosto) parte cerrado. El botón dice «Cajones (N)», con `aria-expanded` y `aria-controls`. |
| 5 | **Salas en una línea**: chip con el código y nombre; tipo y descripción en el `title` y en el texto para lector de pantalla. Editar y eliminar aparecen al pasar el mouse, con foco dentro de la fila, en la sala elegida y siempre en pantallas táctiles (`pointer-coarse`); ocultos no ocupan sitio, así el nombre usa todo el ancho. Búsqueda y filtro de tipo apilados en la columna. Columnas laterales de 208 y 288 px bajo 1100 px de área y de 240 y 320 px desde ahí. |
| 6 | **Plano que se ajusta solo**: el `<svg>` toma el mayor tamaño que cabe en su caja manteniendo la proporción de la sala (se mide la caja con `ResizeObserver`), así se ve la sala completa al elegirla o al cambiar el tamaño de la ventana y la escala de textos (`useMapScale`) vuelve a ser exacta. Zoom, «Ajustar» y «Buscar en la sala» siguen igual. En modo angosto la caja tiene la proporción de la sala con un máximo de 60 % del alto de la ventana. |
| 7 | **Tocar un estante filtra el panel** a sus cajones (y lo abre si estaba cerrado), en vez de abrir la ventana emergente. El estante queda resaltado en el plano. Arriba del panel aparece el estante con zona, cajones y elementos, y los botones **«Ver productos»** (abre la misma ventana de contenido de siempre, con «Editar» y «Asignar cajones») y **«Quitar filtro»**. En `/mapa-salas` el clic sigue abriendo la ventana emergente. |
| 8 | **Panel con dos pestañas** (Radix Tabs): **Cajones** (filtro de texto, una fila compacta por cajón: chip con el código completo, «Lleno», estante y descripción en la segunda línea, y las acciones marcar lleno, imprimir etiqueta y eliminar; «Nuevo cajón» al pie) y **Estantes** (la lista que hoy queda bajo el plano; tocar uno filtra la pestaña Cajones). La lista «Estantes de la sala» desaparece de debajo del plano en Ubicaciones. |
| 9 | **El plano y el panel conversan**: al pasar el mouse (o el foco) por un cajón de la lista se resalta su estante en el plano. |
| 10 | «Editar distribución» sigue en la barra del plano y abre el mismo editor. Ningún endpoint, permiso ni texto de acción cambia. |

## Diseño por pantalla

```
Ancho (≥ 940 px de área)
┌ PageHeader: Gestión de ubicaciones físicas y cajones ───── [Actualizar] [+ Nueva sala / pañol] ┐
├──────────────┬──────────────────────────────────────────────┬────────────────────┤
│ Salas (8)    │ Mapa de «Bodega Edificio E»                   │ [Cajones 14|Estantes 7]
│ [Buscar…]    │ − 100 % + Ajustar [Buscar en la sala]         │ Estante EST-A1 ×    │
│ [Tipo ▾]     │                 [Editar distribución][◧ Cajones]│ [Filtrar cajones…]  │
│▌BODEGAE Bod… │ ┌──────────────────────────────────────────┐ │ BODEGAE-A1-1  🖨 🗑   │
│ E301 Lab…    │ │            plano a la medida             │ │ Estante EST-A1      │
│ …            │ └──────────────────────────────────────────┘ │ [+ Nuevo cajón]     │
└──────────────┴──────────────────────────────────────────────┴────────────────────┘
   208/240 px                  flexible                           288/320 px

Medio (640–939 px): igual sin la tercera columna; «◧ Cajones» abre una hoja a la derecha.
Angosto (< 640 px): [Sala ▾][✎][🗑] · plano · «◧ Cajones» abre una hoja a pantalla completa.
```

## Componentes

- `features/mapa-salas/hooks/use-element-size.ts`: ancho y alto de un elemento con `ResizeObserver` antes de pintar (0 sin medida). Lo usan el plano y la página.
- `features/ubicaciones/lib/workspace-mode.ts`: `workspaceMode(width, previous?)` → `'stack' | 'split' | 'wide'` con histéresis (sin medida, `'wide'`); `hooks/use-workspace-mode.ts` guarda la anterior.
- `features/ubicaciones/lib/location-tipo.ts`: nombre del tipo de ubicación («Pañol», «Bodega»…).
- `features/ubicaciones/hooks/use-panel-preference.ts`: abierto/cerrado recordado en `localStorage`.
- `features/ubicaciones/components/salas-list.tsx`: columna de salas (filas de una línea) y `sala-select.tsx` para el modo angosto.
- `features/ubicaciones/components/ubicacion-panel.tsx`: pestañas Cajones/Estantes, filtro por estante y por texto; `cajon-row.tsx` es cada fila.
- `features/mapa-salas/components/sala-mapa-panel.tsx` suma props opcionales (no cambia `/mapa-salas`): `fit` (plano a la medida de su caja), `toolbarActions`, `onEstanteClick` (reemplaza el pop-up), `highlightEstanteIds`, `contentEstanteId` + `onContentEstanteChange` (pop-up de contenido controlado desde fuera) y `showEstantesList`.
- `features/mapa-salas/lib/fit-size.ts`: mayor tamaño con la proporción dada que cabe en una caja (`SalaSvg` recibe `size`).
- `features/mapa-salas/components/estantes-list.tsx` suma `collapsible` (por defecto `true`) para usarse sin `<details>` dentro del panel.

## Fases

1. [x] Plan y documentos (este archivo, `CLAUDE.md`, `TASKS/REQ-05`, `TASKS/REQ-22`).
2. [x] Plano a la medida (`use-fit-size`, `fit` en `SalaMapaPanel`) y props de integración del panel del mapa; tests.
3. [x] Página: modos por ancho, columna de salas, selector angosto, panel con pestañas acoplado u hoja, filtro por estante y resaltado; tests.
4. [x] Prueba en Chromium contra la API de desarrollo como `PAN-01`: 1440 × 900, 1280 × 720, 1024 × 768, 768 × 1024 y 390 × 844, claro y oscuro, con el menú lateral abierto y encogido, y con el layout de barra superior; sin desplazar la página en los modos medio y ancho y sin desplazamiento lateral en ninguno.

## Notas de implementación

- `cn` del proyecto no combina clases de Tailwind: para ganarle a una clase del componente base se usa el modificador `!` (`sm:min-w-0!` en `TableSearch`, `sm:max-w-sm!` en la hoja).
- Con `fit`, el `<svg>` va en posición absoluta y centrado dentro de una caja medida, así su tamaño no realimenta la medida; `useMapScale` vuelve a ser exacto porque el `<svg>` ya tiene la proporción de la sala.
- Tocar un estante en Ubicaciones llama a `onEstanteClick` (filtra el panel y lo abre); el pop-up de contenido se abre desde «Ver productos» con `contentEstanteId`. En `/mapa-salas` nada cambia. Como hoja, el panel se cierra antes de abrir el contenido o «Nuevo cajón» para no apilar dos capas.
- Los códigos de los estantes no se dibujan cuando el estante es más delgado que el texto (regla de `EstanteShape`, sin cambios); con planos de menos de ~600 px de ancho pasa en las salas de prueba. El panel y el resaltado siguen diciendo qué estante es.

### Prueba real (2026-11-24, `PAN-01`, API de desarrollo)

| Ventana | Menú | Distribución | Desplaza la página | Plano dentro de su caja |
|---|---|---|---|---|
| 1440 × 900 (claro y oscuro) | abierto | ancho | no | sí (554 × 358) |
| 1366 × 768 | abierto | ancho | no | sí (480 × 310) |
| 1280 × 720 | abierto / encogido | ancho / ancho | no | sí (394 × 255 / 586 × 379) |
| 1280 × 720 y 1440 × 900 | barra superior | ancho | no | sí |
| 1024 × 768 | abierto | medio | no | sí |
| 768 × 1024 | cajón | medio | no | sí |
| 390 × 844 (claro y oscuro) | cajón | angosto | no | sí |
| 320 × 640 | cajón | angosto | sí (apilado, esperado) | sí |

Sin desplazamiento lateral en ningún caso. Interacciones con mouse real (29/29): filtro al tocar un estante y resaltado, «Ver productos» y `Escape`, quitar filtro, resaltado al pasar por un cajón, pestaña Estantes, acciones de sala al pasar el mouse, cambio de sala que limpia el filtro, cerrar el panel (el plano crece) y recordarlo al volver, hoja filtrada a 1024 px, hoja a pantalla completa a 390 px sin desplazamiento lateral y «Nuevo cajón» desde la hoja. Sin errores en la consola.

## Cambio: panel solo de estantes desplegables (2026-11-24)

**Estado: implementado (noviembre 2026).** Rama `feat/ubicaciones-estantes-desplegables`. Lo pidió el usuario tras ver el panel con pestañas: «en vez de haber menú de cajones y de estantes, que salgan solo los estantes y al hacer clic en uno se desplieguen los cajones; los cajones sin hacer clic deben mostrar la cantidad de elementos y al hacer clic, un pop-up con la lista de elementos».

| # | Decisión (reemplaza la 8 y ajusta la 7) |
|---|---|
| 11 | **Sin pestañas.** El panel lista solo los **estantes** de la sala (código, nombre, «Zona · N cajones · N elementos», «Stock crítico»). Cada estante es un botón desplegable (`aria-expanded` + `aria-controls`, patrón *disclosure*); se abre **uno a la vez**. Si la sala tiene cajones sin estante, van al final en un grupo «Sin estante». |
| 12 | Al desplegar un estante se ven sus **cajones**: chip con el código completo, «Lleno» y **«N elementos»** (productos + unidades, la misma suma que `items_count` del estante en el backend) sin hacer clic. Las acciones de cada cajón (marcar lleno, imprimir etiqueta, eliminar) siguen en la fila. Al pie del estante, «Ver todo el estante» abre el pop-up de contenido de siempre (con editar y asignar cajones). |
| 13 | **Clic en un cajón → pop-up con sus elementos** (`CajonContenidoDialog`): productos con su cantidad y equipos/maquetas con sus unidades por estado, igual que en el pop-up del estante, más «Ver en inventario». Con estante se arma desde `GET /api/estantes/{id}/contents` (ya precargado al pasar el mouse por el estante); sin estante, desde `GET /api/products?cajon_id=` (no hay endpoint de contenido por cajón y no se agrega). |
| 14 | **Tocar un estante en el plano** despliega ese estante en el panel (y abre el panel o la hoja), lo lleva a la vista y lo resalta en el plano. Pasar el mouse por un estante o un cajón de la lista resalta su estante. |
| 15 | El botón de la barra del plano pasa a **«Estantes (N)»**. El filtro de texto del panel busca en estantes y cajones; con texto, se despliegan todos los estantes con coincidencias. |

Fases:
1. [x] Plan (esta sección) y `TASKS/REQ-05`.
2. [x] `CajonContenidoDialog` y la lista de elementos compartida con el pop-up del estante (`cajon-elementos.tsx`); tests.
3. [x] Panel de estantes desplegables (`estantes-panel.tsx`, `lib/estante-groups.ts`), botón «Estantes (N)», tocar en el plano despliega; tests.
4. [x] Prueba en Chromium contra la API de desarrollo (ancho, medio y teléfono).

Notas de implementación:
- «Elementos» de un cajón = insumos activos + unidades no dadas de baja (`Estante::scopeForMap` del backend: los equipos y maquetas se cuentan por unidad). Comparado con Postgres en los cinco cajones con contenido de PCENTRAL (8, 18, 13, 18 y 1): la fila y el total del pop-up coinciden con la base.
- La API pagina `GET /cajones` de a 15: la lista anterior se cortaba en salas con más de 15 cajones. Ahora los cajones de cada estante salen del plano (completo) y la lista se pide con `per_page=100` (máximo de la API) solo para descripciones y cajones sin estante.
- Radix devuelve el foco solo a su `Dialog.Trigger`; los modales y hojas abiertos desde código lo dejaban en `<body>`. `lib/use-return-focus.ts` lo devuelve a quien los abrió (en `Dialog` y `SheetContent`, para toda la app).
- El pop-up del cajón se abre encima de la hoja (teléfono y modo medio) y al cerrarlo la hoja sigue abierta en el mismo estante.
- Columnas laterales anchas desde 1100 px de área (antes 1200) para que el código completo del cajón quepa en el panel a 1440 px.
- Prueba real (26/26 + teclado 5/5): sin pestañas, uno a la vez, conteos contra la base, pop-up con su total, tocar en el plano despliega y resalta sin pop-up, «Ver todo el estante», Enter/Espacio/Tab y foco de vuelta al cerrar, hoja a 390 y 1024 px con el pop-up encima, sin desplazamiento lateral; códigos de cajón sin cortar a 1440, 1366, 1280 y 390 px.

## Fuera de alcance

- Cambios en `/mapa-salas` (pantalla propia del mapa) y en el editor de distribución.
- Arrastrar cajones entre estantes desde el panel.
- Cambios de backend o de permisos.
