import { ArrowRight, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

/** Aviso del historial: el flujo antiguo quedó en solo lectura (Fase 7 del nuevo flujo de compras). */
export function LegacyQuotationsNotice() {
  return (
    <div
      role="note"
      className="flex flex-wrap items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-600 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
    >
      <Info className="h-4 w-4 shrink-0 text-zinc-400" />
      <span className="flex-1">
        Historial en solo lectura: las cotizaciones de este listado son del flujo anterior. Las compras
        nuevas se piden, cotizan y adjudican desde Solicitudes de compra.
      </span>
      <Link
        to="/solicitudes-compra"
        className="inline-flex h-7 items-center gap-1 rounded-md bg-zinc-900 px-2.5 font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        Ir a Solicitudes de compra
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
