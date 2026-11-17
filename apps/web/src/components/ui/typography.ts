import type { ComponentType } from 'react';

/*
 * Escala tipográfica única de la app (sistema «Pañol»). Toda vista arma sus títulos con `PageHeading`,
 * `SectionTitle` y `SectionLabel` (o con estas clases cuando el elemento lo dibuja otra librería):
 *
 *   Nivel               Componente        Estilo
 *   Título de página    PageHeading       text-2xl · bold · tracking-tight · icono 20px
 *   Subtítulo de página PageHeading       text-sm · zinc-500
 *   Título de sección   SectionTitle      text-sm · semibold · icono 16px
 *   Rótulo de sección   SectionLabel      text-xs · semibold · zinc-500 · icono 14px
 *   Cabecera de tabla   TABLE_HEAD_CLASS  text-xs · medium · zinc-500 (en `<thead>`)
 *   Etiqueta de campo   FIELD_LABEL_CLASS text-xs · medium · zinc-600
 *   Chip de código      CODE_CHIP_CLASS   mono · etiqueta crema con tinta burdeo (SKU, códigos, IDs)
 *   Mensaje de estado   STATE_TEXT_CLASS  text-xs · centrado · zinc-500 (cargando, sin datos)
 *
 * Todo en tipo oración: nada de MAYÚSCULAS en rótulos. `font-mono` es la fuente de interfaz con cifras
 * tabulares (datos técnicos: ubicaciones, RUT, montos); `font-code` es la monoespaciada real, solo en chips.
 * Los títulos de modales y paneles laterales (text-base · semibold) los ponen `Dialog` y `Sheet`.
 */

export type HeadingIcon = ComponentType<{ className?: string }>;

export const PAGE_TITLE_CLASS =
  'flex items-center gap-2 font-display text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100';
export const PAGE_SUBTITLE_CLASS = 'mt-0.5 text-sm text-zinc-500 dark:text-zinc-400';
export const SECTION_TITLE_CLASS =
  'flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100';
export const SECTION_LABEL_CLASS =
  'flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400';
export const TABLE_HEAD_CLASS =
  'border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/40 text-xs font-medium text-zinc-500 dark:text-zinc-400';
export const FIELD_LABEL_CLASS =
  'text-xs font-medium text-zinc-600 dark:text-zinc-300';
export const CODE_CHIP_CLASS =
  'rounded-sm bg-tag px-1.5 py-0.5 font-code text-xs font-medium text-tag-ink whitespace-nowrap dark:bg-tag/15 dark:text-tag';
export const STATE_TEXT_CLASS = 'text-center text-xs text-zinc-500 dark:text-zinc-400';
