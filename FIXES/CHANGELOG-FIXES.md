    2. **Fila Inferior:** Separador sutil (`border-t pt-2`) con la etiqueta de texto `"Tema Claro / Oscuro"` a la izquierda y el componente `Toggle` (`Moon`/`Sun`) a la derecha, garantizando separación total y cero solapamiento incluso en `180px`.
- **Verificación:**
  - `pnpm --filter @sgia/web test`: 26 archivos pasados, 125 tests aprobados.
  - `pnpm typecheck`: 5/5 paquetes aprobados sin errores de TypeScript.

---

## FIX-002: Incorporación de Ajustes de Usuario, Modal de Paletas de Color y Prevención de Solapamiento

- **Fecha:** 2026-10-10
- **Módulo:** Configuración de Usuario / Paleta de Colores (`apps/web`) — [REQ-CONFIG](TASKS/REQ-CONFIG.md)
- **Archivos Modificados / Creados:**
  - [`apps/web/src/components/settings/settings-modal.tsx`](apps/web/src/components/settings/settings-modal.tsx)
  - [`apps/web/src/components/settings/settings-modal.test.tsx`](apps/web/src/components/settings/settings-modal.test.tsx)
  - [`apps/web/src/contexts/theme-context.tsx`](apps/web/src/contexts/theme-context.tsx)
  - [`apps/web/src/contexts/theme-context.test.tsx`](apps/web/src/contexts/theme-context.test.tsx)
  - [`apps/web/src/layouts/app-layout.tsx`](apps/web/src/layouts/app-layout.tsx)
  - [`apps/web/src/layouts/app-layout.test.tsx`](apps/web/src/layouts/app-layout.test.tsx)
  - [`apps/web/src/index.css`](apps/web/src/index.css)
  - [`TASKS/REQ-CONFIG.md`](TASKS/REQ-CONFIG.md)
- **Requerimientos Implementados:**
  1. **Botón de Ajustes en el Sidebar:** Se añadió botón con icono de engranaje (`Settings`) al costado del nombre del usuario en la fila superior del perfil y en el muelle de iconos colapsado (`IconBar 3`), con accesibilidad por teclado y tooltips informativos.
  2. **Modal de Ajustes (`SettingsModal`):** Diálogo Radix centrado y responsive que despliega la sección *"Paleta de Colores de Interfaz"* y *"Modo de Visualización"*.
  3. **Paleta Principal (Industrial INACAP):** Basada en la escala Zinc industrial (`#f4f4f5` / `#18181b`), con acento institucional INACAP (`#dc2626`) y estados técnicos normalizados.
  4. **Paleta B1 (Azul Acero & Indigo):** Implementación de la paleta B1 detallada en `SKILLS/Design.md` con 8 swatches técnicos interactivos: Smart Blue (`#0466c8`), Steel Azure (`#0353a4`), Regal Navy (`#023e7d`), Prussian Blue (`#002855`), Twilight Indigo (`#33415c`), Blue Slate (`#5c677d`), Slate Grey (`#7d8597`) y Cool Steel (`#979dac`).
  5. **Verificación de Cero Solapamiento:**
     - En la barra lateral: Se utilizaron anchos fijos con `shrink-0` para avatar (28px) y grupo de botones (44px), y `min-w-0 flex-1 truncate` para nombre y rol de usuario, impidiendo desbordes y solapes en `MIN_WIDTH = 180px`.
     - En el modal de ajustes: Se configuró un grid responsive (`grid-cols-1 md:grid-cols-2`) con swatches en `flex flex-wrap` y límites elásticos `line-clamp-2` que garantizan cero colisión en pantallas móviles y de escritorio.
  6. **Alineación con Nota L100 de AGENTS.md (Preservación de Fondos Neutros y Reflejo en Botones/Letras/Estados):**
     - Se preservan estrictamente los colores base blanco y negro neutro en canvas y paneles (con micro-variación sutil permitida, sin saturar fondos con colores invasivos).
     - Los colores de la paleta B1 se reflejan en los tonos de botones (`btn-primary`, botones CTA, rings), letras específicas (enlaces activos de navegación, encabezados, metadatos en Blue Slate y Cool Steel) y estados de entidades (dots y badges semánticos) sin perder la estética y densidad principal.
- **Verificación:**
  - `pnpm --filter @sgia/web test`: 27 archivos pasados, 132 tests aprobados (100% pasando).
  - `pnpm typecheck`: 5/5 paquetes aprobados sin errores de TypeScript.

---

## FIX-003: Corrección de Lentitud en Sidebar al Arrastrar y Capa Transparente en Modo Colapsado

- **Fecha:** 2026-10-10
- **Módulo:** UI Layout / Sidebar (`apps/web`) — [REQ-DISEÑO]
- **Archivos Modificados / Creados:**
  - [`apps/web/src/layouts/app-layout.tsx`](apps/web/src/layouts/app-layout.tsx)
- **Requerimientos Implementados:**
  1. **Arrastre de Panel sin Lag:** Se ha eliminado el lag drástico al arrastrar el separador del sidebar para cambiar su ancho. Esto se logró eliminando la transición CSS (se aplica `transition-none`) exclusivamente cuando `isDragging === true` y procesando el evento `mousemove` a 60FPS usando `requestAnimationFrame`. La transición de `duration-200 ease-out` vuelve al soltar el ratón (`isDragging === false`).
  2. **Arrastrar para Colapsar (Snap to Collapse):** Se ha añadido la regla lógica al `mousemove` donde si `e.clientX` cae por debajo de `COLLAPSE_THRESHOLD = 130`, automáticamente dispara `setIsCollapsed(true)`. Si es mayor a 130, actualiza dinámicamente el ancho respetando el `MIN_WIDTH = 180px`.
  3. **Corrección de Capa Subyacente en Modo Colapsado:** Cuando el sidebar entra en modo `isCollapsed = true` (por ej., pulsando el botón superior o arrastrando debajo de 130px), ahora asume estilos de `bg-transparent border-none shadow-none` en lugar de mantener la base sólida. De este modo, los docks flotantes (ej. `IconBar 1, 2 y 3`) flotan libremente sobre el canvas gris del body sin que se vea una franja lateral debajo de ellos.
  4. **Corrección de Separador en Modo Colapsado:** Se oculta totalmente el `div role="separator"` (opacidad 0) en estado colapsado, preservando su funcionalidad y previniendo cortes visuales sobre el dock flotante.
- **Verificación:**
  - `pnpm --filter @sgia/web test`: 28 archivos pasados, 135 tests aprobados (100% pasando).
  - `pnpm typecheck`: Completado sin errores.

---

## FIX-004: Separación Lateral y Centrado Permanente de IconBars en Modo Colapsado

- **Fecha:** 2026-10-10
- **Módulo:** UI Layout / Sidebar (`apps/web`) — [REQ-DISEÑO]
- **Archivos Modificados:**
  - [`apps/web/src/layouts/app-layout.tsx`](apps/web/src/layouts/app-layout.tsx)
  - [`TASKS/REQ-DISEÑO.md`](TASKS/REQ-DISE%C3%91O.md)
- **Requerimientos Implementados:**
  1. **Margen de Respiración Lateral:** El contenedor colapsado ahora tiene un ancho de `64px` con padding horizontal `px-2` y vertical `py-3`, evitando que los muelles `bar-well` (ancho unificado `48px`) queden pegados a los límites izquierdo y derecho de la pantalla o del canvas.
  2. **Centrado Absoluto de Navegación de Funciones:** El contenedor central de módulos (`IconBar 2` con `GlassIconBar`) incluye ahora `justify-center items-center`, asegurando que el bloque de accesos directos permanezca centrado en el medio de la pantalla (eje vertical y horizontal) con independencia de la altura del viewport o de cuántos módulos tenga habilitado el rol.
  3. **Actualización de Requisitos en REQ-DISEÑO.md:** Se documentaron formalmente ambos ítems en la lista de requisitos.
- **Verificación:**
  - `pnpm --filter @sgia/web test src/layouts/app-layout.test.tsx`: 7 tests pasando.
  - `pnpm typecheck`: En ejecución sin errores.

---

## FIX-005: Eliminación de Caracteres Literales `\n` en Filas de Tabla de Inventario

- **Fecha:** 2026-10-10
- **Módulo:** Módulo Inventario (`apps/web`) — [REQ-03-REQ-04-INVENTARIO-PRODUCTOS]
- **Archivos Modificados:**
  - [`apps/web/src/features/inventario/components/inventario-table.tsx`](apps/web/src/features/inventario/components/inventario-table.tsx)
- **Requerimientos Implementados:**
  1. Se eliminó el literal `\n` que se encontraba renderizado como texto sin escapar al final del mapeo de celdas en el `<tr>` de cada fila del `<tbody>` (línea 526).
- **Verificación:**
  - `git grep -n "\\\\n" apps/web/src/` no devuelve ocurrencias indebidas.
  - Tests del módulo de inventario pasando con éxito.

---

## FIX-006: Habilitación de Rutas para Pañol (Préstamos, Ubicaciones, Historial) y Ocultación de Proveedores

- **Fecha:** 2026-10-11
- **Módulo:** Enrutamiento y Navegación (`apps/web`) — [REQ-05, REQ-10, REQ-11]
- **Archivos Modificados / Creados:**
  - [`apps/web/src/app.tsx`](apps/web/src/app.tsx)
  - [`apps/web/src/layouts/app-layout.tsx`](apps/web/src/layouts/app-layout.tsx)
  - [`apps/web/src/features/auth/types/roles.ts`](apps/web/src/features/auth/types/roles.ts)
  - [`apps/web/src/features/ubicaciones/pages/ubicaciones-page.tsx`](apps/web/src/features/ubicaciones/pages/ubicaciones-page.tsx)
  - [`apps/web/src/features/ubicaciones/pages/ubicaciones-page.test.tsx`](apps/web/src/features/ubicaciones/pages/ubicaciones-page.test.tsx)
  - [`apps/web/src/features/prestamos/pages/prestamos-menu-page.tsx`](apps/web/src/features/prestamos/pages/prestamos-menu-page.tsx)
  - [`apps/web/src/features/prestamos/pages/prestamos-menu-page.test.tsx`](apps/web/src/features/prestamos/pages/prestamos-menu-page.test.tsx)
- **Problema Solucionado:**
  1. Al hacer clic en el sidebar en las opciones de **Préstamos** (`/prestamos`), **Ubicaciones** (`/ubicaciones`) e **Historial** (`/historial`), el router no tenía declaradas las rutas exactas correspondientes o los permisos en `roles.ts`, cayendo en el catch-all `*` y redirigiendo a la ruta por defecto del rol PAN-01 (`/inventario`).
  2. La opción **Proveedores** aparecía en la barra lateral para el rol Pañolero (`PAN-01`) cuando solo corresponde a Dirección (`DIR-01`) y Administración (`AD-01`).
- **Solución Implementada:**
  1. **Ruta `/prestamos`:** Creado `PrestamosMenuPage` como centro operativo de mesón, permitiendo acceder a Mostrador y Devoluciones (`/prestamos/mostrador`), Cola de Solicitudes Remotas (`/prestamos/cola`) e Historial (`/prestamos/historial`).
  2. **Ruta `/ubicaciones`:** Creada la página completa de Ubicaciones Físicas y Cajones (`UbicacionesPage`) conectada con los endpoints de API (`useLocations` y `useCajones` de REQ-05).
  3. **Ruta `/historial`:** Agregada ruta en `app.tsx` apuntando directamente a `HistorialPrestamosPage` (REQ-11).
  4. **Ocultación de Proveedores para PAN-01:** Removido `'PAN-01'` del array de roles de la ruta `/proveedores` en `navigation` de `app-layout.tsx`.
- **Verificación:**
  - 30 archivos de prueba pasados, 137 tests aprobados (100% éxito).
  - Verificación de tipos aprobada con cero errores en Turborepo.

---

## FIX-007: Implementación de Dashboards Analíticos (REQ-14) con Mock Data Contextual y Chart.js

- **Fecha:** 2026-10-12
- **Módulo:** Dashboards, Analítica y Métricas (`apps/web`) — [REQ-14]
- **Archivos Modificados / Creados:**
  - [`apps/web/src/features/dashboard/data/mock-metrics.json`](apps/web/src/features/dashboard/data/mock-metrics.json)
  - [`apps/web/src/features/dashboard/types/metrics.ts`](apps/web/src/features/dashboard/types/metrics.ts)
  - [`apps/web/src/features/dashboard/hooks/use-metrics.ts`](apps/web/src/features/dashboard/hooks/use-metrics.ts)
  - [`apps/web/src/features/dashboard/components/metric-strip.tsx`](apps/web/src/features/dashboard/components/metric-strip.tsx)
  - [`apps/web/src/features/dashboard/components/dynamic-chart-card.tsx`](apps/web/src/features/dashboard/components/dynamic-chart-card.tsx)
  - [`apps/web/src/features/dashboard/components/chart-builder-modal.tsx`](apps/web/src/features/dashboard/components/chart-builder-modal.tsx)
  - [`apps/web/src/features/dashboard/pages/dashboard-page.tsx`](apps/web/src/features/dashboard/pages/dashboard-page.tsx)
  - [`apps/web/src/features/dashboard/dashboard-page.test.tsx`](apps/web/src/features/dashboard/dashboard-page.test.tsx)
  - [`TASKS/REQ-14-DASHBOARDS-ANALITICA.md`](TASKS/REQ-14-DASHBOARDS-ANALITICA.md)
- **Requerimientos Implementados:**
  1. **Generación de Mock Data Contextual (`mock-metrics.json`):** Archivo JSON con datos del pañol TI (Routers Cisco 4321, Switches Catalyst 2960, Multímetros Fluke, kits Arduino/IoT, etc.), respetando el disclaimer de desarrollo previo a la API GraphQL.
  2. **Cinta Métrica Ejecutiva (`MetricStrip`):** Con 8 indicadores estratégicos compactos (activos disponibles, en préstamo, en taller, de baja, préstamos hoy, tasa de atrasos, alertas críticas y rotación mensual).
  3. **Visualización con Chart.js y react-chartjs-2:** Integración con estilos zed.dev dual-theme para gráficos de Barras (`Bar`), Líneas (`Line`), Donas (`Doughnut`) y Áreas Polares (`PolarArea`).
  4. **3 Plantillas Predeterminadas:**
     - *Plantilla 1:* Operaciones y Movimiento de Pañol.
     - *Plantilla 2:* Demanda y Desgaste por Carrera.
     - *Plantilla 3:* Salud del Inventario y Ciclo de Vida.
  5. **Constructor Dinámico de Gráficos (`ChartBuilderModal`):**
     - Permite seleccionar Entidad, Métrica/Agregación, Tipo de Gráfico y Rango Temporal.
     - Validación obligatoria de máximo 5 gráficos por plantilla.
     - Detección y rechazo de gráficos duplicados idénticos.
     - Eliminación asistida con confirmación (`ConfirmDialog`).
     - Persistencia en `localStorage`.
  6. **Notación `[p]` de Parcial:** Se actualizaron las tareas en `REQ-14-DASHBOARDS-ANALITICA.md` con la marca `[p]` indicando su estado simulado con mock data hasta la conexión del backend GraphQL.
- **Verificación:**
  - 31 archivos de prueba pasados, 140 tests aprobados en Vitest (100%).
  - `pnpm typecheck` validado en los 5 paquetes con 0 errores.

---

## REWORK-F1: Configuración de Claude Code

- **Fecha:** 2026-10-27
- **Archivos Modificados:** `CLAUDE.md`, `.claude/settings.json`, `.claude/skills/sgia-design/`, `.claude/commands/`
- **Cambios:** `CLAUDE.md` en la raíz; permisos en `settings.json` (permitir typecheck/lint/test, pedir confirmación en install/commit/push, denegar `rm -rf`, `push --force`, `reset --hard`); `SKILLS/Design.md` migrado al skill `sgia-design` con paletas en `references/paletas.md`; comandos `/verificar` y `/nueva-pantalla`.

---

## REWORK-F2: Conflictos de diseño AGENTS.md vs SKILLS/Design.md resueltos

- **Fecha:** 2026-10-27
- **Módulo:** Documentación de diseño
- **Archivos Modificados:** `AGENTS.md`, `SKILLS/Design.md`, `.claude/skills/sgia-design/SKILL.md`, `CLAUDE.md`, `rework.md`
- **Decisiones (según el código existente en `apps/web`):**
  1. **Canvas:** `bg-zinc-100 dark:bg-zinc-950` (27 archivos; ninguno usa `slate-50`).
  2. **Rojo en CTA:** no. `Button` `primary` es monocromo; el rojo queda para etiqueta de sede y paradas críticas.
  3. **Badges:** componente `Badge` (pastilla tintada con borde + `dot` opcional).
  4. **Paletas alternativas:** la nota de preservación de fondos sigue vigente.

---

## REWORK-F3: Limpieza de documentación

- **Fecha:** 2026-10-27
- **Archivos Modificados:** `AGENTS.md`, `FIXES/CHANGELOG-FIXES.md`, `ENDPOINTS.md`, `TASKS/REQ-03-REQ-04-INVENTARIO-PRODUCTOS.md`, `TASKS/REQ-05-UBICACION-FISICA.md`, `TASKS/REQ-06-ALERTAS-STOCK-CRITICO.md`, `README.md`, `rework.md`
- **Cambios:**
  1. Rutas `file:///home/alerrsi/...` reemplazadas por rutas relativas a la raíz del repo (`AGENTS.md`, este changelog).
  2. Nombre oficial del sistema: "Sistema de Gestión de Inventario y Activos" (ENDPOINTS.md y 3 TASKS corregidos).
  3. Nombre oficial del repositorio: `FrondEnd-SGIA` (igual al remoto); el árbol de `AGENTS.md` §2 lo usa.
  4. `AGENTS.md` §5 reducido a un resumen que apunta al skill `sgia-design` (170 → 129 líneas).
  5. `README.md`: sección "Para agentes de IA".

---

## REWORK-F4: Estado de requisitos alineado con el código

- **Fecha:** 2026-10-27
- **Archivos Modificados:** `TASKS/README.md`, `rework.md`
- **Cambios:** estados recalculados con las casillas de cada `TASKS/REQ-*.md` y el código de `apps/` y `packages/`. REQ-03 a REQ-07 y REQ-10 a REQ-12 pasan de Pendiente a Completado; REQ-01 baja de 80% a 48%; REQ-09 pasa a Parcial; REQ-14 a En Progreso; REQ-NF baja de 60% a 17%.

---

## REWORK-F5: Limpieza de código (lint y duplicados)

- **Fecha:** 2026-10-27
- **Cambios:**
  1. `toogle.tsx` (implementación) y `toggle.tsx` (reexportación de 2 líneas) fusionados en `toggle.tsx`.
  2. ESLint compartido: parámetros y variables con prefijo `_` no cuentan como no usados.
  3. Eliminados todos los `any` de `apps/web` (lint web: 29 → 0), usando los tipos de `@sgia/types` que ya existían (`BorradorProducto`, `InvoiceScanResponse`, `UpdateUsuarioPayload`, `Cajon`). `UpdateUsuarioPayload.area` acepta `null`.
  4. `iconbar.tsx`: quitado un `eslint-disable` de una regla no cargada.
  5. `cola-prestamos-page.tsx`: `usePendingLoans` ya devuelve `PaginatedResponse`, se quitó la rama de array.
- **Verificación:** typecheck 5/5, 155 tests pasan, `pnpm --filter @sgia/web lint` sin errores.
  6. `mock-metrics.json` movido de `dashboard/data/` a `dashboard/mocks/` (lo usa `use-metrics.ts` en producción hasta conectar GraphQL).
  7. `usuarios/lib/run.ts` se mantiene: es lógica de RUN chileno, no una utilidad genérica. `apps/mobile` no tiene tests ni Jest (decisión: documentado, no se agrega).
- **Nota:** el lint móvil (6 errores, ver `FIXES/baseline-lint-mobile.txt`) no corría antes porque Turbo se detenía en el fallo de web; se corrigió en F6.

---

## REWORK-F6: Verificación final

- **Fecha:** 2026-10-27
- **Resultado:** `pnpm install` sin errores; typecheck 5/5; 155 tests pasan (igual que la línea base); lint web y móvil 0 errores (el móvil tenía 6 en `FIXES/baseline-lint-mobile.txt`, corregidos).
- **Lint móvil (6 → 0):** en `explore.tsx` e `index.tsx` el estado de carga arranca en `true` en vez de activarse dentro del `useEffect` (`react-hooks/set-state-in-effect`); `explore.tsx` hace el fetch inicial directo en el efecto; comillas escapadas con `&quot;` (`react/no-unescaped-entities`).

---

## REQ-01 móvil: login nativo

- **Fecha:** 2026-10-27
- **Cambios:** pantalla de login (`features/auth/login-screen.tsx`, RHF, `device_name: 'mobile'`), `AuthProvider` con restauración de sesión y rechazo de roles distintos de `PRO-01`, `TokenStorage` con `expo-secure-store` (`config/api.ts`), gate de autenticación en `_layout.tsx` y botón "Cerrar sesión" en Mis Solicitudes.
- **Dependencias nuevas en móvil:** `expo-secure-store`, `@tanstack/react-query`, `react-hook-form`.
- **Pendiente:** NativeWind no está instalado, se usó `StyleSheet`; sin test de integración del login; URL de API vía `EXPO_PUBLIC_SGIA_API_URL`.

---

## REQ-01 móvil: login nativo

- **Fecha:** 2026-10-27
- **Cambios:** pantalla de login (`features/auth/login-screen.tsx`, RHF, `device_name: 'mobile'`), `AuthProvider` con restauración de sesión y rechazo de roles distintos de `PRO-01`, `TokenStorage` con `expo-secure-store` (`config/api.ts`), gate de autenticación en `_layout.tsx` y botón "Cerrar sesión" en Mis Solicitudes.
- **Dependencias nuevas en móvil:** `expo-secure-store`, `@tanstack/react-query`, `react-hook-form`.
- **Pendiente:** NativeWind no está instalado, se usó `StyleSheet`; sin test de integración del login; la URL de la API se toma de `EXPO_PUBLIC_SGIA_API_URL`.

---

## REQ-01 web: cambio de contraseña y sesiones activas

- **Fecha:** 2026-10-28
- **Cambios:** `ChangePasswordDialog` (RHF + Zod: 8+ caracteres con letras y números, confirmación coincidente) y `SessionsDialog` (lista de `GET /api/tokens`, botón "Cerrar otras sesiones"). Se abren desde la nueva sección "Cuenta y seguridad" de Ajustes.
- **api-client:** hooks `useChangePassword`, `useTokens`, `useRevokeOtherTokens`. `fetchTokens` ahora lee `response.tokens` (la API devuelve `{ tokens: [...] }`; antes devolvía el objeto entero).
- **Limitación:** la API no marca cuál es la sesión actual, así que no hay botón para cerrar una sesión individual (`DELETE /api/tokens/{id}`) por riesgo de cerrar la propia.
- **Verificación:** typecheck 5/5, lint 0, 157 tests pasan (+2 del diálogo de contraseña).

---

## REQ-01: cierre

- **Fecha:** 2026-10-28
- **Cambios:** test de integración del login web (`login.test.tsx`) con `AuthProvider` real y `fetch` simulado: login exitoso (token guardado y redirección por rol), 401, 422 y rechazo de `PRO-01` en web.
- **Estado:** REQ-01 sin casillas pendientes. El login móvil se probó a mano contra la API real (navegador); `apps/mobile` sigue sin Jest, decisión de F5.

---

## REQ-14: dashboard conectado a `/api/metrics` (GraphQL)

- **Fecha:** 2026-10-30
- **Contrato:** `metrics.md` (raíz). Implementado según su checklist §9.
- **api-client:** `services/metrics.ts` sin datos de respaldo (propaga `errors[0].message`; 401/403 vía `post`), `buildMetricInput` envía solo campos del contrato; `useExecutiveKpis`/`useCustomMetric` con `retry: false` y clave sin `title`; se eliminó `useBatchMetrics`. `KpiTimeRange` (sin `CUSTOM`) en `packages/types`; `summary` ahora `string | null`.
- **Web:** se eliminó `hooks/use-metrics.ts` y `mocks/mock-metrics.json`; tipos del dashboard reexportan `@sgia/types`. `groupBy` por entidad según §4 (fuera `CAREERS.level`); `TOTAL`/`AVERAGE` ocultos en `ALERTS` y `MAINTENANCE`; `CUSTOM` con fechas; `limit`. `sanitizeCharts` limpia plantillas viejas de `localStorage` con `groupBy` inválidos.
- **Menú de gráficos:** `ChartConfigModal` reemplaza al asistente post-drop y al constructor (sin uso). Se abre al soltar un widget (zona destacada, ranuras) o al pulsar «Añadir» del catálogo; permite cambiar tipo, entidad, cálculo, agrupación, período, límite y título, con sugerencias por tipo.
- **Gráficos:** `MetricChart` + `lib/chart-format.ts`: registro selectivo de Chart.js, paleta sin rojo (rojo solo en semántica crítica), colores cíclicos, `secondaryValue` como segunda serie, leyenda por `category`, `%` en `RATE`, etiquetas truncadas, estados "sin datos", error y sin permisos. Se neutralizó el rojo de banners, zona de soltado y paleta.
- **Verificación:** typecheck web/api-client/types sin errores, lint web 0, 177 tests pasan (+20 en `metrics-api.test.tsx`). `apps/mobile` no compila por dependencias sin instalar (preexistente, ajeno a este cambio).
- **Pendiente:** previsualización en vivo en el menú; no se probó contra el backend real ni se revisó el render visual en navegador.


---

## FIX-008: Capa de datos para el plan Equipos (unidades, carreras, campos nuevos)

- **Fecha:** 2026-10-31
- **Módulo:** `packages/types` y `packages/api-client` según `ENDPOINTS.md` (rama backend `plan/modelos-y-equipos`)
- **Cambios:**
  - Tipos nuevos en `packages/types/src/unidad.ts`: `EquipmentUnit`, estados, `Career`, payloads.
  - Servicios y hooks en `packages/api-client/src/{services,hooks}/units.ts`: unidades (`/products/{id}/units`, `/equipment-units/*`, código de barras, hoja de vida, escaneo `by-code`), carreras (`/careers`), foto de evidencia.
  - `Producto`: `type` (`maqueta`), `category_id`, `career_id`, mantención, `reference_price`, cantidades en reparación/baja. Nuevo `updateProductCondition` (`PATCH /products/{id}/condition`, solo insumos). `setProductoActivo` ahora usa `PATCH /products/{id}/status`.
  - Ubicaciones: `storeroom_id`, `building`, `floor`; cajones: `barcode`. Proveedor: `rut`, `address`.
  - Préstamos: `unit_ids` en checkout/checkin, `deliverLoan(id, payload?)` con `items[{item_id, unit_ids}]`, `storeroom_id`, `delivered_quantity`, `returned_quantity`, `units[]`.
  - Informes de novedades: `equipment_unit_id`, `request_type`, `evidence_photo`.
- **Verificación:** typecheck web/api-client/types sin errores, 177 tests web pasan. `apps/mobile` no compila por dependencias sin instalar (preexistente).
- **Pendiente:** pantallas (detalle de producto con tabla de unidades, selector de unidad en novedades, devolución por unidad, `category_id` obligatorio en alta de producto, quitar campos de cantidad al editar equipos). Los checkboxes de `ENDPOINTS.md` siguen sin marcar.


---

## FIX-009: Módulo de Compras y Adquisiciones (REQ-08)

- **Fecha:** 2026-11-01
- **Módulo:** `apps/web` (`features/compras`), `packages/api-client`, `packages/types` — [REQ-08](TASKS/REQ-08-COMPRAS-ADQUISICIONES.md)
- **Cambios:**
  - Tipos: `PurchaseStatus` queda en `pendiente | en_camino | completa` (la API ya no tiene `rechazada`); `PurchaseOrder` suma `code`, `received_at`, `guide_number`, `arrival_document_url`.
  - api-client: los servicios de compras desenvuelven `data` y normalizan montos; nuevo `downloadPurchaseArrivalDocument` (`GET /purchases/{id}/arrival-document`).
  - Web: ruta `/compras` (AD-01, DIR-01, PAN-01) con tabla, filtros por estado y búsqueda; formulario de orden desde cotización aceptada o compra directa (solo AD-01/DIR-01); detalle con transiciones según `allowed_transitions`, confirmación de llegada y registro de guía/factura (`arrival-scan`). `PurchaseStatusBadge`.
  - Cotizaciones: «Generar orden de compra» ahora aparece con cotización `aceptada` (antes `completa`) y abre `/compras?cotizacion={id}`.
- **Verificación:** typecheck web/api-client/types sin errores, 184 tests web pasan (+2). `apps/mobile` no compila por dependencias sin instalar (preexistente).
- **Pendiente:** no probado contra el backend real; la forma exacta del Resource de compra (`code`, `total_amount`) se asumió y el normalizador tolera `total`.

---

## FIX-010: Presupuestos anuales e ingreso de facturas con descuento de presupuesto (REQ-16 / REQ-17)

- **Fecha:** 2026-11-03
- **Módulo:** `apps/web` (`features/presupuestos`, `features/ingresos-factura`, `features/compras`, `features/inventario`), `packages/api-client`, `packages/types` — [REQ-16 / REQ-17](TASKS/REQ-16-REQ-17-PRESUPUESTOS-INGRESO-FACTURAS.md)
- **Cambios:**
  - Tipos: `presupuesto.ts` (`AnnualBudget`, `BudgetSummaryRow`, `BudgetMovement` con los 6 tipos del ledger confirmados en el backend, `BudgetSpending`, `BudgetMonthly`) e `ingreso-factura.ts` (`InvoiceIntake`, OCR, payload de confirmación). `PurchaseStatus` suma `cancelada`; `PurchaseOrder` suma `annual_budget_id` y `reserved_amount`; `CreatePurchasePayload` exige `annual_budget_id` y `unit_price`.
  - api-client: servicios y hooks de `/budgets` (lista, resumen, detalle, movimientos, gasto, mensual, CRUD) y `/invoice-intakes` (lista, detalle, subida multipart, confirmar, anular, archivo autenticado). Montos string → number. `useCancelPurchase`. Crear/cancelar compra y confirmar/anular ingreso invalidan `budgets` (y productos, unidades y compras cuando corresponde).
  - Compras (fase 1): formulario reescrito con React Hook Form + Zod (presupuesto obligatorio con disponible visible, `unit_price` obligatorio, `422` en `total` mostrado junto al presupuesto); detalle con presupuesto/reserva, «Cancelar compra» y «Registrar factura e ingresar stock»; filtro `cancelada`.
  - Presupuestos (fase 2): ruta `/presupuestos` (AD-01, DIR-01) con cinta métrica, tabla TanStack por año con barra de ejecución, alta/edición/eliminación y panel lateral con pestañas Movimientos, Gasto, Mensual (Chart.js con paleta validada y tabla de respaldo) y Facturas.
  - Ingresos de factura (fase 3): ruta `/ingresos-factura` (AD-01, DIR-01) con bandeja filtrable, subida (archivo + presupuesto + compra opcional, manejo de `429` y OCR no disponible), revisión lado a lado con el archivo, asociación automática por nombre, alta rápida de producto (cantidad 0), cajón obligatorio para equipos/maquetas, aviso de monto y anulación con reversa.
  - Inventario: se retira `factura-upload-modal` (`POST /api/invoices/scan`); el botón «Ingresar por factura» lleva a `/ingresos-factura`.
  - Corrección: los `select` numéricos con valor inicial (cotización preseleccionada, producto asociado por OCR) se controlan con `Controller`; registrados sin controlar no mostraban el valor inicial.
  - Tests preexistentes con errores de tipo (`purchase-hooks.test.tsx`, `producto-unidades-panel.test.tsx`) ajustados a `noUncheckedIndexedAccess`.
- **Verificación:** `pnpm --filter @sgia/web typecheck` y `lint` sin errores; typecheck de `api-client` y `types` sin errores; 204 tests web pasan (42 archivos, +19 tests). `apps/mobile` no compila por dependencias sin instalar (preexistente).
- **Pendiente:** no probado contra el backend real. Los selectores cargan hasta 100 productos/cajones/presupuestos. DIR-01 ve todas las carreras al crear un presupuesto (el `UserResource` no expone sus carreras; el backend responde `403`). El tipo `ajuste` del ledger no trae dirección: se muestra `notes`.

---

## FIX-011: Notificaciones visibles sobre modales y sheets

- **Fecha:** 2026-11-03
- **Módulo:** Notificaciones globales (`apps/web`)
- **Archivos Modificados:**
  - [`apps/web/src/index.css`](apps/web/src/index.css)
- **Problema:** con un `Dialog` o `Sheet` abierto, los toasts de `sileo` quedaban detrás del overlay (`backdrop-blur`) y se veían difuminados. El viewport de sileo trae `z-index: 50`, igual que los overlays (`z-50` / `z-[60]`), y el portal del modal se monta después en el DOM, por lo que lo tapaba.
- **Corrección:** override `[data-sileo-viewport] { z-index: 100; }` en `index.css`, por encima de cualquier capa de la app.
- **Verificación:** `pnpm --filter @sgia/web typecheck` sin errores; 204 tests web pasan (42 archivos). `apps/mobile` sigue sin compilar por dependencias sin instalar (preexistente).

---

## FIX-012: Alta de producto con tipo, categoría y carrera (PAN-01 lee catálogos)

- **Fecha:** 2026-11-03
- **Módulo:** Inventario (`apps/web`) — [ENDPOINTS.md §2.0 y §3](ENDPOINTS.md)
- **Contexto:** `ENDPOINTS.md` abre `GET /api/categories` y `GET /api/careers` a `PAN-01`. El formulario de inventario no enviaba `category_id` (obligatorio en `POST /api/products`), así que el alta respondía `422`.
- **Archivos Modificados / Creados:**
  - [`apps/web/src/features/inventario/components/producto-form-dialog.tsx`](apps/web/src/features/inventario/components/producto-form-dialog.tsx)
  - [`apps/web/src/features/inventario/lib/producto-form-schema.ts`](apps/web/src/features/inventario/lib/producto-form-schema.ts) (nuevo)
  - [`apps/web/src/features/inventario/producto-form-schema.test.ts`](apps/web/src/features/inventario/producto-form-schema.test.ts) (nuevo)
  - `apps/web/src/features/presupuestos/pages/presupuestos-page.tsx`, `components/budget-select.tsx` (comentarios: DIR-01 ya no está limitado a sus carreras)
- **Cambios:**
  - Campos nuevos en alta/edición: `type` (`insumo`/`equipo`/`maqueta`), `category_id` (obligatorio) y `career_id`.
  - Validación de UX (Zod): un insumo sin código de barras exige carrera; un equipo/maqueta con cantidad > 0 exige carrera y cajón (`cajon_id` o `sala` + `cajon`).
  - Alta de equipo/maqueta: la cantidad se rotula «Unidades a crear».
  - Edición de equipo/maqueta: la cantidad queda de solo lectura y no se envía en el `PATCH`, porque el backend responde `422` si llega.
  - Presupuestos (gestión DIR-01, resumen, ledger, gasto, mensual), ingresos de factura (`purchase_id`, anular confirmados) y compras (`annual_budget_id`, `unit_price` obligatorio, `cancel`) ya estaban implementados en FIX-009/FIX-010.
- **Verificación:** `pnpm --filter @sgia/web typecheck` y `lint` sin errores; 212 tests web pasan (43 archivos, +8 tests).
- **Pendiente:** el cliente no sabe si la carrera elegida tiene `code`. Si no lo tiene, el backend responde `422` y el formulario muestra su mensaje. No probado contra el backend real.

---

## FIX-013: Presupuestos en tarjetas (hasta 3 por fila)

- **Fecha:** 2026-11-03
- **Módulo:** Presupuestos (`apps/web`) — REQ-16
- **Archivos:**
  - [`apps/web/src/features/presupuestos/components/budget-card.tsx`](apps/web/src/features/presupuestos/components/budget-card.tsx) (nuevo)
  - [`apps/web/src/features/presupuestos/components/budget-summary-grid.tsx`](apps/web/src/features/presupuestos/components/budget-summary-grid.tsx) (nuevo, reemplaza `budget-summary-table.tsx`, eliminado)
  - [`apps/web/src/features/presupuestos/budget-summary-grid.test.tsx`](apps/web/src/features/presupuestos/budget-summary-grid.test.tsx) (nuevo)
  - `components/budget-execution-bar.tsx` (prop `barClassName` para ancho flexible), `pages/presupuestos-page.tsx`
- **Cambios:** la tabla del resumen pasa a una grilla de tarjetas (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`) dentro del mismo marco con el selector de año. Cada tarjeta trae el código de la carrera en `font-mono`, el año, el disponible destacado, la barra de ejecución a todo el ancho y el desglose inicial / reservado / consumido. Clic o Enter abre el detalle, y el menú `MoreHorizontal` (editar / eliminar) solo aparece a AD-01 y DIR-01. Las tarjetas se ordenan por carrera; se pierde el ordenamiento por columna de la tabla.
- **Verificación:** `pnpm --filter @sgia/web typecheck` y `lint` sin errores; 217 tests web pasan (44 archivos, +5 tests).

---

## FIX-015: Interfaces web del profesor (PRO-01) — REQ-21

- **Fecha:** 2026-11-05
- **Módulo:** `apps/web` (`features/profesor`, `features/auth`, `layouts`), `packages/types`, `packages/api-client` — [REQ-21](TASKS/REQ-21-PROFESOR-WEB.md)
- **Cambios:**
  1. **Acceso:** `PRO-01` pasa a ser rol web (`WEB_ROLES`), con inicio en `/profesor/solicitudes`; el menú se reduce a Catálogo, Mis solicitudes y Novedades y las rutas del panel le devuelven acceso denegado (y viceversa). Acceso rápido «PRO-01 (Profesor)» (`docente@sgia.cl`) en el login.
  2. **Catálogo y nueva solicitud:** carrera, asignatura, fecha, hora de inicio y término, pañol, laboratorio (salas y talleres del pañol elegido) y lista de insumos con cantidad ≤ stock. El profesor es el usuario autenticado. Se envían `start_time`, `end_time`, `storeroom_id` y `location_id`; el backend deriva `room` y `time_block` (el móvil sigue con `room`/`time_block`).
  3. **Mis solicitudes:** tabla con carrera, horario, laboratorio, pañol y estado, detalle con insumos y motivo de rechazo, y cancelación solo en `pendiente`. Las fechas sin hora (`loan_date`, `report_date`) se muestran sin desfase de zona horaria (`formatDateOnly`).
  4. **Novedades:** lista propia, detalle con descarga del PDF y formulario con casillas por problema, firma en `<canvas>`, foto y vista previa del equipo por código.
  5. `api-client`/`types`: contrato nuevo de `POST /loans/requests` y lecturas (`career`, `storeroom`, `location`, `teacher`, horas) y filtro `storeroom_id` en ubicaciones.
- **Verificación:** `pnpm typecheck` y `pnpm --filter @sgia/web test` (325 tests) sin errores. Probado en Chromium contra la API real (`localhost:8000`, `docente@sgia.cl`): login con el acceso rápido, solicitud completa (creada, listada, detallada y cancelada) e informe con firma dibujada, foto y equipo por código (detalle y PDF 200). Hallazgos corregidos en esa prueba: la fecha del informe por defecto usaba el día UTC (`todayIso` ahora es local; de noche daba «fecha futura»), `report_date` se mostraba un día antes en el detalle (`formatDateOnly` compartido) y el detalle ofrecía al profesor los botones de cambio de estado, que el backend rechaza con 403 (`readOnly`). La base local necesitaba `php artisan migrate`. `normalizeRoleCode` devuelve `PRO-01` ante un rol desconocido, así que ese caso ya no se rechaza en el login web (el backend aplica los permisos).

---

## FIX-016: Solicitud remota ampliada en el pañol — cola por pañol, filtros y vencimiento (REQ-21)

- **Fecha:** 2026-11-05
- **Módulo:** `packages/types`, `packages/api-client`, `apps/web` (`features/prestamos`, `features/profesor`, `components/shared`) — [solicitud-prestamo-profesor](TASKS/solicitud-prestamo-profesor.md)
- **Cambios:**
  1. **Cola del pañol (`GET /loans/pending`):** cada tarjeta muestra profesor (`teacher`), fecha y horario, laboratorio, pañol y carrera; los préstamos antiguos caen a `time_block`/`room`. `PAN-01` ve la cola de su pañol (lo filtra el backend); `AD-01` tiene un selector de pañol que envía `?storeroom_id=` (`PendingLoanParams`).
  2. **Historial y exportación (`GET /loans`, `/loans/export`):** filtros nuevos de pañol, laboratorio (salas y talleres del pañol elegido) y fecha de actividad (`storeroom_id`, `location_id`, `loan_date`), también en la exportación. La columna «Laboratorio / Pañol» y el detalle muestran laboratorio, pañol, fecha de actividad y horario.
  3. **Formulario del profesor:** vencimiento opcional (`due_date`, no anterior a la fecha de la actividad; vacío = mismo día) y los `422` del backend se muestran junto a cada campo (`items.{i}.quantity` con el stock del pañol, `location_id`, etc.).
  4. Selectores compartidos `StoreroomSelect` y `LaboratorySelect`; los formateadores de préstamo (`loanSchedule`, `loanLaboratory`, `loanStoreroom`, `loanTeacher`, `loanCareer`) pasan a `features/prestamos/lib/loan-display.ts`.
- **Verificación:** `pnpm typecheck` (5/5) y `pnpm --filter @sgia/web test` (337 tests) sin errores; lint limpio en los archivos tocados. No probado aún contra la API real.

---

## FIX-017: Revisión de solicitudes remotas y elección de unidades en el pañol (REQ-10)

- **Fecha:** 2026-11-08
- **Módulo:** `packages/types`, `packages/api-client`, `apps/web` (`features/prestamos`) — [REQ-10](TASKS/REQ-10-OPERACION-PRESTAMOS-PANOL.md)
- **Cambios:**
  1. **Revisión (`GET /loans/{id}/review`):** la tarjeta de la cola cambia «Aprobar / Preparar» por «Revisar». El diálogo muestra los detalles de la solicitud y las unidades propuestas por el sistema, con código, número de serie, sala y cajón, ordenadas por sala y cajón. `LoanReviewDialog`, `LoanReviewUnitRow`, `useLoanReview` y `fetchLoanReview`.
  2. **Elección por código:** «Cambiar» acepta un código escrito o escaneado, que se busca en `available_units`. Un código no disponible o ya elegido muestra un error en línea y no cambia la selección. Las unidades cambiadas se marcan y se puede restablecer la propuesta. La lógica está en `lib/loan-review-selection.ts`.
  3. **Aprobación (`POST /loans/{id}/approve` con `items`):** se envían todas las unidades visibles. Con faltante, «Aprobar» queda deshabilitado. Ante un `422` se vuelve a pedir la revisión y se avisa que la propuesta pudo cambiar.
  4. **Corrección de `normalizePrestamo`:** antes se descartaban `id` y `units` de cada ítem, y `cajon` podía llegar como objeto y mostrarse como `[object Object]`. `approve`, `reject`, `checkout`, `deliver` y `checkin` leen ahora `loan` o `data`; antes normalizaban el envoltorio de la respuesta.
  5. **Tarjeta de la cola:** ya no inventa `Pañol` o `G-0` cuando falta la sala o el cajón.
- **Verificación:** `pnpm --filter @sgia/web test` (374 tests), typecheck de `apps/web`, `api-client` y `types`, y ESLint de `apps/web` sin errores. `pnpm typecheck` y `pnpm lint` fallan solo por errores previos de `apps/mobile`, que no se tocó.

---

## FIX-018: Préstamos limitados al pañol de `PAN-01` (REQ-10, REQ-11)

- **Fecha:** 2026-11-08
- **Módulo:** `apps/web` (`features/prestamos`) — [REQ-11](TASKS/REQ-11-HISTORIAL-AUDITORIA-PRESTAMOS.md)
- **Cambios:**
  1. **Backend:** `PAN-01` solo ve y opera los préstamos de su pañol, y solo registra presenciales ahí; `403` si son de otro. `active_loan` de una unidad viene `null` si el préstamo es de otro pañol. `DIR-01` y `AD-01` no se limitan.
  2. **Historial:** `PAN-01` ya no ve el filtro de pañol, y el filtro de laboratorio usa su pañol.

---

## FIX-019: Botón «Cambiar elementos» con escaneo en la revisión (REQ-10)

- **Fecha:** 2026-11-08
- **Módulo:** `apps/web` (`features/prestamos`) — [REQ-10](TASKS/REQ-10-OPERACION-PRESTAMOS-PANOL.md)
- **Cambios:**
  1. **Botón por producto:** «Cambiar elementos» reemplaza la acción «Cambiar» de cada fila. Es opcional: sin usarlo se aprueba la propuesta del sistema.
  2. **Escaneo:** `LoanReviewScanPanel` pide exactamente la cantidad solicitada, muestra el avance, avisa con sonido y mantiene el foco para el siguiente código. Los elementos se reemplazan al completar la cantidad.
  3. **Selección:** `scanUnit` reemplaza a `replaceUnitByCode`. Una unidad de la propuesta se puede escanear para conservarla.

---

## FIX-020: Carrera obligatoria en la solicitud móvil y lint de `apps/mobile` (REQ-09)

- **Fecha:** 2026-11-09
- **Módulo:** `apps/mobile` — [REQ-09](../TASKS/REQ-09-PRESTAMOS-REMOTOS.md)
- **Cambios:**
  1. **Selector de carrera:** la solicitud carga `GET /api/careers` y envía `career_id`, que el backend exige. Antes no se enviaba, y eso rompía `pnpm typecheck`.
  2. **Lint:** el error de `expo-secure-store` venía de una caché vieja en `.expo/cache/eslint`. No requirió cambios de código.
- **Verificación:** `pnpm typecheck` y `pnpm lint` pasan. Sin probar en un dispositivo.

---

## FIX-021: Cerrar sesión con cuenta desactivada (REQ-01)

- **Fecha:** 2026-11-09
- **Módulo:** `packages/api-client` (`http.ts`), compartido por web y móvil
- **Cambios:**
  1. **`403` con `code: "account_inactive"`:** si había un token en uso, cierra la sesión, también en descargas (`getBlob`).
  2. **Sin cambios:** un `403` sin ese código sigue siendo falta de permisos, y en el login, sin token, se muestra el mensaje del servidor.
- **Verificación:** `account-inactive.test.ts` (4 tests; 2 fallaban antes del arreglo).

---

## FIX-022: Accesos rápidos del login solo en desarrollo (REQ-21)

- **Fecha:** 2026-11-09
- **Módulo:** `apps/web` (`features/auth`) — [REQ-21](../TASKS/REQ-21-PROFESOR-WEB.md)
- **Cambios:**
  1. **Contraseña:** sale del código a `VITE_DEV_QUICK_LOGIN_PASSWORD` (`apps/web/.env.example`).
  2. **Visibilidad:** el bloque solo se muestra en `vite dev` y con la variable definida.
- **Verificación:** 3 tests nuevos en `login.test.tsx`. Un build de producción con `.env.local` presente no contiene ni la contraseña ni el bloque.
- **Pendiente:** la contraseña sigue en el historial de git. No debe usarse en producción (ahí la define `SEED_ADMIN_PASSWORD`).

---

## FIX-023: `pnpm lint` de `apps/web`

- **Fecha:** 2026-11-09
- **Módulo:** `apps/web` (`features/profesor/components/catalog-panel.tsx`)
- **Cambios:** se quitó un `eslint-disable` de `react-hooks/exhaustive-deps`, regla que la web no tiene configurada y que ESLint trataba como error.
- **Verificación:** `pnpm lint` pasa en todo el monorepo.

---

## FIX-024: Solicitud móvil: fecha, catálogo y mensajes de error (REQ-09)

- **Fecha:** 2026-11-09
- **Módulo:** `apps/mobile`, `packages/api-client`, `apps/web/src/lib/api-error.ts` — [REQ-09](../TASKS/REQ-09-PRESTAMOS-REMOTOS.md)
- **Cambios:**
  1. **Fecha:** se propone el día local en vez del día UTC. Requiere el cambio del backend `809511b`, que valida `loan_date` con el día de Chile; sin él, la fecha de hoy recibe `422` por la noche. Eso también corrige la web del profesor.
  2. **Catálogo:** la búsqueda usa `search` en el servidor, con espera de 300 ms entre teclas. Ya no se limita a los primeros 50 productos, y también avisa si no hay resultados o falla la carga.
  3. **Errores:** se muestra el mensaje de validación del backend. Los fallos `5xx` y de conexión tienen su propio mensaje.
  4. **`apiErrorToMessage`:** pasa a `api-client`; la web la reexporta desde `lib/api-error.ts`.
- **Verificación:** `pnpm typecheck`, `pnpm lint`, 392 tests web, `expo export --platform web` y `LoanRemoteRequestTest` en el backend. Móvil sin tests propios ni prueba en un dispositivo.

---

## FIX-025: El backend pasa a la hora de Chile

- **Fecha:** 2026-11-09
- **Módulo:** documentación (`ENDPOINTS.md`, `front-end.md`); el cambio está en el backend
- **Cambios:** la API opera en `America/Santiago`, y las fecha-hora pueden llegar con `-03:00`/`-04:00` o con `Z`. El cliente no requiere cambios: las interpreta con `new Date()` o usa solo la parte de la fecha.

---

## FIX-026: Actualización de `apps/mobile` a Expo SDK 58

- **Fecha:** 2026-11-09
- **Módulo:** `apps/mobile`, `apps/web/package.json`, `package.json`
- **Motivo:** Expo Go ya no permite abrir el proyecto con SDK 57.
- **Cambios:**
  1. **Dependencias:** Expo 58, React Native 0.88 y React 19.3, alineadas con `expo install --fix`. `@expo/dom-webview` y `@react-native/metro-config` se declaran explícitamente porque quedaban en versiones anteriores.
  2. **Una sola versión de React:** `pnpm.overrides` en la raíz y la web en 19.3. `packages/api-client` usa la copia de React de cada app, y dos versiones distintas rompen los hooks al ejecutar.
  3. **Tipos de React Native 0.88:** `useColorScheme` ya no devuelve `unspecified` y puede devolver `null`; los manejadores de `Pressable` y `TextInput` no aceptan directamente el `handleSubmit` de React Hook Form.
- **Verificación:** `expo-doctor` (20/20), `pnpm typecheck`, `pnpm lint`, 392 tests web, build de la web y `expo export` para Android, iOS y web. Pendiente de probar en Expo Go en un dispositivo.

---

## FIX-027: Lista desplegable y campo de fecha en la solicitud móvil

- **Fecha:** 2026-11-09
- **Módulo:** `apps/mobile` (Solicitud de Préstamo), `TASKS/REQ-09`, `TASKS/REQ-13`
- **Cambios:**
  1. **`SelectField`:** Carrera y Bloque Horario pasan de chips horizontales a lista desplegable vertical.
  2. **`DateField`:** la fecha deja de ser texto libre y usa el selector nativo (`@react-native-community/datetimepicker`) o `<input type="date">` en web. Muestra `DD-MM-AAAA`, sigue enviando `AAAA-MM-DD` y no permite fechas pasadas.
  3. **Especificación:** REQ-09 y REQ-13 fijan estos controles para los formularios móviles.
- **Verificación:** `pnpm typecheck`, lint de móvil, 392 tests web, `expo-doctor` (20/20) y `expo export` para Android y web. Móvil sin tests propios ni prueba en un dispositivo.

---

## FIX-028: Informe de novedades del pañolero y en la app móvil

- **Fecha:** 2026-11-09
- **Módulo:** `apps/web` (`/novedades`), `apps/mobile` (pestaña Novedades), `TASKS/REQ-13`, `ENDPOINTS.md`, `AGENTS.md`; el permiso de `PAN-01` está en el backend
- **Cambios:**
  1. **Pañolero:** la bandeja web muestra Nuevo informe solo a `PAN-01`, con el formulario del docente. Los textos dejan de asumir que reporta un docente.
  2. **Móvil:** pestaña Novedades con historial, detalle y formulario para `PRO-01`, con problemas en lista desplegable múltiple, fecha nativa, foto y firma.
  3. **Dependencias móviles:** `expo-image-picker`, `react-native-svg`, `react-native-view-shot`, `zod` y `@hookform/resolvers`.
- **Pendiente:** escanear el código del equipo, y ver el PDF, la firma y la foto desde el móvil.
- **Verificación:** `pnpm typecheck`, lint, 395 tests web, `expo-doctor` (20/20) y `expo export` para Android, iOS y web. Móvil sin tests propios ni prueba en un dispositivo.

---

## FIX-029: Enviar la foto del informe de novedades desde el móvil

- **Fecha:** 2026-11-09
- **Módulo:** `apps/mobile` (Novedades), `packages/types`, `packages/api-client`
- **Causa:** el `fetch` de Expo no admite partes `{ uri, name, type }` en `FormData` y lanza `Unsupported FormDataPart implementation`. Como no era una respuesta de la API, la app mostraba "No se pudo conectar con el servidor".
- **Cambios:**
  1. **Envío:** la foto va como `File` de `expo-file-system`, y `CreateIncidentReportPayload` deja de aceptar `{ uri, name, type }`.
  2. **Tamaño:** se reduce a un máximo de 1600 px en JPEG con `expo-image-manipulator`. Sin esto, una foto de cámara superaría el `upload_max_filesize` de 2 MB del PHP de desarrollo.
  3. **Diagnóstico:** en desarrollo, `requestErrorMessage` registra el error real cuando no viene de la API.
- **Verificación:** `pnpm typecheck`, lint, tests web y `expo export`. El envío real debe confirmarse en un dispositivo.

---

## FIX-030: Pañol, laboratorios y existencias en la solicitud móvil

- **Fecha:** 2026-11-09
- **Módulo:** `apps/mobile` (Solicitud de Préstamo), `TASKS/REQ-09`
- **Cambios:**
  1. **Pañol a solicitar:** campo nuevo y obligatorio; por defecto, el pañol del usuario si tiene uno.
  2. **Laboratorios:** salen de la API, solo salas y talleres del pañol elegido. Reemplazan al texto libre `room`.
  3. **Existencias:** el catálogo y el carrito muestran las del pañol elegido, sin permitir agregar más de lo disponible. La API sigue siendo quien valida al enviar.
  4. **Horario:** el bloque se envía como `start_time` y `end_time`, el formato de la API para clientes actuales.
- **Limitación:** al cambiar de pañol, un producto del carrito que no aparece en la búsqueda actual queda con "Existencias por confirmar"; si no alcanza, responde la API al enviar.
- **Verificación:** `pnpm typecheck`, lint y `expo export`. Móvil sin tests propios; confirmar en un dispositivo.

---

## FIX-031: Ubicación del informe de novedades

- **Fecha:** 2026-11-09
- **Módulo:** `apps/web`, `apps/mobile`, `packages/types`, `TASKS/REQ-13`, `ENDPOINTS.md`; la validación está en el backend
- **Cambios:** el selector ofrece salas, talleres y pañoles, sin bodegas (`INCIDENT_LOCATION_TYPES`), y pasa a llamarse "Laboratorio o pañol". El backend responde `422` si llega una bodega.
- **Verificación:** `pnpm typecheck`, lint, tests web y `expo export`. Los cambios de FIX-029 y FIX-030 ya se probaron manualmente en un dispositivo; este selector aún no.

---

## FIX-032: Nuevo flujo de compras — solicitud de compra (Fases 1 a 6, frontend)

- **Fecha:** 2026-11-10
- **Módulo:** `apps/web` (`features/solicitudes-compra`, `features/proveedores`, `features/ingresos-factura`), `packages/types`, `packages/api-client`; plan en `NUEVO-FLUJO-COMPRAS.md`
- **Cambios:**
  1. **Áreas de proveedor (Fase 1):** `Supplier.areas` (`informatica`, `diseno`, `telecomunicaciones`, `ciberseguridad`). El formulario pasa a RHF + Zod con multiselección de áreas obligatoria (≥1) y deja de editar `category` (en retiro). El listado suma la columna Áreas (aviso "Sin área" en proveedores viejos) y el filtro `area`.
  2. **Solicitudes (Fase 2):** rutas `/solicitudes-compra` (TanStack Table, filtros de estado, código y fechas) y `/solicitudes-compra/:id`, entrada "Solicitudes de compra" en el menú (`DIR-01` escribe; `AD-01` y `PAN-01` leen). Formulario de borrador con productos, cantidades y presupuesto; Aprobar, Editar y Cancelar con confirmación.
  3. **Envío por áreas (Fase 3):** diálogo con áreas, conteo de proveedores activos y vista previa de destinatarios sin duplicados; panel de proveedores contactados con estado del correo y "Reenviar fallidos".
  4. **Cotizaciones (Fase 4):** subida `multipart` (proveedor contactado, archivo PDF/imagen/Word/Excel, total y precio unitario por ítem), descarga autenticada, eliminación, comparador de totales y "Elegir" libre con mínimo 3.
  5. **OC (Fase 5):** subida del archivo y número de la OC (reserva el total elegido) y descarga.
  6. **Factura (Fase 6):** al subir una factura se puede indicar el código `SC-AAAA-NNNN` (`purchase_request_code`), con búsqueda de la solicitud; desde el detalle, "Registrar factura" abre `/ingresos-factura?solicitud=…`. Confirmar o anular una factura invalida las solicitudes.
- **Contrato:** alineado con `PurchaseRequestResource` del backend (`can_*`, `min_quotations`, `order` = `PurchaseResource` con `invoices`, `file_url`, envoltura `purchase_request` en `send`/`resend`/`quotations`). Las pantallas de `/cotizaciones` no se tocaron (se retiran en la Fase 7).
- **Realineación con el backend final:** `status_label`, `approver`, `email_status`, `order_number` y proveedor de la OC; `received_at` opcional y un precio por cada ítem al subir la cotización; aviso `facturada → con_oc`; el detalle de compra oculta "Cancelar" en OC de solicitud (el backend responde `422`) y "Registrar factura" usa `?solicitud=`; la subida de factura desde una OC vuelve a enviar `purchase_id`/`annual_budget_id`. Se corrigió la nota falsa "Facturas sin presupuesto ni compra" de `front-end.md`.
- **Prueba contra el backend real:** flujo solicitud → PATCH con `annual_budget_id` → aprobar → enviar → 3 cotizaciones → elegir → OC → detalle/listado, por el kernel HTTP real con token Sanctum, dentro de una transacción revertida (sin datos residuales). Las respuestas reales se pasaron por `normalizePurchaseRequest` y coinciden con los tipos; se confirmaron los `422` de cotización con precios incompletos y de `POST /api/purchases/{id}/cancel` sobre OC de solicitud.
- **Verificación:** `pnpm typecheck`, `pnpm lint` y `pnpm --filter @sgia/web test` en verde. Tests nuevos: `purchase-request-hooks.test.tsx`, `purchase-request-schemas.test.ts`, `quotations-panel.test.tsx`, `supplier-form-schema.test.ts` y casos de áreas en `proveedores-table.test.tsx`. Sin prueba manual contra el backend real todavía.

---

## FIX-033: Fase 7 del nuevo flujo de compras — cotizaciones en solo lectura

- **Fecha:** 2026-11-10
- **Módulo:** `apps/web` (`features/cotizaciones`, `features/compras`, `layouts/app-layout.tsx`, `features/auth/types/roles.ts`), `packages/api-client`, `packages/types`
- **Cambios:**
  1. `/cotizaciones` pasa a **Historial de cotizaciones** en solo lectura: lista y detalle sin acciones, con aviso y enlace a Solicitudes de compra. El menú la mueve al final del bloque de compras como "Historial cotizaciones" (icono `Archive`).
  2. Eliminados: `CotizacionFormDialog` (crear), `QuotationResponseDialog` (registrar respuesta), aceptar/rechazar del detalle, "Aprobar y generar orden de compra", `PurchaseFormDialog` + `purchase-form-schema` (crear compra desde cotización) y el parámetro `?cotizacion=` de `/compras`. `/compras` enlaza a "Nueva compra desde una solicitud" (solo `DIR-01`).
  3. api-client: fuera `createCotizacion`, `updateQuotationStatus`, `updateQuotationResponse`, `createPurchase` y sus hooks; tipos `CreateCotizacionPayload`, `QuotationResponsePayload` y `CreatePurchasePayload`; acciones `changeQuotationStatus`, `respondQuotation` y `createPurchase` de `ACTION_ROLES`. Tests eliminados con ellos: `cotizacion-hooks.test.tsx`, `cotizacion-form.test.tsx` y `purchase-form-schema.test.ts`.
  4. El frontend solo llama `GET /api/quotations` y `GET /api/quotations/{id}` del flujo antiguo. `NUEVO-FLUJO-COMPRAS.md` se copió del backend conservando los checkboxes Front.
- **Verificación:** `pnpm typecheck`, `pnpm lint` y `pnpm --filter @sgia/web test` en verde.

---

## FIX-034: Solapamiento de bloques en el sidebar encogido

- **Fecha:** 2026-11-11
- **Módulo:** Layout / Sidebar colapsado (`apps/web`)
- **Archivos Modificados:**
  - [`apps/web/src/layouts/app-layout.tsx`](apps/web/src/layouts/app-layout.tsx)
  - [`apps/web/src/index.css`](apps/web/src/index.css)
- **Causa:**
  1. Los íconos de los bloques superior (logo / expandir) e inferior (usuario, ajustes, tema, cerrar sesión) usan `.gnav-item`, pero su tamaño de 36px solo se aplicaba dentro de `.gnav[data-orientation="vertical"]`; fuera de la barra de módulos quedaban sin tamaño y pegados entre sí.
  2. La barra de módulos se centraba con `justify-center` dentro de un contenedor con scroll: si no cabía en la altura de la ventana, desbordaba por arriba y abajo y quedaba recortada encima de los otros bloques.
- **Solución:**
  1. Clase `rail-collapsed` en el `aside` encogido con variables `--rail-item` (36px) y `--rail-gap` (4px); en ventanas de hasta 940px de alto bajan a 32px / 2px. Todos los `.gnav-item` del sidebar encogido usan ese tamaño.
  2. `gap-2` entre bloques y `shrink-0` en los bloques superior e inferior.
  3. La barra de módulos se centra con `my-auto` y tiene `max-h-full overflow-y-auto`: si no cabe, el scroll ocurre dentro de la barra y conserva sus bordes redondeados.
- **Verificación:** `pnpm typecheck` y `pnpm --filter @sgia/web test` (73 archivos, 403 tests) en verde; revisión visual con Chromium headless a 620, 900 y 1080px de alto.
