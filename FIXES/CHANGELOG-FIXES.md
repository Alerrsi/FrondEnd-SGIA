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
