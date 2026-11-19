import { useState, type CSSProperties } from 'react';
import { Moon, Sun } from 'lucide-react';

import { cn } from '@/lib/cn';

/*
 * Interruptor de tema (sistema «Trazo»). Izquierda = luna (oscuro, `on=false`), derecha = sol (claro, `on=true`).
 * Solo CSS: la perilla se desliza con `transform` (200 ms).
 * `size="sm"` para el sidebar encogido y barras; `md` para ajustes.
 */

export interface ToggleProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  size?: 'sm' | 'md';
  className?: string;
  'aria-label'?: string;
  disabled?: boolean;
}

const SIZES = {
  sm: { track: 46, height: 24, thumb: 18, icon: 10 },
  md: { track: 68, height: 34, thumb: 26, icon: 13 },
} as const;

export function Toggle({
  checked,
  defaultChecked = false,
  onCheckedChange,
  size = 'md',
  className,
  'aria-label': ariaLabel = 'Alternar modo',
  disabled = false,
}: ToggleProps) {
  const isControlled = checked !== undefined;
  const [internalOn, setInternalOn] = useState(defaultChecked);
  const on = isControlled ? checked : internalOn;

  const { track, height, thumb, icon } = SIZES[size];
  const pad = (height - thumb) / 2;
  const travel = track - thumb - pad * 2;

  const flip = () => {
    if (disabled) return;
    const next = !on;
    if (!isControlled) setInternalOn(next);
    onCheckedChange?.(next);
  };

  return (
    <div
      className={cn('liq-well', className)}
      style={{ width: `${track}px`, height: `${height}px` } as CSSProperties}
    >
      <button
        type="button"
        className="liq-sw"
        data-on={on}
        data-size={size}
        role="switch"
        aria-checked={on}
        aria-label={ariaLabel}
        disabled={disabled}
        style={{ width: `${track}px`, height: `${height}px` }}
        onClick={flip}
      >
        <span className="liq-sw-blobs flex items-center justify-between px-1" aria-hidden="true">
          <Moon
            aria-hidden="true"
            size={icon}
            className={cn('ml-0.5 pointer-events-none', on ? 'text-zinc-400' : 'text-zinc-900 dark:text-zinc-100')}
          />
          <Sun
            aria-hidden="true"
            size={icon}
            className={cn('mr-0.5 pointer-events-none', on ? 'text-warn' : 'text-zinc-400')}
          />
          <span
            className="liq-thumb"
            style={
              {
                '--liq-thumb': `${thumb}px`,
                top: `${pad}px`,
                left: `${pad}px`,
                transform: `translateX(${on ? travel : 0}px)`,
              } as CSSProperties
            }
          />
        </span>
      </button>
    </div>
  );
}
