import { ChevronRight, HardHat } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { InicioHero } from '../lib/inicio-content';

/** Recomendación del pañol con un atajo (esquina inferior izquierda). */
export function TipCard({ tip }: { tip: InicioHero['tip'] }) {
  return (
    <div className="flex items-center gap-3">
      <span className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
        <span className="absolute -inset-2 rounded-full border border-dashed border-zinc-300 dark:border-zinc-700" />
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-300 text-zinc-900">
          <HardHat className="h-5 w-5" strokeWidth={1.75} />
        </span>
      </span>
      <div className="min-w-0">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{tip.label}</p>
        <Link
          to={tip.to}
          className="group inline-flex items-center gap-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100"
        >
          {tip.linkLabel}
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
