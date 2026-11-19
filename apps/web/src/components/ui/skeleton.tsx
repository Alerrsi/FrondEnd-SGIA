interface SkeletonProps {
  className?: string;
  /** Con `label`, el bloque se anuncia como estado de carga a los lectores de pantalla. */
  label?: string;
}

const BLOCK = 'rounded-md bg-zinc-200/80 motion-safe:animate-pulse dark:bg-zinc-800';

/** Bloque que ocupa el lugar del contenido mientras el servidor responde (esquema de carga). */
export function Skeleton({ className = '', label }: SkeletonProps) {
  if (!label) return <div aria-hidden="true" className={`${BLOCK} ${className}`} />;
  return (
    <div role="status" className={`${BLOCK} ${className}`}>
      <span className="sr-only">{label}</span>
    </div>
  );
}
