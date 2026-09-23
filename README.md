# SGIA — Frontend (Monorepo)

Panel web y app móvil del **SGIA** (Sistema de Gestión de Inventario y Activos), INACAP Sede Temuco.

Lee `AGENTS.md` para el contexto completo de negocio, arquitectura y estética.

## Estructura

```
.
├── apps/
│   ├── web/              # Panel administrativo (Vite + React) — AD-01, DIR-01, PAN-01
│   └── mobile/           # App móvil (Expo + React Native) — PRO-01
├── packages/
│   ├── api-client/       # Cliente HTTP tipado + hooks de TanStack Query
│   ├── types/            # Tipos compartidos (Producto, Préstamo, Cotización, Usuario, Equipo…)
│   ├── config/           # tsconfig, eslint, prettier compartidos
│   └── design-tokens/    # Colores, tipografía, espaciado (Tailwind/NativeWind + TS)
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## Requisitos

- Node >= 20
- pnpm >= 9 (el monorepo usa pnpm workspaces + Turborepo)

## Comandos

```bash
pnpm install        # instalar todas las apps y paquetes
pnpm dev            # turbo: corre el dev server de cada app
pnpm dev:web        # solo web (Vite)
pnpm dev:mobile     # solo mobile (Expo)
pnpm build          # build de producción
pnpm lint           # lint de todas las apps/paquetes
pnpm typecheck      # typecheck de todas las apps/paquetes
```

## Nota de stack

El documento de formulación original especificaba Flutter para el componente móvil.
Este monorepo usa **React Native (Expo)**; el cambio de stack debe quedar constancia
en la documentación académica del proyecto.