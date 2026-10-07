import type { Tone } from '@/components/ui/badge';

export interface EquipmentLifeCycleInfo {
  purchaseDateFormatted: string;
  lifespanYears: number;
  ageYears: number;
  remainingYears: number;
  percentUsed: number;
  isExpired: boolean;
  isCritical: boolean;
  statusLabel: string;
  statusTone: Tone;
}

/**
 * Calcula métricas de ciclo de vida para equipamiento crítico SGIA.
 * Maneja valores nulos o indefinidos con fallbacks seguros.
 */
export function calculateEquipmentLifeCycle(
  purchaseDate?: string | null,
  lifespanYearsParam?: number | null,
  now: Date = new Date(),
): EquipmentLifeCycleInfo {
  const lifespanYears = Math.max(1, lifespanYearsParam ?? 5);

  if (!purchaseDate) {
    return {
      purchaseDateFormatted: 'No registrada',
      lifespanYears,
      ageYears: 0,
      remainingYears: lifespanYears,
      percentUsed: 0,
      isExpired: false,
      isCritical: false,
      statusLabel: 'Sin fecha de compra',
      statusTone: 'neutral',
    };
  }

  const pDate = new Date(purchaseDate);
  const isValidDate = !isNaN(pDate.getTime());

  if (!isValidDate) {
    return {
      purchaseDateFormatted: 'Fecha inválida',
      lifespanYears,
      ageYears: 0,
      remainingYears: lifespanYears,
      percentUsed: 0,
      isExpired: false,
      isCritical: false,
      statusLabel: 'Fecha inválida',
      statusTone: 'neutral',
    };
  }

  const diffMs = now.getTime() - pDate.getTime();
  const elapsedYears = Math.max(0, diffMs / (1000 * 60 * 60 * 24 * 365.25));
  const ageYears = Number(elapsedYears.toFixed(1));
  const rawRemaining = lifespanYears - elapsedYears;
  const remainingYears = Number(rawRemaining.toFixed(1));
  const percentUsed = Math.min(100, Math.max(0, Math.round((elapsedYears / lifespanYears) * 100)));
  const isExpired = remainingYears <= 0;
  const isCritical = isExpired || remainingYears <= 1;

  let statusLabel = 'Operación Óptima';
  let statusTone: Tone = 'available';

  if (isExpired) {
    statusLabel = 'Vida Útil Expirada';
    statusTone = 'critical';
  } else if (remainingYears <= 1) {
    statusLabel = 'Próximo a Reemplazo (< 1 año)';
    statusTone = 'critical';
  } else if (percentUsed >= 70) {
    statusLabel = 'Atención Preventiva (>= 70%)';
    statusTone = 'warning';
  }

  const purchaseDateFormatted = pDate.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return {
    purchaseDateFormatted,
    lifespanYears,
    ageYears,
    remainingYears: Math.max(0, remainingYears),
    percentUsed,
    isExpired,
    isCritical,
    statusLabel,
    statusTone,
  };
}
