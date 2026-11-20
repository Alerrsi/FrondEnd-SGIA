import { ArrowRight, Info } from 'lucide-react';
import { ButtonLink } from '@/components/shared/button-link';

/** Aviso del historial: el flujo antiguo quedó en solo lectura (Fase 7 del nuevo flujo de compras). */
export function LegacyQuotationsNotice() {
  return (
    <div
      role="note"
      className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-[13px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 sm:flex-row sm:items-center"
    >
      <span className="flex flex-1 items-start gap-2">
        <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
        <span>
        Historial en solo lectura: las cotizaciones de este listado son del flujo anterior. Las compras
        nuevas se piden, cotizan y adjudican desde Solicitudes de compra.
        </span>
      </span>
      <ButtonLink to="/compras/solicitudes" variant="primary" size="sm">
        Ir a solicitudes de compra
        <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
      </ButtonLink>
    </div>
  );
}
