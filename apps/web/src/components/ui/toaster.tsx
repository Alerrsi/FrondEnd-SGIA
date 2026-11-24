import { useSyncExternalStore } from 'react';

import { getToasts, subscribeToasts, toast } from '@/lib/toast';
import { ToastCard } from './toast-card';

/**
 * Contenedor de avisos (docs/avisos-emergentes.md): arriba a la derecha, a ancho completo bajo 640 px y por encima
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
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-stretch gap-2 p-3 sm:inset-x-auto sm:right-0 sm:w-[24rem] sm:p-4"
    >
      {/* Dos regiones vivas: los errores se anuncian de inmediato, el resto sin interrumpir. */}
      <div role="status" aria-live="polite" aria-label="Avisos" className="flex flex-col gap-2">
        {others.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={toast.dismiss} />
        ))}
      </div>
      <div role="alert" aria-live="assertive" aria-label="Errores" className="flex flex-col gap-2">
        {errors.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={toast.dismiss} />
        ))}
      </div>
    </div>
  );
}
