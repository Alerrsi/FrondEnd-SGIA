import { Link } from 'react-router-dom';
import { Archive, Loader2 } from 'lucide-react';
import { useEstanteContenido } from '@sgia/api-client';
import type { EstanteContenidoCajon, EstanteContenidoUnidades } from '@sgia/types';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogCloseButton, DialogFooter } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { CODE_CHIP_CLASS, SECTION_LABEL_CLASS } from '@/components/ui/typography';
import { apiErrorToMessage } from '@/lib/api-error';
import { plural } from '../lib/map-labels';
import { CajonLlenoButton } from './cajon-lleno-button';

export interface EstanteContenidoDialogProps {
  estanteId: number | null;
  /** Código ya conocido del mapa, para el título mientras carga. */
  codigo?: string;
  onClose: () => void;
  /** `PAN-01` y `DIR-01`: enlace a inventario por cajón. */
  canSeeInventory: boolean;
  /** `DIR-01` y `PAN-01`: botón para marcar o quitar «lleno» en cada cajón. */
  canMarkFull?: boolean;
  /** Acciones de edición (solo editores). */
  onEdit?: () => void;
  onAssign?: () => void;
}

function UnidadesBadges({ unidades }: { unidades: EstanteContenidoUnidades }) {
  const { disponible, prestado, en_reparacion } = unidades.by_status;
  return (
    <span className="flex flex-wrap justify-end gap-1">
      {disponible > 0 && <Badge tone="available">{plural(disponible, 'disponible', 'disponibles')}</Badge>}
      {prestado > 0 && <Badge tone="loaned">{plural(prestado, 'prestado', 'prestados')}</Badge>}
      {en_reparacion > 0 && <Badge tone="maintenance">{`${en_reparacion} en reparación`}</Badge>}
    </span>
  );
}

function CajonSection({
  cajon,
  canSeeInventory,
  canMarkFull,
}: {
  cajon: EstanteContenidoCajon;
  canSeeInventory: boolean;
  canMarkFull: boolean;
}) {
  const empty = cajon.productos.length === 0 && cajon.unidades.length === 0;
  return (
    <section aria-label={`Cajón ${cajon.barcode ?? cajon.codigo}`} className="rounded-md border border-zinc-200 dark:border-zinc-800">
      <header className="flex flex-wrap items-center gap-2 border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
        <span className={CODE_CHIP_CLASS}>{cajon.barcode ?? cajon.codigo}</span>
        {cajon.lleno && <Badge tone="loaned">Lleno</Badge>}
        {cajon.descripcion && <span className="min-w-0 flex-1 truncate text-[13px] text-zinc-500 dark:text-zinc-400">{cajon.descripcion}</span>}
        <span className="ml-auto flex items-center gap-3">
          {canSeeInventory && !empty && (
            <Link to={`/inventario?cajon_id=${cajon.id}`} className="text-[13px] font-medium text-accent hover:underline">
              Ver en inventario
            </Link>
          )}
          {canMarkFull && <CajonLlenoButton cajonId={cajon.id} codigo={cajon.barcode ?? cajon.codigo} lleno={cajon.lleno} />}
        </span>
      </header>
      {empty ? (
        <p className="px-3 py-2 text-[13px] text-zinc-500 dark:text-zinc-400">Cajón vacío.</p>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {cajon.productos.map((producto) => (
            <li key={`p-${producto.id}`} className="flex items-center gap-3 px-3 py-2 text-sm">
              <span className="min-w-0 flex-1 text-zinc-900 dark:text-zinc-100">{producto.name}</span>
              {producto.is_critical && <Badge tone="danger">Bajo el mínimo</Badge>}
              <span className="font-mono text-[13px] text-zinc-600 dark:text-zinc-300">{producto.quantity} u.</span>
            </li>
          ))}
          {cajon.unidades.map((unidades) => (
            <li key={`u-${unidades.product_id}`} className="flex flex-wrap items-center gap-3 px-3 py-2 text-sm">
              <span className="min-w-0 flex-1 text-zinc-900 dark:text-zinc-100">
                {unidades.product_name}
                <span className="ml-1.5 text-[13px] text-zinc-500 dark:text-zinc-400">
                  {unidades.type === 'maqueta' ? 'Maqueta' : 'Equipo'}
                </span>
              </span>
              <UnidadesBadges unidades={unidades} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Pop-up del estante: sus cajones con los productos y unidades que guardan, por nombre. */
export function EstanteContenidoDialog({
  estanteId,
  codigo,
  onClose,
  canSeeInventory,
  canMarkFull = false,
  onEdit,
  onAssign,
}: EstanteContenidoDialogProps) {
  const { data, isLoading, isError, error, refetch } = useEstanteContenido(estanteId ?? undefined);
  const estante = data?.estante;
  const title = `Estante ${estante?.codigo ?? codigo ?? ''}`.trim();
  const llenos = data?.cajones.filter((cajon) => cajon.lleno).length ?? 0;
  const description = data
    ? [estante?.nombre, data.zona?.nombre, data.location.nombre].filter(Boolean).join(' · ')
    : undefined;

  return (
    <Dialog open={estanteId !== null} onClose={onClose} title={title} description={description} size="md">
      <div className="flex flex-col gap-4">
        {isLoading && (
          <p className="flex items-center gap-2 text-[13px] text-zinc-500 dark:text-zinc-400">
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            Cargando contenido…
          </p>
        )}
        {isError && (
          <ErrorState action={<Button size="sm" variant="secondary" onClick={() => void refetch()}>Reintentar</Button>}>
            {apiErrorToMessage(error)}
          </ErrorState>
        )}
        {data && data.cajones.length === 0 && (
          <EmptyState
            icon={Archive}
            title="Este estante no tiene cajones"
            description="Asígnale cajones de la sala para ver aquí lo que guarda."
            action={onAssign ? <Button size="sm" variant="secondary" onClick={onAssign}>Asignar cajones</Button> : undefined}
          />
        )}
        {data && data.cajones.length > 0 && (
          <>
            <p className={SECTION_LABEL_CLASS}>
              {plural(data.cajones.length, 'cajón', 'cajones')} · {plural(data.estante.items_count, 'elemento', 'elementos')}
              {llenos > 0 && ` · ${plural(llenos, 'lleno', 'llenos')}`}
            </p>
            {data.cajones.map((cajon) => (
              <CajonSection key={cajon.id} cajon={cajon} canSeeInventory={canSeeInventory} canMarkFull={canMarkFull} />
            ))}
          </>
        )}
        <DialogFooter>
          <DialogCloseButton>Cerrar</DialogCloseButton>
          {onAssign && data && data.cajones.length > 0 && (
            <Button size="sm" variant="secondary" onClick={onAssign}>Asignar cajones</Button>
          )}
          {onEdit && (
            <Button size="sm" variant="secondary" onClick={onEdit}>Editar estante</Button>
          )}
        </DialogFooter>
      </div>
    </Dialog>
  );
}
