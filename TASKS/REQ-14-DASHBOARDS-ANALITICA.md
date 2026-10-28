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
- [p] **Cinta Métrica Compacta Superior (`MetricStrip` - Estilo sgia-design):**
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

### 5. Interacción con los Gráficos y Composición Drag & Drop (Modo Edición)
- [p] **Modo de Edición del Dashboard (Edit Mode Toggle):**
  - [p] Interruptor/botón en la barra de controles para alternar entre "Modo Visualización" y "Modo Edición del Dashboard".
  - [p] En Modo Visualización: bloqueo de reordenamiento y arrastre para garantizar ergonomía de lectura y tooltips sin saltos accidentales.
  - [p] En Modo Edición: habilitación de zonas de soltado (Drop Zones), indicadores de arrastre (drag handles) en gráficos existentes y despliegue del panel lateral de widgets.
- [p] **Panel Lateral de Formas Gráficas Genéricas (Widget Palette Drawer):**
  - [p] Panel lateral retráctil (Drawer / Sheet zed.dev) con catálogo de formas genéricas disponibles:
    - **Gráfico de Barras (BAR):** Miniatura representativa para comparativas discretas o rankings categóricos.
    - **Gráfico de Torta / Dona (DOUGHNUT):** Miniatura para proporciones relativas y cuotas porcentuales del pañol.
    - **Gráfico de Series de Tiempo / Línea (LINE):** Miniatura para tendencias cronológicas continuas (semanal/mensual).
    - **Gráfico de Área Polar (POLAR_AREA):** Miniatura para frecuencias multivariables y ciclos de asignaturas.
  - [p] Cada elemento del lote es arrastrable (`draggable={true}`) con cursor `grab`/`grabbing` y ghost preview de arrastre con badges descriptivos.
- [p] **Zonas de Soltado y Lienzo Interactivo (Drag & Drop Canvas):**
  - [p] Ranuras de soltado visuales (`DropZone`) entre tarjetas y al final del grid de hasta 5 elementos, con estilo dashed tenue y realce reactivo (`dragover`).
  - [p] Prevención y feedback visual si se intenta arrastrar habiendo alcanzado el cupo máximo de 5 gráficos (desactivación del drag con tooltip explicativo).
  - [p] Posibilidad de reordenar la cuadrícula arrastrando gráficos ya existentes hacia nuevas posiciones en modo edición.
- [p] **Asistente Contextual Post-Drop (Configurador Inmediato al Soltar):**
  - [p] Al soltar una forma gráfica en una DropZone, apertura inmediata del modal/asistente de configuración analítica:
    - **Tipo de Gráfico preasignado:** Bloqueado y determinado automáticamente por la forma arrastrada (ej. si arrastró "Series de tiempo", el tipo es estrictamente `LINE`).
    - **Entidad:** Selección de dominio del pañol (`EQUIPMENT`, `SUPPLIES`, `LOANS`, `ALERTS`, `MAINTENANCE`, `CAREERS`, `TEACHERS`).
    - **Métrica / Agregación:** Selección de cálculo matemático (`COUNT`, `TOTAL`, `AVERAGE`, `RATE`, etc.).
    - **Agrupar por (Group By Contextual y Coherente):** Menú dinámico dependiente de la entidad elegida con relaciones semánticas válidas:
      - Para `LOANS`: agrupar por Estado de Préstamo, Docente solicitante, Asignatura o Tipo de Insumo.
      - Para `SUPPLIES`: agrupar por Especialidad/Carrera, Categoría técnica o Rotación.
      - Para `EQUIPMENT`: agrupar por Categoría de Hardware, Sala/Ubicación o Estado físico.
      - Para `ALERTS`: agrupar por Criticidad o Especialidad/Área.
      - Para `MAINTENANCE`: agrupar por Equipo, Tipo de Falla o Taller.
    - **Título personalizado:** Pre-generación automática de título coherente con opción de sobreescritura manual por el director.
  - [p] Cancelación limpia: si el usuario cancela el asistente modal, la acción de drop se revierte sin añadir elementos vacíos ni romper el layout.
- [p] **Validación y Persistencia del Layout Editado:**
  - [p] Validación automática anti-duplicados (rechazo si ya existe un gráfico con idéntica entidad, cálculo, tipo y agrupación).
  - [p] Botón "Guardar y Salir" que consolida el nuevo orden y composición en `localStorage` y notifica el éxito mediante toast de Sileo.
- [p] Reemplazar botón de añadir gráfico sin modo de edición: solo se pueden añadir mediante "Abrir catálogo de widgets".
- [p] En modo edición los gráficos pueden cambiar de lugar si es que se arrastran.
- [p] Cuando el usuario agarre un gráfico y salga del menú de widgets se debe enfocar la zona donde se pueden poner los widgets quitando el menú de widgets.
- [p] Al estar en la zona de enfoque arrastrando el grafico fuera de la zona de widgets aun se debe visualizar el movimiento del grafico con el mouse hasta soltarlo en la zona, si el usuario no ha soltado no quites el grafico, OBLIGATORIO
- [p] Cuando se salga arrastrando el grafico se debe mostrar una zona clara donde soltar el grafico que resalte de las demas, una vez la suelte dentro el grafico se tiene que añadir y quedar
- [p] Si el usuario esta dentro de una plantilla por defecto al añadir un grafico se debe crear una personalizada con ese grafico añadido

---

## 🧪 Pruebas Requeridas

- [p] Unit test: hooks `useExecutiveKpis`, `useCustomMetric`.
- [p] Unit test: validaciones del builder dinámico (máximo 5 gráficos, rechazo de duplicados idénticos).
- [p] Component test: interacción de eliminación con modal de confirmación (`ConfirmDialog`).
- [p] Integration test: renderizado de gráficos dinámicos `react-chartjs-2` a partir de respuestas analíticas.
- [p] Unit & Component test: activación del modo de edición y bloqueo/desbloqueo de controles de arrastre.
- [p] Component test: arrastre de forma gráfica genérica desde el panel lateral y activación de DropZone.
- [p] Integration test: apertura del asistente post-drop con tipo de gráfico bloqueado al arrastrado y selectores dependientes de `groupBy`.
- [p] Integration test: cancelación y confirmación del drop, verificación de persistencia en `localStorage`.
