# AGENTS.md — SGIA Frontend Monorepo (Web + Mobile)

Este archivo entrega contexto de negocio, técnico y de diseño para cualquier agente de IA que trabaje sobre este repositorio. Léelo antes de generar o modificar código.

## 0. Alcance de este repositorio

**Este repositorio es un monorepo que contiene el panel web (React) y la app móvil (React Native/Expo) del sistema SGIA, más el código compartido entre ambos.**

- No contiene la API (eso vive en `sgia-backend`, Laravel). Ambas apps consumen esa API vía HTTPS/JSON.
- No implementa reglas de negocio ni validaciones de autoridad final: solo valida en cliente por UX, la fuente de verdad siempre es la respuesta de la API.
- **Web (`apps/web`)** es para los roles AD-01 (Administrador), DIR-01 (Director/Coordinador) y PAN-01 (Pañol).
- **Mobile (`apps/mobile`)** es exclusivamente para PRO-01 (Profesor): solicitud de préstamos remotos y reportes de novedades/fallas.
- El código compartido (`packages/`) existe para evitar duplicar el cliente de API, los tipos de datos y la lógica de validación entre las dos apps — no para compartir UI visual (web usa DOM, mobile usa componentes nativos, son superficies distintas).

## 1. Contexto del proyecto

**Nombre:** SGIA – Sistema de Gestión de Inventario y Activos (Frontend)  
**Cliente:** Área de Informática y Ciberseguridad, INACAP Sede Temuco  
**Problema que resuelve:** reemplaza la gestión manual del pañol (planillas y papel) por un sistema digital ágil, industrial y denso con trazabilidad física, préstamos en tiempo real, cotizaciones y control de activos.

> Nota: el documento de formulación original especifica Flutter para el componente móvil. Al migrar a React Native/Expo, mantener la constancia en la documentación del proyecto.

## 2. Estructura del monorepo

```
sgia-frontend/
├── apps/
│   ├── web/              # Panel administrativo y de pañol (Vite + React) — AD-01, DIR-01, PAN-01
│   └── mobile/           # App móvil de solicitudes docentes (Expo + React Native) — PRO-01
├── packages/
│   ├── api-client/       # Cliente HTTP tipado + hooks de TanStack Query hacia la API Laravel
│   ├── types/            # Tipos/interfaces compartidos (Producto, Préstamo, Cotización, Usuario, Equipo...)
│   ├── config/           # tsconfig, eslint, prettier compartidos
│   └── design-tokens/    # Colores, tipografía y tokens compartidos
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

- `api-client` expone funciones y hooks (`useProducts`, `useLoans`, `useQuotations`, etc.) consumidos por ambas apps.
- `types` es la fuente única de verdad para las entidades y contratos de datos.
- El manejo de sesión (token) usa una abstracción común en `api-client` (localStorage en web, SecureStore en mobile).

## 3. Roles y alcance de plataformas

| Rol | App | Pantallas principales |
|-----|-----|------------------------|
| **AD-01** (Administrador) | web | Gestión integral de usuarios (alta, edición, activar/desactivar), auditoría. |
| **DIR-01** (Director/Coordinador) | web | Alta vía escaneo de facturas (OCR), cotizaciones a proveedores, fichas técnicas y dashboards analíticos. |
| **PAN-01** (Pañolero) | web | Control de inventario, stock crítico, ubicaciones físicas, cola de préstamos remotos, registro presencial e historial. |
| **PRO-01** (Profesor) | mobile | Solicitudes de préstamo remoto, seguimiento de estados e informe de novedades/fallas. |

## 4. Requisitos y especificaciones funcionales

> **Nota de arquitectura:** Cada requisito funcional y no funcional cuenta con su propio archivo de especificación detallada en el directorio [`TASKS/`](file:///home/alerrsi/Documents/proyects/SGIA/FrondEnd-SGIA/TASKS/README.md). Consulta cada archivo específico antes de implementar o modificar flujos:

- **Autenticación y Sesiones:** [`TASKS/REQ-01-AUTENTICACION-SESIONES.md`](file:///home/alerrsi/Documents/proyects/SGIA/FrondEnd-SGIA/TASKS/REQ-01-AUTENTICACION-SESIONES.md)
- **Administración de Usuarios:** [`TASKS/REQ-02-ADMINISTRACION-USUARIOS.md`](file:///home/alerrsi/Documents/proyects/SGIA/FrondEnd-SGIA/TASKS/REQ-02-ADMINISTRACION-USUARIOS.md)
- **Inventario y Facturas OCR:** [`TASKS/REQ-03-REQ-04-INVENTARIO-PRODUCTOS.md`](file:///home/alerrsi/Documents/proyects/SGIA/FrondEnd-SGIA/TASKS/REQ-03-REQ-04-INVENTARIO-PRODUCTOS.md)
- **Ubicación Física:** [`TASKS/REQ-05-UBICACION-FISICA.md`](file:///home/alerrsi/Documents/proyects/SGIA/FrondEnd-SGIA/TASKS/REQ-05-UBICACION-FISICA.md)
- **Alertas de Stock Crítico:** [`TASKS/REQ-06-ALERTAS-STOCK-CRITICO.md`](file:///home/alerrsi/Documents/proyects/SGIA/FrondEnd-SGIA/TASKS/REQ-06-ALERTAS-STOCK-CRITICO.md)
- **Cotizaciones y Proveedores:** [`TASKS/REQ-07-COTIZACIONES-PROVEEDORES.md`](file:///home/alerrsi/Documents/proyects/SGIA/FrondEnd-SGIA/TASKS/REQ-07-COTIZACIONES-PROVEEDORES.md)
- **Compras y Adquisiciones:** [`TASKS/REQ-08-COMPRAS-ADQUISICIONES.md`](file:///home/alerrsi/Documents/proyects/SGIA/FrondEnd-SGIA/TASKS/REQ-08-COMPRAS-ADQUISICIONES.md)
- **Préstamos Remotos:** [`TASKS/REQ-09-PRESTAMOS-REMOTOS.md`](file:///home/alerrsi/Documents/proyects/SGIA/FrondEnd-SGIA/TASKS/REQ-09-PRESTAMOS-REMOTOS.md)
- **Operación de Pañol Presencial:** [`TASKS/REQ-10-OPERACION-PRESTAMOS-PANOL.md`](file:///home/alerrsi/Documents/proyects/SGIA/FrondEnd-SGIA/TASKS/REQ-10-OPERACION-PRESTAMOS-PANOL.md)
- **Historial y Auditoría de Préstamos:** [`TASKS/REQ-11-HISTORIAL-AUDITORIA-PRESTAMOS.md`](file:///home/alerrsi/Documents/proyects/SGIA/FrondEnd-SGIA/TASKS/REQ-11-HISTORIAL-AUDITORIA-PRESTAMOS.md)
- **Fichas Técnicas de Equipos:** [`TASKS/REQ-12-FICHAS-TECNICAS-EQUIPOS.md`](file:///home/alerrsi/Documents/proyects/SGIA/FrondEnd-SGIA/TASKS/REQ-12-FICHAS-TECNICAS-EQUIPOS.md)
- **Informes de Novedades y Fallas:** [`TASKS/REQ-13-INFORMES-NOVEDADES-FALLAS.md`](file:///home/alerrsi/Documents/proyects/SGIA/FrondEnd-SGIA/TASKS/REQ-13-INFORMES-NOVEDADES-FALLAS.md)
- **Dashboards y Analítica:** [`TASKS/REQ-14-DASHBOARDS-ANALITICA.md`](file:///home/alerrsi/Documents/proyects/SGIA/FrondEnd-SGIA/TASKS/REQ-14-DASHBOARDS-ANALITICA.md)
- **Configuración y Paletas de Color:** [`TASKS/REQ-CONFIG.md`](file:///home/alerrsi/Documents/proyects/SGIA/FrondEnd-SGIA/TASKS/REQ-CONFIG.md)
- **Requisitos No Funcionales (Calidad, Accesibilidad y Rendimiento):** [`TASKS/REQ-NF-CALIDAD-ACCESIBILIDAD-PERFORMANCE.md`](file:///home/alerrsi/Documents/proyects/SGIA/FrondEnd-SGIA/TASKS/REQ-NF-CALIDAD-ACCESIBILIDAD-PERFORMANCE.md)
- **Directrices de Interfaz y Sidebar:** [`TASKS/REQ-DISEÑO.md`](file:///home/alerrsi/Documents/proyects/SGIA/FrondEnd-SGIA/TASKS/REQ-DISE%C3%91O.md)

## 5. Resumen Ejecutivo del Sistema de Diseño (UI Global SGIA)

> Fuente canónica y especificación completa: [`SKILLS/Design.md`](file:///home/alerrsi/Documents/proyects/SGIA/FrondEnd-SGIA/SKILLS/Design.md).

El diseño del SGIA evita plantillas SaaS genéricas y adopta un **enfoque industrial, técnico, ágil y de alta densidad de información** (inspirado en Linear, Raycast y consolas de ingeniería):

### 1. Canvas y Jerarquía de Superficies
- **Fondo Canvas:** `bg-slate-50` (o `bg-zinc-50`). Prohibido usar fondos blanco puro extensos para prevenir fatiga en turnos largos.
- **Paneles y Tarjetas:** `bg-white`, bordes finos de 1px (`border-slate-200/80`), elevación mínima (`shadow-xs` / `shadow-sm`) y bordes rectos o sutiles. Prohibidas tarjetas infladas o sombras difusas pesadas.
- **Divisores:** `border-slate-100` o `divide-slate-100`.

### 2. Paleta Semántica, Acento Institucional y Paletas Alternativas

#### A. Paleta Principal Institucional INACAP
- **Rojo Institucional (`#d9232a` / `bg-red-600` / `hover:bg-red-700`):**
  - **Uso deliberado y exclusivo:** CTA principal culminante (ej. *"Dar de alta producto"*, *"Confirmar préstamo"*) o paradas críticas.
  - **Prohibido:** fondos grandes, cabeceras completas o barras laterales rojas para evitar sobreestimulación visual.
- **Escala Neutra:**
  - Títulos: `text-slate-900 font-semibold`.
  - Metadatos / secundarios: `text-slate-500 text-xs` o `text-slate-600 text-sm`.
  - Bordes y campos: `border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-400`.
- **Badges Semánticos Técnicos (con icono + texto siempre):**
  - **Disponible / Óptimo:** `bg-emerald-50 text-emerald-700 border-emerald-200/60`.
  - **En Préstamo / Asignado:** `bg-blue-50 text-blue-700 border-blue-200/60`.
  - **Stock Crítico / Umbral Mínimo:** `bg-rose-50 text-rose-700 border-rose-200/60`.
  - **En Mantención / Revisión:** `bg-amber-50 text-amber-700 border-amber-200/60`.
  - **De Baja / Retirado:** `bg-slate-100 text-slate-600 border-slate-200`.

> **NOTA DE PRESERVACIÓN DE FONDOS (Regla de Oro para todas las paletas alternativas):**  
> Para cada paleta alternativa dentro de las opciones se deben mantener como colores de fondo ya sea el blanco y negro (este puede variar un poco según paleta elegida). Los colores deben verse reflejados en los tonos de botones, letras específicas como estados de entidades entre otros sin perder la estética principal y enfoque de la paleta principal. Prohibido teñir canvas completos o tarjetas con fondos saturados.

#### B. Paleta B1: Industrial Steel & Aerospace Azure (SKILLS/Design.md)
- Esquema de alta concentración técnica con tonos `Smart Blue` (`#0466c8`), `Steel Azure` (`#0353a4`), `Regal Navy` (`#023e7d`), `Twilight Indigo` (`#33415c`), `Blue Slate` (`#5c677d`) y `Cool Steel` (`#979dac`).

#### C. Paletas Alternativas Tipo Pastel (Soft Technical Pastels)
Paletas suaves de baja saturación diseñadas para reducir la fatiga ocular en jornadas extensas de mesón y pañol, manteniendo siempre la rigurosidad industrial, la legibilidad y los fondos neutros intactos:

1. **Sage Mint (Menta Salvia Suave) — `palette-sage`:**
   - **Concepto:** Tono sereno, orgánico y técnico, óptimo para gestión de laboratorio y ergonomía de lectura sostenida.
   - **Color de Acento / Botones:** Salvia suave (`#62929e` / hover `#4d7c8a` en light; `#83c5be` en dark). Botón secundario con borde sutil `#b2c9ab`.
   - **Letras y Tipografía Específica:** Links activos y titulares de módulo en Verde Salvia Profundo (`#284b40` en light; `#a7c4bc` en dark). Micro-etiqueta de Sede en Salvia técnico.
   - **Estados de Entidades:**
     - *Disponible / Activo:* `bg-emerald-50/70 text-emerald-800 border-emerald-200/70` (dot `#52b788`).
     - *En Préstamo:* `bg-teal-50/80 text-teal-800 border-teal-200/70` (dot `#62929e`).
     - *Alerta / Stock Crítico:* `bg-rose-50/70 text-rose-800 border-rose-200/60` (dot `#e07a5f`).
     - *Mantención:* `bg-amber-50/70 text-amber-800 border-amber-200/60` (dot `#d4a373`).

2. **Lavender Mist (Lavanda / Violeta Empolvado) — `palette-lavender`:**
   - **Concepto:** Atmósfera analítica, reflexiva y de alta concentración para módulos de auditoría y reportes.
   - **Color de Acento / Botones:** Lavanda Iris (`#7c69d8` / hover `#6855c4` en light; `#9b87f5` en dark). Anillo de foco (`ring`) en `#c8b6ff`.
   - **Letras y Tipografía Específica:** Enlaces activos y micro-etiqueta institucional en Púrpura Pizarra (`#3c3169` en light; `#c8b6ff` en dark).
   - **Estados de Entidades:**
     - *Disponible / Activo:* `bg-violet-50/80 text-violet-800 border-violet-200/70` (dot `#8f80c7`).
     - *En Préstamo:* `bg-indigo-50/80 text-indigo-800 border-indigo-200/70` (dot `#6b7280`).
     - *Alerta / Stock Crítico:* `bg-rose-50/70 text-rose-800 border-rose-200/60` (dot `#f472b6`).
     - *Mantención:* `bg-purple-50/70 text-purple-800 border-purple-200/60` (dot `#c084fc`).

3. **Nordic Ice (Celeste Glaciar / Sky Pastel) — `palette-nordic`:**
   - **Concepto:** Estilo telecomunicaciones e infraestructura de redes, frío, ultra limpio y preciso.
   - **Color de Acento / Botones:** Hielo Glaciar (`#4682b4` / hover `#36648b` en light; `#64b5f6` en dark). Bordes de acción en `#a2d2ff`.
   - **Letras y Tipografía Específica:** Navegación activa y texto de Sede en Azul Ártico Técnico (`#1d4e89` en light; `#90caf9` en dark).
   - **Estados de Entidades:**
     - *Disponible / Activo:* `bg-sky-50/80 text-sky-800 border-sky-200/70` (dot `#38bdf8`).
     - *En Préstamo:* `bg-cyan-50/80 text-cyan-800 border-cyan-200/70` (dot `#0284c7`).
     - *Alerta / Stock Crítico:* `bg-red-50/70 text-red-800 border-red-200/60` (dot `#fb7185`).
     - *Mantención:* `bg-blue-50/80 text-blue-800 border-blue-200/60` (dot `#93c5fd`).

4. **Peach & Sand (Melocotón / Arcilla Suave Pastel) — `palette-peach`:**
   - **Concepto:** Calidez sutil y visualmente relajada para logística de inventario rápido sin estridencias.
   - **Color de Acento / Botones:** Terracota Suave (`#d97757` / hover `#be6143` en light; `#f4978e` en dark). Foco suave en `#ffc6a5`.
   - **Letras y Tipografía Específica:** Identificadores y enlaces activos en Marrón Arcilla (`#6b3a2e` en light; `#f8ad9d` en dark). Sede en Melocotón técnico.
   - **Estados de Entidades:**
     - *Disponible / Activo:* `bg-amber-50/80 text-stone-800 border-stone-200/70` (dot `#e07a5f`).
     - *En Préstamo:* `bg-orange-50/80 text-orange-800 border-orange-200/70` (dot `#f4978e`).
     - *Alerta / Stock Crítico:* `bg-rose-50/70 text-rose-800 border-rose-200/60` (dot `#e63946`).
     - *Mantención:* `bg-yellow-50/70 text-yellow-800 border-yellow-200/60` (dot `#f6bd60`).

5. **Chamomile Honey (Manzanilla / Ocre Suave Pastel) — `palette-chamomile`:**
   - **Concepto:** Gama cálida de bajísimo contraste fotópico, diseñada para turnos vespertinos y control de activos bajo luz tenue.
   - **Color de Acento / Botones:** Ámbar Mate (`#b5832b` / hover `#9c6d1f` en light; `#e2b866` en dark). Bordes en `#f6df9d`.
   - **Letras y Tipografía Específica:** Indicadores de navegación y texto de Sede en Ocre Mineral (`#5c4015` en light; `#f6df9d` en dark).
   - **Estados de Entidades:**
     - *Disponible / Activo:* `bg-amber-50/80 text-amber-900 border-amber-200/70` (dot `#d4a34b`).
     - *En Préstamo:* `bg-stone-50/80 text-stone-800 border-stone-200/70` (dot `#a8a29e`).
     - *Alerta / Stock Crítico:* `bg-rose-50/70 text-rose-800 border-rose-200/60` (dot `#f87171`).
     - *Mantención:* `bg-yellow-50/70 text-yellow-800 border-yellow-200/60` (dot `#facc15`).

### 3. Tipografía Técnica
- `font-mono`: Obligatorio en identificadores técnicos (SKU, seriales, rotulado Code128, IP/MAC de equipos Cisco, gavetas `Cajon-A2`, RUT y cifras tabulares con `font-variant-numeric: tabular-nums`).
- `font-sans`: Tipografía de lectura e interfaz (Inter o Geist) para navegación, formularios, descripciones y títulos.

### 4. Tablas y Data Grids de Alta Densidad (TanStack Table)
- Cabeceras compactas en mayúsculas atenuadas (`text-xs font-semibold uppercase tracking-wider text-slate-400`).
- SKU en chip monoespaciado tenue (`font-mono text-xs text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded border border-slate-200/60`).
- Microbarra de nivel de stock compacto (40-60px) con coloración semántica.
- Acciones por fila: 1 acción directa principal + menú contextual `DropdownMenu` (`MoreHorizontal`) de Radix UI para acciones secundarias.

### 5. Formularios y Operatoria de Mesón
- **React Hook Form + Zod** con validación estricta y mensajes correctivos.
- Agrupación en fieldsets técnicos (`"Identificación de Hardware"`, `"Ubicación en Pañol"`, `"Parámetros de Stock"`).
- **Drawers laterales (Radix Sheet):** Para operaciones frecuentes (fichas técnicas, asignación rápida) manteniendo la tabla visible de fondo.
- **Modales centrados (Radix Dialog):** Reservados para confirmaciones destructivas o acciones aisladas.
- **Ergonomía de Lector Code128:** Soporte de escaneo continuo con listener de eventos `keydown` terminado en `Enter` sin requerir clic previo.
- **Feedback fluido:** Notificaciones y alertas operativas con Sileo (`toast.success`, `toast.warning`, `toast.error`).

## 6. Arquitectura y Manejo de Datos

- **Data Fetching:** TanStack Query consumiendo `packages/api-client`. Caché centralizada, revalidación y sincronización de estado.
- **Formularios:** React Hook Form tipado en modo estricto.
- **Autenticación:** Tokens persistidos con interceptor HTTP en `api-client`.
- **Regla de oro:** Ambas apps son clientes de la API; ninguna regla de negocio final ni mutación se asume sin confirmación del backend.

## 7. Convenciones de Código para Agentes

- **TypeScript estricto:** Cero `any`, tipado exhaustivo mediante `packages/types`.
- **Modularidad:** Un componente/hook por archivo, agrupado por funcionalidad técnica.
- **Llamadas a API:** Centralizadas en `packages/api-client` (nunca llamadas `fetch` o `axios` dispersas dentro de componentes UI).
- **Estados compartidos:** Enums y tipos de estado sincronizados en `packages/types`.

## 8. Stack Tecnológico

- **Monorepo:** Turborepo + pnpm workspaces.
- **Web (`apps/web`):**
  - React 19 + TypeScript + Vite.
  - Tailwind CSS + Radix UI / Shadcn primitives.
  - TanStack Table para data grids densos.
  - React Hook Form + Zod.
  - Sileo para notificaciones y alertas de escaneo.
  - Lucide React para iconografía consistente.
  - Chart.js / react-chartjs-2 para analítica FU-06.
  - Tesseract para OCR y escanero de documentos
- **Mobile (`apps/mobile`):**
  - React Native con Expo.
  - NativeWind (Tailwind CSS nativo).
  - React Navigation.
  - Lucide React Native.
- **Testing:**
  - Vitest + React Testing Library (web).
  - Jest + React Native Testing Library (mobile).

## 9. Referencias y Fuentes

- Formulación del Proyecto de Título - SGIA, INACAP Sede Temuco (Sección TIHI84).
- Especificación de diseño y patrones de componentes: [`SKILLS/Design.md`](file:///home/alerrsi/Documents/proyects/SGIA/FrondEnd-SGIA/SKILLS/Design.md).
- Índice de requisitos detallados: [`TASKS/README.md`](file:///home/alerrsi/Documents/proyects/SGIA/FrondEnd-SGIA/TASKS/README.md).
