import { BudgetMovementType } from '@sgia/types';

import type { Tone } from '@/components/ui/badge';

interface MovementMeta {
  label: string;
  /**
   * Efecto sobre el disponible. `ajuste` no tiene signo: el backend guarda |nuevo − anterior|
   * y la dirección solo viene en `notes` (`Monto inicial: $X → $Y`).
   */
  sign: '+' | '−' | '±';
  tone: Tone;
}

export const MOVEMENT_META: Record<BudgetMovementType, MovementMeta> = {
  [BudgetMovementType.ASIGNACION_INICIAL]: {
    label: 'Asignación inicial',
    sign: '+',
    tone: 'success',
  },
  [BudgetMovementType.AJUSTE]: { label: 'Ajuste', sign: '±', tone: 'neutral' },
  [BudgetMovementType.RESERVA]: {
    label: 'Reserva',
    sign: '−',
    tone: 'warning',
  },
  [BudgetMovementType.LIBERACION_RESERVA]: {
    label: 'Liberación de reserva',
    sign: '+',
    tone: 'loaned',
  },
  [BudgetMovementType.CONSUMO]: { label: 'Consumo', sign: '−', tone: 'danger' },
  [BudgetMovementType.REPOSICION]: {
    label: 'Reposición',
    sign: '+',
    tone: 'success',
  },
};

export const MOVEMENT_TYPES = Object.values(BudgetMovementType);

export function movementMeta(type: string): MovementMeta {
  return (
    MOVEMENT_META[type as BudgetMovementType] ?? {
      label: type,
      sign: '±',
      tone: 'neutral',
    }
  );
}
