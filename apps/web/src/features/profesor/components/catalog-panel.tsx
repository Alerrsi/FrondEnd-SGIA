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
      className="flex flex-col gap-3 rounded-md border border-border bg-surface p-3"
    >
      <h2 className="text-sm font-semibold text-text">Catálogo</h2>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar insumo o equipo…"
          aria-label="Buscar en el catálogo"
          className="h-8 w-full rounded-md border border-border bg-background pl-7 pr-2 font-mono text-xs text-text focus:outline-none focus:ring-1 focus:ring-info"
        />
      </div>

      {isLoading ? (
        <p className="py-6 text-center font-mono text-xs text-text-muted">Cargando catálogo…</p>
      ) : isError ? (
        <p role="alert" className="py-6 text-center text-xs text-danger">
          No se pudo cargar el catálogo.
        </p>
      ) : products.length === 0 ? (
        <p className="py-6 text-center text-xs text-text-muted">No hay productos disponibles.</p>
      ) : (
        <ul className="flex max-h-[28rem] flex-col divide-y divide-border/60 overflow-y-auto">
          {products.map((p) => {
            const name = p.nombre ?? p.name ?? 'Producto';
            const available = p.stock ?? p.quantity ?? 0;
            const added = addedIds.has(p.id);
            return (
              <li key={p.id} className="flex items-center justify-between gap-2 py-2">
                <div className="min-w-0">
                  <p className="truncate text-xs text-text">{name}</p>
                  <p className="font-mono text-xs text-text-muted">
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
