import { useEffect, useState } from "react";
import { useProducts } from "@sgia/api-client";
import type { Producto } from "@sgia/types";
import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { LoanRequestItem } from "@/features/profesor/lib/loan-request-schema";
import { SectionTitle } from '@/components/ui/section-title';
import { STATE_TEXT_CLASS } from "@/components/ui/typography";

interface CatalogPanelProps {
  /** Ids ya agregados a la solicitud. */
  addedIds: ReadonlySet<number>;
  onAdd: (item: Omit<LoanRequestItem, "quantity">) => void;
  /** Pañol elegido en el formulario; sin él no se ofrecen existencias. */
  storeroomId?: number;
  /** Existencias del pañol por producto, para revalidar lo ya agregado. */
  onAvailability?: (availability: ReadonlyMap<number, number>) => void;
}

/** Catálogo de productos activos con stock, para armar la lista de insumos. */
export function CatalogPanel({
  addedIds,
  onAdd,
  storeroomId,
  onAvailability,
}: CatalogPanelProps) {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const hasStoreroom =
    storeroomId !== undefined && Number.isFinite(storeroomId);
  const { data, isLoading, isError, isPlaceholderData } = useProducts({
    search: debounced || undefined,
    is_active: true,
    storeroom_id: hasStoreroom ? storeroomId : undefined,
    per_page: 30,
  });
  // Con pañol: `available_in_storeroom` (lo que valida la solicitud). Sin pañol: no hay cifra.
  const availableOf = (p: Producto) =>
    hasStoreroom ? (p.available_in_storeroom ?? p.stock ?? p.quantity ?? 0) : 0;
  const products = data?.data ?? [];

  useEffect(() => {
    // Durante la recarga por cambio de pañol `data` aún es el del pañol anterior.
    if (!hasStoreroom || isPlaceholderData || !data) return;
    onAvailability?.(new Map(data.data.map((p) => [p.id, availableOf(p)])));
  }, [data, isPlaceholderData, hasStoreroom, onAvailability]);

  return (
    <section
      aria-label="Catálogo"
      className="flex flex-col gap-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 shadow-xs"
    >
      <SectionTitle>Catálogo</SectionTitle>
      {!hasStoreroom && (
        <p className="text-[11px] text-zinc-500">
          Elige un pañol para ver sus existencias.
        </p>
      )}
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
        <p className={`py-6 ${STATE_TEXT_CLASS}`}>
          Cargando catálogo…
        </p>
      ) : isError ? (
        <p
          role="alert"
          className="py-6 text-center text-xs text-rose-600 dark:text-rose-400"
        >
          No se pudo cargar el catálogo.
        </p>
      ) : products.length === 0 ? (
        <p className={`py-6 ${STATE_TEXT_CLASS}`}>
          No hay productos disponibles.
        </p>
      ) : (
        <ul className="flex max-h-[28rem] flex-col divide-y divide-zinc-100 dark:divide-zinc-800/60 overflow-y-auto">
          {products.map((p) => {
            const name = p.nombre ?? p.name ?? "Producto";
            const available = availableOf(p);
            const added = addedIds.has(p.id);
            const noStock = hasStoreroom && available <= 0;
            return (
              <li
                key={p.id}
                className="flex items-center justify-between gap-2 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs text-zinc-800 dark:text-zinc-200">
                    {name}
                  </p>
                  <p className="font-mono text-[11px] text-zinc-400">
                    {p.barcode ?? "—"} ·{" "}
                    {!hasStoreroom
                      ? "Elige un pañol"
                      : noStock
                        ? "Sin existencias en este pañol"
                        : `${available} disp.`}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={added || !hasStoreroom || noStock}
                  aria-label={`Agregar ${name}`}
                  onClick={() => onAdd({ product_id: p.id, name, available })}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {added ? "Agregado" : "Agregar"}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
