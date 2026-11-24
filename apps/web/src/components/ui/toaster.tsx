import { useSyncExternalStore } from 'react';

import { getToasts, subscribeToasts, toast } from '@/lib/toast';
import { ToastCard } from './toast-card';

/**
 * Contenedor de avisos (docs/avisos-emergentes.md): arriba a la derecha como sileo (350 px, 12 px entre avisos) y por encima
 * de modales y hojas. `Dialog` y `Sheet` ignoran los clics que vienen de aquí (`[data-toaster]`), así quitar un
 * aviso no cierra el modal abierto.
 */
export function Toaster() {
  const toasts = useSyncExternalStore(subscribeToasts, getToasts, getToasts);
  const errors = toasts.filter((t) => t.type === 'error');
  const others = toasts.filter((t) => t.type !== 'error');

  return (
    <div
      data-toaster=""
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-end gap-3 p-3 sm:inset-x-auto sm:right-0 sm:w-[calc(350px+1.5rem)]"
    >
      {/* Dos regiones vivas: los errores se anuncian de inmediato, el resto sin interrumpir. */}
      <div role="status" aria-live="polite" aria-label="Avisos" className="flex w-full flex-col items-end gap-3">
        {others.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={toast.dismiss} />
        ))}
      </div>
      <div role="alert" aria-live="assertive" aria-label="Errores" className="flex w-full flex-col items-end gap-3">
        {errors.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={toast.dismiss} />
        ))}
      </div>
    </div>
  );
}
