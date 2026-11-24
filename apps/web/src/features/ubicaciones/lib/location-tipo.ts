const LABELS: Record<string, string> = {
  sala: 'Sala',
  panol: 'Pañol',
  taller: 'Taller',
  bodega: 'Bodega',
};

/** Nombre del tipo de ubicación en tipo oración (`panol` → «Pañol»); un tipo desconocido se muestra tal cual. */
export function locationTipoLabel(tipo: string | null | undefined): string {
  if (!tipo) return '';
  return LABELS[tipo] ?? tipo;
}
