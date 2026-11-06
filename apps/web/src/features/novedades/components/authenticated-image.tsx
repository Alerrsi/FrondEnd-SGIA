import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface AuthenticatedImageProps {
  /** Descarga con token (p. ej. `downloadIncidentReportSignature`); una `<img src>` directa daría 401. */
  load: () => Promise<Blob>;
  alt: string;
  className?: string;
}

/** Muestra una imagen servida por un endpoint autenticado, vía `blob:` URL. */
export function AuthenticatedImage({ load, alt, className }: AuthenticatedImageProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    load()
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [load]);

  if (failed) return <p className="text-xs text-text-muted">No se pudo cargar la imagen.</p>;
  if (!src)
    return (
      <div className="flex items-center gap-2 py-4 text-xs text-text-muted">
        <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
        Cargando…
      </div>
    );
  return <img src={src} alt={alt} className={className} />;
}
