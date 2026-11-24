import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useEstanteContenido, useProducts } from '@sgia/api-client';
import type { EstanteContenidoProducto, EstanteContenidoUnidades, Producto } from '@sgia/types';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogCloseButton, DialogFooter } from '@/components/ui/dialog';
import { ErrorState } from '@/components/ui/error-state';
import { SECTION_LABEL_CLASS } from '@/components/ui/typography';
import { apiErrorToMessage } from '@/lib/api-error';
import { plural } from '../lib/map-labels';
import { CajonElementos } from './cajon-elementos';
import { CajonLlenoButton } from './cajon-lleno-button';

/** Cajón cuyo contenido se muestra. */
export interface CajonContenidoTarget {
  id: number;
  /** Código corto (`A1-1`). */
  codigo: string;
  /** Código completo de la etiqueta (`BODEGAE-A1-1`). */
  code: string;
  estanteId: number | null;
  estanteCodigo?: string | null;
  descripcion?: string | null;
  lleno?: boolean;
}

export interface CajonContenidoDialogProps {
  cajon: CajonContenidoTarget | null;
  onClose: () => void;
  /** `PAN-01` y `DIR-01`: enlace a inventario filtrado por el cajón. */
  canSeeInventory: boolean;
  /** Botón para marcar o quitar «lleno». */
  canMarkFull?: boolean;
}

/** Producto del inventario como fila de contenido (cajón sin estante: no hay endpoint de contenido por cajón). */
function toContenido(producto: Producto): EstanteContenidoProducto {
  const quantity = producto.quantity ?? producto.stock ?? 0;
  const minimo = producto.stock_minimo ?? producto.stockCritico ?? 0;
  return {
    id: producto.id,
    name: producto.name ?? producto.nombre,
    type: producto.type ?? 'insumo',
    barcode: null,
    quantity,
    stock_minimo: minimo,
    is_critical: minimo > 0 && quantity <= minimo,
  };
}

const NO_UNITS: EstanteContenidoUnidades[] = [];

/**
 * Pop-up de un cajón (docs/ubicaciones-distribucion.md, decisión 13): la lista de lo que guarda. Con estante sale de
 * `GET /api/estantes/{id}/contents` (productos con cantidad y unidades por estado); sin estante, de los productos
 * con `cajon_id`.
 */
export function CajonContenidoDialog({ cajon, onClose, canSeeInventory, canMarkFull = false }: CajonContenidoDialogProps) {
  const open = cajon !== null;
  const conEstante = open && cajon.estanteId !== null;
  const contenido = useEstanteContenido(conEstante ? (cajon.estanteId ?? undefined) : undefined);
  const productos = useProducts(
    { cajon_id: cajon?.id, per_page: 100 },
    { enabled: open && cajon.estanteId === null },
  );

  const elementos = useMemo(() => {
    if (!cajon) return null;
    if (cajon.estanteId !== null) {
      const encontrado = contenido.data?.cajones.find((c) => c.id === cajon.id);
      return encontrado ? { productos: encontrado.productos, unidades: encontrado.unidades } : null;
    }
    return productos.data ? { productos: productos.data.data.map(toContenido), unidades: NO_UNITS } : null;
  }, [cajon, contenido.data, productos.data]);

  const query = conEstante ? contenido : productos;
  const total = elementos ? elementos.productos.length + elementos.unidades.reduce((sum, grupo) => sum + grupo.total, 0) : 0;
  const description = cajon
    ? [cajon.descripcion, cajon.estanteCodigo ? `Estante ${cajon.estanteCodigo}` : 'Sin estante'].filter(Boolean).join(' · ')
    : undefined;

  return (
    <Dialog open={open} onClose={onClose} title={cajon ? `Cajón ${cajon.code}` : 'Cajón'} description={description} size="md">
      <div className="flex flex-col gap-4">
        {query.isLoading && (
          <p className="flex items-center gap-2 text-[13px] text-zinc-500 dark:text-zinc-400">
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            Cargando elementos…
          </p>
        )}
        {query.isError && (
          <ErrorState action={<Button size="sm" variant="secondary" onClick={() => void query.refetch()}>Reintentar</Button>}>
            {apiErrorToMessage(query.error)}
          </ErrorState>
        )}
        {cajon && elementos && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <p className={SECTION_LABEL_CLASS}>{plural(total, 'elemento', 'elementos')}</p>
              {cajon.lleno && <Badge tone="loaned">Lleno</Badge>}
              <span className="ml-auto flex items-center gap-3">
                {canSeeInventory && total > 0 && (
                  <Link to={`/inventario?cajon_id=${cajon.id}`} className="text-[13px] font-medium text-accent hover:underline">
                    Ver en inventario
                  </Link>
                )}
                {canMarkFull && <CajonLlenoButton cajonId={cajon.id} codigo={cajon.code} lleno={Boolean(cajon.lleno)} />}
              </span>
            </div>
            <div className="rounded-md border border-zinc-200 dark:border-zinc-800">
              <CajonElementos productos={elementos.productos} unidades={elementos.unidades} />
            </div>
          </>
        )}
        <DialogFooter>
          <DialogCloseButton>Cerrar</DialogCloseButton>
        </DialogFooter>
      </div>
    </Dialog>
  );
}
