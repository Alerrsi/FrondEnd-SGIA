/**
 * Distribución de Ubicaciones según el ancho del área de trabajo (docs/ubicaciones-distribucion.md). Se mide el
 * área y no la ventana porque el menú lateral puede estar abierto, encogido o como cajón.
 *   stack  < 640 px      todo apilado; la sala en un selector y el panel como hoja.
 *   split  640–939 px    columna de salas y plano; el panel como hoja.
 *   wide   ≥ 940 px      salas, plano y panel acoplado.
 */
export type WorkspaceMode = 'stack' | 'split' | 'wide';

export const SPLIT_MIN_PX = 640;
export const WIDE_MIN_PX = 940;
/**
 * Para bajar de distribución el ancho debe quedar este margen bajo el umbral. Al apilarse, la página se desplaza y
 * su barra resta unos 15 px de ancho; sin margen, justo en el umbral las dos distribuciones se alternarían.
 */
export const HYSTERESIS_PX = 24;

const RANK: Record<WorkspaceMode, number> = { stack: 0, split: 1, wide: 2 };

function modeFor(width: number): WorkspaceMode {
  if (width >= WIDE_MIN_PX) return 'wide';
  return width >= SPLIT_MIN_PX ? 'split' : 'stack';
}

/**
 * Distribución para `width`. Con `previous`, subir es inmediato y bajar exige quedar `HYSTERESIS_PX` bajo el
 * umbral. Sin medida (pruebas, primer render sin `ResizeObserver`) usa la distribución completa.
 */
export function workspaceMode(width: number, previous?: WorkspaceMode): WorkspaceMode {
  if (width <= 0) return previous ?? 'wide';
  const next = modeFor(width);
  if (!previous || RANK[next] >= RANK[previous]) return next;
  const lower = modeFor(width + HYSTERESIS_PX);
  return RANK[lower] < RANK[previous] ? lower : previous;
}
