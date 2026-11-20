import { useEffect, useMemo, useState } from 'react';
import { useProducts } from '@sgia/api-client';
import type { Estante } from '@sgia/types';

const DEBOUNCE_MS = 300;
const MIN_CHARS = 2;

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/**
 * «Buscar en la sala»: marca los estantes cuyo código, nombre o cajón coincide, y los que guardan un producto
 * con ese nombre o código (por el cajón registrado del producto, `GET /api/products?search=&location_id=`).
 */
export function useSalaSearch(locationId: number, estantes: Estante[], term: string) {
  const [debounced, setDebounced] = useState(term);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(term), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [term]);

  const query = debounced.trim();
  const active = query.length >= MIN_CHARS;
  const products = useProducts({ search: query, location_id: locationId, per_page: 100 }, { enabled: active });

  const marked = useMemo(() => {
    const ids = new Set<number>();
    if (!active) return ids;
    const needle = normalize(query);
    const productCajones = new Set(
      (products.data?.data ?? []).map((product) => product.cajon_id).filter((id): id is number => typeof id === 'number'),
    );
    for (const estante of estantes) {
      const own = [estante.codigo, estante.nombre ?? ''].some((text) => normalize(text).includes(needle));
      const byCajon = estante.cajones.some(
        (cajon) =>
          productCajones.has(cajon.id) ||
          normalize(cajon.codigo).includes(needle) ||
          normalize(cajon.barcode ?? '').includes(needle),
      );
      if (own || byCajon) ids.add(estante.id);
    }
    return ids;
  }, [active, query, estantes, products.data]);

  return { marked, active, isSearching: active && products.isFetching };
}
