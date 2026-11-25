import { useEffect, useState } from 'react';
import { useInvoiceIntakeFile } from '@sgia/api-client';
import { ExternalLink, FileX, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

/**
 * Vista del archivo de la factura (descarga autenticada; nunca una URL directa del backend). Con el modal en una
 * columna (bajo 1280px) mide media pantalla para que los ítems queden cerca; desde 1280px ocupa su columna.
 */
export function InvoiceFilePreview({ intakeId, hasFile }: { intakeId: number; hasFile: boolean }) {
  const { data: blob, isLoading, isError } = useInvoiceIntakeFile(intakeId, hasFile);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) return;
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);

  if (!hasFile || isError) {
    return (
      <div className="flex h-full min-h-48 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 text-[13px] text-zinc-500 dark:text-zinc-400">
        <FileX aria-hidden="true" className="h-6 w-6" />
        {isError ? 'No se pudo cargar el archivo.' : 'El ingreso no tiene archivo.'}
      </div>
    );
  }

  if (isLoading || !url || !blob) {
    return (
      <div className="flex h-full min-h-48 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 text-[13px] text-zinc-500 dark:text-zinc-400">
        <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />
        Cargando factura…
      </div>
    );
  }

  const isImage = blob.type.startsWith('image/');

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="h-[50vh] overflow-hidden rounded-lg xl:h-auto xl:min-h-[55vh] xl:flex-1 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
        {isImage ? (
          <img src={url} alt="Factura escaneada" width={800} height={1100} className="h-full w-full object-contain" />
        ) : (
          <iframe src={url} title="Factura en PDF" className="h-full w-full xl:min-h-[55vh]" />
        )}
      </div>
      <Button
        variant="secondary"
        size="sm"
        className="self-start"
        onClick={() => window.open(url, '_blank', 'noopener')}
      >
        <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
        Abrir en otra pestaña
      </Button>
    </div>
  );
}
