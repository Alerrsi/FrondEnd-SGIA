interface SkeletonProps {
  className?: string;
  /** Con `label`, el bloque se anuncia como estado de carga a los lectores de pantalla. */
  label?: string;
}

// Fondo fijo, sin brillo ni pulso animado (rediseño «Trazo»: nada se mueve sin un motivo).
const BLOCK = 'rounded-md bg-zinc-100 dark:bg-zinc-800/70';

/** Bloque que ocupa el lugar del contenido mientras el servidor responde (esquema de carga). */
export function Skeleton({ className = '', label }: SkeletonProps) {
  if (!label) return <div aria-hidden="true" className={`${BLOCK} ${className}`} />;
  return (
    <div role="status" className={`${BLOCK} ${className}`}>
      <span className="sr-only">{label}</span>
    </div>
  );
}
