import { useEffect, useRef } from 'react';

import { playNotificationSound } from '@/lib/notification-sound';

/**
 * Suena cuando llega una alerta que no estaba (docs/exportaciones-y-campana.md). Se compara por el mayor `id`
 * visto: los ids crecen al crear alertas, así que quitar una o ver otra más antigua no hace sonar. La primera
 * carga solo registra lo que hay.
 */
export function useNewAlertSound(alertIds: readonly number[] | undefined, play: () => void = playNotificationSound): void {
  const maxSeen = useRef<number | null>(null);

  useEffect(() => {
    if (!alertIds) return;
    const max = alertIds.length > 0 ? Math.max(...alertIds) : 0;
    if (maxSeen.current === null) {
      maxSeen.current = max;
      return;
    }
    if (max > maxSeen.current) {
      maxSeen.current = max;
      play();
    }
  }, [alertIds, play]);
}
