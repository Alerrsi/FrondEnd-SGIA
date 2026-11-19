# Rediseño de la interfaz web «Trazo»

**Estado: plan, sin implementar (19 nov 2026).** Rama `feat/rediseno-zed` en `FrondEnd-SGIA`. Solo frontend web (`apps/web`); la app móvil y el backend no cambian. Seguimiento en `TASKS/REQ-DISEÑO.md` (sección «Rediseño Trazo»).

Plan escrito con el skill `design-taste-frontend` (tasteskill 2.5). Ese skill está hecho para sitios de empresa; aquí se usan su sistema de tokens, tipografía, botones, formularios, movimiento, accesibilidad y presupuesto de rendimiento. Lo que es solo de páginas de marketing (fotografías, una sección por pantalla, «momentos», efectos de shader) no aplica a un panel de operación y queda fuera (ver «Fuera de alcance»).

---

## 1. Problema

| Hoy («Pañol») | Problema |
|---|---|
| Menú navy, canvas slate frío, acento burdeo, etiqueta crema y 7 paletas alternativas (una lavanda) que tiñen solo partes de la interfaz. | Varias superficies de color compiten; las paletas alternativas producen combinaciones que no se diseñaron. |
| Schibsted Grotesk en interfaz y Geist Mono en chips. | Dos familias con trabajos que se cruzan (`font-mono` apunta a Schibsted). |
| Una sola forma de navegar: sidebar redimensionable. | No hay búsqueda de pantallas ni atajos: llegar a una página depende de conocer el menú. |
| `/` es la misma portada para los 4 roles, con tarjetas de tareas y una grilla de accesos. | Cada rol trabaja distinto (mostrador, compras, administración, pedidos), pero ve la misma estructura. |
| Rutas sin `React.lazy`; Chart.js entra en el paquete inicial. | El primer render carga código de todas las pantallas. |
| Modales centrados en todos los anchos; tablas con scroll horizontal sin columna fija. | En 390px los modales largos y las tablas anchas son incómodos. |

## 2. Referencia: qué se toma de zed.dev

Revisado en `zed.dev`, `/pricing`, `/blog` y `/docs` (HTML y CSS del 19 nov 2026).

| Rasgo de zed.dev | Cómo se traduce a SGIA |
|---|---|
| Columna central enmarcada (`max-w` ~1080px) con bordes verticales de 1px y secciones separadas por líneas horizontales (`divide-y`). | El área de contenido es un **marco**: borde a izquierda y derecha, bloques separados por una línea de 1px, sin sombras ni tarjetas flotando sobre el canvas. |
| Celdas que comparten bordes (`divide-x`/`divide-y`, sin separación entre celdas). | Componente `CellGrid`: las tarjetas de inicio, métricas y accesos son celdas de una misma grilla con líneas compartidas, no cajas sueltas con espacio entre ellas. |
| Cabecera fija de 57px, fondo opaco, línea inferior, enlaces a la izquierda y acciones con atajo de teclado visible («Sign up `S`», «Download `D`»). | Cabecera de 56px igual en ambas versiones del layout, con atajos visibles en `Kbd` (`Ctrl K` búsqueda, `N` nuevo, `/` filtrar). |
| Neutros cálidos (crema, «offgray»), un solo color de acento (azul) para enlaces, foco y la banda del pie. | Neutros cálidos papel/grafito; el **burdeo institucional** es el único acento: botón principal, foco, enlaces, estado activo y series principales de gráficos. |
| Mockup de la app como contenido principal: paneles con línea de 1px, texto 11–13px, filas de 24px, listas densas. | Las tablas, listas y paneles laterales siguen esa densidad: filas de 36px, cabeceras de 13px, iconos de 14–16px. |
| Separadores punteados dentro de una tarjeta, entre título y descripción. | Una sola línea discontinua: separa cabecera y cuerpo dentro de una celda. En ningún otro lugar. |
| Transiciones de 150ms con curva de salida. | Tokens de movimiento del skill (sección 7). |

**No se copia:** el código, los textos, las imágenes, la textura de ruido de fondo ni las marcas en cruz de las intersecciones (son la firma visual de zed.dev). Tampoco su tipografía serif: SGIA usa una sola familia.

## 3. Decisiones

| # | Decisión |
|---|---|
| 1 | **Sistema «Trazo»:** neutros cálidos, líneas de 1px como estructura, burdeo como único acento. Reemplaza «Pañol». |
| 2 | **Tipografía dada por el skill:** Geist (interfaz y títulos) + Geist Mono (SKU, RUT, códigos, cifras técnicas). Una familia, dos cortes, 4 archivos de fuente como máximo, alojados en el proyecto (`@fontsource-variable/geist`, `@fontsource-variable/geist-mono`) con `font-display: swap`. Se elimina Schibsted Grotesk. |
| 3 | **Paleta con los colores del cliente** (`start.mjs brand`): las tres paletas que repartió el skill (menta, verde azulado, rosa) chocan con el burdeo de INACAP, así que se usan los colores institucionales sobre neutros cálidos. |
| 4 | **Radio `sharp`** (4 / 6 / 8px), como las herramientas de desarrollo de referencia. Botones en **`pill`** (sorteado por el skill): un solo estilo de botón en toda la app. |
| 5 | **Dos layouts con un solo menú:** `sidebar` (por defecto, conserva colapsar, redimensionar y el `IconBar` vertical) y `header` (barra superior tradicional). Los dos leen el mismo `nav-config.ts`. El usuario elige en Ajustes; se guarda en `localStorage` (`sgia-layout`). Sidebar es el valor por defecto (confirmado). |
| 6 | **Menú lateral neutro:** deja de ser navy. Fondo `--surface-alt`, línea derecha de 1px, ítem activo con fondo `--surface` y barra de 2px burdeo. Así no hay un segundo color de superficie. |
| 7 | **Paletas alternativas eliminadas** (B1, Sage, Lavender, Nordic, Peach, Chamomile, Industrial). Ajustes conserva claro/oscuro/sistema y suma layout y densidad. Confirmado por el usuario (19 nov 2026). |
| 8 | **Buscador de pantallas y acciones (`Ctrl K`)** en ambos layouts: lista las rutas que el rol puede abrir (`ROUTE_PERMISSIONS`) y las acciones rápidas del rol. Ninguna pantalla queda a más de 2 clics ni a más de una búsqueda. |
| 9 | **Página de inicio por rol:** `/` muestra una composición distinta por rol (sección 6). Datos operativos (cola, vencidos, stock crítico) con los hooks REST actuales; **cualquier métrica o KPI nuevo va por GraphQL** (`POST /api/metrics`). |
| 10 | **Modales responsivos:** desde 640px, `Dialog` centrado como hoy; bajo 640px, hoja inferior a ancho completo. `Sheet` lateral pasa a pantalla completa bajo 640px. La API de `Dialog`/`Sheet` no cambia. |
| 11 | **Tablas responsivas:** bajo 768px, scroll horizontal con la primera columna fija y sombra de borde; las tablas principales (inventario, cola, historial, usuarios) ofrecen además una vista de filas apiladas (`mobileRow`). |
| 12 | **Se quita `framer-motion`:** solo lo usa `toggle.tsx`; la animación pasa a CSS. |
| 13 | **Rutas con `React.lazy`** y Chart.js cargado solo en las pantallas con gráficos. |

## 4. Tokens

Se reescribe `apps/web/src/index.css` y `packages/design-tokens/theme.css`. Se mantienen los nombres de clase que usa la app (`zinc-*`, `bg-accent`, `bg-tag`) redefinidos con los valores nuevos, para que la migración sea por tokens antes que por componentes.

### Color

Valores de `start.mjs brand --bg #f6f5f2 --ink #1b1a17 --accent #6b1729 --surface #ffffff --muted #5f5b53 --type geist --radius sharp`, más la escala neutra y los estados.

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--bg` | `#F6F5F2` | `#131210` | Canvas (fuera del marco) |
| `--surface` | `#FFFFFF` | `#1B1A17` | Marco de contenido, celdas, modales |
| `--surface-alt` | `#EFEDE8` | `#22211E` | Menú lateral, cabecera de tabla, filtros |
| `--line` | `#E2DFD8` | `#2E2C28` | Toda línea de 1px (bordes, divisiones) |
| `--line-strong` | `#CBC7BE` | `#3D3A35` | Borde de control en hover, separador discontinuo |
| `--ink` | `#1B1A17` | `#F2F0EB` | Texto principal (≥ 7:1) |
| `--ink-muted` | `#5F5B53` | `#A19C92` | Rótulos, fechas, metadatos (≥ 4.5:1) |
| `--accent` | `#6B1729` | `#E8A3B1` | Botón principal, foco, enlace, ítem activo |
| `--accent-ink` | `#F6F5F2` | `#1B1A17` | Texto sobre el acento |
| `--accent-soft` | `#F3E4E3` | `#3A1E24` | Fondo de fila seleccionada |
| `--ok` / `--ok-bg` | `#1E6B47` / `#E3EFE6` | `#7FCBA2` / `#1C2E24` | Disponible |
| `--info` / `--info-bg` | `#2F5C8A` / `#E3ECF5` | `#9DBEE0` / `#1C2633` | En préstamo |
| `--warn` / `--warn-bg` | `#8A5300` / `#F8EBCF` | `#E6B565` / `#33281A` | Mantención, vence pronto |
| `--danger` / `--danger-bg` | `#A3202E` / `#F7E1DF` | `#F09A9F` / `#36191C` | Crítico, error, destructivo |

Reglas: la interfaz es 90–95% neutra; el burdeo no es un estado ni un fondo grande; sin violeta ni lavanda; la etiqueta crema (`--tag`) queda solo para chips de código (`#ECE6DA` / tinta `#6B1729`).

### Tipografía

Una escala, en `components/ui/typography.ts` (se mantiene la regla de no escribir tamaños a mano en `h1`–`h4`).

| Nivel | Componente | 1440 | 390 | Peso |
|---|---|---|---|---|
| Saludo de inicio | `HomeHero` | 32/40 | 26/32 | 500, `-0.035em` |
| Título de página | `PageHeading` | 24/32 | 20/28 | 500, `-0.02em` |
| Título de sección o celda | `SectionTitle` | 15/22 | 15/22 | 500 |
| Rótulo de bloque | `SectionLabel` | 13/18 | 13/18 | 500, `--ink-muted` |
| Texto | — | 14/22 | 15/24 | 400 |
| Cabecera de tabla, etiqueta de campo | `TABLE_HEAD_CLASS`, `FIELD_LABEL_CLASS` | 13/18 | 13/18 | 500 |
| Cifra de métrica | `Metric` | 28/32 | 24/28 | 500, cifras tabulares |
| Código (SKU, RUT, OC) | `CODE_CHIP_CLASS`, `font-mono` | 12/16 | 12/16 | 400 Geist Mono |

Tipo oración siempre; nada bajo 12px (se elimina `text-[11px]`); nunca 700; cifras con `font-variant-numeric: tabular-nums`.

### Forma, espacio y altura

- Radios: `--r-sm` 4px (chips), `--r-md` 6px (controles, celdas), `--r-lg` 8px (marco, modal). Botones: `rounded-full`.
- Espaciado en la escala 4 / 8 / 12 / 16 / 24 / 32 / 48. Raíz de página `gap-6`; dentro de una celda `p-4` (`p-3` en 390).
- Controles: 32px con puntero fino, **44px con puntero táctil** (`@media (pointer: coarse)`), así se cumple el tamaño táctil sin inflar el escritorio.
- Sin sombras, salvo modal y menú desplegable (una sombra: `0 8px 24px rgb(0 0 0 / .08)`).

## 5. Layouts

Archivo único de navegación `apps/web/src/layouts/nav-config.ts`: ítems, grupos (Compras, Préstamos), iconos, atajos y roles leídos de `ROUTE_PERMISSIONS`. Lo usan sidebar, header, buscador `Ctrl K` y las páginas de inicio. Hoy esa información está repetida en `app-layout.tsx` e `inicio-content.ts`.

### A. Sidebar (por defecto)

```
┌──────────┬───────────────────────────────────────────────────────┐
│ SGIA     │ Inventario / Productos          [Ctrl K Buscar] 🔔 (A)│ 56px
│──────────│───────────────────────────────────────────────────────│
│ ⌂ Inicio │ │ Productos                      [Exportar] [Nuevo  N]│ │
│ ▦ Invent.│ │ 412 referencias · 6 bajo el mínimo · lector listo   │ │
│ ⇄ Présta.│ │─────────────────────────────────────────────────────│ │
│ ▸ Compras│ │ [Buscar /] [Área ▾] [Estado ▾]                      │ │
│   …      │ │─────────────────────────────────────────────────────│ │
│          │ │ SKU        Producto          Ubicación   Stock      │ │
│ ⚙ Ajustes│ │ …                                                   │ │
│ ◐ Tema   │ └ marco de contenido: bordes izq./der. de 1px ────────┘ │
└──────────┴───────────────────────────────────────────────────────┘
```

- Conserva lo de `REQ-DISEÑO.md`: colapsar, redimensionar (`col-resize`), `IconBar` vertical de 48px, tema en el pie.
- Bajo 1024px: el sidebar se oculta y se abre como cajón desde el botón de menú (con foco atrapado y `Esc`).
- La cabecera muestra la ruta (migas) a la izquierda y búsqueda, campana y cuenta a la derecha.

### B. Header tradicional

```
┌──────────────────────────────────────────────────────────────────┐
│ SGIA  Inicio  Inventario  Préstamos▾  Compras▾  Informes   [Ctrl K] 🔔 (A) │ 56px
├──────────────────────────────────────────────────────────────────┤
│        ┌ marco centrado, máx. 1280px, bordes de 1px ┐            │
│        │ Productos                     [Nuevo  N]   │            │
│        │ …                                          │            │
```

- Hasta 6 ítems visibles; los grupos abren un panel de una superficie (columnas con título y descripción corta, como el menú de producto de zed.dev). Lo que no cabe pasa a «Más».
- Ítem actual: barra de 2px bajo la palabra (`aria-current="page"`).
- Bajo 1024px: botón de menú que abre un menú a pantalla completa con los grupos expandidos y búsqueda arriba.
- Las páginas de datos anchas (inventario, historial) usan el marco a ancho completo (`variant="wide"`).

### C. Común a ambos

- Buscador `Ctrl K` (Radix Dialog): pantallas del rol, acciones rápidas («Nuevo préstamo», «Registrar factura», «Crear usuario») y, en inventario, búsqueda por SKU o nombre.
- Atajos con `Kbd` visibles junto a la acción; `?` abre la lista de atajos. Los atajos se desactivan dentro de campos de texto. El lector Code128 del mostrador no se ve afectado.
- Ajustes: tema (claro / oscuro / sistema), layout (sidebar / header), densidad (cómoda / compacta).
- Enlace de salto al contenido como primer elemento enfocable.

## 6. Páginas de inicio por rol (`/`)

Estructura común: **banda de saludo** (nombre, fecha, pañol, una acción principal con su atajo) → **celdas de «Lo que te toca hoy»** (`CellGrid`, cada celda con número, frase y enlace a la pantalla donde se atiende) → **bloque propio del rol** → **accesos** (las pantallas del rol, desde `nav-config.ts`). En 390 todo queda en una columna y la acción principal ocupa el ancho completo.

| Rol | Acción principal | «Lo que te toca hoy» | Bloque propio |
|---|---|---|---|
| **PAN-01 Pañolero** | Abrir mostrador (`M`) | Solicitudes en cola · Préstamos vencidos · Devoluciones de hoy · Stock crítico | Lista de las 5 próximas solicitudes de la cola con «Revisar» por fila, y campo de escaneo listo (Code128) que lleva al producto o al préstamo. |
| **DIR-01 Director** | Nueva solicitud de compra (`N`) | Compras por aprobar · Cotizaciones pendientes · Stock crítico · Préstamos vencidos | Etapas de compras en curso (`PurchaseFlowSteps`) y saldo de presupuesto por área (barras, GraphQL). |
| **AD-01 Administrador** | Crear usuario (`U`) | Estado del sistema · Accesos fallidos (24 h) · Cuentas inactivas · Pañoles | Actividad reciente de auditoría (tabla de 8 filas) y gráfico de accesos por hora (GraphQL). |
| **PRO-01 Profesor** | Solicitar equipo (`N`) | Solicitudes en revisión · Aprobadas para retirar · Devoluciones pendientes · Informes abiertos | Buscador del catálogo como bloque principal («¿Qué necesitas para tu clase?») y estado de sus últimas solicitudes en una línea de tiempo. |

Datos: los conteos usan los hooks que ya existen (`usePendingLoans`, `useLoans`, `useCriticalStockAlerts`, `useMyLoanRequests`, `useAuditLogs`, `useSystemHealth`, `useLoginActivity`). Lo que no exista todavía («Devoluciones de hoy», «Cuentas inactivas», saldo por área para inicio) se pide como **campo GraphQL** y se agrega a la tabla «Endpoints pendientes» de `ENDPOINTS.md` en la fase 4, antes de programarlo. Una celda sin datos muestra «Sin pendientes», nunca un cero sin contexto ni un esqueleto eterno.

Implementación: `features/inicio/pages/inicio-page.tsx` elige `PanolHome`, `DirectorHome`, `AdminHome` o `ProfesorHome` por rol; cada uno en su archivo bajo `features/inicio/components/`.

## 7. Movimiento

Tokens de `references/motion.md` del skill, como variables CSS en `index.css`:

| Token | Valor | Uso |
|---|---|---|
| `--m-in` / `--m-out` | 150 / 120ms | Hover (color, borde) |
| `--m-press` | 90ms | Pulsación de botón (`scale(.985)`) |
| `--m-panel` / `--m-close` | 200 / 120ms | Menú, desplegable, modal, cajón |
| `--m-slide` | 240ms | Indicador de pestañas |
| `--ease` | `cubic-bezier(.2,.8,.2,1)` | Todo paso de interfaz |

- Solo `transform` y `opacity` (y colores en hover). Nunca ancho, alto ni márgenes; el redimensionado del sidebar sigue el puntero sin transición.
- Celda o fila con enlace: sube 2px y el borde pasa a `--line-strong`, solo con puntero fino.
- Modal: fundido + 6px de desplazamiento; hoja inferior en móvil: sube desde abajo, 200ms.
- Entrada de la página de inicio: saludo y celdas una sola vez al cargar, 300ms en total. Ninguna otra pantalla anima al entrar ni al hacer scroll.
- `prefers-reduced-motion`: solo cambian colores y opacidad; nada queda oculto.
- Esqueletos de carga sin brillo animado (un fondo `--surface-alt` fijo).

## 8. Gráficos

Chart.js se queda (analítica, presupuestos, monitoreo). Nuevo `apps/web/src/lib/chart-theme.ts`, único lugar de estilos de gráfico:

- Colores leídos de las variables CSS (cambian con el tema sin recrear el gráfico): serie principal `--accent`; series secundarias en una rampa neutra; estados con los tonos de la sección 4. Paleta categórica validada con el skill `dataviz` antes de usarla.
- Rejilla de 1px `--line` solo en el eje de valores; ejes sin línea; ticks 12px Geist Mono.
- Leyenda arriba a la izquierda; tooltip con fondo `--surface`, borde `--line`, sin sombra fuerte.
- Animación de 200ms o ninguna con movimiento reducido.
- Cada gráfico dentro de una celda con título (`SectionTitle`), cifra principal y el botón de ampliar actual (`ChartExpandButton`).
- Datos siempre por GraphQL (`POST /api/metrics`); el CRUD de gráficos guardados (`/me/charts`, `/chart-templates`) sigue en REST.

## 9. Formularios, tablas y componentes

| Componente | Cambio |
|---|---|
| `Button` | Variantes `primary` (burdeo, la única rellena), `secondary` (borde), `ghost`, `danger`. Pill. 32px / 44px táctil. Hover sube 1px, pulsación baja y escala .985. |
| `Kbd` (nuevo) | Atajo junto a una acción: Geist Mono 12px, borde `--line`, radio 4px. Oculto en táctil. |
| `CellGrid` / `Cell` (nuevos) | Grilla con bordes compartidos. 1 / 2 / 4 columnas (390 / 768 / 1280). Reemplaza `ModuleGrid` y las tarjetas sueltas de inicio. |
| `Card` | Pasa a «panel»: `--surface`, borde `--line`, radio 8px, sin sombra. |
| `Metric` (nuevo) | Cifra + rótulo + variación opcional. Reemplaza la cinta métrica hecha a mano en cada página. |
| `DataTable` (nuevo, sobre TanStack) | Barra de herramientas integrada (búsqueda `/`, filtros como chips, acciones), cabecera fija, primera columna fija bajo 768px, `mobileRow` opcional, paginación y estados vacío / cargando / error en un solo lugar. |
| Campos | Etiqueta visible arriba, ayuda debajo, error bajo su campo en `--danger`, foco con anillo burdeo de 2px. 36px / 44px táctil. Dos columnas desde 640px, una debajo. |
| `Dialog` | Hoja inferior bajo 640px (decisión 10). Cabecera y pie fijos; se mantiene el estándar de `sgia-design` (tamaños `sm`–`2xl`, `DialogFooter`, confirmación si hay datos escritos). |
| `Sheet` | Pantalla completa bajo 640px. |
| `Badge` | Tonos de la sección 4: fondo suave + texto, sin borde. |
| `EmptyState` (nuevo) | Icono, una frase y la acción que lo resuelve. |
| `Toggle` | Sin `framer-motion`: transición CSS. |
| Login | Marco centrado: a la izquierda el formulario, a la derecha una celda con qué permite hacer SGIA por rol. Una columna bajo 768px. |

## 10. Fases

Una fase = un commit en `feat/rediseno-zed`, con `pnpm typecheck` y `pnpm --filter @sgia/web test` en verde. Hasta 2 agentes en paralelo con archivos que no se cruzan; los commits los hace la sesión principal.

### Fase 0 — Plan y documentos
- [x] Rama `feat/rediseno-zed`.
- [x] Este plan en `docs/rediseno-interfaz.md`.
- [x] `TASKS/REQ-DISEÑO.md` y `CLAUDE.md` apuntan a este plan.
- [x] Respuestas a las preguntas abiertas (sección 12).

### Fase 1 — Tokens y tipografía
- [ ] Geist y Geist Mono alojadas en el proyecto; fuera Schibsted Grotesk.
- [ ] Reescribir `@theme` y `:root` / `.dark` de `index.css` y `packages/design-tokens` (sección 4).
- [ ] Quitar las paletas alternativas de `index.css`, `theme-context.tsx` y `settings-modal.tsx` (si se confirma la decisión 7).
- [ ] Escala tipográfica en `typography.ts`; eliminar `text-[11px]`.
- [ ] Tokens de movimiento y foco.
- [ ] Revisión visual en claro y oscuro de 3 pantallas (inventario, cola, solicitud de compra).

### Fase 2 — Componentes base
- [ ] `Button`, `Badge`, `Card`, campos y `Toggle` (sin `framer-motion`).
- [ ] Nuevos: `Kbd`, `CellGrid`/`Cell`, `Metric`, `EmptyState`.
- [ ] `Dialog` y `Sheet` responsivos (hoja inferior / pantalla completa).
- [ ] `DataTable` con barra integrada, columna fija y `mobileRow`.
- [ ] Tests de cada componente nuevo.

### Fase 3 — Layouts y navegación
- [ ] `nav-config.ts` como fuente única (migrar `app-layout.tsx` e `inicio-content.ts`).
- [ ] `SidebarLayout` neutro, con cajón bajo 1024px.
- [ ] `HeaderLayout` con paneles de grupo y menú a pantalla completa bajo 1024px.
- [ ] Preferencia de layout y densidad en Ajustes.
- [ ] Buscador `Ctrl K`, lista de atajos `?` y migas de pan.
- [ ] Rutas con `React.lazy` y `Suspense`.
- [ ] Actualizar `app-layout.test.tsx` y sumar tests del header y del buscador.

### Fase 4 — Páginas de inicio por rol
- [ ] Registrar en `ENDPOINTS.md` (ambos repos) los campos GraphQL que falten para inicio.
- [ ] `PanolHome`, `DirectorHome`, `AdminHome`, `ProfesorHome`.
- [ ] Test por rol: muestra su acción principal y solo enlaces que el rol puede abrir.

### Fase 5 — Pantallas por módulo
Cada pantalla: `PageHeading` + acciones, `Metric` en vez de cinta hecha a mano, `DataTable`, modales con el estándar nuevo.
- [ ] Inventario, Ubicaciones, Equipos, Alertas.
- [ ] Préstamos: menú, cola, mostrador, historial.
- [ ] Compras: hub, solicitudes (+ detalle), cotizaciones, órdenes (+ trazabilidad), presupuestos, facturas, proveedores.
- [ ] Informes, Mantenciones, Estudiantes.
- [ ] Profesor: catálogo, mis solicitudes, mis informes.
- [ ] Administración: usuarios, pañoles, auditoría, monitoreo.
- [ ] Login y pantallas de error.

### Fase 6 — Gráficos
- [ ] `chart-theme.ts` y paleta validada con `dataviz`.
- [ ] Analítica, presupuestos y monitoreo con el tema nuevo; Chart.js en carga diferida.

### Fase 7 — Responsivo, rendimiento y accesibilidad
- [ ] Revisión a 320, 390, 768, 1024 y 1440 de cada pantalla, con capturas (`shoot.mjs` del skill sobre el servidor de Vite).
- [ ] Sin scroll horizontal de página a 320; controles de 44px en táctil.
- [ ] `perf.mjs` del skill en login, inicio e inventario: sin filas FAIL (JS inicial, fuentes, cambios de layout).
- [ ] Teclado: enlace de salto, foco visible, orden de títulos, nombres accesibles en botones de icono.
- [ ] Movimiento reducido.

### Fase 8 — Cierre
- [ ] Reescribir `.claude/skills/sgia-design/SKILL.md` con el sistema «Trazo».
- [ ] Actualizar «Decisiones de diseño» y reglas duras de `CLAUDE.md` (menú navy y burdeo de `bg-accent`).
- [ ] Registrar en `FIXES/CHANGELOG-FIXES.md`; marcar las casillas de `REQ-DISEÑO.md`.
- [ ] Estado de este plan: implementado.

## 11. Fuera de alcance

- App móvil (`apps/mobile`) y backend: sin cambios de diseño ni de contrato, salvo los campos GraphQL de la fase 4.
- Reglas del skill pensadas para sitios de marketing: fotografías, una sección por pantalla, «momentos» y efectos WebGL. El portero final del skill (`gate.mjs`) da fallos falsos en un panel de operación; se usan solo `shoot.mjs`, `check.mjs` (desbordes y solapes) y `perf.mjs`.
- Cambios de flujo o de permisos: el rediseño no mueve reglas de negocio ni rutas, salvo agregar el buscador y los atajos.

## 12. Preguntas resueltas (19 nov 2026)

1. Paletas alternativas: **se eliminan todas** (decisión 7).
2. Layout por defecto: **sidebar** (decisión 5).
3. El pañolero **entra a Inicio** (`/`), como los demás roles; el mostrador es su acción principal ahí.
