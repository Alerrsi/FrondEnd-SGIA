import { useEffect, useRef, useState } from 'react';
import { ApiRequestError, useUploadInvoiceIntake } from '@sgia/api-client';
import type { InvoiceIntake } from '@sgia/types';
import { FileText, FileUp, Loader2, UploadCloud, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogCloseButton } from '@/components/ui/dialog';
import { apiErrorToMessage, apiFieldErrors } from '@/lib/api-error';
import { cn } from '@/lib/cn';
import { toast } from '@/lib/toast';

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];

const errorClasses = 'mt-1 text-[11px] text-rose-600 dark:text-rose-400';

interface UploadInvoiceIntakeDialogProps {
  open: boolean;
  onClose: () => void;
  onUploaded: (intake: InvoiceIntake) => void;
}

/** Paso 1: solo el archivo (la factura ya no se asocia a presupuesto ni orden de compra). El backend corre el OCR y crea el borrador. */
export function UploadInvoiceIntakeDialog({
  open,
  onClose,
  onUploaded,
}: UploadInvoiceIntakeDialogProps) {
  const upload = useUploadInvoiceIntake();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setErrors({});
    if (fileRef.current) fileRef.current.value = '';
  }, [open]);

  const pickFile = (f: File | undefined) => {
    if (!f) return;
    if (f.size > MAX_BYTES) {
      setErrors((e) => ({ ...e, file: 'El archivo no puede superar 10 MB.' }));
      return;
    }
    if (!ACCEPTED.includes(f.type)) {
      setErrors((e) => ({
        ...e,
        file: 'Formato no soportado: usa PDF, PNG, JPG o WEBP.',
      }));
      return;
    }
    setErrors(({ file: _omit, ...rest }) => rest);
    setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrors({ file: 'Selecciona el archivo de la factura.' });
      return;
    }
    setErrors({});

    try {
      const intake = await upload.mutateAsync({ file });
      toast.success(
        intake.raw_ocr_payload.ocr_available
          ? `Borrador creado: ${intake.raw_ocr_payload.items.length} ítem(s) detectados para revisar.`
          : 'Borrador creado sin lectura OCR: carga los ítems a mano.',
      );
      onUploaded(intake);
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 429) {
        toast.error('Demasiadas facturas en poco tiempo. Espera un minuto e inténtalo de nuevo.');
        return;
      }
      setErrors(apiFieldErrors(error));
      toast.error(apiErrorToMessage(error));
    }
  };

  const pending = upload.isPending;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      hasUnsavedChanges={Boolean(file) && !pending}
      title="Subir factura"
      description="Se guarda el archivo, se lee con OCR y se crea un borrador. Nada se descuenta hasta que lo confirmes."
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            pickFile(e.dataTransfer.files[0]);
          }}
          className={cn(
            'flex flex-col items-center justify-center rounded-md border-2 border-dashed p-6 text-center transition-colors',
            dragging
              ? 'border-zinc-400 bg-zinc-100 dark:bg-zinc-800'
              : 'border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950/40',
            pending && 'pointer-events-none opacity-60',
          )}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            aria-label="Archivo de factura"
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0])}
          />
          {pending ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <Loader2 className="h-7 w-7 animate-spin text-zinc-500" />
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Leyendo la factura con OCR…
              </span>
            </div>
          ) : file ? (
            <div className="flex items-center gap-2 text-xs">
              <FileText className="h-5 w-5 text-zinc-400" />
              <span className="font-mono text-zinc-800 dark:text-zinc-200">{file.name}</span>
              <span className="text-zinc-400">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
              <button
                type="button"
                aria-label="Quitar archivo"
                onClick={() => {
                  setFile(null);
                  if (fileRef.current) fileRef.current.value = '';
                }}
                className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <>
              <UploadCloud className="mb-2 h-6 w-6 text-zinc-400" />
              <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                Arrastra la factura aquí
              </p>
              <p className="mt-0.5 font-mono text-[11px] text-zinc-500">
                PDF, PNG, JPG o WEBP · máx. 10 MB
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 text-xs"
                onClick={() => fileRef.current?.click()}
              >
                <FileUp className="h-3.5 w-3.5" />
                Seleccionar archivo
              </Button>
            </>
          )}
        </div>
        {errors.file && <p className={errorClasses}>{errors.file}</p>}

        <div className="flex justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800 pt-3">
          <DialogCloseButton disabled={pending}>Cancelar</DialogCloseButton>
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Subir y leer factura
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
