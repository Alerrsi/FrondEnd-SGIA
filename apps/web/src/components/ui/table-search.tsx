import { useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

import { cn } from '@/lib/cn';
import { FILTER_CONTROL_CLASS } from './form-control';
import { Kbd } from './kbd';

export interface TableSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Nombre accesible; por defecto el `placeholder`. */
  label?: string;
  /** Atajo `/` para enfocar la búsqueda (uno por pantalla). */
  shortcut?: boolean;
  className?: string;
}

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

/** Búsqueda de una tabla: icono, campo que crece y atajo `/` visible con puntero fino. */
export function TableSearch({
  value,
  onChange,
  placeholder = 'Buscar…',
  label,
  shortcut = true,
  className,
}: TableSearchProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!shortcut) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      e.preventDefault();
      ref.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [shortcut]);

  return (
    <div className={cn('relative min-w-0 sm:min-w-56 sm:flex-1', className)}>
      <Search aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label ?? placeholder}
        className={cn(FILTER_CONTROL_CLASS, 'w-full pl-8 pr-9')}
      />
      {shortcut && !value && (
        <Kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">/</Kbd>
      )}
    </div>
  );
}
