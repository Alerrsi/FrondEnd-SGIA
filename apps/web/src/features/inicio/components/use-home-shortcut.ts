import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/** Tecla única de la página de inicio (p. ej. `M` abre el mostrador). Fuera de campos y sin modificadores. */
export function useHomeShortcut(key: string | undefined, to: string) {
  const navigate = useNavigate();
  useEffect(() => {
    if (!key) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
      if (typing || e.ctrlKey || e.metaKey || e.altKey || e.key.toLowerCase() !== key) return;
      // Sin abrir otra cosa si hay un modal encima.
      if (document.querySelector('[role="dialog"]')) return;
      e.preventDefault();
      navigate(to);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [key, to, navigate]);
}
