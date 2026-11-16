import { useState } from 'react';
import { ChevronLeft, ChevronRight, CornerDownRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { cn } from '@/lib/cn';
import type { InicioModule } from '../lib/inicio-content';

const TONE_CLASSES: Record<InicioModule['tone'], string> = {
  amber: 'bg-amber-300 text-zinc-900',
  sky: 'bg-sky-300 text-zinc-900',
  emerald: 'bg-emerald-300 text-zinc-900',
  violet: 'bg-violet-300 text-zinc-900',
  zinc: 'bg-zinc-200 text-zinc-900',
};

/** Tarjeta punteada con los módulos del rol, uno a la vez, con anterior / siguiente. */
export function QuickAccessCarousel({ modules }: { modules: InicioModule[] }) {
  const [index, setIndex] = useState(0);
  const current = modules[index % Math.max(modules.length, 1)];
  if (!current) return null;

  const Icon = current.icon;
  const step = (delta: number) => setIndex((i) => (i + delta + modules.length) % modules.length);

  return (
    <section
      aria-label="Accesos rápidos"
      className="rounded-2xl border border-dashed border-white/25 bg-zinc-950/40 p-4 text-white backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-3 border-b border-dashed border-white/15 pb-3">
        <h2 className="text-xs font-medium text-white/80">Accesos rápidos</h2>
        <div className="flex items-center gap-3 text-[11px]">
          <button
            type="button"
            onClick={() => step(-1)}
            className="inline-flex cursor-pointer items-center gap-1 text-white/50 transition-colors hover:text-white"
            aria-label="Módulo anterior"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Anterior
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            className="inline-flex cursor-pointer items-center gap-1 text-white transition-colors hover:text-amber-300"
            aria-label="Módulo siguiente"
          >
            Siguiente <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-4">
        <span
          className={cn(
            'flex h-14 w-14 shrink-0 items-center justify-center rounded-full shadow-lg ring-4 ring-white/10',
            TONE_CLASSES[current.tone],
          )}
        >
          <Icon className="h-6 w-6" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold">{current.label}</p>
          <p className="flex items-center gap-1 text-[11px] text-white/50">
            <CornerDownRight className="h-3 w-3 shrink-0 text-amber-300" />
            <span className="truncate">{current.description}</span>
          </p>
        </div>
        <span className="hidden max-w-[40%] truncate font-mono text-xs text-white/60 sm:inline">{current.to}</span>
        <Link
          to={current.to}
          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-amber-300 px-3 text-xs font-semibold text-zinc-900 transition-colors hover:bg-amber-200"
        >
          Abrir <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <p className="pt-3 font-mono text-[11px] text-white/40" aria-live="polite">
        {String((index % modules.length) + 1).padStart(2, '0')} / {String(modules.length).padStart(2, '0')}
      </p>
    </section>
  );
}
