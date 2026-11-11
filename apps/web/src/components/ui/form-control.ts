/*
 * Estilo único de los campos (`<input>`, `<select>`, `<textarea>`). Dos variantes:
 *   FORM_CONTROL_CLASS    campo de formulario (modales y paneles): ancho completo, 34px de alto.
 *   FILTER_CONTROL_CLASS  filtro en la barra de una tabla: 32px de alto, ancho según contenido.
 * `FORM_CONTROL_BASE_CLASS` es el de formulario sin alto fijo, para `<textarea>`.
 */

const SHARED =
  'rounded-md border border-zinc-200 dark:border-zinc-800 font-mono text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-colors focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 disabled:opacity-50 aria-invalid:border-rose-400 dark:aria-invalid:border-rose-700';

export const FORM_CONTROL_BASE_CLASS = `w-full bg-white dark:bg-zinc-900 px-3 ${SHARED}`;
export const FORM_CONTROL_CLASS = `h-8.5 ${FORM_CONTROL_BASE_CLASS}`;
export const FILTER_CONTROL_CLASS = `h-8 bg-zinc-50 dark:bg-zinc-950 px-2 ${SHARED}`;
