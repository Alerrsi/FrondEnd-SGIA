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
DISCLAIMER: DE MOMENTO NO ESTA PROGRAMADA LA API DE EL BACKEND
POR LO QUE DEBES GENERAR LOS GRAFICOS QUE EL USUARIO NECESITA 
CON DATOS MOCK FALSOS, DICHOS DATOS DEBEN SER CON EL CONTEXTO DEL SISTEMA 
OBVIAMENTE NO PASARAS DATOS DE ALGO NADA QUE VER COMO CARREAS, ETC.
CUANDO MARQUES LAS TAREAS NO PONGAS UNA X CON UNA p de PARTIAL
y usa charts.js
HASTA QUE TE INDIQUE TRABAJAR CON LA API DE GRAHPQL
PD: crea un json con los datos de prueba
## 📋 Lista de Tareas Desglosada

### 1. Cliente GraphQL y Capa de Datos (`apps/web` & `@sgia/api-client`)
- [p] **Configuración del Cliente GraphQL hacia `/api/metrics`:**
  - [p] Función de transporte GraphQL autenticada con Bearer Token (reutilizando credenciales Sanctum).
  - [p] Tipos TypeScript para operaciones GraphQL (`MetricEntity`, `MetricAggregation`, `TimeRange`, `ChartType`, `MetricResult`, `ExecutiveKpis`).
  - [p] Hooks TanStack Query especializados (`useExecutiveKpis`, `useCustomMetric`, `useBatchMetrics`) alimentados por mock JSON en contexto pañol TI.

### 2. Cinta Métrica de KPIs Ejecutivos (GraphQL `executiveKpis`)
- [p] **Cinta Métrica Compacta Superior (`MetricStrip` - Estilo Design.md):**
  - [p] Consulta vía GraphQL `executiveKpis(timeRange: $range)`.
  - [p] Estado de inventario: activos disponibles, en préstamo, en taller y de baja.
  - [p] Operación diaria: préstamos activos hoy y tasa porcentual de atrasos.
  - [p] Salud y rotación: alertas de stock crítico pendientes y porcentaje de rotación mensual.

### 3. Configuración Visual Chart.js con Tema Oscuro (`react-chartjs-2`)
- [p] **Tokens de Diseño y Paleta Zed.dev:**
  - [p] Fondo `#111113`, superficies `#18181b`, líneas de cuadrícula translúcidas `#27272a`.
  - [p] Paleta semántica institucional: acentos rojo `#ef4444`, ámbar `#f59e0b`, esmeralda `#10b981`, violeta `#8b5cf6` y cian `#06b6d4`.
  - [p] Tooltips interactivos con contraste alto, tipografía monoespaciada compacta y badges legibles.
  - [p] Componente envolvente genérico `DynamicChartCard` que recibe `MetricResult` y lo traduce a configuración de `react-chartjs-2`.

### 4. Sistema de Plantillas y Dashboards Dinámicos
- [p] **Selector de Plantillas Predefinidas (3 Plantillas por Defecto):**
  - [p] *Plantilla 1: Operaciones y Movimiento de Pañol:*
    - Préstamos diarios (Línea: `LOANS` + `COUNT` + `LAST_30_DAYS`).
    - Estado y atrasos de préstamos (Dona: `LOANS` + `RATE`).
    - Alertas críticas por categoría (Barras: `ALERTS` + `COUNT`).
  - [p] *Plantilla 2: Demanda y Desgaste por Carrera:*
    - Insumos consumidos por especialidad (Barras: `SUPPLIES` + `TOTAL` agrupado por `CAREER`).
    - Ranking de equipos más solicitados (Barras horizontales: `EQUIPMENT` + `COUNT`).
    - Préstamos por docente y asignatura (Dona / Polar: `TEACHERS` + `COUNT`).
  - [p] *Plantilla 3: Salud del Inventario y Ciclo de Vida:*
    - Inventario ocioso / sin rotación (Barras: `EQUIPMENT` + `COUNT` en estado ocioso).
    - Incidencias y mantenciones por equipo (Línea: `MAINTENANCE` + `COUNT`).
    - Tasa de rotación semestral de insumos (Barras: `SUPPLIES` + `RATE`).
- [p] **Constructor de Gráficos Personalizados (GraphQL Query Builder Modal):**
  - [p] Formulario interactivo con selección de:
    - **Entidad:** `EQUIPMENT`, `SUPPLIES`, `LOANS`, `ALERTS`, `MAINTENANCE`, `CAREERS`, `TEACHERS`.
    - **Métrica:** `TOTAL`, `AVERAGE`, `COUNT`, `RATE`.
    - **Tipo de Gráfico:** `BAR`, `LINE`, `DOUGHNUT`, `POLAR_AREA`.
    - **Rango Temporal:** `LAST_7_DAYS`, `LAST_30_DAYS`, `SEMESTER_CURRENT`, `SEMESTER_PREVIOUS`, `YEAR_TO_DATE`, `CUSTOM`.
  - [p] Previsualización en vivo ejecutando la consulta hacia los datos mock tipados.
- [p] **Reglas de Negocio y Restricciones Obligatorias:**
  - [p] **Límite máximo:** Máximo 5 gráficos simultáneos por plantilla (bloquea la adición si se alcanza el cupo).
  - [p] **Prevención de duplicados:** Validación que prohíbe agregar 2 gráficos idénticos (mismo conjunto de `entity`, `metric`, `chartType` y `timeRange`).
  - [p] **Eliminación con confirmación:** Cada tarjeta de gráfico incluye botón de eliminar con `ConfirmDialog` antes de su retiro.
  - [p] **Persistencia:** Guardado local (`localStorage`) del estado de plantillas del director.

---

## 🧪 Pruebas Requeridas

- [p] Unit test: hooks `useExecutiveKpis`, `useCustomMetric`.
- [p] Unit test: validaciones del builder dinámico (máximo 5 gráficos, rechazo de duplicados idénticos).
- [p] Component test: interacción de eliminación con modal de confirmación (`ConfirmDialog`).
- [p] Integration test: renderizado de gráficos dinámicos `react-chartjs-2` a partir de respuestas analíticas.
