/** Hoy (`AAAA-MM-DD`) en la hora local; `toISOString()` daría el día UTC y de noche adelanta la fecha. */
export function todayIso(): string {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}
