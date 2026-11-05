interface ProfesorPendientePageProps {
  title: string;
}

/** Marcador de las pantallas del profesor (REQ-21) hasta que se implementen. */
export function ProfesorPendientePage({ title }: ProfesorPendientePageProps) {
  return (
    <div className="p-6">
      <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</h1>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        Esta pantalla del profesor estará disponible próximamente.
      </p>
    </div>
  );
}
