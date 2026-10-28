---
description: Crea la estructura de features/<módulo>/ para una pantalla nueva
argument-hint: [módulo] [rol]
---

Módulo y rol: $ARGUMENTS. Si falta alguno, pregúntalo antes de crear nada (roles válidos: AD-01, DIR-01, PAN-01 en web).

1. Lee el `TASKS/REQ-XX` del módulo y `.claude/skills/sgia-design/SKILL.md`.
2. Si `apps/web/src/features/<módulo>/` ya existe, reutilízalo; no crees uno equivalente.
3. Crea, siguiendo los módulos vecinos (por ejemplo `features/inventario/`): `components/`, `hooks/`, `pages/`, un componente o hook por archivo, nombres en kebab-case.
4. Datos solo vía hooks de `packages/api-client`; tipos desde `packages/types`. Sin `fetch`/`axios` ni `any`.
5. Formularios con React Hook Form + Zod; tablas con TanStack Table.
6. Protege la ruta con `RequireRole` para el rol indicado.
7. Al terminar corre `/verificar`.
