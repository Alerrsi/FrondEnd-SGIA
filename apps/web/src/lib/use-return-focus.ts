import { useCallback, useRef } from 'react';

/**
 * Devuelve el foco a quien abrió un modal o una hoja de Radix al cerrarlos. Radix solo lo devuelve a su
 * `Dialog.Trigger`; los que la app abre desde código (clic en una fila, en el plano…) dejaban el foco en `<body>`
 * y quien navega con teclado perdía su lugar. `onOpenAutoFocus` corre antes de mover el foco adentro, así que en
 * ese momento `document.activeElement` todavía es quien lo abrió.
 */
export function useReturnFocus() {
  const opener = useRef<HTMLElement | null>(null);

  const onOpenAutoFocus = useCallback(() => {
    const active = document.activeElement;
    opener.current = active instanceof HTMLElement && active !== document.body ? active : null;
  }, []);

  const onCloseAutoFocus = useCallback((event: Event) => {
    const target = opener.current;
    opener.current = null;
    if (target?.isConnected) {
      event.preventDefault();
      target.focus({ preventScroll: true });
    }
  }, []);

  return { onOpenAutoFocus, onCloseAutoFocus };
}
