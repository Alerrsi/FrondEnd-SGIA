import { useRef } from 'react';
import { FileText, FileUp, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { acceptAttribute } from '@/features/solicitudes-compra/lib/quotation-upload-schema';
import { cn } from '@/lib/cn';

interface FileFieldProps {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
  /** Extensiones aceptadas, sin punto. */
  extensions: string[];
  /** Texto de ayuda con los formatos y el tamaño máximo. */
  hint: string;
  disabled?: boolean;
  invalid?: boolean;
}

/** Selector de un archivo (PDF/imagen); la validación de tipo y tamaño la hace el esquema Zod. */
export function FileField({
  label,
  file,
  onChange,
  extensions,
  hint,
  disabled,
  invalid,
}: FileFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const clear = () => {
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md border border-dashed px-3 py-2 text-xs',
        invalid
          ? 'border-rose-300 dark:border-rose-800'
          : 'border-zinc-300 dark:border-zinc-700',
        'bg-zinc-50/50 dark:bg-zinc-950/40',
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={acceptAttribute(extensions)}
        aria-label={label}
        className="hidden"
        disabled={disabled}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      {file ? (
        <>
          <FileText className="h-4 w-4 shrink-0 text-zinc-400" />
          <span className="flex-1 truncate font-mono text-zinc-800 dark:text-zinc-200">
            {file.name}
          </span>
          <span className="font-mono text-zinc-400">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
          <button
            type="button"
            aria-label="Quitar archivo"
            onClick={clear}
            disabled={disabled}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </>
      ) : (
        <>
          <span className="flex-1 font-mono text-[11px] text-zinc-500">
            {hint}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
          >
            <FileUp className="h-3.5 w-3.5" />
            Seleccionar archivo
          </Button>
        </>
      )}
    </div>
  );
}
