# REQ-14: Dashboards Analíticos y Métricas de Gestión Institucional

> **Código:** `REQ-14` | **Módulo:** `FU-06` (Reportes, Dashboards y Analítica)  
> **Plataforma:** Web (`apps/web`)  
> **Roles:** Director de Carrera (`DIR-01`) y Administrador (`AD-01`)

---

## 🎯 Objetivo

Entregar visibilidad estratégica y operativa sobre el rendimiento y uso del inventario del pañol. Ofrecer gráficos interactivos en tema oscuro (acorde a la estética zed.dev) con Chart.js para identificar insumos de alta demanda, inventario ocioso, distribución por carrera y hábitos de préstamo docente para la toma de decisiones presupuestarias y académicas.

---

## 📡 Endpoints del Backend (`ENDPOINTS.md`)

| Método | Endpoint | Roles | Descripción | Estado API |
|---|---|---|---|:---:|
| `GET` | `/api/dashboard/stats` | `DIR-01`, `AD-01` | Resumen general: productos por estado, préstamos activos vs atrasados, alertas críticas y rotación mensual. | 🟡 Planificado |
| `GET` | `/api/dashboard/top-products` | `DIR-01`, `AD-01` | Ranking de los 10 productos/equipos con mayor demanda histórica y semestral. | 🟡 Planificado |
| `GET` | `/api/dashboard/top-supplies` | `DIR-01`, `AD-01` | Ranking de insumos fungibles más consumidos (cables, conectores, soldadura). | 🟡 Planificado |
| `GET` | `/api/dashboard/careers-distribution` | `DIR-01`, `AD-01` | Consumo de insumos y préstamos desglosado por carrera académica. | 🟡 Planificado |
| `GET` | `/api/dashboard/least-demanded` | `DIR-01`, `AD-01` | Inventario ocioso o sin uso en los últimos 6 meses. | 🟡 Planificado |
| `GET` | `/api/dashboard/top-teachers` | `DIR-01`, `AD-01` | Docentes con mayor frecuencia y volumen de solicitudes. | 🟡 Planificado |
| `GET` | `/api/dashboard/loans-by-teacher` | `DIR-01`, `AD-01` | Préstamos agrupados por docente y asignatura para análisis curricular. | 🟡 Planificado |

---

## 📋 Lista de Tareas Desglosada

### 1. Indicadores Clave de Desempeño (KPIs) (`apps/web`)
- [ ] **Tarjetas de Resumen Ejecutivo (`/`):**
  - [ ] Total de activos disponibles vs en préstamo vs en taller vs dados de baja.
  - [ ] Préstamos activos en el día y tasa de atrasos.
  - [ ] Contador de alertas de stock crítico no resueltas.
  - [ ] Tasa de rotación mensual del pañol en porcentaje.

### 2. Gráficos Interactivos con Chart.js (`react-chartjs-2`)
- [ ] **Configuración del Tema Oscuro:**
  - [ ] Paleta institucional integrada desde `packages/design-tokens` (fondo `#111113`, grid lines translúcidas `#222`, acento rojo/naranja `#ef4444`).
- [ ] **Top 10 Productos y Equipos Más Solicitados:**
  - [ ] Gráfico de barras horizontales mostrando cantidad de préstamos por equipo.
- [ ] **Insumos Fungibles de Mayor Consumo:**
  - [ ] Gráfico de barras con proyección de agotamiento.
- [ ] **Distribución de Uso por Carrera Académica:**
  - [ ] Gráfico de dona (Doughnut chart) con porcentajes por especialidad (ej. Ciberseguridad, Telecomunicaciones, Informática).
- [ ] **Inventario Ocioso (Equipos Menos Demandados):**
  - [ ] Tabla destacando equipos sin movimiento para reasignación o dar de baja.
- [ ] **Ranking de Docentes y Préstamos por Asignatura:**
  - [ ] Gráfico comparativo de docentes con mayor volumen de horas/equipos solicitados.

### 3. Filtros Temporales
- [ ] **Selector de Rango de Período:**
  - [ ] Filtro por Semestre Actual (ej. "2026-1", "2026-2"), Año Completo o Rango Personalizado.
  - [ ] Refresco automático de todas las consultas de analítica.

---

## 🧪 Pruebas Requeridas

- [ ] Unit test: hooks `useDashboardStats`, `useTopProducts` y `useCareersDistribution`.
- [ ] Visual regression test: renderizado de gráficos Chart.js en tema oscuro con tooltip legible.
