import { playNotificationSound } from '@/lib/notification-sound';

/**
 * Avisos emergentes propios (docs/avisos-emergentes.md). Misma API que antes con sileo:
 * `toast.success('Texto')` o `toast.error({ title, description })`. Cada aviso suena al aparecer, se pinta en rojo
 * al pasar el mouse y se quita con un clic (`components/ui/toaster.tsx`).
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  title?: string;
  description?: string;
  /** Milisegundos visible; por defecto 4 s (errores 6 s). */
  duration?: number;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration: number;
}

/** Más de cuatro a la vez tapan la pantalla: el más antiguo sale. */
export const MAX_TOASTS = 4;
const DEFAULT_DURATION: Record<ToastType, number> = { success: 4000, info: 4000, warning: 5000, error: 6000 };
/** Varios avisos juntos (p. ej. al guardar en lote) suenan una sola vez. */
const SOUND_GAP_MS = 400;

let items: ToastItem[] = [];
let lastSound = 0;
let sequence = 0;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function push(type: ToastType, message: string | ToastOptions): string {
  const options = typeof message === 'string' ? { title: message } : message;
  const id = `t${Date.now().toString(36)}-${(sequence++).toString(36)}`;
  items = [
    ...items,
    {
      id,
      type,
      title: options.title ?? '',
      description: options.description,
      duration: options.duration ?? DEFAULT_DURATION[type],
    },
  ].slice(-MAX_TOASTS);
  emit();

  const now = Date.now();
  if (now - lastSound > SOUND_GAP_MS) {
    lastSound = now;
    playNotificationSound();
  }
  return id;
}

export const toast = {
  success: (message: string | ToastOptions) => push('success', message),
  error: (message: string | ToastOptions) => push('error', message),
  warning: (message: string | ToastOptions) => push('warning', message),
  info: (message: string | ToastOptions) => push('info', message),
  dismiss: (id: string) => {
    const next = items.filter((item) => item.id !== id);
    if (next.length === items.length) return;
    items = next;
    emit();
  },
  clear: () => {
    items = [];
    emit();
  },
};

/** Para `useSyncExternalStore` en el `Toaster`. */
export function subscribeToasts(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getToasts(): ToastItem[] {
  return items;
}
