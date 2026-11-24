import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, Trash2, XCircle } from 'lucide-react';

import { cn } from '@/lib/cn';
import type { ToastItem, ToastType } from '@/lib/toast';

const ICON: Record<ToastType, { Icon: typeof Info; className: string }> = {
  success: { Icon: CheckCircle2, className: 'text-ok' },
  error: { Icon: XCircle, className: 'text-danger' },
  warning: { Icon: AlertTriangle, className: 'text-warn' },
  info: { Icon: Info, className: 'text-info' },
};

interface ToastCardProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

/**
 * Un aviso (docs/avisos-emergentes.md). Todo el aviso es un botón: al pasar el mouse o con foco pasa a rojo en
 * 300 ms y aparece el basurero; clic, Enter o Espacio lo quitan. El tiempo se detiene mientras está encima.
 */
export function ToastCard({ toast, onDismiss }: ToastCardProps) {
  const [paused, setPaused] = useState(false);
  const remaining = useRef(toast.duration);
  const { Icon, className: iconClass } = ICON[toast.type];

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
      className={cn(
        'ui-toast group pointer-events-auto relative flex w-full items-start gap-3 rounded-lg border border-zinc-200 bg-white py-3 pl-3.5 pr-10 text-left shadow-[0_8px_24px_rgb(0_0_0/0.08)] dark:border-zinc-800 dark:bg-zinc-900',
        'cursor-pointer outline-none transition-colors duration-300 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none',
        'hover:border-danger/40 hover:bg-danger-bg focus-visible:border-danger/40 focus-visible:bg-danger-bg focus-visible:ring-2 focus-visible:ring-accent',
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn(
          'mt-0.5 h-4 w-4 shrink-0 transition-colors duration-300 motion-reduce:transition-none group-hover:text-danger group-focus-visible:text-danger',
          iconClass,
        )}
      />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-medium text-zinc-900 transition-colors duration-300 motion-reduce:transition-none group-hover:text-danger group-focus-visible:text-danger dark:text-zinc-100">
          {toast.title}
        </span>
        {toast.description && (
          <span className="text-[13px] text-zinc-500 transition-colors duration-300 motion-reduce:transition-none group-hover:text-danger group-focus-visible:text-danger dark:text-zinc-400">
            {toast.description}
          </span>
        )}
      </span>
      <Trash2
        aria-hidden="true"
        data-testid="toast-trash"
        className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-danger opacity-0 transition-opacity duration-300 motion-reduce:transition-none group-hover:opacity-100 group-focus-visible:opacity-100"
      />
    </button>
  );
}
