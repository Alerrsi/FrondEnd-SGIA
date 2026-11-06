interface PageEyebrowProps {
  /** Área funcional: ADQUISICIONES, PAÑOL TI, ADMINISTRACIÓN… */
  area: string;
  /** Nombre corto de la sección actual. */
  section: string;
}

/** Sobretítulo único de todas las pantallas: insignia de sede + sección. */
export function PageEyebrow({ area, section }: PageEyebrowProps) {
  return (
    <div className="mb-1 flex flex-wrap items-center gap-2">
      <span
        data-sede-badge="true"
        className="sede-badge inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand-soft px-2 py-0.5 font-mono text-xs font-medium text-brand-strong"
      >
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand" />
        SEDE TEMUCO · {area}
      </span>
      <span aria-hidden="true" className="font-mono text-xs text-text-muted">
        /
      </span>
      <span className="font-mono text-xs uppercase tracking-wider text-text-muted">{section}</span>
    </div>
  );
}
