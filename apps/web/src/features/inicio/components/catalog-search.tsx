import { useEffect, useId, useState, type FormEvent } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '@sgia/api-client';

import { Button } from '@/components/ui/button';
import { FORM_CONTROL_CLASS } from '@/components/ui/form-control';
import { cn } from '@/lib/cn';

const MAX_SUGGESTIONS = 5;

const catalogUrl = (q: string) => `/profesor/catalogo?q=${encodeURIComponent(q)}`;

/** Búsqueda del catálogo desde Inicio: valida que no esté vacía, sugiere productos y lleva al catálogo. */
export function CatalogSearch() {
  const navigate = useNavigate();
  const listId = useId();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  const { data } = useProducts({
    search: debounced || undefined,
    is_active: true,
    per_page: MAX_SUGGESTIONS,
  });
  const names = debounced
    ? Array.from(
        new Set(
          (data?.data ?? []).map((p) => p.nombre ?? p.name ?? '').filter((n) => n !== ''),
        ),
      ).slice(0, MAX_SUGGESTIONS)
    : [];
  const showSuggestions = open && query.trim() !== '' && names.length > 0;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) {
      setError('Escribe qué necesitas antes de buscar.');
      return;
    }
    navigate(catalogUrl(q));
  };

  return (
    <form onSubmit={submit} role="search" noValidate className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <label htmlFor="inicio-catalogo" className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
        ¿Qué necesitas para tu clase?
      </label>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <input
            id="inicio-catalogo"
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setError('');
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setOpen(false);
            }}
            placeholder="Notebook, osciloscopio, cable HDMI…"
            autoComplete="off"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${listId}-error` : undefined}
            aria-controls={showSuggestions ? listId : undefined}
            aria-expanded={showSuggestions}
            className={cn(FORM_CONTROL_CLASS, 'pl-8')}
          />
          {showSuggestions && (
            <ul
              id={listId}
              aria-label="Sugerencias"
              className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-md border border-zinc-200 bg-white py-1 shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              {names.map((name) => (
                <li key={name}>
                  <button
                    type="button"
                    // `mousedown` evita que el blur cierre la lista antes del clic.
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => navigate(catalogUrl(name))}
                    className="block w-full cursor-pointer truncate px-3 py-1.5 text-left text-[13px] text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 pointer-coarse:py-3"
                  >
                    {name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Button type="submit" variant="secondary">
          Buscar
        </Button>
      </div>
      {error && (
        <p id={`${listId}-error`} role="alert" className="text-[13px] text-rose-700 dark:text-rose-400">
          {error}
        </p>
      )}
    </form>
  );
}
