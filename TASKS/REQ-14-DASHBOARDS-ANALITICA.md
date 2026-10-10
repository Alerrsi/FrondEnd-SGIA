# REQ-14: Dashboards Analíticos y Métricas Dinámicas con GraphQL

> **Código:** `REQ-14` | **Módulo:** `FU-06` (Reportes, Dashboards y Analítica)  
> **Plataforma:** Web (`apps/web`)  
> **Roles:** Director de Carrera (`DIR-01`) y Administrador (`AD-01`)

---

## 🎯 Objetivo

Entregar visibilidad estratégica y operativa sobre el rendimiento y uso del inventario del pañol mediante **dashboards dinámicos e interactivos en tema oscuro (estética zed.dev) impulsados exclusivamente por GraphQL**.

A través del endpoint unificado `/api/metrics`, los directores (`DIR-01`) y administradores (`AD-01`) pueden consultar métricas analíticas flexibles y visualizarlas con Chart.js (`react-chartjs-2`). El sistema permite conmutar entre 3 plantillas predeterminadas de análisis y componer plantillas personalizadas a medida, seleccionando entidad, métrica, tipo de visualización y rango temporal.

---

## 📡 Endpoint de la API (`ENDPOINTS.md`)

Este módulo sustituye los endpoints REST convencionales por un único endpoint **GraphQL** para todas sus consultas analíticas, agregaciones y métricas:

| Método | Endpoint | Roles | Descripción | Estado API |
|---|---|---|---|:---:|
| `POST` | `/api/metrics` | `DIR-01`, `AD-01` | Endpoint unificado GraphQL para consultas analíticas dinámicas y generación de métricas personalizadas. | 🟡 Planificado |

### Esquema GraphQL (`/api/metrics`)

```graphql
"""
Entidad o dominio de datos sobre el cual se calculan las métricas
"""
enum MetricEntity {
  EQUIPMENT
  SUPPLIES
  LOANS
  ALERTS
  MAINTENANCE
  CAREERS
  TEACHERS
}

"""
Tipo de agregación o cálculo estadístico aplicado
"""
enum MetricAggregation {
  TOTAL
  AVERAGE
  COUNT
  RATE
}

"""
Ventana temporal para el análisis de los datos
"""
enum TimeRange {
  LAST_7_DAYS
  LAST_30_DAYS
  SEMESTER_CURRENT
  SEMESTER_PREVIOUS
  YEAR_TO_DATE
  CUSTOM
}

"""
Tipo de visualización gráfica compatible con react-chartjs-2
"""
enum ChartType {
  BAR
  LINE
  DOUGHNUT
  POLAR_AREA
}

input MetricQueryInput {
  entity: MetricEntity!
  metric: MetricAggregation!
  timeRange: TimeRange!
  groupBy: String
  dateFrom: String
  dateTo: String
  limit: Int
}

type MetricDataPoint {
  label: String!
  value: Float!
  secondaryValue: Float
  category: String
}

type MetricResult {
  entity: MetricEntity!
  metric: MetricAggregation!
  timeRange: TimeRange!
  chartType: ChartType
  points: [MetricDataPoint!]!
  summary: Float
}

type ExecutiveKpis {
  activosDisponibles: Int!
  activosEnPrestamo: Int!
  activosEnTaller: Int!
  activosDeBaja: Int!
  prestamosActivosHoy: Int!
  tasaAtrasosPct: Float!
  alertasCriticasNoResueltas: Int!
  tasaRotacionMensualPct: Float!
}

type Query {
  """
  Indicadores clave ejecutivos para la cinta métrica superior
  """
  executiveKpis(timeRange: TimeRange): ExecutiveKpis!

  """
  Consulta flexible de métricas analíticas para gráficos individuales
  """
  customMetric(input: MetricQueryInput!): MetricResult!

  """
  Consulta en batch de múltiples métricas para renderizar una plantilla completa
  """
  batchMetrics(inputs: [MetricQueryInput!]!): [MetricResult!]!
}
```

---

## 📋 Lista de Tareas Desglosada

### 1. Cliente GraphQL y Capa de Datos (`apps/web` & `@sgia/api-client`)
- [ ] **Configuración del Cliente GraphQL hacia `/api/metrics`:**
  - [ ] Función de transporte GraphQL autenticada con Bearer Token (reutilizando credenciales Sanctum).
  - [ ] Tipos TypeScript para operaciones GraphQL (`MetricEntity`, `MetricAggregation`, `TimeRange`, `ChartType`, `MetricResult`, `ExecutiveKpis`).
  - [ ] Hooks TanStack Query especializados (`useExecutiveKpis`, `useCustomMetric`, `useBatchMetrics`).

### 2. Cinta Métrica de KPIs Ejecutivos (GraphQL `executiveKpis`)
- [ ] **Cinta Métrica Compacta Superior (`MetricStrip` - Estilo Design.md):**
  - [ ] Consulta vía GraphQL `executiveKpis(timeRange: $range)`.
  - [ ] Estado de inventario: activos disponibles, en préstamo, en taller y de baja.
  - [ ] Operación diaria: préstamos activos hoy y tasa porcentual de atrasos.
  - [ ] Salud y rotación: alertas de stock crítico pendientes y porcentaje de rotación mensual.

### 3. Configuración Visual Chart.js con Tema Oscuro (`react-chartjs-2`)
- [ ] **Tokens de Diseño y Paleta Zed.dev:**
  - [ ] Fondo `#111113`, superficies `#18181b`, líneas de cuadrícula translúcidas `#27272a`.
  - [ ] Paleta semántica institucional: acentos rojo `#ef4444`, ámbar `#f59e0b`, esmeralda `#10b981`, violeta `#8b5cf6` y cian `#06b6d4`.
  - [ ] Tooltips interactivos con contraste alto, tipografía monoespaciada compacta y badges legibles.
  - [ ] Componente envolvente genérico `DynamicChartCard` que recibe `MetricResult` y lo traduce a configuración de `react-chartjs-2`.

### 4. Sistema de Plantillas y Dashboards Dinámicos
- [ ] **Selector de Plantillas Predefinidas (3 Plantillas por Defecto):**
  - [ ] *Plantilla 1: Operaciones y Movimiento de Pañol:*
    - Préstamos diarios (Línea: `LOANS` + `COUNT` + `LAST_30_DAYS`).
    - Estado y atrasos de préstamos (Dona: `LOANS` + `RATE`).
    - Alertas críticas por categoría (Barras: `ALERTS` + `COUNT`).
  - [ ] *Plantilla 2: Demanda y Desgaste por Carrera:*
    - Insumos consumidos por especialidad (Barras: `SUPPLIES` + `TOTAL` agrupado por `CAREER`).
    - Ranking de equipos más solicitados (Barras horizontales: `EQUIPMENT` + `COUNT`).
    - Préstamos por docente y asignatura (Dona / Polar: `TEACHERS` + `COUNT`).
  - [ ] *Plantilla 3: Salud del Inventario y Ciclo de Vida:*
    - Inventario ocioso / sin rotación (Barras: `EQUIPMENT` + `COUNT` en estado ocioso).
    - Incidencias y mantenciones por equipo (Línea: `MAINTENANCE` + `COUNT`).
    - Tasa de rotación semestral de insumos (Barras: `SUPPLIES` + `RATE`).
- [ ] **Constructor de Gráficos Personalizados (GraphQL Query Builder Modal):**
  - [ ] Formulario interactivo con selección de:
    - **Entidad:** `EQUIPMENT`, `SUPPLIES`, `LOANS`, `ALERTS`, `MAINTENANCE`, `CAREERS`, `TEACHERS`.
    - **Métrica:** `TOTAL`, `AVERAGE`, `COUNT`, `RATE`.
    - **Tipo de Gráfico:** `BAR`, `LINE`, `DOUGHNUT`, `POLAR_AREA`.
    - **Rango Temporal:** `LAST_7_DAYS`, `LAST_30_DAYS`, `SEMESTER_CURRENT`, `SEMESTER_PREVIOUS`, `YEAR_TO_DATE`, `CUSTOM`.
  - [ ] Previsualización en vivo ejecutando la consulta GraphQL hacia `/api/metrics`.
- [ ] **Reglas de Negocio y Restricciones Obligatorias:**
  - [ ] **Límite máximo:** Máximo 5 gráficos simultáneos por plantilla (bloquea la adición si se alcanza el cupo).
  - [ ] **Prevención de duplicados:** Validación que prohíbe agregar 2 gráficos idénticos (mismo conjunto de `entity`, `metric`, `chartType` y `timeRange`).
  - [ ] **Eliminación con confirmación:** Cada tarjeta de gráfico incluye botón de eliminar con `ConfirmDialog` antes de su retiro.
  - [ ] **Persistencia:** Guardado local (`localStorage`) y/o remoto del estado de plantillas del director.

---

## 🧪 Pruebas Requeridas

- [ ] Unit test: servicio de consultas GraphQL y hooks `useExecutiveKpis`, `useCustomMetric` y `useBatchMetrics`.
- [ ] Unit test: validaciones del builder dinámico (máximo 5 gráficos, rechazo de duplicados idénticos).
- [ ] Component test: interacción de eliminación con modal de confirmación (`ConfirmDialog`).
- [ ] Integration test: renderizado de gráficos dinámicos `react-chartjs-2` a partir de respuestas GraphQL.
