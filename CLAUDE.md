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

- `apps/web/` — panel administrativo (React 19, Vite, Tailwind, Radix/Shadcn). Roles AD-01, DIR-01, PAN-01.
- `apps/mobile/` — app Expo / React Native. Solo rol PRO-01 (profesor).
- `packages/api-client/` — cliente HTTP tipado y hooks de TanStack Query. Único lugar donde se llama a la API.
- `packages/types/` — tipos compartidos (Producto, Préstamo, Cotización, Usuario, Equipo). Fuente única de verdad de entidades.
- `packages/design-tokens/` — colores y tipografía compartidos.
- `packages/config/` — tsconfig, ESLint y Prettier compartidos.
- `TASKS/` — especificación de cada requisito (`REQ-XX`). Leer el archivo del requisito antes de tocar un flujo.
- `ENDPOINTS.md` — catálogo de endpoints de la API.
- `FIXES/CHANGELOG-FIXES.md` — historial de correcciones; registrar ahí los cambios importantes.
- `.claude/skills/sgia-design/` — skill con la especificación de diseño de UI (se carga sola). Leer antes de crear o modificar componentes visuales.
- `AGENTS.md` — contexto de negocio y arquitectura completo. Consultarlo para tareas de dominio.

## Reglas duras

- **TypeScript estricto.** Nada de `any`. Tipar todo contra `packages/types`.
- **Las llamadas a la API van solo en `packages/api-client`.** Prohibido usar `fetch` o `axios` dentro de componentes.
- **La API es la fuente de verdad.** El cliente valida por UX, pero ninguna regla de negocio final se asume sin respuesta del backend.
- **Un componente o hook por archivo**, agrupado por funcionalidad en `features/`.
- **Formularios:** React Hook Form + Zod.
- **Tablas densas:** TanStack Table. Los identificadores técnicos (SKU, seriales, RUT, IP/MAC) van en `font-mono`.
- **Sidebar colapsado (`isCollapsed === true`):** el `IconBar` debe permanecer siempre en orientación vertical (`axis="column"`, `flex flex-col items-center`). Nunca en horizontal.
- **Rojo institucional (`#d9232a`)** solo para paradas, alertas críticas y la etiqueta de sede. El CTA principal es monocromo. Nunca como fondo grande ni cabecera.

## Decisiones de diseño

Resueltas en Fase 2 de `rework.md` según el código existente (detalle en el skill `sgia-design`): canvas `bg-zinc-100 dark:bg-zinc-950`; CTA principal monocromo (sin rojo); badges con el componente `Badge`; paletas alternativas no tiñen canvas ni tarjetas.

## Convenciones de trabajo

- Antes de crear un archivo nuevo, buscar si ya existe uno equivalente.
- Registrar en `FIXES/CHANGELOG-FIXES.md` los cambios importantes.
- Idioma: la documentación y los mensajes de commit van en español.
