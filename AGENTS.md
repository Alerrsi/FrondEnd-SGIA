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
FrondEnd-SGIA/
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

> **Nota de arquitectura:** Cada requisito funcional y no funcional cuenta con su propio archivo de especificación detallada en el directorio [`TASKS/`](TASKS/README.md). Consulta cada archivo específico antes de implementar o modificar flujos:

- **Autenticación y Sesiones:** [`TASKS/REQ-01-AUTENTICACION-SESIONES.md`](TASKS/REQ-01-AUTENTICACION-SESIONES.md)
- **Administración de Usuarios:** [`TASKS/REQ-02-ADMINISTRACION-USUARIOS.md`](TASKS/REQ-02-ADMINISTRACION-USUARIOS.md)
- **Inventario y Facturas OCR:** [`TASKS/REQ-03-REQ-04-INVENTARIO-PRODUCTOS.md`](TASKS/REQ-03-REQ-04-INVENTARIO-PRODUCTOS.md)
- **Ubicación Física:** [`TASKS/REQ-05-UBICACION-FISICA.md`](TASKS/REQ-05-UBICACION-FISICA.md)
- **Alertas de Stock Crítico:** [`TASKS/REQ-06-ALERTAS-STOCK-CRITICO.md`](TASKS/REQ-06-ALERTAS-STOCK-CRITICO.md)
- **Cotizaciones y Proveedores:** [`TASKS/REQ-07-COTIZACIONES-PROVEEDORES.md`](TASKS/REQ-07-COTIZACIONES-PROVEEDORES.md)
- **Compras y Adquisiciones:** [`TASKS/REQ-08-COMPRAS-ADQUISICIONES.md`](TASKS/REQ-08-COMPRAS-ADQUISICIONES.md)
- **Préstamos Remotos:** [`TASKS/REQ-09-PRESTAMOS-REMOTOS.md`](TASKS/REQ-09-PRESTAMOS-REMOTOS.md)
- **Operación de Pañol Presencial:** [`TASKS/REQ-10-OPERACION-PRESTAMOS-PANOL.md`](TASKS/REQ-10-OPERACION-PRESTAMOS-PANOL.md)
- **Historial y Auditoría de Préstamos:** [`TASKS/REQ-11-HISTORIAL-AUDITORIA-PRESTAMOS.md`](TASKS/REQ-11-HISTORIAL-AUDITORIA-PRESTAMOS.md)
- **Fichas Técnicas de Equipos:** [`TASKS/REQ-12-FICHAS-TECNICAS-EQUIPOS.md`](TASKS/REQ-12-FICHAS-TECNICAS-EQUIPOS.md)
- **Informes de Novedades y Fallas:** [`TASKS/REQ-13-INFORMES-NOVEDADES-FALLAS.md`](TASKS/REQ-13-INFORMES-NOVEDADES-FALLAS.md)
- **Dashboards y Analítica:** [`TASKS/REQ-14-DASHBOARDS-ANALITICA.md`](TASKS/REQ-14-DASHBOARDS-ANALITICA.md)
- **Configuración y Paletas de Color:** [`TASKS/REQ-CONFIG.md`](TASKS/REQ-CONFIG.md)
- **Requisitos No Funcionales (Calidad, Accesibilidad y Rendimiento):** [`TASKS/REQ-NF-CALIDAD-ACCESIBILIDAD-PERFORMANCE.md`](TASKS/REQ-NF-CALIDAD-ACCESIBILIDAD-PERFORMANCE.md)
- **Directrices de Interfaz y Sidebar:** [`TASKS/REQ-DISEÑO.md`](TASKS/REQ-DISE%C3%91O.md)

## 5. Sistema de Diseño (resumen)

> Especificación completa (tokens, tablas, drawers, patrón de componente): [`.claude/skills/sgia-design/SKILL.md`](.claude/skills/sgia-design/SKILL.md). Paletas alternativas: [`references/paletas.md`](.claude/skills/sgia-design/references/paletas.md).

Estética industrial, técnica y de alta densidad (inspirada en Linear, Supabase y Vercel), con doble tema claro/oscuro y escala neutra `zinc`.

- **Canvas:** `bg-zinc-100 dark:bg-zinc-950`; paneles `bg-white dark:bg-zinc-900` con borde de 1px y elevación mínima.
- **Rojo institucional (`#d9232a`):** solo etiqueta de sede y paradas o alertas críticas. El CTA principal es monocromo; nunca fondos grandes ni cabeceras rojas.
- **Badges de estado:** componente `Badge` (`apps/web/src/components/ui/badge.tsx`), pastilla tintada con borde, icono + texto y punto opcional.
- **Tipografía:** `font-mono` obligatorio en SKU, seriales, Code128, IP/MAC, gavetas y RUT; `font-sans` (Inter o Geist) para el resto.
- **Tablas:** TanStack Table, cabeceras compactas, máximo 1 acción directa por fila y el resto en `DropdownMenu`.
- **Formularios y mesón:** React Hook Form + Zod; Drawers (Radix Sheet) para operaciones frecuentes, Dialog solo para confirmaciones destructivas; escáner Code128 por `keydown` + `Enter`; avisos con Sileo.
- **Paletas alternativas:** el fondo sigue siendo blanco/negro. El color va en botones, textos y estados; prohibido teñir canvas o tarjetas con fondos saturados.

> **RESTRICCIÓN OBLIGATORIA (Sidebar encogido):** con `isCollapsed === true` (ancho `64px`), el `IconBar` y todos los muelles de iconos del lateral izquierdo **DEBEN PERMANECER SIEMPRE EN ORIENTACIÓN VERTICAL** (`axis="column"`, `data-orientation="vertical"`, `flex flex-col items-center`). Prohibido renderizarlos en horizontal (`row`).

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
- Especificación de diseño y patrones de componentes: [`.claude/skills/sgia-design/SKILL.md`](.claude/skills/sgia-design/SKILL.md).
- Índice de requisitos detallados: [`TASKS/README.md`](TASKS/README.md).
