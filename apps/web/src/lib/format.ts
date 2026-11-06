const clp = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

export function formatCLP(value: number | null | undefined): string {
  return clp.format(value ?? 0);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-CL', {
    timeZone: 'America/Santiago',
  });
}

/**
 * Fecha sin hora (`AAAA-MM-DD`, p. ej. `loan_date`, `report_date`) como `DD-MM-AAAA`.
 * `formatDate` la interpreta como UTC y en America/Santiago mostraría el día anterior.
 */
export function formatDateOnly(value: string | null | undefined): string {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return formatDate(value);
  return `${match[3]}-${match[2]}-${match[1]}`;
}

const dateTime = new Intl.DateTimeFormat('es-CL', {
  timeZone: 'America/Santiago',
  dateStyle: 'short',
  timeStyle: 'short',
});

export function formatDateTime(value: string | null | undefined): string {
  return value ? dateTime.format(new Date(value)) : '—';
}

export function formatNumber(value: number, maximumFractionDigits = 0): string {
  return value.toLocaleString('es-CL', { maximumFractionDigits });
}
