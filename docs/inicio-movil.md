# Inicio del profesor en la app móvil

**Estado: plan, sin implementar.** Rama: `feat/inicio-movil`. Solo `apps/mobile`. Sin endpoints nuevos. Seguimiento en `TASKS/REQ-09-PRESTAMOS-REMOTOS.md` (§1, «Inicio móvil»).

## 1. Problema

La app abre directo en el formulario «Solicitar equipo». El docente no ve de un vistazo cómo van sus solicitudes ni qué tiene pendiente. En la web, PRO-01 tiene un Inicio (`apps/web/src/features/inicio`): saludo, acción principal, búsqueda del catálogo, «Lo que te toca hoy» y accesos.

## 2. Decisiones

1. **Inicio es la primera pestaña** del menú de iconos (`House`, como en la web) y la ruta `/`. «Solicitar equipo» pasa a `/solicitar`. Quedan cuatro pestañas: Inicio, Solicitar, Mis préstamos, Novedades.
2. **Mismo contenido que el Inicio web de PRO-01**, adaptado al teléfono (una columna):
   - **Saludo:** «Hola, {nombre}», fecha · «Docente» · pañol del usuario. Botón principal «Solicitar equipo» y dos secundarios «Reportar una falla» y «Mis préstamos».
   - **Búsqueda del catálogo** («¿Qué necesitas para tu clase?»): no deja buscar vacío y lleva a Solicitar con la búsqueda escrita (`/solicitar?q=…`).
   - **Lo que te toca hoy:** tres celdas que comparten bordes (como `CellGrid`), cada una lleva a Mis préstamos: «En revisión» (`pendiente`), «Listas para retirar» (`en_proceso`, el pañol ya la prepara) y «Atrasadas» (`diasAtraso > 0` y sin devolver). Con pendientes, cifra grande y barra burdeo arriba; sin pendientes, «Al día».
   - **Próximas clases:** hasta tres solicitudes con fecha de hoy en adelante (no rechazadas), con código, fecha, bloque, asignatura, laboratorio y estado.
   - **Informes abiertos:** cuántos informes de novedades siguen sin cerrar (`reportado`, `en_revision`, `en_reparacion`); lleva a Novedades.
3. **Estados de los préstamos con los valores reales del backend** (`pendiente`, `en_proceso`, `procesado`, `rechazado`; el atraso es `diasAtraso`). El Inicio web cuenta `preparado` y `atrasado` por estado, que el backend no devuelve: esas celdas quedan siempre en cero. Se anota como hallazgo; el web no se toca en esta tarea.
4. **«Reportar una falla»** abre directamente el formulario de Novedades (`/novedades?nuevo=1`).
5. **Datos:** `useMyLoanRequests({ per_page: 100 })` y `useMyIncidentReports({ per_page: 100 })` de `@sgia/api-client`; tirar para recargar. Los cuatro estados (carga, error, vacío, datos) en cada bloque.
6. **Diseño «Trazo» móvil** (`.claude/skills/sgia-design/SKILL.md` §7): `Screen`, `Section`, `Row`, `Button`, `Badge`, `CodeChip`, `TextField`; el saludo usa `variant="hero"`.

## 3. Archivos

- `src/app/(app)/index.tsx` → Inicio (nuevo). `src/app/(app)/solicitar.tsx` ← el antiguo `index.tsx`, lee `?q=`.
- `src/features/inicio/components/`: `home-hero.tsx`, `catalog-search.tsx`, `today-tasks.tsx`, `upcoming-loans.tsx`, `open-reports.tsx`.
- `src/features/inicio/lib/loan-summary.ts`: cuentas y próximas clases (función pura).
- `src/features/prestamos/lib/loan-status.ts`: estado → tono y nombre, compartido por Inicio y Mis préstamos.
- `src/components/app-tabs.tsx`: pestaña Inicio.
- `novedades.tsx`: abre el formulario con `?nuevo=1`.

## 4. Fases

- [ ] **Fase 1 — Rutas y menú.** Mover Solicitar a `/solicitar`, pestaña Inicio con `House`, `?q=` en Solicitar y `?nuevo=1` en Novedades.
- [ ] **Fase 2 — Inicio.** Saludo, búsqueda, «Lo que te toca hoy», próximas clases e informes abiertos.
- [ ] **Fase 3 — Verificación.** `pnpm typecheck`, `expo lint` sin errores nuevos, capturas a 390 px en claro y oscuro con PRO-01 contra la API de desarrollo; navegación desde cada bloque.
- [ ] **Fase 4 — Cierre.** `TASKS/REQ-09`, `CLAUDE.md`, changelog, este plan a «implementado».

## 5. Fuera de alcance

- Corregir el Inicio web (decisión 3).
- Notificaciones en el Inicio (las push ya llevan a Mis préstamos).
- Endpoints de totales por estado: con más de 100 solicitudes las cuentas son de las 100 más recientes (igual que en la web).
