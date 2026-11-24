import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Kbd } from '@/components/ui/kbd';
import type { QuickAction } from '@/layouts/nav-config';
import { TypewriterName } from './typewriter-name';
import { useHomeShortcut } from './use-home-shortcut';

export interface HomeHeroProps {
  firstName: string;
  /** Fecha · rol · pañol. */
  context: string;
  primary: QuickAction | undefined;
  secondary: QuickAction[];
  /** Bloque a la derecha de la banda (búsqueda del catálogo, escaneo). */
  aside?: ReactNode;
}

/**
 * Banda de saludo de Inicio: quién eres, qué día es y la acción principal del rol con su tecla.
 * Entra una sola vez al cargar (260 ms); el nombre se escribe a máquina (docs/saludo-animado.md); el resto de la
 * página no se anima.
 */
export function HomeHero({ firstName, context, primary, secondary, aside }: HomeHeroProps) {
  useHomeShortcut(primary?.key, primary?.to ?? '/');

  return (
    <section
      aria-label="Bienvenida"
      className="ui-enter grid grid-cols-1 gap-6 border-b border-zinc-200 pb-6 dark:border-zinc-800 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-end"
    >
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[26px] font-medium leading-8 tracking-[-0.035em] text-zinc-900 dark:text-zinc-100 sm:text-[32px] sm:leading-10">
            Hola, <TypewriterName name={firstName} />
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{context}</p>
        </div>
        {primary && (
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              to={primary.to}
              aria-keyshortcuts={primary.key?.toUpperCase()}
              className="ui-press inline-flex h-10 items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-accent-ink hover:bg-accent-muted pointer-coarse:h-11"
            >
              <primary.icon aria-hidden="true" className="h-4 w-4" />
              {primary.label}
              {primary.key && <Kbd className="border-white/25 bg-white/10 text-current dark:border-black/20 dark:bg-black/10">{primary.key.toUpperCase()}</Kbd>}
            </Link>
            {secondary.slice(0, 2).map((action) => (
              <Link
                key={action.id}
                to={action.to}
                className="ui-press group inline-flex h-10 items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-800 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-700 pointer-coarse:h-11"
              >
                {action.label}
                <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 text-zinc-400 transition-transform duration-150 group-hover:translate-x-[3px]" />
              </Link>
            ))}
          </div>
        )}
      </div>
      {aside && <div className="min-w-0">{aside}</div>}
    </section>
  );
}
