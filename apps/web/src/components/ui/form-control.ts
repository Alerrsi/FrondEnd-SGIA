/*
 * Estilo único de los campos (`<input>`, `<select>`, `<textarea>`). Dos variantes:
 *   FORM_CONTROL_CLASS    campo de formulario (modales y paneles): ancho completo, 34px de alto.
 *   FILTER_CONTROL_CLASS  filtro en la barra de una tabla: 32px de alto, ancho según contenido.
 * Con puntero táctil (`pointer-coarse`) ambos miden 44px. Foco: borde burdeo y anillo suave de 3px.
 * `FORM_CONTROL_BASE_CLASS` es el de formulario sin alto fijo, para `<textarea>`.
 */

const SHARED =
  'rounded-md border border-zinc-200 dark:border-zinc-800 text-[13px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-[border-color,box-shadow] duration-150 hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-accent focus:outline-none focus:ring-3 focus:ring-accent/15 disabled:opacity-50 aria-invalid:border-rose-400 dark:aria-invalid:border-rose-700';

export const FORM_CONTROL_BASE_CLASS = `w-full bg-white dark:bg-zinc-900 px-3 ${SHARED}`;
export const FORM_CONTROL_CLASS = `h-8.5 pointer-coarse:h-11 ${FORM_CONTROL_BASE_CLASS}`;
export const FILTER_CONTROL_CLASS = `h-8 pointer-coarse:h-11 bg-zinc-50 dark:bg-zinc-950 px-2 ${SHARED}`;
