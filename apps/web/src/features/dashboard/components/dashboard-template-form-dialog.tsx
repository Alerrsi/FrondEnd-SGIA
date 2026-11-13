import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { FORM_CONTROL_CLASS } from '@/components/ui/form-control';

interface DashboardTemplateFormDialogProps {
  open: boolean;
  /** Nombre actual al renombrar; vacío al crear. */
  initialName?: string;
  loading?: boolean;
  onSubmit: (name: string) => void;
  onClose: () => void;
}

/** Pide el nombre de una plantilla de dashboard (crear o renombrar). */
export function DashboardTemplateFormDialog({
  open,
  initialName = '',
  loading = false,
  onSubmit,
  onClose,
}: DashboardTemplateFormDialogProps) {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (open) setName(initialName);
  }, [open, initialName]);

  const trimmed = name.trim();
  const isRename = initialName !== '';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isRename ? 'Renombrar plantilla' : 'Nueva plantilla de dashboard'}
      description="Agrupa hasta 9 gráficos bajo un nombre para cambiar de panel con un clic."
      className="max-w-md"
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (trimmed) onSubmit(trimmed);
        }}
      >
        <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Nombre
          <input
            autoFocus
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Resumen semestral"
            className={FORM_CONTROL_CLASS}
            data-testid="template-name-input"
          />
        </label>
        <div className="flex justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800 pt-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!trimmed || loading}>
            {isRename ? 'Guardar' : 'Crear plantilla'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
