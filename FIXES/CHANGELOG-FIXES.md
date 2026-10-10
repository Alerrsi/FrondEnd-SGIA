    2. **Fila Inferior:** Separador sutil (`border-t pt-2`) con la etiqueta de texto `"Tema Claro / Oscuro"` a la izquierda y el componente `Toggle` (`Moon`/`Sun`) a la derecha, garantizando separación total y cero solapamiento incluso en `180px`.
- **Verificación:**
  - `pnpm --filter @sgia/web test`: 26 archivos pasados, 125 tests aprobados.
  - `pnpm typecheck`: 5/5 paquetes aprobados sin errores de TypeScript.

---

## FIX-002: Incorporación de Ajustes de Usuario, Modal de Paletas de Color y Prevención de Solapamiento

- **Fecha:** 2026-10-10
- **Módulo:** Configuración de Usuario / Paleta de Colores (`apps/web`) — [REQ-CONFIG](file:///home/alerrsi/Documents/proyects/SGIA/FrondEnd-SGIA/TASKS/REQ-CONFIG.md)
- **Archivos Modificados / Creados:**
  - [`apps/web/src/components/settings/settings-modal.tsx`](file:///home/alerrsi/Documents/proyects/SGIA/FrondEnd-SGIA/apps/web/src/components/settings/settings-modal.tsx)
  - [`apps/web/src/components/settings/settings-modal.test.tsx`](file:///home/alerrsi/Documents/proyects/SGIA/FrondEnd-SGIA/apps/web/src/components/settings/settings-modal.test.tsx)
  - [`apps/web/src/contexts/theme-context.tsx`](file:///home/alerrsi/Documents/proyects/SGIA/FrondEnd-SGIA/apps/web/src/contexts/theme-context.tsx)
  - [`apps/web/src/contexts/theme-context.test.tsx`](file:///home/alerrsi/Documents/proyects/SGIA/FrondEnd-SGIA/apps/web/src/contexts/theme-context.test.tsx)
  - [`apps/web/src/layouts/app-layout.tsx`](file:///home/alerrsi/Documents/proyects/SGIA/FrondEnd-SGIA/apps/web/src/layouts/app-layout.tsx)
  - [`apps/web/src/layouts/app-layout.test.tsx`](file:///home/alerrsi/Documents/proyects/SGIA/FrondEnd-SGIA/apps/web/src/layouts/app-layout.test.tsx)
  - [`apps/web/src/index.css`](file:///home/alerrsi/Documents/proyects/SGIA/FrondEnd-SGIA/apps/web/src/index.css)
  - [`TASKS/REQ-CONFIG.md`](file:///home/alerrsi/Documents/proyects/SGIA/FrondEnd-SGIA/TASKS/REQ-CONFIG.md)
- **Requerimientos Implementados:**
  1. **Botón de Ajustes en el Sidebar:** Se añadió botón con icono de engranaje (`Settings`) al costado del nombre del usuario en la fila superior del perfil y en el muelle de iconos colapsado (`IconBar 3`), con accesibilidad por teclado y tooltips informativos.
  2. **Modal de Ajustes (`SettingsModal`):** Diálogo Radix centrado y responsive que despliega la sección *"Paleta de Colores de Interfaz"* y *"Modo de Visualización"*.
  3. **Paleta Principal (Industrial INACAP):** Basada en la escala Zinc industrial (`#f4f4f5` / `#18181b`), con acento institucional INACAP (`#dc2626`) y estados técnicos normalizados.
  4. **Paleta B1 (Azul Acero & Indigo):** Implementación de la paleta B1 detallada en `SKILLS/Design.md` con 8 swatches técnicos interactivos: Smart Blue (`#0466c8`), Steel Azure (`#0353a4`), Regal Navy (`#023e7d`), Prussian Blue (`#002855`), Twilight Indigo (`#33415c`), Blue Slate (`#5c677d`), Slate Grey (`#7d8597`) y Cool Steel (`#979dac`).
  5. **Verificación de Cero Solapamiento:**
     - En la barra lateral: Se utilizaron anchos fijos con `shrink-0` para avatar (28px) y grupo de botones (44px), y `min-w-0 flex-1 truncate` para nombre y rol de usuario, impidiendo desbordes y solapes en `MIN_WIDTH = 180px`.
     - En el modal de ajustes: Se configuró un grid responsive (`grid-cols-1 md:grid-cols-2`) con swatches en `flex flex-wrap` y límites elásticos `line-clamp-2` que garantizan cero colisión en pantallas móviles y de escritorio.
  6. **Alineación con Nota L100 de AGENTS.md (Preservación de Fondos Neutros y Reflejo en Botones/Letras/Estados):**
     - Se preservan estrictamente los colores base blanco y negro neutro en canvas y paneles (con micro-variación sutil permitida, sin saturar fondos con colores invasivos).
     - Los colores de la paleta B1 se reflejan en los tonos de botones (`btn-primary`, botones CTA, rings), letras específicas (enlaces activos de navegación, encabezados, metadatos en Blue Slate y Cool Steel) y estados de entidades (dots y badges semánticos) sin perder la estética y densidad principal.
- **Verificación:**
  - `pnpm --filter @sgia/web test`: 27 archivos pasados, 132 tests aprobados (100% pasando).
  - `pnpm typecheck`: 5/5 paquetes aprobados sin errores de TypeScript.

---

## FIX-003: Corrección de Lentitud en Sidebar al Arrastrar y Capa Transparente en Modo Colapsado

- **Fecha:** 2026-10-10
- **Módulo:** UI Layout / Sidebar (`apps/web`) — [REQ-DISEÑO]
- **Archivos Modificados / Creados:**
  - [`apps/web/src/layouts/app-layout.tsx`](file:///home/alerrsi/Documents/proyects/SGIA/FrondEnd-SGIA/apps/web/src/layouts/app-layout.tsx)
- **Requerimientos Implementados:**
  1. **Arrastre de Panel sin Lag:** Se ha eliminado el lag drástico al arrastrar el separador del sidebar para cambiar su ancho. Esto se logró eliminando la transición CSS (se aplica `transition-none`) exclusivamente cuando `isDragging === true` y procesando el evento `mousemove` a 60FPS usando `requestAnimationFrame`. La transición de `duration-200 ease-out` vuelve al soltar el ratón (`isDragging === false`).
  2. **Arrastrar para Colapsar (Snap to Collapse):** Se ha añadido la regla lógica al `mousemove` donde si `e.clientX` cae por debajo de `COLLAPSE_THRESHOLD = 130`, automáticamente dispara `setIsCollapsed(true)`. Si es mayor a 130, actualiza dinámicamente el ancho respetando el `MIN_WIDTH = 180px`.
  3. **Corrección de Capa Subyacente en Modo Colapsado:** Cuando el sidebar entra en modo `isCollapsed = true` (por ej., pulsando el botón superior o arrastrando debajo de 130px), ahora asume estilos de `bg-transparent border-none shadow-none` en lugar de mantener la base sólida. De este modo, los docks flotantes (ej. `IconBar 1, 2 y 3`) flotan libremente sobre el canvas gris del body sin que se vea una franja lateral debajo de ellos.
  4. **Corrección de Separador en Modo Colapsado:** Se oculta totalmente el `div role="separator"` (opacidad 0) en estado colapsado, preservando su funcionalidad y previniendo cortes visuales sobre el dock flotante.
- **Verificación:**
  - `pnpm --filter @sgia/web test`: 28 archivos pasados, 135 tests aprobados (100% pasando).
  - `pnpm typecheck`: Completado sin errores.

---

## FIX-004: Separación Lateral y Centrado Permanente de IconBars en Modo Colapsado

- **Fecha:** 2026-10-10
- **Módulo:** UI Layout / Sidebar (`apps/web`) — [REQ-DISEÑO]
- **Archivos Modificados:**
  - [`apps/web/src/layouts/app-layout.tsx`](file:///home/alerrsi/Documents/proyects/SGIA/FrondEnd-SGIA/apps/web/src/layouts/app-layout.tsx)
  - [`TASKS/REQ-DISEÑO.md`](file:///home/alerrsi/Documents/proyects/SGIA/FrondEnd-SGIA/TASKS/REQ-DISE%C3%91O.md)
- **Requerimientos Implementados:**
  1. **Margen de Respiración Lateral:** El contenedor colapsado ahora tiene un ancho de `64px` con padding horizontal `px-2` y vertical `py-3`, evitando que los muelles `bar-well` (ancho unificado `48px`) queden pegados a los límites izquierdo y derecho de la pantalla o del canvas.
  2. **Centrado Absoluto de Navegación de Funciones:** El contenedor central de módulos (`IconBar 2` con `GlassIconBar`) incluye ahora `justify-center items-center`, asegurando que el bloque de accesos directos permanezca centrado en el medio de la pantalla (eje vertical y horizontal) con independencia de la altura del viewport o de cuántos módulos tenga habilitado el rol.
  3. **Actualización de Requisitos en REQ-DISEÑO.md:** Se documentaron formalmente ambos ítems en la lista de requisitos.
- **Verificación:**
  - `pnpm --filter @sgia/web test src/layouts/app-layout.test.tsx`: 7 tests pasando.
  - `pnpm typecheck`: En ejecución sin errores.

---

## FIX-005: Eliminación de Caracteres Literales `\n` en Filas de Tabla de Inventario

- **Fecha:** 2026-10-10
- **Módulo:** Módulo Inventario (`apps/web`) — [REQ-03-REQ-04-INVENTARIO-PRODUCTOS]
- **Archivos Modificados:**
  - [`apps/web/src/features/inventario/components/inventario-table.tsx`](file:///home/alerrsi/Documents/proyects/SGIA/FrondEnd-SGIA/apps/web/src/features/inventario/components/inventario-table.tsx)
- **Requerimientos Implementados:**
  1. Se eliminó el literal `\n` que se encontraba renderizado como texto sin escapar al final del mapeo de celdas en el `<tr>` de cada fila del `<tbody>` (línea 526).
- **Verificación:**
  - `git grep -n "\\\\n" apps/web/src/` no devuelve ocurrencias indebidas.
  - Tests del módulo de inventario pasando con éxito.
