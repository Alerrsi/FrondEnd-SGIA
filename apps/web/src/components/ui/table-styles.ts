/*
 * Clases de tabla del sistema «Trazo» (docs/rediseno-interfaz.md §9). Las tablas siguen siendo `<table>`
 * propias (con o sin TanStack); estas clases y `TableFrame` les dan el mismo marco, densidad y respuesta.
 *
 *   TH_CLASS          celda de cabecera: 13px · 500 · zinc-500, alineada a la izquierda
 *   TD_CLASS          celda de listado: 14px, 40px de alto aprox.
 *   TD_COMPACT_CLASS  celda dentro de un panel o modal
 *   ROW_CLASS         fila con línea inferior y fondo al pasar el puntero
 *   STICKY_COL_CLASS  primera columna fija bajo 768px (en `<th>` y `<td>`), para no perder la referencia al
 *                     desplazar la tabla de lado en el teléfono
 */
export const TH_CLASS = 'px-4 py-2.5 text-left text-[13px] font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap';
export const TD_CLASS = 'px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300';
export const TD_COMPACT_CLASS = 'px-3 py-2 text-[13px] text-zinc-700 dark:text-zinc-300';
export const ROW_CLASS =
  'border-b border-zinc-200 last:border-b-0 dark:border-zinc-800 transition-colors duration-150 hover:bg-zinc-50 dark:hover:bg-zinc-800/40';
export const STICKY_COL_CLASS =
  'max-md:sticky max-md:left-0 max-md:z-[1] max-md:bg-white max-md:shadow-[1px_0_0_0_var(--line)] max-md:dark:bg-zinc-900';
