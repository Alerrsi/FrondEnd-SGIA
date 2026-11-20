import { useSearchParams } from 'react-router-dom';
import { useEffect, useState } from "react";
import { useProducts } from "@sgia/api-client";
import type { Producto } from "@sgia/types";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { LoanRequestItem } from "@/features/profesor/lib/loan-request-schema";
import { ErrorState } from '@/components/ui/error-state';
import { SectionTitle } from '@/components/ui/section-title';
import { TableSearch } from '@/components/ui/table-search';
import { STATE_TEXT_CLASS } from "@/components/ui/typography";
import { SkeletonList } from '@/components/ui/skeleton-list';

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
  // `?q=` llega desde la búsqueda del catálogo en Inicio (rediseño «Trazo», fase 4).
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
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
      className="flex min-w-0 flex-col gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4"
    >
      <SectionTitle>Catálogo</SectionTitle>
      {!hasStoreroom && (
        <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
          Elige un pañol para ver sus existencias.
        </p>
      )}
      <TableSearch
        value={search}
        onChange={setSearch}
        placeholder="Buscar insumo o equipo…"
        label="Buscar en el catálogo"
        className="sm:min-w-0"
      />

      {isLoading ? (
        <SkeletonList label="Cargando catálogo…" rows={5} columns={3} />
      ) : isError ? (
        <ErrorState>No se pudo cargar el catálogo.</ErrorState>
      ) : products.length === 0 ? (
        <p className={`py-6 ${STATE_TEXT_CLASS}`}>
          No hay productos disponibles.
        </p>
      ) : (
        <ul className="flex max-h-[28rem] flex-col divide-y divide-zinc-200 dark:divide-zinc-800 overflow-y-auto">
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
                  <p className="truncate text-sm text-zinc-900 dark:text-zinc-100">
                    {name}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="font-code">{p.barcode ?? "—"}</span> ·{" "}
                    {!hasStoreroom
                      ? "Elige un pañol"
                      : noStock
                        ? "Sin existencias en este pañol"
                        : `${available} disp.`}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={added || !hasStoreroom || noStock}
                  aria-label={`Agregar ${name}`}
                  onClick={() => onAdd({ product_id: p.id, name, available })}
                >
                  <Plus aria-hidden="true" className="h-3.5 w-3.5" />
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
