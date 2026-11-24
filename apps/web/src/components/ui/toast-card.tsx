import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { AlertTriangle, CheckCircle2, Info, Trash2, XCircle } from 'lucide-react';

import { cn } from '@/lib/cn';
import type { ToastItem, ToastType } from '@/lib/toast';

/** Colores de estado de sileo (sus `oklch`), para que los avisos se vean como antes (docs/avisos-emergentes.md §9). */
const TONE: Record<ToastType, { Icon: typeof Info; color: string }> = {
  success: { Icon: CheckCircle2, color: 'oklch(0.723 0.219 142.136)' },
  error: { Icon: XCircle, color: 'oklch(0.637 0.237 25.331)' },
  warning: { Icon: AlertTriangle, color: 'oklch(0.795 0.184 86.047)' },
  info: { Icon: Info, color: 'oklch(0.685 0.169 237.323)' },
};

/** Fondo de sileo: píldora oscura en claro y clara en oscuro; rojo al pasar el mouse para quitarla. */
const SURFACE =
  'bg-[#1a1a1a] dark:bg-[#f2f2f2] transition-colors duration-300 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none hover:bg-[oklch(0.577_0.245_27.325)] focus-visible:bg-[oklch(0.577_0.245_27.325)] dark:hover:bg-[oklch(0.577_0.245_27.325)] dark:focus-visible:bg-[oklch(0.577_0.245_27.325)]';

interface ToastCardProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

/**
 * Un aviso con el aspecto de sileo (docs/avisos-emergentes.md): píldora con el ícono del estado en un círculo y el
 * título en su color; con descripción se abre en tarjeta. Al pasar el mouse o con foco se pone roja en 300 ms y el
 * ícono pasa a basurero; clic, Enter o Espacio la quitan. El tiempo se detiene mientras está encima.
 */
export function ToastCard({ toast, onDismiss }: ToastCardProps) {
  const [paused, setPaused] = useState(false);
  const remaining = useRef(toast.duration);
  const { Icon, color } = TONE[toast.type];
  const expanded = Boolean(toast.description);

  useEffect(() => {
    if (paused) return;
    const startedAt = Date.now();
    const timer = window.setTimeout(() => onDismiss(toast.id), remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current = Math.max(0, remaining.current - (Date.now() - startedAt));
    };
  }, [paused, onDismiss, toast.id]);

  return (
    <button
      type="button"
      data-toast=""
      data-toast-type={toast.type}
      aria-label={`Quitar aviso: ${[toast.title, toast.description].filter(Boolean).join('. ')}`}
      title="Quitar aviso"
      onClick={() => onDismiss(toast.id)}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      style={{ '--toast-tone': color } as CSSProperties}
      className={cn(
        'ui-toast group pointer-events-auto flex max-w-[350px] cursor-pointer flex-col text-left outline-none',
        'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
        expanded ? 'w-[350px] max-w-full rounded-[20px]' : 'self-end rounded-full',
        SURFACE,
      )}
    >
      <span className="ui-toast-head flex h-10 min-w-0 items-center gap-2 py-2 pl-2 pr-4">
        <span
          className="relative grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklch,var(--toast-tone)_20%,transparent)] text-[var(--toast-tone)] transition-colors duration-300 motion-reduce:transition-none group-hover:bg-white/20 group-hover:text-white group-focus-visible:bg-white/20 group-focus-visible:text-white"
        >
          <Icon
            aria-hidden="true"
            className="col-start-1 row-start-1 h-3.5 w-3.5 transition-opacity duration-300 motion-reduce:transition-none group-hover:opacity-0 group-focus-visible:opacity-0"
          />
          <Trash2
            aria-hidden="true"
            data-testid="toast-trash"
            className="col-start-1 row-start-1 h-3.5 w-3.5 opacity-0 transition-opacity duration-300 motion-reduce:transition-none group-hover:opacity-100 group-focus-visible:opacity-100"
          />
        </span>
        <span className="min-w-0 truncate text-[0.825rem] font-medium leading-4 text-[var(--toast-tone)] transition-colors duration-300 motion-reduce:transition-none group-hover:text-white group-focus-visible:text-white">
          {toast.title}
        </span>
      </span>
      {expanded && (
        <span className="px-4 pb-3.5 pt-0.5 text-sm leading-5 text-white/70 transition-colors duration-300 motion-reduce:transition-none group-hover:text-white/90 group-focus-visible:text-white/90 dark:text-black/60 dark:group-hover:text-white/90 dark:group-focus-visible:text-white/90">
          {toast.description}
        </span>
      )}
    </button>
  );
}
