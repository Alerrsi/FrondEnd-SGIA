import { Dialog, DialogCloseButton, DialogFooter } from '@/components/ui/dialog';
import { Kbd } from '@/components/ui/kbd';
import { quickActionsForRole } from './nav-config';

export interface ShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
  role: string | undefined;
}

/** Lista de atajos de teclado (`?`). Los de Inicio dependen del rol. */
export function ShortcutsDialog({ open, onClose, role }: ShortcutsDialogProps) {
  const homeKeys = quickActionsForRole(role).filter((a) => a.key);
  const rows: Array<[string, string]> = [
    ['Ctrl K', 'Buscar pantallas y acciones'],
    ['/', 'Buscar en la tabla de la pantalla'],
    ['?', 'Ver esta lista'],
    ['Esc', 'Cerrar un modal o panel'],
    ...homeKeys.map((a): [string, string] => [a.key!.toUpperCase(), `${a.label} (en Inicio)`]),
  ];

  return (
    <Dialog open={open} onClose={onClose} title="Atajos de teclado" description="Funcionan fuera de los campos de texto." size="sm">
      <div className="flex flex-col gap-4">
        <dl className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
          {rows.map(([keys, label]) => (
            <div key={keys} className="flex items-center justify-between gap-4 py-2">
              <dt className="text-sm text-zinc-700 dark:text-zinc-300">{label}</dt>
              <dd>
                <Kbd className="inline-flex">{keys}</Kbd>
              </dd>
            </div>
          ))}
        </dl>
        <DialogFooter>
          <DialogCloseButton>Cerrar</DialogCloseButton>
        </DialogFooter>
      </div>
    </Dialog>
  );
}
