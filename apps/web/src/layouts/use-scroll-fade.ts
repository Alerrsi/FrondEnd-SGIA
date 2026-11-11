import { useEffect, type DependencyList, type RefObject } from 'react';

/** Margen (px) que se deja al traer el ítem activo a la vista. */
const ACTIVE_MARGIN = 8;

/**
 * Marca un contenedor con scroll vertical con `data-fade-top` / `data-fade-bottom`
 * cuando hay contenido oculto arriba o abajo (el CSS los usa para difuminar el borde)
 * y desplaza el ítem activo (`aria-current="page"`) hasta dejarlo visible.
 *
 * `selector` permite apuntar a un descendiente del ref (p. ej. la `.gnav` interna
 * de `GlassIconBar`, que no expone su propio ref).
 */
export function useScrollFade(
  ref: RefObject<HTMLElement | null>,
  selector: string | null,
  deps: DependencyList,
) {
  useEffect(() => {
    const root = ref.current;
    const el = root && selector ? root.querySelector<HTMLElement>(selector) : root;
    if (!el) return;

    const update = () => {
      const hidden = el.scrollHeight - el.clientHeight;
      el.toggleAttribute('data-fade-top', el.scrollTop > 1);
      el.toggleAttribute('data-fade-bottom', hidden > 1 && el.scrollTop < hidden - 1);
    };

    // Solo se mueve el propio contenedor (nunca el aside ni la página).
    const active = el.querySelector<HTMLElement>('[aria-current="page"]');
    if (active) {
      const box = el.getBoundingClientRect();
      const item = active.getBoundingClientRect();
      if (item.top < box.top) el.scrollTop -= box.top - item.top + ACTIVE_MARGIN;
      else if (item.bottom > box.bottom) el.scrollTop += item.bottom - box.bottom + ACTIVE_MARGIN;
    }

    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    ro?.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro?.disconnect();
    };
  }, deps);
}
