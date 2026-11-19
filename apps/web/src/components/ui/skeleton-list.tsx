import { Skeleton } from './skeleton';

const WIDTHS = ['w-1/4', 'w-1/3', 'w-1/5', 'w-1/6'];

interface SkeletonListProps {
  /** Texto para lectores de pantalla («Cargando …»). */
  label: string;
  rows?: number;
  /** Bloques por fila (las columnas del listado que reemplaza). */
  columns?: number;
  className?: string;
}

/** Esquema de un listado o tabla completa mientras carga (fuera de un `<table>`). */
export function SkeletonList({ label, rows = 6, columns = 4, className = '' }: SkeletonListProps) {
  return (
    <div role="status" className={`flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800/60 ${className}`}>
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} aria-hidden="true" className="flex items-center gap-4 px-4 py-3">
          {Array.from({ length: columns }, (_, col) => (
            <Skeleton key={col} className={`h-3.5 ${WIDTHS[(col + row) % WIDTHS.length]}`} />
          ))}
        </div>
      ))}
    </div>
  );
}
