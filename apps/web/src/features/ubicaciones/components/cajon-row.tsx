import { Loader2, Printer, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { ICON_BUTTON_CLASS } from '@/components/ui/table-styles';
import { CODE_CHIP_CLASS } from '@/components/ui/typography';
import { cn } from '@/lib/cn';
import { CajonLlenoButton } from '@/features/mapa-salas/components/cajon-lleno-button';

/** Cajón tal como lo muestra el panel de estantes (datos del plano y de la lista de cajones). */
export interface CajonVista {
  id: number;
  /** Código corto (`A1-1`). */
  codigo: string;
  /** Código completo de la etiqueta y el escáner (`BODEGAE-A1-1`). */
  code: string;
  descripcion: string | null;
  lleno: boolean;
  /** Productos + unidades que guarda (`null` si la API no lo trae). */
  elementos: number | null;
  estanteId: number | null;
  estanteCodigo: string | null;
}

export interface CajonRowProps {
  cajon: CajonVista;
  canMarkFull: boolean;
  printing: boolean;
  /** Clic en el cajón: pop-up con sus elementos. */
  onOpen: (cajon: CajonVista) => void;
  onPrint: (cajon: CajonVista) => void;
  onDelete: (cajon: CajonVista) => void;
}

/**
 * Cajón dentro de un estante desplegado (docs/ubicaciones-distribucion.md, decisión 12): código, «Lleno» y cuántos
 * elementos guarda a la vista; clic abre el pop-up con la lista. Las acciones van aparte en la misma fila.
 */
export function CajonRow({ cajon, canMarkFull, printing, onOpen, onPrint, onDelete }: CajonRowProps) {
  return (
    <li className="flex items-center gap-1 pr-1 hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
      <button
        type="button"
        onClick={() => onOpen(cajon)}
        aria-haspopup="dialog"
        className="flex min-w-0 flex-1 flex-col items-start gap-1 py-2 pl-9 pr-1 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent pointer-coarse:py-2.5"
      >
        <span className="flex min-w-0 max-w-full flex-wrap items-center gap-1.5">
          <span className={`${CODE_CHIP_CLASS} max-w-full truncate`}>{cajon.code}</span>
          {cajon.lleno && <Badge tone="loaned">Lleno</Badge>}
        </span>
        <span className="flex min-w-0 max-w-full items-center gap-1.5 text-[13px] text-zinc-500 dark:text-zinc-400">
          {cajon.elementos !== null && (
            <span className={cn('shrink-0', cajon.elementos > 0 ? 'text-zinc-700 dark:text-zinc-200' : undefined)}>
              <span className="font-mono">{cajon.elementos}</span> {cajon.elementos === 1 ? 'elemento' : 'elementos'}
            </span>
          )}
          {cajon.descripcion && (
            <>
              {cajon.elementos !== null && <span aria-hidden="true">·</span>}
              <span className="min-w-0 truncate">{cajon.descripcion}</span>
            </>
          )}
        </span>
      </button>

      <div className="flex shrink-0 items-center">
        {canMarkFull && <CajonLlenoButton cajonId={cajon.id} codigo={cajon.code} lleno={cajon.lleno} compact />}
        <button
          type="button"
          onClick={() => onPrint(cajon)}
          disabled={printing}
          className={cn(ICON_BUTTON_CLASS, 'disabled:cursor-not-allowed disabled:opacity-50')}
          title="Imprimir etiqueta"
          aria-label={`Imprimir etiqueta de ${cajon.code}`}
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
