# rework.md — Tareas de rehacer y corregir el repositorio

Lista de cambios para dejar el repositorio bien configurado para Claude Code y consistente en código y documentación. Ordenado por prioridad: primero lo que afecta a todo lo demás.

Estado: `[ ]` pendiente · `[x]` hecho · `[~]` en progreso

---

## Fase 0 — Línea base (antes de cambiar nada)

- [x] **Ejecutar `pnpm install`** y registrar la versión de Node y pnpm usadas.
- [x] **Ejecutar `pnpm typecheck`** y guardar el resultado en `FIXES/baseline-typecheck.txt`.
  - Criterio: se sabe cuántos errores hay hoy.
- [x] **Ejecutar `pnpm --filter @sgia/web test`** y guardar el resultado en `FIXES/baseline-test.txt`.
  - Criterio: se sabe cuántos tests pasan. El changelog menciona 132 aprobados el 2026-10-10; confirmar si sigue siendo así.
- [x] **Ejecutar `pnpm lint`** y registrar errores y advertencias.

Motivo: sin esta línea base no se puede saber si un cambio rompió algo.

---

## Fase 1 — Configuración de Claude Code

- [x] **Crear `CLAUDE.md`** en la raíz (ya generado).
- [x] **Crear `.claude/settings.json`** con permisos:
  - Permitir: `pnpm typecheck`, `pnpm lint`, `pnpm --filter @sgia/web test`, `pnpm --filter @sgia/web dev`, `git status`, `git diff`, `git log`.
  - Pedir confirmación: `pnpm install`, `pnpm add`, `pnpm remove`, `git commit`, `git push`.
  - Denegar: `rm -rf`, `git push --force`, `git reset --hard`.
  - Criterio: Claude no pide permiso para correr typecheck o tests, pero sí antes de instalar o borrar algo.
- [x] **Convertir `SKILLS/Design.md` en un skill real:**
  - Crear `.claude/skills/sgia-design/SKILL.md` con frontmatter:
    ```yaml
    ---
    name: sgia-design
    description: Diseño visual de la UI de SGIA (web). Usar al crear o modificar componentes, pantallas, tablas, formularios o badges en apps/web.
    ---
    ```
  - Mover las paletas alternativas (Sage, Lavender, Nordic, Peach, Chamomile, B1) a `.claude/skills/sgia-design/references/paletas.md` para que solo se carguen cuando se necesiten.
  - Criterio: al pedir "haz una pantalla de inventario", Claude carga el skill sin que el usuario lo pida.
- [x] **Decidir si `SKILLS/Design.md` se mantiene** como documento de referencia o se elimina después de migrar. → eliminado; el skill es la única fuente.
- [x] **Crear comandos de proyecto** en `.claude/commands/`:
  - `/verificar`: corre typecheck, lint y tests web, y resume los fallos.
  - `/nueva-pantalla`: pide módulo y rol, y crea la estructura de `features/<módulo>/` siguiendo las convenciones.

---

## Fase 2 — Resolver conflictos de diseño (decisión del equipo)

Estas decisiones no las puede tomar Claude por su cuenta. Hay que elegir una opción en cada caso y dejarla escrita en `SKILLS/Design.md` y en `AGENTS.md` (la misma en los dos).

- [x] **Color del canvas:** `bg-slate-50` (AGENTS §5) o `bg-zinc-100` (Design.md §2A).
- [x] **Uso del rojo institucional en botones:** permitido en CTAs como "Dar de alta producto" (AGENTS) o prohibido, con CTA monocromo (Design.md).
- [x] **Estilo de badges de estado:** pastilla con fondo de color (AGENTS §5) o punto de 6px sobre fondo neutro (Design.md).
- [x] **Paletas alternativas:** confirmar si la nota de "preservación de fondos" de AGENTS sigue vigente.

Resuelto el 2026-10-27 según el código existente (canvas zinc-100, CTA monocromo, `Badge` tintado + dot opcional, nota de fondos vigente). Criterio: los dos archivos dicen lo mismo en esos cuatro puntos.

---

## Fase 3 — Limpieza de documentación

- [x] **Quitar rutas absolutas `file:///home/alerrsi/...`** de `AGENTS.md` y de `FIXES/CHANGELOG-FIXES.md`. Reemplazar por rutas relativas (`TASKS/REQ-01-AUTENTICACION-SESIONES.md`).
  - Motivo: no funcionan fuera de esa máquina y son ruido en el contexto.
- [x] **Unificar el nombre del sistema.** `AGENTS.md` dice "Sistema de Gestión de Inventario y Activos" y `ENDPOINTS.md` dice "Sistema de Gestión de Inventario y Almacenamiento". Elegir uno.
- [x] **Actualizar `sgia-frontend/` en `AGENTS.md` §2.** La estructura del árbol usa ese nombre, pero el repositorio se llama `frondend-sgia`. Corregir la ruta del árbol o aclarar que es ilustrativo.
- [x] **Corregir el typo del nombre del repositorio:** `FrondEnd-SGIA` aparece en las rutas de los docs y `frondend-sgia` en el remoto. Decidir cuál es el nombre oficial y renombrar en los docs.
- [x] **Reducir `AGENTS.md`** o dividirlo: lo de negocio y roles puede quedarse; el detalle de diseño ya vive en el skill (Fase 1).
- [x] **Actualizar `README.md`:** agregar el paso de `pnpm install` antes de `pnpm dev:web` (ya está, pero confirmar) y una sección "Para agentes de IA" que apunte a `CLAUDE.md`.

---

## Fase 4 — Estado de los requisitos

`TASKS/README.md` marca el estado de cada requisito. Revisar si coincide con el código real.

- [x] **REQ-01 (80%)**: confirmar qué falta exactamente.
- [x] **REQ-02 (100%)**: confirmar que los tests de `usuarios-lifecycle` y `usuarios-table` pasan.
- [x] **REQ-03-04 (Pendiente)**: revisar si ya existe `inventario-table` y `producto-form-dialog` en `apps/web/src/features/inventario/`. Si existen, el estado está desactualizado.
- [x] **REQ-05, 06, 07, 08 (Pendientes)**: revisar si hay código parcial en `features/ubicaciones`, `features/alertas`, `features/cotizaciones` y `features/proveedores`.
- [x] **REQ-CONFIG (100%)**: confirmar con `FIX-002` y `FIX-003` del changelog.
- [x] **Actualizar `TASKS/README.md`** con el estado real.

Criterio: el porcentaje de cada requisito se puede justificar con archivos concretos.

---

## Fase 5 — Código

Estos puntos dependen de lo que muestre la Fase 0. Se completan después.

- [x] **Resolver los errores de `pnpm typecheck`** registrados en la línea base.
- [x] **Resolver los fallos de tests** registrados en la línea base.
- [x] **Revisar `apps/web/src/components/ui/toogle.tsx`**: el nombre tiene una errata y existe también `toggle.tsx`. Confirmar si son duplicados y eliminar el que no se usa.
- [x] **Revisar `apps/web/src/features/dashboard/data/mock-metrics.json`**: confirmar que no se usa en producción o moverlo a un directorio de mocks. → sí se usa en producción (`use-metrics.ts`, sin GraphQL aún, REQ-14 `[p]`); movido a `dashboard/mocks/`.
- [x] **Revisar `apps/web/src/features/usuarios/lib/run.ts`**: el nombre no describe su contenido; renombrar si es una utilidad genérica. → no es genérica: validación/formato del RUN chileno, solo de `usuarios`; se mantiene el nombre.
- [x] **Verificar que `apps/mobile` consume la API solo por `packages/api-client`** y no con `fetch` directo.
- [x] **Confirmar que las pantallas del mobile tienen tests**: no hay script `test` en `apps/mobile/package.json`. Decidir si se agrega Jest o se documenta que no se testea. → confirmado: no hay tests móviles; se documenta, sin agregar Jest por ahora.

---

## Fase 6 — Verificación final

- [x] `pnpm install` sin errores.
- [x] `pnpm typecheck` sin errores.
- [x] `pnpm lint` sin errores nuevos respecto de la línea base.
- [x] `pnpm --filter @sgia/web test` con al menos la misma cantidad de tests pasando que en la línea base.
- [x] `FIXES/CHANGELOG-FIXES.md` tiene una entrada por cada cambio importante de este rework.
- [x] `TASKS/README.md` refleja el estado real.

---

## Notas para quien ejecute este documento

- Trabajar en ramas separadas por fase (`rework/fase-1-claude-config`, etc.).
- Commitear por tarea, no por fase completa.
- Las decisiones de la Fase 2 no se toman sin consultar al equipo.
