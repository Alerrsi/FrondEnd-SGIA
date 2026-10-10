# Registro de Correcciones y Fixes (SGIA Frontend)

Este documento registra de forma cronológica todas las correcciones de bugs, optimizaciones de interfaz y ajustes técnicos realizados en el proyecto.

---

## 📌 Índice de Correcciones

- [FIX-001: Solapamiento entre Nombre de Usuario y Toggle de Modo Oscuro en Sidebar Mínimo](#fix-001-solapamiento-entre-nombre-de-usuario-y-toggle-de-modo-oscuro-en-sidebar-mínimo)
- [FIX-002: Incorporación de Ajustes de Usuario, Modal de Paletas de Color y Prevención de Solapamiento](#fix-002-incorporación-de-ajustes-de-usuario-modal-de-paletas-de-color-y-prevención-de-solapamiento)

---

## FIX-001: Solapamiento entre Nombre de Usuario y Toggle de Modo Oscuro en Sidebar Mínimo

- **Fecha:** 2026-10-10
- **Módulo:** UI Global / Layout Lateral (`apps/web`)
- **Archivos Modificados:**
  - [`apps/web/src/layouts/app-layout.tsx`](file:///home/alerrsi/Documents/proyects/SGIA/FrondEnd-SGIA/apps/web/src/layouts/app-layout.tsx)
- **Problema Detectado:**
  - Cuando el sidebar se encontraba en modo expandido pero en su ancho mínimo redimensionable (`MIN_WIDTH = 180px`), la tarjeta inferior de perfil colocaba en una sola fila horizontal (`flex justify-between items-center`):
    1. Las iniciales del avatar.
    2. El nombre del usuario y su rol.
    3. El control de modo oscuro (`Toggle` + iconos `Moon`/`Sun`).
    4. El botón de cerrar sesión (`LogOut`).
  - Al reducir el ancho a 180px-200px, el contenedor del toggle de tema chocaba y se solapaba visualmente con el texto del nombre del usuario (`user.nombre`).
- **Solución Implementada:**
  - Se rediseñó la tarjeta de perfil inferior dividiéndola en dos filas limpias y ergonómicas con padding adecuado (`p-2.5` y `gap-2`):
    1. **Fila Superior:** Avatar del usuario, nombre truncado elásticamente (`truncate flex-1 min-w-0 pr-1`) y botón directo de cerrar sesión (`LogOut`).
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
- **Requerimientos Implementados:**
  1. **Botón de Ajustes en el Sidebar:** Se añadió botón con icono de engranaje (`Settings`) al costado del nombre del usuario en la fila superior del perfil y en el muelle de iconos colapsado (`IconBar 3`), con accesibilidad por teclado y tooltips informativos.
  2. **Modal de Ajustes (`SettingsModal`):** Diálogo Radix centrado y responsive que despliega la sección *"Paleta de Colores de Interfaz"* y *"Modo de Visualización"*.
  3. **Paleta Principal (Industrial INACAP):** Basada en la escala Zinc industrial (`#f4f4f5` / `#18181b`), con acento institucional INACAP (`#dc2626`) y estados técnicos normalizados.
  4. **Paleta B1 (Azul Acero & Indigo):** Implementación de la paleta B1 detallada en `SKILLS/Design.md` con 8 swatches técnicos interactivos: Smart Blue (`#0466c8`), Steel Azure (`#0353a4`), Regal Navy (`#023e7d`), Prussian Blue (`#002855`), Twilight Indigo (`#33415c`), Blue Slate (`#5c677d`), Slate Grey (`#7d8597`) y Cool Steel (`#979dac`).
  5. **Verificación de Cero Solapamiento:**
     - En la barra lateral: Se utilizaron anchos fijos con `shrink-0` para avatar (28px) y grupo de botones (44px), y `min-w-0 flex-1 truncate` para nombre y rol de usuario, impidiendo desbordes y solapes en `MIN_WIDTH = 180px`.
     - En el modal de ajustes: Se configuró un grid responsive (`grid-cols-1 md:grid-cols-2`) con swatches en `flex flex-wrap` y límites elásticos `line-clamp-2` que garantizan cero colisión en pantallas móviles y de escritorio.
- **Verificación:**
  - `pnpm --filter @sgia/web test`: 27 archivos pasados, 132 tests aprobados (100% pasando).
  - `pnpm typecheck`: 5/5 paquetes aprobados sin errores de TypeScript.
