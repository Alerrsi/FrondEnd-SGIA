import { cn } from '@/lib/cn';
import { useMediaQuery } from '@/lib/use-media-query';
import { useTypewriter } from '../hooks/use-typewriter';

const CARET_CLASS = 'ml-[0.06em] inline-block h-[0.09em] w-[0.5em] rounded-[1px] align-baseline';

/**
 * Nombre del saludo escrito a máquina con un guion bajo burdeo como cursor (docs/saludo-animado.md). El nombre
 * completo reserva su lugar (invisible) para que el título no cambie de tamaño; el lector de pantalla lo lee una
 * sola vez. Con movimiento reducido queda fijo y sin cursor.
 */
export function TypewriterName({ name }: { name: string }) {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const { shown, state } = useTypewriter(name, !reduced);

  return (
    <span className="inline-grid">
      <span className="sr-only">{name}</span>
      <span aria-hidden="true" className="invisible col-start-1 row-start-1 whitespace-pre">
        {name}
        {!reduced && <span className={CARET_CLASS} />}
      </span>
      <span aria-hidden="true" data-testid="typewriter-name" data-phase={state.phase} className="col-start-1 row-start-1 whitespace-pre">
        {shown}
        {!reduced && (
          <span data-testid="typewriter-caret" className={cn(CARET_CLASS, 'bg-accent', state.phase === 'holding' && 'ui-caret')} />
        )}
      </span>
    </span>
  );
}
