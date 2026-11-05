import { useEffect, useState } from 'react';
import { useProducts } from '@sgia/api-client';
import { Plus, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { LoanRequestItem } from '@/features/profesor/lib/loan-request-schema';

interface CatalogPanelProps {
  /** Ids ya agregados a la solicitud. */
  addedIds: ReadonlySet<number>;
  onAdd: (item: Omit<LoanRequestItem, 'quantity'>) => void;
}

/** Catálogo de productos activos con stock, para armar la lista de insumos. */
export function CatalogPanel({ addedIds, onAdd }: CatalogPanelProps) {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isError } = useProducts({
    search: debounced || undefined,
    is_active: true,
    per_page: 30,
  });
  const products = (data?.data ?? []).filter((p) => (p.stock ?? p.quantity ?? 0) > 0);

  return (
    <section
      aria-label="Catálogo"
      className="flex flex-col gap-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3"
    >
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Catálogo</h2>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar insumo o equipo…"
          aria-label="Buscar en el catálogo"
          className="h-8 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 pl-7 pr-2 font-mono text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-400"
        />
      </div>

      {isLoading ? (
        <p className="py-6 text-center font-mono text-xs text-zinc-500">Cargando catálogo…</p>
      ) : isError ? (
        <p role="alert" className="py-6 text-center text-xs text-rose-600 dark:text-rose-400">
          No se pudo cargar el catálogo.
        </p>
      ) : products.length === 0 ? (
        <p className="py-6 text-center text-xs text-zinc-400">No hay productos disponibles.</p>
      ) : (
        <ul className="flex max-h-[28rem] flex-col divide-y divide-zinc-100 dark:divide-zinc-800/60 overflow-y-auto">
          {products.map((p) => {
            const name = p.nombre ?? p.name ?? 'Producto';
            const available = p.stock ?? p.quantity ?? 0;
            const added = addedIds.has(p.id);
            return (
              <li key={p.id} className="flex items-center justify-between gap-2 py-2">
                <div className="min-w-0">
                  <p className="truncate text-xs text-zinc-800 dark:text-zinc-200">{name}</p>
                  <p className="font-mono text-[11px] text-zinc-400">
                    {p.barcode ?? '—'} · {available} disp.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={added}
                  aria-label={`Agregar ${name}`}
                  onClick={() => onAdd({ product_id: p.id, name, available })}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {added ? 'Agregado' : 'Agregar'}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
