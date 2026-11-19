import { useState, type FormEvent } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { FORM_CONTROL_CLASS } from '@/components/ui/form-control';
import { cn } from '@/lib/cn';

/** Búsqueda del catálogo desde Inicio: lleva al catálogo con la búsqueda aplicada. */
export function CatalogSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/profesor/catalogo?q=${encodeURIComponent(q)}` : '/profesor/catalogo');
  };

  return (
    <form onSubmit={submit} role="search" className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
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
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Notebook, osciloscopio, cable HDMI…"
            className={cn(FORM_CONTROL_CLASS, 'pl-8')}
          />
        </div>
        <Button type="submit" variant="secondary">
          Buscar
        </Button>
      </div>
    </form>
  );
}
