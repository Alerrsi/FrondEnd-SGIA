---
name: sgia-design
description: Diseño visual de la UI de SGIA (web). Usar al crear o modificar componentes, pantallas, tablas, formularios, gráficos o badges en apps/web.
---

# SGIA · Sistema de diseño «Trazo»

Interfaz del panel web de SGIA (INACAP Sede Temuco). Referencia de distribución: zed.dev (marco con líneas de 1px, celdas que comparten bordes, cabecera fija con atajos). Plan e historia de decisiones: `docs/rediseno-interfaz.md`. Este archivo es la regla; ante una duda, manda el código de `apps/web/src/components/ui/`.

Objetivo: que todo se encuentre en pocos clics, se lea igual en cada pantalla y funcione de 320 a 1440 px.

## 1. Stack

React 19 + TypeScript estricto (sin `any`), Tailwind v4 con tema por clase (`dark:`), Radix (Dialog, DropdownMenu, Select, Tabs, Tooltip), Lucide, TanStack Table, React Hook Form + Zod, avisos propios (`toast` de `@/lib/toast`, `components/ui/toaster.tsx`), TanStack Charts (`@tanstack/charts`, SVG) para gráficos. Sin librerías de animación.

## 2. Tokens (`apps/web/src/index.css`, `packages/design-tokens/src/theme.css`)

### Color
La interfaz es 90–95 % neutra. Se sigue escribiendo `zinc-*`: la escala está redefinida a neutros cálidos.

| Uso | Claro | Oscuro | Clase |
|---|---|---|---|
| Canvas | `#F6F5F2` | `#131210` | `bg-zinc-50 dark:bg-zinc-950` |
| Superficie (paneles, celdas, modales) | `#FFFFFF` | `#1B1A17` | `bg-white dark:bg-zinc-900` |
| Superficie alterna (menú lateral, cabeceras) | `#EFEDE8` | `#22211E` | `bg-zinc-100 dark:bg-zinc-900` |
| Línea de 1px | `#E2DFD8` | `#2E2C28` | `border-zinc-200 dark:border-zinc-800` |
| Tinta | `#1B1A17` | `#F2F0EB` | `text-zinc-900 dark:text-zinc-100` |
| Texto secundario (AA) | `#5F5B53` | `#A19C92` | `text-zinc-500 dark:text-zinc-400` |
| **Acento único** | burdeo `#6B1729` | rosa `#E8A3B1` | `bg-accent text-accent-ink`, `text-accent`, `bg-accent-soft` |

Estados (siempre con texto o icono, nunca solo color): `text-ok bg-ok-bg` (disponible), `text-info bg-info-bg` (en préstamo), `text-warn bg-warn-bg` (mantención, vence pronto), `text-danger bg-danger-bg` (crítico, error, destructivo). Prohibido escribir `red-*`, `rose-*`, `emerald-*`, `amber-*`, `blue-*`, `sky-*` para estados. **Nunca violeta ni lavanda.** El burdeo no es un estado: es el botón principal, el foco, el ítem activo y la serie principal de un gráfico. Etiqueta crema (`bg-tag text-tag-ink`) solo en chips de código.

### Forma
Radios 4 / 6 / 8 px (`rounded-sm` chip, `rounded-md` control y celda, `rounded-lg` panel y modal). Botones en pastilla (`rounded-full`). Sin sombras salvo modal y menú desplegable; sin `backdrop-blur`.

### Tipografía
Geist (interfaz) y Geist Mono, alojadas con `@fontsource-variable`. `font-mono` es Geist con cifras tabulares (montos, fechas, cantidades). `font-code` es Geist Mono, **solo** para identificadores: SKU, Code128, serial, RUT, N° de factura, `SC-…`, OC, cajón.

| Nivel | Componente o clase | Estilo |
|---|---|---|
| Saludo de inicio | `HomeHero` | 26/32 → 32/40, 500, -0.035em |
| Título de página (h1 único) | `PageHeader` / `PageHeading` | 20 → 24 px, 500, -0.02em; subtítulo 14 px obligatorio |
| Título de sección o celda | `SectionTitle` | 15 px, 500 |
| Rótulo de bloque | `SectionLabel` | 13 px, 500, secundario |
| Cabecera de tabla / etiqueta de campo | `TH_CLASS`, `TABLE_HEAD_CLASS`, `FIELD_LABEL_CLASS` | 13 px, 500 |
| Cifra | `Metric` | 24 → 28 px, 500, tabular |
| Texto | — | 14 px (13 px secundario) |

Pesos 400 y 500; 600 solo en cifras destacadas; **nunca 700**. Nada bajo 12 px (`text-xs` es el mínimo). Tipo oración siempre: sin `uppercase` ni `tracking-wider`.

### Movimiento
Tokens `--m-in` 150 ms, `--m-out` 120, `--m-press` 90, `--m-panel` 200, `--m-close` 120, `--m-slide` 240; curva `--ease` `cubic-bezier(.2,.8,.2,1)`, sin rebote. Solo `transform`, `opacity` y colores; nunca ancho, alto ni márgenes. Clases: `ui-press` (botón sube 1px y se hunde al pulsar), `ui-overlay`, `ui-dialog`, `ui-sheet-*`, `ui-menu`, `ui-tip`, `ui-enter` (solo la bienvenida de Inicio, una vez). Nada se anima al hacer scroll; sin `animate-pulse`/`ping`/`bounce` (solo `Loader2 animate-spin` mientras algo carga). Única animación continua permitida: el nombre del saludo de Inicio, que se escribe, se borra y se vuelve a escribir con un guion bajo burdeo como cursor (`ui-caret`, `docs/saludo-animado.md`); con movimiento reducido queda fijo. Esqueletos sin brillo. Con `prefers-reduced-motion` todo queda quieto.

## 3. Layout y navegación (`apps/web/src/layouts/`)

- **Fuente única del menú:** `nav-config.ts` (`navForRole`, `screensForRole`, `findScreen`, `quickActionsForRole`). Lo leen sidebar, header, buscador, migas e Inicio. Permisos desde `ROUTE_PERMISSIONS`.
- **Dos layouts**, elegidos en Ajustes (`useLayoutPreference`, `localStorage` `sgia-layout`): `SidebarLayout` (por defecto) y `HeaderLayout`.
- **Sidebar:** neutro, ítem activo con superficie y barra burdeo de 2px. Desde 1024 px fijo, se encoge a riel y se redimensiona (`col-resize`). Bajo 1024 px es un cajón. **Regla dura:** encogido, el `IconBar` es siempre vertical (`axis="column"`, 48 px).
- **Header:** 56 px fijo, 5 ítems + «Más», Compras y «Más» abren un panel; menú a pantalla completa bajo 1024 px.
- **Marco de contenido** (`ContentFrame`): columna de hasta 1280 px con líneas laterales desde 1024 px. Cada pantalla con `React.lazy`.
- **Buscador `Ctrl K`** (pantallas y acciones del rol), **`?`** lista de atajos, **`/`** búsqueda de la tabla, teclas de Inicio por rol (`M`, `N`, `U`). Los atajos no actúan dentro de campos. Junto a cada acción con atajo va su `Kbd`.
- **Migas de pan** en la barra superior del layout con sidebar.

## 4. Componentes (`apps/web/src/components/ui/`)

| Necesidad | Usar | Nunca |
|---|---|---|
| Cabecera de página | `PageHeader` (`icon`, `title`, `description`, `actions`) | bloques `flex justify-between` a mano |
| Botón | `Button` `primary` (uno por vista) / `secondary` / `ghost` / `danger`; `size` `sm`,`md`,`lg`,`icon` | colores o alturas por `className` |
| Botón de icono en fila | `ICON_BUTTON_CLASS` + `aria-label` | `h-7 w-7` sueltos |
| Tabla | `TableFrame` (`toolbar`, `mobile`, `footer`, `maxHeight`) + `TableToolbar` + `TableSearch` + `TH_CLASS`/`TD_CLASS`/`ROW_CLASS`/`STICKY_COL_CLASS` | barra de filtros en una caja aparte |
| Fila en teléfono | `MobileRow` dentro de `TableFrame mobile` | ocultar columnas con CSS |
| Cifras | `Metric` dentro de `CellGrid`/`Cell` | tarjetas KPI de 150 px de alto |
| Accesos / pendientes | `CellGrid` + `Cell` (bordes compartidos) | tarjetas sueltas con `gap` |
| Estado | `Badge` `tone` | `<span>` coloreado a mano |
| Vacío / error | `EmptyState` / `ErrorState` | cajas rojas a mano |
| Campo | `FORM_CONTROL_CLASS`, `FILTER_CONTROL_CLASS`, `FIELD_LABEL_CLASS` | estilos de campo propios |
| Chip de código | `CODE_CHIP_CLASS` | `font-mono` en un SKU |

- **Tablas densas:** TanStack Table donde haya orden/paginación. Una acción directa por fila; el resto en `DropdownMenu` (`MoreHorizontal`). Densidad cómoda/compacta en Ajustes (`data-density`).
- **Modales (`Dialog`, obligatorio):** prop `size` (`sm` 448, `md` 512, `lg` 672, `xl` 768, `2xl` 1024), sin `max-w`/`max-h`/`overflow` en `className`; raíz `flex flex-col gap-4`; `DialogFooter` último hijo con `DialogCloseButton` y la acción principal. Bajo 640 px el modal es una hoja inferior a ancho completo y los botones del pie se apilan. Si hay datos escritos, cerrar pide confirmación (`hasUnsavedChanges`). Nunca `window.confirm()`.
- **Paneles laterales (`Sheet`):** para fichas y operaciones de mesón sin perder la tabla; pantalla completa bajo 640 px; ya hacen scroll.
- **Avisos (`toast` de `@/lib/toast`):** escaneo, stock crítico, operación completada, error de red. Aspecto de sileo (píldora `#1a1a1a`/`#f2f2f2`, ícono en círculo y título en el color del estado; tarjeta si hay descripción). Suenan al aparecer, se ponen rojos con el ícono convertido en basurero al pasar el mouse y se quitan con clic; títulos en tipo oración (`docs/avisos-emergentes.md`).
- **Escáner Code128:** listener de ráfagas que terminan en `Enter` en las vistas de mesón; el campo de escaneo usa `font-code`.
- **Tema:** `Toggle` (CSS) en el sidebar expandido; botón sol/luna en el riel encogido.

## 5. Gráficos (`apps/web/src/lib/chart-theme.ts`)

Todo gráfico (TanStack Charts, `@tanstack/charts/react`) toma de ahí tema (`chartTheme`), ejes (`categoryAxis`, `valueAxis`, `integerTicks` para conteos), rejilla y animación; el tooltip se estila con las variables `--ts-chart-tooltip-*` de `index.css` y la leyenda es HTML (`ChartLegend`). Serie única en el acento; segunda medida en neutro; estados con sus tonos. Paleta categórica de 6 (validada con el skill `dataviz`), en orden fijo, sin reciclar: desde la sexta porción, «Otros». Leyenda arriba a la izquierda en todo gráfico de categorías; rejilla solo en el eje de valores; un solo eje Y. Datos de analítica siempre por GraphQL (`POST /api/metrics`).

## 6. Responsivo y accesibilidad

- De 320 a 1440 sin scroll lateral de página. Grillas `grid-cols-1 sm:…`, nunca columnas fijas. Barras de controles apiladas bajo 640 px; acciones de cabecera a ancho completo en el teléfono.
- Controles de 44 px con puntero táctil (`pointer-coarse:`), ya incluidos en `Button`, campos e íconos de fila.
- Foco visible: anillo burdeo de 2 px, sin transición. Enlace «Saltar al contenido». Un h1 por pantalla, títulos en orden. Todo botón de icono con `aria-label`; íconos decorativos `aria-hidden`.
- Texto que se lee: 4,5:1 como mínimo (`zinc-400` en claro es solo decorativo).

## 7. App móvil (`apps/mobile`, solo PRO-01)

Mismo lenguaje que el web (color, tipo, líneas de 1 px, radios), con controles nativos donde corresponde. Plan e historia: `docs/rediseno-movil.md`.

- **Tokens:** `src/theme/` lee las paletas claro/oscuro de `@sgia/design-tokens` (`themes`). Se usan con `useTheme()`; ningún archivo fuera de `src/theme/` escribe un hex, un `fontSize` ni un radio. Modo oscuro según el sistema.
- **Tipo:** Geist y Geist Mono con `@expo-google-fonts` (el peso va en `fontFamily`, nunca `fontWeight`). `ThemedText variant` = `hero`, `title`, `subtitle`, `section`, `label`, `body`, `bodyMedium`, `secondary`, `caption`, `metric`, `code`, `codeSmall`; `tone` = color de la paleta.
- **Componentes (`src/components/ui/`):** `Screen` + `ScreenHeader` en cada pestaña; `Section` (superficie, borde 1 px, radio 8, sin sombra) con `Row` para listas; `Field` + `TextField`/`SelectField`/`MultiSelectField`/`DateField` (estilo único `controlStyle`); `Button` en pastilla de 44 px (`primary` uno por pantalla); `Badge tone`; `CodeChip` para códigos; `StateMessage` para carga/vacío/error; `SheetHeader` en las hojas (`Modal` `pageSheet`).
- **Menú:** barra de iconos inferior (`icon-tab-bar.tsx`) con el lenguaje del riel del sidebar encogido: pozo en superficie con borde de 1 px y radio 16, indicador `surfaceAlt` con borde que se desliza (240 ms, sin rebote, quieto con «reducir movimiento»). Solo iconos Lucide con `accessibilityLabel`; el nombre de la pantalla va en su `ScreenHeader`.
- **Firma:** siempre papel blanco con tinta grafito (`signaturePaper`), también en oscuro.

