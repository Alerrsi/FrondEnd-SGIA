import { useEffect } from 'react';

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

/**
 * Atajos de toda la app: `Ctrl K` / `⌘ K` abre el buscador (también desde un campo) y `?` la lista de
 * atajos (fuera de campos). El lector Code128 del mostrador escribe dentro de su campo, así que no choca.
 */
export function useGlobalShortcuts({ onSearch, onHelp }: { onSearch: () => void; onHelp: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onSearch();
        return;
      }
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey && !isTyping(e.target)) {
        e.preventDefault();
        onHelp();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onSearch, onHelp]);
}
