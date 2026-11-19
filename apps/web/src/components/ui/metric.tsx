import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

const TONES = {
  neutral: 'text-zinc-900 dark:text-zinc-100',
  danger: 'text-danger',
  warning: 'text-warn',
  success: 'text-ok',
} as const;

export interface MetricProps {
  label: ReactNode;
  value: ReactNode;
  /** Línea corta bajo la cifra: contexto o variación («6 bajo el mínimo», «+3 esta semana»). */
  hint?: ReactNode;
  /** Color de la cifra cuando el número es un estado (crítico, al día). */
  tone?: keyof typeof TONES;
  className?: string;
}

/** Cifra con rótulo: reemplaza las cintas métricas hechas a mano. Cifras tabulares en Geist. */
export function Metric({ label, value, hint, tone = 'neutral', className }: MetricProps) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)}>
      <span className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className={cn('text-2xl sm:text-[28px] leading-8 font-medium tracking-[-0.02em] tabular-nums', TONES[tone])}>
        {value}
      </span>
      {hint && <span className="text-[13px] text-zinc-500 dark:text-zinc-400">{hint}</span>}
    </div>
  );
}
