import type { ComponentType } from 'react';

/*
 * Escala tipográfica única de la app. Toda vista arma sus títulos con `PageHeading`,
 * `SectionTitle` y `SectionLabel` (o con estas clases cuando el elemento lo dibuja otra
 * librería), para que un mismo nivel se vea igual en todas partes:
 *
 *   Nivel               Componente      Estilo
 *   Título de página    PageHeading     text-xl · bold · icono 20px
 *   Subtítulo de página PageHeading     text-xs · zinc-500
 *   Título de sección   SectionTitle    text-sm · semibold · icono 16px
 *   Rótulo de sección   SectionLabel    text-xs · semibold · MAYÚSCULAS · icono 14px
 *   Cabecera de tabla   TABLE_HEAD_CLASS text-[11px] · mono · MAYÚSCULAS (en `<thead>`)
 *   Etiqueta de campo   FIELD_LABEL_CLASS text-xs · semibold · MAYÚSCULAS (en `<label>`)
 *   Chip de código      CODE_CHIP_CLASS   text-xs · mono · fondo gris (SKU, códigos, IDs)
 *   Mensaje de estado   STATE_TEXT_CLASS  text-xs · centrado · zinc-500 (cargando, sin datos)
 *
 * Siempre `font-sans`; `font-mono` queda para identificadores técnicos (SKU, códigos, RUT).
 * Los títulos de modales y paneles laterales (text-base · semibold) los ponen `Dialog` y `Sheet`.
 */

export type HeadingIcon = ComponentType<{ className?: string }>;

export const PAGE_TITLE_CLASS =
  'flex items-center gap-2 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100';
export const PAGE_SUBTITLE_CLASS = 'text-xs text-zinc-500 dark:text-zinc-400';
export const SECTION_TITLE_CLASS =
  'flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100';
export const SECTION_LABEL_CLASS =
  'flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400';
export const TABLE_HEAD_CLASS =
  'border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40 font-mono text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400';
export const FIELD_LABEL_CLASS =
  'text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400';
export const CODE_CHIP_CLASS =
  'rounded border border-zinc-200/80 dark:border-zinc-700/60 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-zinc-700 dark:text-zinc-300';
export const STATE_TEXT_CLASS = 'text-center text-xs text-zinc-500 dark:text-zinc-400';
