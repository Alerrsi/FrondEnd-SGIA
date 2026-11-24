# Gráficos con TanStack Charts

**Estado: implementado (noviembre 2026), fases 1 a 5.** Rama `feat/tanstack-charts`. Reemplaza Chart.js / react-chartjs-2 por `@tanstack/charts` 1.5 (entrada React `@tanstack/charts/react`).

## Problema

| Hoy | Problema |
|---|---|
| Analítica (`MetricChart`), presupuestos (`BudgetMonthlyChart`) y monitoreo (`LoginActivityChart`) dibujan con Chart.js en `<canvas>`. | El canvas no tiene foco por teclado ni texto accesible por punto; happy-dom no lo dibuja y los tests mockean `react-chartjs-2`, así que no prueban nada del gráfico. |
| Los estilos viven en `lib/chart-theme.ts` como opciones de Chart.js (`tooltipStyle`, `legendStyle`, `categoryAxis`, `valueAxis`). | Atados a la API de Chart.js. |

## Decisiones

| # | Decisión |
|---|---|
| 1 | Paquete **`@tanstack/charts`** (no `@tanstack/react-charts`, que solo reexporta lo mismo). Renderer **SVG** (por defecto): pocos puntos, foco por teclado y tooltip nativos. |
| 2 | Se conservan los mismos tokens de `lib/chart-theme.ts` (paleta categórica, estados, burdeo como serie principal, Geist 12px). Se reemplazan los adaptadores de Chart.js por un `chartTheme(isDark)` para la opción `theme` y estilos de eje/rejilla comunes. |
| 3 | **Equivalencias:** `BAR` → `barY` (dos medidas: `layout: group()`); `LINE` → `areaY` + `lineY` con puntos; `DOUGHNUT` → `pie` + `radialArc` con radio interior 62%; `POLAR_AREA` → `radialBarRadius` en `polar()` (rosa); barras de presupuesto → `barY` agrupadas; inicios de sesión → `barY` apiladas. |
| 4 | **Leyenda en HTML** (`ChartLegend`, puntos de 8px, texto secundario) encima del gráfico, en lugar de la leyenda del lienzo: Trazo controla tipografía y ajuste de línea. |
| 5 | Tooltip: el de TanStack (`@tanstack/charts/tooltip`) con foco agrupado por x (`focus: 'group-x'`) y textos formateados (`formatValue`, `formatCLP`), estilado con clase Trazo (superficie, borde 1px, radio 6px). |
| 6 | Movimiento: animación de entrada corta; nada con `prefers-reduced-motion`. |
| 7 | Las tablas y textos alternativos existentes se mantienen (presupuesto con tabla debajo; `aria-label` por gráfico). |
| 8 | Los tests dejan de mockear la librería: happy-dom renderiza el SVG y se verifica geometría (cantidad de barras/porciones, colores de estado). |

## Fases

1. [x] Plan y documentos (este archivo, `CLAUDE.md`, `TASKS/REQ-14`, `REQ-DISEÑO`, `AGENTS.md`).
2. [x] `lib/chart-theme.ts` sin Chart.js + `ChartLegend`; `chart-format.ts` produce filas tipadas en vez de `ChartData`.
3. [x] `MetricChart` (4 tipos), `BudgetMonthlyChart`, `LoginActivityChart` y el pop-up ampliado (`ChartExpandButton`).
4. [x] Tests sin mocks de `react-chartjs-2`; quitar `chart.js` y `react-chartjs-2` de `package.json`.
5. [x] Revisión visual en Chromium (claro y oscuro, 390 y 1440 px) contra la API real.

## Notas de implementación

- `lib/chart-theme.ts`: `chartTheme`, `categoryAxis`, `valueAxis`, `valueGrid`, `chartAnimation` e `integerTicks` (conteos sin cifras repetidas: con Chart.js era `precision: 0`). Los tokens y la paleta no cambiaron.
- `features/dashboard/lib/metric-chart-definition.ts`: una definición por tipo; `chart-format.ts` entrega `MetricChartRow[]` (x = posición del punto, para que dos etiquetas iguales no se apilen).
- Tooltip con `content` propio: título del punto, una fila por medida (sin repetir el punto que aportan área y línea) y la categoría.
- La línea usa `curveMonotoneX` de `d3-shape` (dependencia directa, misma versión que trae TanStack Charts).
- El gráfico sigue la altura del contenedor (`style={{ height: '100%' }}` sin `height`), así sirve igual en la tarjeta y en el pop-up ampliado.

## Fuera de alcance

- Cambiar las métricas, el esquema GraphQL o los tipos de gráfico disponibles.
- Gráficos en la app móvil.
