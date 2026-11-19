import { Skeleton } from './skeleton';

// Anchos que se repiten por columna para que el esquema parezca una tabla real y no una grilla pareja.
const WIDTHS = ['w-24', 'w-40', 'w-28', 'w-16', 'w-32', 'w-20'];

interface SkeletonRowsProps {
  /** Columnas de la tabla real (`columns.length`). */
  columns: number;
  rows?: number;
  /** Texto para lectores de pantalla («Cargando …»). */
  label: string;
  /** Padding de celda de la tabla donde se usa (listado `px-4 py-2.5`; panel `px-3 py-2`). */
  cellClassName?: string;
}

/** Filas de esquema dentro de un `<tbody>` mientras carga la tabla. */
export function SkeletonRows({ columns, rows = 6, label, cellClassName = 'px-4 py-3' }: SkeletonRowsProps) {
  return (
    <>
      {Array.from({ length: rows }, (_, row) => (
        <tr key={row} aria-hidden={row > 0 || undefined}>
          {Array.from({ length: columns }, (_, col) => (
            // `relative`: el texto oculto (absoluto) no escapa de una tabla con scroll horizontal.
            <td key={col} className={`relative ${cellClassName}`}>
              {row === 0 && col === 0 && (
                <span role="status" className="sr-only">
                  {label}
                </span>
              )}
              <Skeleton className={`h-3.5 ${WIDTHS[(col + row) % WIDTHS.length]}`} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
