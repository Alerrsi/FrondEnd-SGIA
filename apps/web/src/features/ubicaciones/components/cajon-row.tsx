import { Loader2, Printer, Trash2 } from 'lucide-react';
import type { CajonEntity } from '@sgia/types';

import { Badge } from '@/components/ui/badge';
import { ICON_BUTTON_CLASS } from '@/components/ui/table-styles';
import { CODE_CHIP_CLASS } from '@/components/ui/typography';
import { cn } from '@/lib/cn';
import { CajonLlenoButton } from '@/features/mapa-salas/components/cajon-lleno-button';

export interface CajonRowProps {
  cajon: CajonEntity;
  /** Código completo (`BODEGAE-A1-1`): el de la etiqueta y el escáner. */
  code: string;
  canMarkFull: boolean;
  printing: boolean;
  onPrint: (cajon: CajonEntity) => void;
  onDelete: (cajon: CajonEntity) => void;
  /** Estante a resaltar en el plano mientras el puntero o el foco están en la fila (`null` al salir). */
  onHighlight: (estanteId: number | null) => void;
}

/** Fila compacta de un cajón en el panel lateral de Ubicaciones (docs/ubicaciones-distribucion.md). */
export function CajonRow({ cajon, code, canMarkFull, printing, onPrint, onDelete, onHighlight }: CajonRowProps) {
  const estanteId = cajon.estante_id ?? cajon.estante?.id ?? null;
  const highlight = () => onHighlight(estanteId);
  const clear = () => onHighlight(null);

  return (
    <li
      onPointerEnter={highlight}
      onPointerLeave={clear}
      onFocus={highlight}
      onBlur={clear}
      className="flex items-start justify-between gap-2 px-3 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span className={`${CODE_CHIP_CLASS} max-w-full truncate`}>{code}</span>
          {cajon.lleno && <Badge tone="loaned">Lleno</Badge>}
        </span>
        <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 text-[13px] text-zinc-500 dark:text-zinc-400">
          <span className="text-zinc-700 dark:text-zinc-200">{cajon.codigo}</span>
          <span aria-hidden="true">·</span>
          {cajon.estante ? (
            <span>
              Estante <span className="font-code text-zinc-700 dark:text-zinc-200">{cajon.estante.codigo}</span>
            </span>
          ) : (
            <span>Sin estante</span>
          )}
        </span>
        {cajon.descripcion && (
          <span className="truncate text-[13px] text-zinc-500 dark:text-zinc-400">{cajon.descripcion}</span>
        )}
      </div>

      <div className="flex shrink-0 items-center">
        {canMarkFull && <CajonLlenoButton cajonId={cajon.id} codigo={code} lleno={Boolean(cajon.lleno)} compact />}
        <button
          type="button"
          onClick={() => onPrint(cajon)}
          disabled={printing}
          className={cn(ICON_BUTTON_CLASS, 'disabled:cursor-not-allowed disabled:opacity-50')}
          title="Imprimir etiqueta"
          aria-label={`Imprimir etiqueta de ${code}`}
        >
          {printing ? (
            <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Printer aria-hidden="true" className="h-3.5 w-3.5" />
          )}
        </button>
        <button
          type="button"
          onClick={() => onDelete(cajon)}
          className={ICON_BUTTON_CLASS}
          title="Eliminar cajón"
          aria-label={`Eliminar cajón ${cajon.codigo}`}
        >
          <Trash2 aria-hidden="true" className="h-3.5 w-3.5 text-danger" />
        </button>
      </div>
    </li>
  );
}
