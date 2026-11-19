import { useId, useMemo, useState, type KeyboardEvent } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { CornerDownLeft, House, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Kbd } from '@/components/ui/kbd';
import { cn } from '@/lib/cn';
import { quickActionsForRole, screensForRole, type NavLinkEntry } from './nav-config';

interface PaletteItem {
  id: string;
  label: string;
  hint: string;
  to: string;
  icon: NavLinkEntry['icon'];
  group: 'Acciones' | 'Pantallas';
}

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: string | undefined;
}

/**
 * Buscador de pantallas y acciones (`Ctrl K`): lista lo que el rol puede abrir, filtra sin tildes ni
 * mayúsculas y abre con Enter. Flechas para moverse, Esc para cerrar.
 */
export function CommandPalette({ open, onOpenChange, role }: CommandPaletteProps) {
  const navigate = useNavigate();
  const listId = useId();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const items = useMemo<PaletteItem[]>(() => {
    const actions = quickActionsForRole(role).map((a) => ({
      id: `accion-${a.id}`,
      label: a.label,
      hint: 'Acción',
      to: a.to,
      icon: a.icon,
      group: 'Acciones' as const,
    }));
    const screens = [
      { to: '/', label: 'Inicio', description: 'Lo que te toca hoy', icon: House },
      ...screensForRole(role),
    ].map((s) => ({ id: `pantalla-${s.to}`, label: s.label, hint: s.description, to: s.to, icon: s.icon, group: 'Pantallas' as const }));
    return [...actions, ...screens];
  }, [role]);

  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return items;
    return items.filter((i) => normalize(`${i.label} ${i.hint}`).includes(q));
  }, [items, query]);

  const current = Math.min(active, Math.max(results.length - 1, 0));

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setQuery('');
      setActive(0);
    }
  };

  const go = (item: PaletteItem | undefined) => {
    if (!item) return;
    close(false);
    navigate(item.to);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((current + 1) % Math.max(results.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((current - 1 + results.length) % Math.max(results.length, 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(results[current]);
    }
  };

  let lastGroup = '';

  return (
    <DialogPrimitive.Root open={open} onOpenChange={close}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="ui-overlay fixed inset-0 z-50 bg-zinc-950/40" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="ui-menu fixed inset-x-0 top-0 z-50 flex max-h-dvh flex-col overflow-hidden border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-[0_8px_24px_rgb(0_0_0/0.08)] focus:outline-none sm:inset-x-4 sm:top-[12vh] sm:mx-auto sm:max-h-[70vh] sm:max-w-xl sm:rounded-lg sm:border"
        >
          <DialogPrimitive.Title className="sr-only">Buscar pantallas y acciones</DialogPrimitive.Title>
          <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 px-4">
            <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-zinc-400" />
            <input
              autoFocus
              role="combobox"
              aria-expanded="true"
              aria-controls={listId}
              aria-activedescendant={results[current] ? `${listId}-${results[current].id}` : undefined}
              aria-label="Buscar pantallas y acciones"
              placeholder="Buscar pantallas y acciones…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              className="h-12 min-w-0 flex-1 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
            />
            <Kbd>Esc</Kbd>
          </div>
          <ul id={listId} role="listbox" aria-label="Resultados" className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
            {results.length === 0 && (
              <li className="px-3 py-8 text-center text-[13px] text-zinc-500 dark:text-zinc-400">
                Nada coincide con «{query}».
              </li>
            )}
            {results.map((item, index) => {
              const heading = item.group !== lastGroup ? item.group : null;
              lastGroup = item.group;
              const Icon = item.icon;
              const selected = index === current;
              return (
                <li key={item.id} role="presentation">
                  {heading && (
                    <p role="presentation" className="px-2 pb-1 pt-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      {heading}
                    </p>
                  )}
                  <div
                    id={`${listId}-${item.id}`}
                    role="option"
                    aria-selected={selected}
                    onMouseMove={() => setActive(index)}
                    onClick={() => go(item)}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm pointer-coarse:py-3',
                      selected ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' : 'text-zinc-700 dark:text-zinc-300',
                    )}
                  >
                    <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-zinc-500" />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    <span className="hidden truncate text-[13px] text-zinc-500 dark:text-zinc-400 sm:block">{item.hint}</span>
                    {selected && <CornerDownLeft aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-zinc-400" />}
                  </div>
                </li>
              );
            })}
          </ul>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
