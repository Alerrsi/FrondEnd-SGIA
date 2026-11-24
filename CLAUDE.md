# CLAUDE.md — SGIA Frontend

Monorepo del frontend de **SGIA** (Sistema de Gestión de Inventario y Activos), INACAP Sede Temuco. Panel web (`apps/web`) y app móvil (`apps/mobile`) que consumen una API Laravel externa (`sgia-backend`, no está en este repo).

## Comandos

```bash
pnpm install                          # instalar dependencias del monorepo
pnpm dev:web                          # servidor de desarrollo web (Vite)
pnpm dev:mobile                       # Expo (móvil)
pnpm --filter @sgia/web test          # tests web (Vitest)
pnpm typecheck                        # TypeScript en todos los paquetes
pnpm lint                             # ESLint en todos los paquetes
```

Antes de dar una tarea por terminada: `pnpm typecheck` y `pnpm --filter @sgia/web test` deben pasar.

## Estructura

- `apps/web/` — panel administrativo (React 19, Vite, Tailwind, Radix/Shadcn). Roles AD-01, DIR-01, PAN-01 y PRO-01 (profesor, menú reducido en `/profesor/*`, REQ-21).
- `apps/mobile/` — app Expo / React Native. Solo rol PRO-01 (profesor). Mismo sistema «Trazo»: tokens en `src/theme/` (desde `@sgia/design-tokens`), componentes en `src/components/ui/` y menú inferior en barra de iconos (`components/icon-tab-bar.tsx`).
- `packages/api-client/` — cliente HTTP tipado y hooks de TanStack Query. Único lugar donde se llama a la API.
- `packages/types/` — tipos compartidos (Producto, Préstamo, Cotización, Usuario, Equipo). Fuente única de verdad de entidades.
- `packages/design-tokens/` — colores y tipografía compartidos.
- `packages/config/` — tsconfig, ESLint y Prettier compartidos.
- `TASKS/` — especificación de cada requisito (`REQ-XX`). Leer el archivo del requisito antes de tocar un flujo.
- `ENDPOINTS.md` — catálogo de endpoints de la API.
- `FIXES/CHANGELOG-FIXES.md` — historial de correcciones; registrar ahí los cambios importantes.
- `.claude/skills/sgia-design/` — skill con la especificación de diseño de UI (se carga sola). Leer antes de crear o modificar componentes visuales.
- `AGENTS.md` — contexto de negocio y arquitectura completo. Consultarlo para tareas de dominio.
- `docs/` — planes de implementación del frontend. `docs/rediseno-interfaz.md`: rediseño «Trazo» (rama `feat/rediseno-zed`, implementado) con la historia de decisiones. `docs/mapa-salas.md`: mapa SVG por sala con zonas y estantes arrastrables (rama `mapa-salas`, REQ-22, implementado). `docs/rediseno-movil.md`: sistema «Trazo» en la app móvil (rama `feat/rediseno-movil`, implementado). `docs/inicio-movil.md`: Inicio del profesor en la app móvil (rama `feat/inicio-movil`, implementado). `docs/graficos-tanstack-charts.md`: migración de Chart.js a TanStack Charts (rama `feat/tanstack-charts`, implementado). Cajones llenos: plan y contrato en `BackEnd-SGIA/docs/cajones-llenos.md` (REQ-22).

## Reglas duras

- **TypeScript estricto.** Nada de `any`. Tipar todo contra `packages/types`.
- **Las llamadas a la API van solo en `packages/api-client`.** Prohibido usar `fetch` o `axios` dentro de componentes.
- **La API es la fuente de verdad.** El cliente valida por UX, pero ninguna regla de negocio final se asume sin respuesta del backend.
- **Un componente o hook por archivo**, agrupado por funcionalidad en `features/`.
- **Formularios:** React Hook Form + Zod.
- **Tablas densas:** TanStack Table. Los identificadores técnicos (SKU, seriales, RUT, IP/MAC) van en `font-mono`.
- **Sidebar colapsado (`isCollapsed === true`):** el `IconBar` debe permanecer siempre en orientación vertical (`axis="column"`, `flex flex-col items-center`). Nunca en horizontal.
- **Burdeo (`bg-accent`)** es el único acento: CTA principal, etiqueta de sede y gráficos. Nunca como fondo grande ni cabecera. Las alertas críticas van en `rose`/`danger`.

## Decisiones de diseño

Sistema «Trazo» (rama `feat/rediseno-zed`; regla completa en `.claude/skills/sgia-design/SKILL.md`, historia en `docs/rediseno-interfaz.md`): neutros cálidos papel/grafito con la escala `zinc` redefinida en `apps/web/src/index.css` (se sigue escribiendo `zinc-*`), burdeo como único acento (rosa en oscuro), menú lateral neutro (`bg-zinc-100 dark:bg-zinc-900`, activo con barra burdeo), Geist en la interfaz y Geist Mono solo en `font-code` (SKU, RUT, seriales, códigos); `font-mono` es Geist con cifras tabulares, radios 4/6/8px, sin paletas alternativas, pesos 400/500 (nunca 700), nada bajo 12px y rótulos en tipo oración (sin `uppercase`). Chips de código como etiqueta crema (`CODE_CHIP_CLASS`); badges con el componente `Badge`.
Componentes base en `apps/web/src/components/ui/` (`PageHeader`, `Metric`, `CellGrid`, `TableFrame`, `Dialog`/`Sheet`, `Badge`, `ErrorState`); el menú sale de `layouts/nav-config.ts` y los gráficos (TanStack Charts) de `lib/chart-theme.ts`. Responsivo de 320 a 1440 px, controles de 44px con puntero táctil.

## Convenciones de trabajo

- Antes de crear un archivo nuevo, buscar si ya existe uno equivalente.
- Registrar en `FIXES/CHANGELOG-FIXES.md` los cambios importantes.
- Idioma: la documentación y los mensajes de commit van en español.
- Errores al usuario: siempre con `apiErrorToMessage` (web) o `requestErrorMessage` (móvil), nunca `error.message` ni `error.body.message` directo: un 5xx puede traer SQL o trazas (auditoría de seguridad, FIX-054). Nada de `document.write`/`innerHTML` con datos del usuario sin escapar.
