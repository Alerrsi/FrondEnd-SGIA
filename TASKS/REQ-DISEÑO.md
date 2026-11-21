- [x] Panel lateral responsivo y encogible:
  - [x] Boton de que haga expand y collapse 
  - [x] Que se pueda ajustar el tamaño y todas las interfaces se adapten al tamaño de este, cambiando el estado del cursor (`col-resize`)
  - [x] Solo mostrar rol como nombre "Pañol" / "Administrador" segun sea el caso (sin códigos técnicos AD-01 / PAN-01)
- [x] El sidebar debe poder quedar como en modo encogido con la opción de mostrar los logos de las opciones para acceder a ellos
- [x] Opcion en sidebar de cambiar el modo entre claro y oscuro
- [x] Cada formulario modal si el usuario ingreso datos y por cualquier motivo quiere salir del formulario ya sea usando esc o hacer click en otra parte que haga eso, se debe mostrar un panel de confirmación para que este confirme si realmente quiere salir, SOLO SI TIENE DATOS ESCRITOS
- [x] usar componente 'toggle' para cambiar entre modo claro y modo oscuro
- [x] usar componente 'iconbar' el cual en modo comprimido con el boton de collapse siempre debe permanecer en orientación vertical (con los iconos apilados en columna vertical w-[48px], axis="column"), centrado y adaptable al modo oscuro
- [x] Unificar anchura de todos los iconbars en modo encogido para que tengan exactamente la misma dimensión visual (w-[48px]) sin discrepancias
- [x] En modo encogido, ocultar el toggle y utilizar un botón con icono adaptativo (sol/luna) para alternar entre modo claro y oscuro
- [x] El header debe ser del mismo color que el body, sin descrepansias
- [x] Margen de respiración lateral en iconbars: Espacio de separación respecto a los bordes izquierdo y derecho del sidebar para evitar sensación de saturación o estar pegados a los límites (ancho del panel colapsado ajustado a 64px, con padding horizontal px-2 y centrado balanceado).
- [x] Centrado vertical y horizontal permanente del iconbar de módulos/funciones: El bloque central de navegación permanece perfectamente centrado en el eje vertical y horizontal dentro del viewport, independientemente de la cantidad de enlaces.

## Rediseño «Trazo» (rama `feat/rediseno-zed`)

Plan completo: `docs/rediseno-interfaz.md` (estado: plan, sin implementar). Referencia visual: zed.dev.

- [x] Fase 1 — Tokens y tipografía (Geist + Geist Mono, neutros cálidos, burdeo único acento)
- [x] Fase 2 — Componentes base (`Button`, `Kbd`, `CellGrid`, `Metric`, `DataTable`, `Dialog`/`Sheet` responsivos)
- [x] Fase 3 — Layouts sidebar y header con `nav-config.ts` único, buscador `Ctrl K` y rutas diferidas
- [x] Fase 4 — Página de inicio por rol (PAN-01, DIR-01, AD-01, PRO-01)
- [x] Fase 5 — Migración de pantallas por módulo
- [x] Fase 6 — Tema de gráficos (Chart.js, datos por GraphQL)
- [x] Fase 7 — Responsivo (320–1440), rendimiento y accesibilidad
- [x] Fase 8 — Cierre: `sgia-design`, `CLAUDE.md`, changelog

## Rediseño «Trazo» en móvil (rama `feat/rediseno-movil`)

Plan completo: `docs/rediseno-movil.md` (estado: plan, sin implementar). Solo `apps/mobile` y `packages/design-tokens`.

- [x] Fase 0 — Base: dependencias instaladas (typecheck móvil en verde) y tokens claro/oscuro en `design-tokens`
- [ ] Fase 1 — Tema `src/theme/`, Geist y Geist Mono, tema de navegación
- [ ] Fase 2 — Componentes (`ThemedText`, `Button`, `Badge`, `CodeChip`, `Section`, `TextField`, `EmptyState`, `ScreenHeader`) y campos reestilizados
- [ ] Fase 3 — Marco: barra de iconos inferior estilo riel del sidebar web, splash SGIA
- [ ] Fase 4 — Pantallas: login, Solicitar, Mis préstamos, Novedades
- [ ] Fase 5 — Limpieza de plantilla, auditoría y capturas claro/oscuro a 375 px
- [ ] Fase 6 — Cierre: `sgia-design`, `CLAUDE.md`, changelog
