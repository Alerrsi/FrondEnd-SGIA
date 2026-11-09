/** Fecha local a `AAAA-MM-DD`; `toISOString()` daría el día UTC y de noche adelanta la fecha. */
export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Hoy (`AAAA-MM-DD`) en la hora local. */
export function todayIso(): string {
  return toIsoDate(new Date());
}

/** `AAAA-MM-DD` a fecha local; `new Date(iso)` la leería como UTC y podría retroceder un día. */
export function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year!, month! - 1, day!);
}

/** `AAAA-MM-DD` a `DD-MM-AAAA` para mostrarla al usuario. */
export function formatIsoDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  return `${day}-${month}-${year}`;
}
