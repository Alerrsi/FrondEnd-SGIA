# Mapa de salas (plano SVG con estantes arrastrables)

**Estado: fases 1 a 5 implementadas (20 nov 2026); fase 6 (mapa en Ubicaciones, edición en modal y datos de prueba) en plan, sin implementar.** Ver §11 y §12 al final. Rama `mapa-salas` en `FrondEnd-SGIA` y en `BackEnd-SGIA`. Requisito: [`TASKS/REQ-22-MAPA-SALAS.md`](../TASKS/REQ-22-MAPA-SALAS.md). **Contrato de la API (fuente de verdad): `BackEnd-SGIA/docs/mapa-salas.md`**; este documento cubre la pantalla. Solo web (`apps/web`); la app móvil no cambia.

---

## 1. Objetivo

Cada sala del pañol tiene un plano propio, dibujado en SVG, donde se ve su distribución: muros, zonas y estantes. El pañolero crea estantes y los arrastra a su lugar en la sala donde los creó. Al pulsar un estante se abre un pop-up con los elementos que guarda (productos y unidades de equipo, por nombre).

Referencia visual (imagen del pedido): «SALA 01» con muro de doble línea, «Zona A» con tres estantes verticales (EST-A1, EST-A2, EST-A3), «Zona B» y «Zona C» con dos estantes horizontales cada una; cada estante dividido en celdas; el estante seleccionado con borde de color y un punto marcador.

## 2. Situación actual

| Hoy | Consecuencia para el mapa |
|---|---|
| Jerarquía **Sala (`locations`) → Cajón (`cajones`)**. No existe «estante» ni «zona». | Hay que crear dos entidades nuevas en el backend. |
| El backend ya llama «cajón (estante)» al cajón en algún mensaje y el `barcode` antiguo era `EST-xxxxxxxx`. | El vocabulario se ordena: **estante** = mueble en el plano, **cajón** = compartimiento donde se guarda (lo que se escanea). |
| `locations` no tiene medidas; `cajones` no tiene posición. | Medidas de sala y posición de estantes son campos nuevos. |
| `/ubicaciones` es solo de `PAN-01` y `/inventario` de `PAN-01` y `DIR-01` (`features/auth/types/roles.ts`). | El mapa tiene ruta y permiso propios (`/mapa-salas`). «Ver mapa» desde `/ubicaciones` solo lo ve `PAN-01`; `DIR-01` y `AD-01` entran por el menú. |
| `/inventario` solo lee `?q=` de la URL. | «Ver en inventario» desde el pop-up necesita que la lista lea `?cajon_id=` (el filtro ya existe en `ProductoParams`). |
| Hasta octubre `/api/estantes` era un alias de cajones (retirado). | `/api/estantes` vuelve, pero como el mueble del plano. |
| `packages/types` ya declara un `estante_id?` suelto en el payload de producto, sin uso. | Se reemplaza por el tipo real o se elimina en la fase 2. |
| Los productos (insumos) tienen `cajon_id`; las unidades de equipo también. `GET /api/products?cajon_id=` y `GET /api/equipment-units?cajon_id=` existen. | El contenido de un estante se puede calcular, pero conviene un endpoint que lo entregue en una llamada. |

## 3. Decisiones

| # | Decisión | Motivo |
|---|---|---|
| 1 | **Nueva entidad `Estante`**: Sala → Estante → Cajón. El estante tiene posición y tamaño en el plano; los cajones se asignan a un estante (`cajones.estante_id`, opcional). | Elegido por el usuario. Las celdas del dibujo son los cajones reales del estante. |
| 2 | **Nueva entidad `Zona`**: rectángulo con nombre dentro de la sala, arrastrable y redimensionable. Un estante pertenece a lo sumo a una zona. | Elegido por el usuario. |
| 3 | **Roles:** `PAN-01` y `DIR-01` ven y editan; `AD-01` solo ve; `PRO-01` no ve el mapa. Sin restricción por pañol (igual que salas y cajones). | Elegido por el usuario. Coincide con quién puede crear cajones hoy. Ver riesgo R4. |
| 4 | **Unidades reales en centímetros enteros.** La sala mide `map_width_cm × map_height_cm`; cada estante y zona tiene `x`, `y`, `width`, `depth` en cm desde la esquina superior izquierda. El `viewBox` del SVG es la sala en cm. | El plano no depende de la pantalla; el mismo dato sirve a futuro para medir pasillos o imprimir a escala. |
| 5 | **Rejilla de 10 cm** para soltar (snap) y líneas de guía cada 50 cm (solo en modo edición). | Ordena el plano sin pedir precisión al usuario. |
| 6 | **Rotación 0° o 90°.** | La referencia solo tiene estantes horizontales y verticales; con dos valores la superposición se calcula con rectángulos alineados a los ejes. |
| 7 | **SVG propio, sin librerías** (ni de arrastre ni de diagramas). Arrastre con Pointer Events y `setPointerCapture`; conversión de coordenadas con `getScreenCTM().inverse()`. | Prioridad de velocidad del pedido; cero dependencias nuevas. |
| 8 | **Durante el arrastre no hay renders de React:** el `<g>` arrastrado se mueve escribiendo su `transform` en un `ref` dentro de `requestAnimationFrame`; React solo actualiza al soltar. | 60 fps con cientos de estantes. |
| 9 | **Guardado por cada soltar** (`PATCH /api/estantes/{id}`) con **actualización optimista** y vuelta atrás si la API responde error. No hay botón «Guardar distribución». | Menos estados intermedios; la API sigue siendo la fuente de verdad (valida límites y superposición). |
| 10 | **Clic sin movimiento = abrir pop-up**, en modo vista y en modo edición. Un movimiento de más de 4 px de pantalla es arrastre. | El pedido exige pop-up al pulsar el estante. |
| 11 | **Al soltar, la zona del estante se recalcula** según la zona que contiene su centro y se envía `zona_id` en el mismo `PATCH`. | El usuario no tiene que elegir zona a mano al mover. |
| 12 | **Superposición entre estantes no se permite**; fuera de los muros tampoco. El cliente lo impide al soltar (vuelve a su lugar con aviso) y la API lo rechaza con `422`. | Plano coherente con el espacio físico. Las zonas sí pueden contener estantes. |
| 13 | **El `barcode` del cajón no cambia** (`{sala}-{cajón}`). El estante tiene `codigo` propio (`EST-A1`, único por sala) solo para mostrar. | No invalida etiquetas ya impresas. |
| 14 | **Pop-up = `Dialog` `size="md"`** (hoja inferior bajo 640 px). Contenido cargado al abrir, con prefetch al pasar el puntero o enfocar. | Componente existente del sistema «Trazo». |
| 15 | **Ruta `/mapa-salas/:locationId`** (no `/ubicaciones/mapa`: anidada, el menú de `PAN-01` marcaba «Ubicaciones» y «Mapa de salas» a la vez), con `/mapa-salas` que redirige a la última sala vista (preferencia local) o a la primera. Entrada «Mapa de salas» en `nav-config.ts` y acceso «Ver mapa» por sala en `/ubicaciones`. | Un mapa por sala, URL compartible. |

## 4. Modelo de datos (contrato con el backend)

Detalle completo, validaciones, respuestas y mensajes en `BackEnd-SGIA/docs/mapa-salas.md`. Resumen:

```
locations  + map_width_cm (int, null)  + map_height_cm (int, null)
zonas      id, location_id, nombre, x, y, width, depth, created_by, updated_by, timestamps
estantes   id, location_id, zona_id (null), codigo, nombre (null), descripcion (null),
           x, y, width, depth, rotation (0|90), created_by, updated_by, timestamps
cajones    + estante_id (null)
```

Tipos en `packages/types/src/mapa-sala.ts` (nuevo):

```ts
export type EstanteRotation = 0 | 90;

export interface Zona {
  id: number;
  location_id: number;
  nombre: string;
  x: number; y: number; width: number; depth: number;
}

export interface EstanteCajonResumen {
  id: number;
  codigo: string;
  barcode: string | null;
  products_count: number;
  units_count: number;
}

export interface Estante {
  id: number;
  location_id: number;
  zona_id: number | null;
  codigo: string;
  nombre: string | null;
  descripcion: string | null;
  x: number; y: number; width: number; depth: number;
  rotation: EstanteRotation;
  cajones: EstanteCajonResumen[];
  items_count: number;
  has_critical_stock: boolean;
}

export interface SalaMapa {
  location: Pick<LocationEntity, 'id' | 'code' | 'nombre' | 'tipo'> & {
    map_width_cm: number;
    map_height_cm: number;
    /** `false` si la sala aún no tiene medidas: el backend entrega 1000 × 600 por defecto. */
    has_dimensions: boolean;
  };
  zonas: Zona[];
  estantes: Estante[];
  cajones_sin_estante_count: number;
}

export interface EstanteContenido { /* estante + cajones[] con productos[] y unidades agrupadas por producto */ }
```

## 5. Endpoints

| Método | Endpoint | Roles | Uso en el front |
|---|---|---|---|
| `GET` | `/api/locations/{id}/map` | Auth | Un solo pedido para dibujar la sala: medidas, zonas, estantes con sus cajones resumidos. |
| `PATCH` | `/api/locations/{id}` | `DIR-01`, `PAN-01` | Agrega `map_width_cm` y `map_height_cm` (100–10 000, siempre juntos). `422` en `map_width_cm` si al achicar queda un estante o zona afuera. |
| `GET` | `/api/estantes?location_id=` | Auth | Selector de estante en el formulario de cajón. |
| `POST` | `/api/estantes` | `DIR-01`, `PAN-01` | Crear estante. Sin `x`/`y`, la API lo ubica en el primer hueco libre. |
| `PATCH` | `/api/estantes/{id}` | `DIR-01`, `PAN-01` | Mover (`x`, `y`, `zona_id`), girar (`rotation`) o editar datos. `422` por límites o superposición. |
| `DELETE` | `/api/estantes/{id}` | `DIR-01`, `PAN-01` | `422` si tiene cajones. |
| `GET` | `/api/estantes/{id}/contents` | Auth | Pop-up: cajones del estante con productos y unidades por nombre. |
| `GET/POST/PATCH/DELETE` | `/api/zonas` | Auth / `DIR-01`, `PAN-01` | Zonas. Borrar una zona deja sus estantes sin zona. |
| `PATCH` | `/api/cajones/{id}` | `DIR-01`, `PAN-01` | Agrega `estante_id` (de la misma sala). |
| `GET` | `/api/cajones?estante_id=` / `?sin_estante=1` | Auth | «Asignar cajones» y aviso de cajones sin estante. |

## 6. Arquitectura en el front

### Paquetes

- `packages/types/src/mapa-sala.ts`: tipos de la sección 4 y payloads (`CreateEstantePayload`, `UpdateEstantePayload`, `CreateZonaPayload`, `UpdateZonaPayload`). Exportados en `index.ts`. `CajonEntity` suma `estante_id` y `estante`.
- `packages/api-client/src/services/room-map.ts`: `fetchSalaMapa`, `fetchEstantes`, `createEstante`, `updateEstante`, `deleteEstante`, `fetchEstanteContenido`, `createZona`, `updateZona`, `deleteZona`, con normalizadores tipados (sin `any`). `services/locations.ts` suma los filtros `estante_id` y `sin_estante` en `fetchCajones`.
- `packages/api-client/src/hooks/room-map.ts`: `salaMapaKeys`, `useSalaMapa`, `useEstanteContenido`, `usePrefetchEstanteContenido`, `useCreateEstante`, `useUpdateEstante` (optimista sobre `salaMapaKeys.detail(locationId)` con `onMutate`/`onError`/`onSettled`), `useDeleteEstante` y los equivalentes de zona. Las mutaciones invalidan además `cajonKeys` y `locationKeys`.

### Pantalla (`apps/web/src/features/mapa-salas/`)

```
pages/
  mapa-sala-page.tsx            ruta /mapa-salas/:locationId
  mapa-sala-index-redirect.tsx  /mapa-salas → última sala o primera
components/
  sala-selector.tsx             Select de salas en las acciones del PageHeader
  mapa-toolbar.tsx              Editar distribución · Nuevo estante · Nueva zona · zoom
  sala-svg.tsx                  <svg> raíz: viewBox, muro, rejilla, capas
  sala-walls.tsx                muro de doble línea
  map-grid-pattern.tsx          <pattern> de rejilla (solo en edición)
  zona-shape.tsx                rectángulo + nombre (+ tiradores en edición)
  estante-shape.tsx             rectángulo, celdas de cajones, código, foco, estado
  estante-contenido-dialog.tsx  pop-up con los elementos del estante
  estante-form-dialog.tsx       crear/editar estante (RHF + Zod)
  zona-form-dialog.tsx          crear/editar zona (RHF + Zod)
  sala-dimensiones-dialog.tsx   ancho × largo de la sala en metros
  move-pad.tsx                  flechas de movimiento para puntero táctil
hooks/
  use-svg-drag.ts               arrastre por Pointer Events con ref + rAF
  use-map-scale.ts              ResizeObserver → px por cm (tamaño de textos)
  use-map-viewport.ts           zoom y desplazamiento del viewBox
  use-last-sala.ts              preferencia local de la última sala (try/catch)
lib/
  map-geometry.ts               snap, clamp, rect rotado, superposición, zona por centro, primer hueco
  map-geometry.test.ts
  estante-form-schema.ts        Zod
```

Un componente o hook por archivo, como exige `CLAUDE.md`.

### Dibujo SVG (estilo «Trazo»)

| Elemento | Claro / oscuro (clases Tailwind sobre SVG) |
|---|---|
| Fondo de la sala | `fill-white dark:fill-zinc-900` |
| Muro | doble rectángulo, `stroke-zinc-300 dark:stroke-zinc-700`, 2 px exterior y 1 px interior, `vector-effect="non-scaling-stroke"` |
| Zona | `fill-zinc-50 dark:fill-zinc-950`, borde 1 px `stroke-zinc-200 dark:stroke-zinc-800`, nombre 13 px `fill-zinc-500` en tipo oración («Zona A») |
| Estante | `fill-white dark:fill-zinc-900`, borde 1 px `stroke-zinc-400 dark:stroke-zinc-600`, radio 4 px; celdas = cajones con líneas `stroke-zinc-200`; código en `font-code` |
| Estante seleccionado / foco | borde 2 px `stroke-accent` (burdeo, rosa en oscuro). El naranja de la referencia se traduce al acento único. |
| Marcadores | Fondo `fill-accent-soft` para el estante que contiene lo buscado; punto `fill-danger` si algún insumo del estante está en stock crítico (siempre con texto en el pop-up, la lista y el `aria-label`) |
| Estante que no cabe al soltar | borde `stroke-danger` mientras se arrastra sobre un lugar inválido |
| Rejilla de edición | líneas de 1 px `stroke-zinc-200/60` cada 50 cm |

- Todas las líneas con `vector-effect="non-scaling-stroke"` para que midan 1 px en cualquier zoom.
- **Textos legibles a cualquier escala:** `use-map-scale` mide el SVG con `ResizeObserver` y calcula el tamaño de letra en cm para que en pantalla nunca baje de 12 px. Si el código no cabe en el estante, se oculta y queda en el `aria-label` y en un `<title>`.
- Estantes verticales (rotación 90°) con el texto girado −90°, como en la referencia.
- Sin `filter`, sombras ni degradados en el SVG: es lo que más cuesta pintar.
- Movimiento según tokens: solo `transform`, `opacity` y colores; nada animado durante el arrastre; con `prefers-reduced-motion` no hay transición al volver a su lugar.

### Interacción

1. **Modo vista** (todos los roles con acceso): clic o `Enter` sobre un estante abre el pop-up.
2. **Modo edición** (`PAN-01`, `DIR-01`, botón «Editar distribución»): muestra la rejilla y los tiradores de zona.
   - `pointerdown` en un estante → lo selecciona y captura el puntero.
   - `pointermove` → delta en cm con la matriz inversa del SVG; el `transform` del `<g>` se escribe en el `ref` dentro de `requestAnimationFrame`; se marca inválido si se superpone o sale de la sala.
   - `pointerup` → si el movimiento total fue < 4 px, abre el pop-up; si no, ajusta a la rejilla, valida, calcula `zona_id` y llama a `useUpdateEstante` (optimista). Si es inválido o la API responde `422`, vuelve a su lugar y muestra el `message` con Sileo.
   - Teclado: estante enfocado + flechas mueve 10 cm (con `Shift`, 50 cm); `R` gira; el guardado se agrupa 400 ms después de la última tecla. `Escape` cancela un arrastre en curso.
   - Puntero táctil (`pointer-coarse`): `touch-action: none` sobre los estantes y `move-pad` con cuatro flechas de 44 px para el estante seleccionado.
3. **Crear estante:** «Nuevo estante» abre `estante-form-dialog` (código, nombre, zona opcional, ancho y fondo en cm, orientación). Al guardar, la API lo ubica en el primer hueco libre (o dentro de la zona elegida), el mapa entra en modo edición con ese estante seleccionado y un aviso indica «Arrástralo a su lugar». Un estante siempre pertenece a la sala del mapa donde se creó.
4. **Zonas:** «Nueva zona» igual que el estante; en edición se arrastran por su borde y se redimensionan con un tirador en la esquina inferior derecha.
5. **Zoom:** botones «Acercar», «Alejar» y «Ajustar»; `Ctrl` + rueda. Con zoom > 1, arrastrar el fondo desplaza. El zoom cambia el `viewBox`, no el CSS.
6. **Sala sin medidas:** aviso arriba del mapa con «Definir medidas» (`sala-dimensiones-dialog`, metros con un decimal; se envían en cm).

### Pop-up del estante (`estante-contenido-dialog.tsx`)

- Título «Estante EST-A2» (código en `font-code`) y nombre; descripción con la zona y la sala.
- Por cada cajón: chip `CODE_CHIP_CLASS` con el `barcode`, descripción y lista de elementos por **nombre**:
  - Insumo: nombre y cantidad (`font-mono`), `Badge` `danger` si está bajo el mínimo.
  - Equipo o maqueta: nombre y unidades por estado (`Badge`: disponible, prestado, en reparación; las dadas de baja no vienen).
- Estante sin cajones o cajones vacíos: `EmptyState`.
- Pie: «Ver en inventario» por cajón (lleva a `/inventario?cajon_id=`; solo `PAN-01` y `DIR-01`, que son quienes entran a inventario) y, para editores, «Editar estante» y «Asignar cajones» (lista de `GET /api/cajones?location_id=&sin_estante=1` y un `PATCH /api/cajones/{id}` con `estante_id` por cajón marcado). Cerrar con `DialogCloseButton`.
- Carga con `Loader2`; error con `ErrorState` y «Reintentar».

### Rendimiento

| Meta | Cómo |
|---|---|
| Primer dibujo de una sala en una llamada | `GET /api/locations/{id}/map` |
| 60 fps al arrastrar con 200 estantes | sin `setState` en `pointermove`; `React.memo` en `EstanteShape` y `ZonaShape` con comparación por id y posición |
| Pop-up instantáneo | prefetch de `contents` en `pointerenter`/`focus`, `staleTime` 30 s |
| Paquete | ruta con `React.lazy`; sin dependencias nuevas; objetivo < 15 kB gzip para el módulo |
| Sin trabajo extra en oscuro | colores por clase, sin recalcular el SVG al cambiar tema |

### Responsivo y accesibilidad

- 320 a 1440 px: el SVG ocupa el ancho del marco con `preserveAspectRatio="xMidYMid meet"`; la barra de herramientas se apila bajo 640 px.
- Cada estante es `<g role="button" tabIndex={0}>` con `aria-label` «Estante EST-A2, Zona A, 3 cajones, 12 elementos» y `<title>`. El SVG tiene `role="group"` y `aria-label` con el nombre de la sala.
- Alternativa en texto: bajo el mapa, una lista colapsable «Estantes de la sala» (código, zona, cajones, elementos) para lectores de pantalla y teléfonos pequeños; cada fila abre el mismo pop-up.
- Foco visible con anillo burdeo (borde 2 px `stroke-accent`); controles de 44 px con puntero táctil.

## 7. Fases

| Fase | Alcance | Repositorio | Listo cuando |
|---|---|---|---|
| **0** | Este plan, `REQ-22`, prompt del backend, índice y referencias. | Front | Commit en `mapa-salas`. |
| **1** | Migraciones, modelos, `RoomMapService`, endpoints y tests de `BackEnd-SGIA/docs/mapa-salas.md` (casillas en `BackEnd-SGIA/TASKS/Productos.md`, REQ-22). | `BackEnd-SGIA` | Tests del backend en verde; `ENDPOINTS.md` de ambos repos a ✅. |
| **2** | Tipos, servicios y hooks (con actualización optimista); `CajonEntity.estante_id`; quitar el `estante_id` suelto del payload de producto. Tests de servicios y del hook optimista. | Front | `pnpm typecheck` y tests en verde. |
| **3** | `map-geometry.ts` con tests; ruta, permiso, menú, selector de sala; dibujo SVG en modo vista; pop-up con contenido; lista alternativa; acceso «Ver mapa» desde `/ubicaciones`. | Front | Un `AD-01` ve el mapa y abre el pop-up; tests de componentes. |
| **4** | Modo edición: arrastre, teclado, `move-pad`, crear/editar/borrar estante y zona, redimensionar zona, medidas de sala, selector de estante en `cajon-form-dialog`, «Asignar cajones» y `?cajon_id=` en `/inventario`. | Front | `PAN-01` crea un estante y lo arrastra; recarga y queda donde lo dejó. |
| **5** | Zoom y desplazamiento, marcador de búsqueda y stock crítico, revisión a 320/390/768/1024/1440 en claro y oscuro, prueba con 200 estantes, `CHANGELOG-FIXES`, cierre de `REQ-22`. | Front | Checklist de `REQ-22` completo. |

Cada fase termina con `pnpm typecheck`, `pnpm lint` y `pnpm --filter @sgia/web test` en verde y un commit en español.

## 8. Pruebas

| Archivo | Qué prueba |
|---|---|
| `features/mapa-salas/lib/map-geometry.test.ts` | snap a 10 cm, clamp a la sala, rectángulo con rotación 90°, superposición (bordes que se tocan no cuentan), zona por centro, primer hueco libre. |
| `packages/api-client` (servicio y hook) | normalización de `/map` y `/contents`; `useUpdateEstante` aplica el cambio antes de la respuesta y lo revierte con `422`. |
| `features/mapa-salas/sala-svg.test.tsx` | dibuja zonas y estantes con su código; textos ocultos si no caben; estantes verticales giran el texto. |
| `features/mapa-salas/estante-contenido-dialog.test.tsx` | clic en estante abre el pop-up con los nombres de productos y unidades; vacío y error. |
| `features/mapa-salas/mapa-sala-drag.test.tsx` | arrastre simulado con `pointerdown/move/up` y `getScreenCTM` simulado (jsdom no lo implementa): envía `PATCH` con `x`, `y` ajustados y `zona_id`; clic sin movimiento no envía `PATCH`; soltar encima de otro estante vuelve atrás. |
| `features/mapa-salas/mapa-sala-page.test.tsx` | `AD-01` no ve «Editar distribución»; `PAN-01` y `DIR-01` sí; teclado mueve y guarda; sala sin medidas muestra el aviso. |

## 9. Riesgos y preguntas abiertas

| # | Riesgo | Mitigación |
|---|---|---|
| R1 | Cajones existentes quedan sin estante. | `cajones_sin_estante_count` en el mapa con un aviso «N cajones sin estante · Asignar»; asignación desde el pop-up o desde `/ubicaciones`. |
| R2 | jsdom no implementa `getScreenCTM` ni `ResizeObserver`. | La conversión vive en `map-geometry.ts` y recibe la matriz; en tests se inyecta una matriz identidad. |
| R3 | Dos personas mueven el mismo estante a la vez. | Gana el último `PATCH`; `onSettled` refresca el mapa. Sin bloqueo por ahora. |
| R4 | `AD-01` hoy no entra a inventario ni a ubicaciones («recorte de AD-01»); darle lectura del mapa abre un acceso nuevo. | Elegido así; es una línea en `ROUTE_PERMISSIONS` si se decide quitarlo. |
| R5 | Salas muy grandes o estantes muy chicos dejan textos ilegibles. | Ocultar textos que no caben y usar zoom; el `aria-label` y la lista alternativa siempre tienen el dato. |
| R6 | La app móvil no muestra el mapa. | Fuera de alcance: el móvil es solo de `PRO-01`, que no ve el mapa. |
| R7 | `PAN-01` de un pañol puede editar el mapa de salas de otro pañol. | Igual que salas y cajones hoy; si se limita, se hace para las tres entidades a la vez. |

## 10. Fuera de alcance

Formas no rectangulares de sala, puertas y ventanas, rotaciones libres, varios pisos en un mismo plano, etiqueta imprimible del estante, edición simultánea en tiempo real y el mapa en la app móvil.

## 11. Diferencias con lo planificado (implementación, 20 nov 2026)

| Plan | Implementado | Motivo |
|---|---|---|
| Ruta `/ubicaciones/mapa/:locationId` | `/mapa-salas/:locationId` | Anidada, el menú de `PAN-01` marcaba «Ubicaciones» y «Mapa de salas» a la vez. |
| Punto `fill-accent` para lo buscado | Fondo `fill-accent-soft` | El punto burdeo y el rojo de stock crítico no se distinguían. |
| Búsqueda en la sala | Código o nombre del estante, código del cajón y productos por `GET /api/products?search=&location_id=` (su cajón registrado) | No hay endpoint de búsqueda por sala; una unidad de equipo guardada en otra sala que la de su producto no se encuentra por nombre. `useProducts` suma `enabled`. |
| Nombre de la zona arriba | Arriba, o abajo si un estante ocupa la franja superior | Como «Zona B» en la referencia. |
| Mover una zona | La zona se mueve sola; sus estantes quedan donde están | Es un rectángulo de referencia; la API no relaciona posición de zona y estante. Al soltar un estante se recalcula su zona. |
| «Ver en inventario» filtrado por sala y cajón | `/inventario?cajon_id=` (`fetchProducts` ahora envía `cajon_id`) | El filtro por cajón alcanza; el chip «Quitar filtro» lo limpia. |
| `AD-01` en el menú | `AD-01` ve «Mapa de salas» (solo lectura) | Decisión 3; `layout-shell.test.tsx` actualizado. |

**Archivos:** `apps/web/src/features/mapa-salas/` (`components/`, `hooks/`, `lib/`, `pages/`, tests), `packages/api-client/src/{services,hooks}/room-map.ts`, `packages/types/src/mapa-sala.ts`; cambios menores en `ubicaciones-page.tsx` («Ver mapa»), `cajon-form-dialog.tsx` (estante), `productos-list-page.tsx` (`?cajon_id=`), `roles.ts`, `nav-config.ts` y `app.tsx`.

**Verificación:** 95 archivos de test (561 + 1 omitida) en verde; typecheck y lint de web sin errores. Revisión visual a 320, 390, 768, 1024 y 1440 px en claro y oscuro con datos de prueba (Chromium con emulación de dispositivo). **Recorrido de punta a punta contra la API real** (Chromium, mouse y teclado reales, login de desarrollo): PAN-01 crea zona y estante, lo arrastra (guarda ajustado a 10 cm y recalcula la zona), persiste al recargar, soltar fuera de la sala no guarda, flechas mueven 10 cm, «Asignar cajones» ofrece solo los cajones sueltos de la sala (la API rechaza uno de otra sala con 422), búsqueda y zoom; AD-01 solo lee (403 al escribir) y DIR-01 edita; 30/30 comprobaciones, sin errores en consola. Encontró un cajón repetido en «Asignar cajones» mientras se refrescaban las listas (corregido).

## 12. Fase 6 · Mapa en Ubicaciones, edición en modal y datos de prueba (plan, 20 nov 2026, sin implementar)

### Pedido

El mapa debe verse en Ubicaciones, al costado de la lista de salas. Editar la distribución abre un modal que sigue el sistema «Trazo». Todas las salas deben quedar con estantes y cajones asignados como datos de prueba.

### Decisiones (usuario, 20 nov 2026)

| # | Decisión |
|---|---|
| 16 | **Ubicaciones (`PAN-01`)**: salas a la izquierda; a la derecha, el mapa de la sala elegida (modo vista: zoom, búsqueda, pop-up) y debajo la lista de cajones que ya existe. Se quita «Ver mapa» de cada fila: el mapa ya está en la misma pantalla. |
| 17 | **La edición va en un modal**: «Editar distribución» abre `Dialog` `size="2xl"` (hoja inferior a pantalla completa bajo 640 px) con barra Medidas · Nueva zona · Nuevo estante, rejilla, arrastre, teclado y `MovePad`; pie con `DialogCloseButton` «Listo». Los formularios (estante, zona, medidas, asignar cajones) se abren encima. El plano de afuera queda solo para mirar. Vale igual en `/mapa-salas`. |
| 18 | **`/mapa-salas` solo para `DIR-01` y `AD-01`** (`ROUTE_PERMISSIONS` y menú). `PAN-01` usa Ubicaciones. `DIR-01` edita con el mismo modal; `AD-01` solo mira. |
| 19 | **Datos de prueba en las 8 ubicaciones** con un seeder repetible del backend (`MapaSalasDemoSeeder`, contrato en `BackEnd-SGIA/docs/mapa-salas.md`): medidas por tipo, zonas A/B/C como la referencia, siete estantes y todos los cajones asignados; crea cajones donde no hay. No pisa lo que ya existe (respeta `EST-1` de `PCENTRAL`). |

### Diseño

- **`SalaMapaPanel`** (nuevo, `components/sala-mapa-panel.tsx`): lo que hoy arma `MapaSalaPage` para mirar el plano (barra de zoom y búsqueda, avisos, SVG en modo vista, lista «Estantes de la sala», pop-up). Recibe `locationId`, `canEdit`, `canSeeInventory` y un `variant` (`page` | `embedded`: en Ubicaciones va en una celda con su título y un alto menor). Si `canEdit`, muestra «Editar distribución».
- **`SalaMapaEditorDialog`** (nuevo): la edición que hoy vive en la página (rejilla, arrastre de estantes y zonas, teclado, `MovePad`, crear/editar/borrar, medidas, asignar cajones) dentro del modal. Reusa `useSvgDrag`, `useEstanteKeyboard`, `useMapViewport` y los diálogos existentes.
- **`Escape` dentro del modal**: mientras se arrastra cancela el arrastre y, con un estante seleccionado, lo deselecciona; solo sin nada de eso cierra el modal. `Dialog` suma la prop opcional `onEscapeKeyDown` (se llama antes de su lógica de cambios sin guardar).
- **Cierre del modal con un movimiento de teclado pendiente**: se guarda al cerrar (no se pierde la espera de 400 ms).
- **`MapaSalaPage`** (`/mapa-salas`): `PageHeader` + selector + `SalaMapaPanel`.
- **Ubicaciones**: la columna derecha pasa a `SalaMapaPanel variant="embedded"` + cajones. Cada cajón muestra su estante (`EST-A1`) si tiene.

### Fases

| Fase | Alcance | Repo | Listo cuando |
|---|---|---|---|
| 6.0 | Este plan, REQ-22, docs del backend. | Ambos | Commit. |
| 6.1 | `MapaSalasDemoSeeder` con test; se corre en la base de desarrollo. | Backend | Test en verde; las 8 ubicaciones con estantes y cajones asignados. |
| 6.2 | `SalaMapaPanel`, `SalaMapaEditorDialog`, `onEscapeKeyDown` en `Dialog`, `/mapa-salas` para `DIR-01`/`AD-01`. | Front | Tests de panel, modal (arrastre, teclado, `Escape`) y roles en verde. |
| 6.3 | Mapa en Ubicaciones; estante en la lista de cajones. | Front | Tests de Ubicaciones en verde. |
| 6.4 | Recorrido de punta a punta contra la API real (PAN-01 en Ubicaciones, DIR-01 y AD-01 en `/mapa-salas`), capturas a 390 y 1440 px, cierre de docs. | Ambos | Recorrido completo sin fallas. |

