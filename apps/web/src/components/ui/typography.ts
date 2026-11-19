import type { ComponentType } from 'react';

/*
 * Escala tipográfica única de la app (sistema «Trazo», docs/rediseno-interfaz.md §4). Toda vista arma sus
 * títulos con `PageHeading`, `SectionTitle` y `SectionLabel` (o con estas clases cuando el elemento lo dibuja
 * otra librería):
 *
 *   Nivel               Componente        Estilo
 *   Título de página    PageHeading       20px (24px desde sm) · 500 · tracking -0.02em · icono 20px
 *   Subtítulo de página PageHeading       14px · zinc-500
 *   Título de sección   SectionTitle      15px · 500 · icono 16px
 *   Rótulo de sección   SectionLabel      13px · 500 · zinc-500 · icono 14px
 *   Cabecera de tabla   TABLE_HEAD_CLASS  13px · 500 · zinc-500 (en `<thead>`)
 *   Etiqueta de campo   FIELD_LABEL_CLASS 13px · 500 · zinc-600
 *   Chip de código      CODE_CHIP_CLASS   Geist Mono 12px · etiqueta crema con tinta burdeo (SKU, códigos, IDs)
 *   Mensaje de estado   STATE_TEXT_CLASS  13px · centrado · zinc-500 (cargando, sin datos)
 *
 * Pesos 400 y 500 (600 solo en cifras destacadas); nunca 700. Tipo oración: nada de MAYÚSCULAS en rótulos.
 * `font-mono` y `font-code` son Geist Mono con cifras tabulares: SKU, RUT, seriales, códigos y montos.
 * Los títulos de modales y paneles laterales (16px · 500) los ponen `Dialog` y `Sheet`. Nada bajo 12px.
 */

export type HeadingIcon = ComponentType<{ className?: string }>;

export const PAGE_TITLE_CLASS =
  'flex items-center gap-2 font-display text-xl sm:text-2xl font-medium tracking-[-0.02em] text-zinc-900 dark:text-zinc-100';
export const PAGE_SUBTITLE_CLASS = 'mt-0.5 text-sm text-zinc-500 dark:text-zinc-400';
export const SECTION_TITLE_CLASS =
  'flex items-center gap-1.5 text-[15px] leading-[22px] font-medium text-zinc-900 dark:text-zinc-100';
export const SECTION_LABEL_CLASS =
  'flex items-center gap-1.5 text-[13px] leading-[18px] font-medium text-zinc-500 dark:text-zinc-400';
export const TABLE_HEAD_CLASS =
  'border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 text-[13px] font-medium text-zinc-500 dark:text-zinc-400';
export const FIELD_LABEL_CLASS =
  'text-[13px] font-medium text-zinc-600 dark:text-zinc-300';
export const CODE_CHIP_CLASS =
  'rounded-sm bg-tag px-1.5 py-0.5 font-code text-xs text-tag-ink whitespace-nowrap dark:bg-tag/10 dark:text-tag';
export const STATE_TEXT_CLASS = 'text-center text-[13px] text-zinc-500 dark:text-zinc-400';
