import type { UsuarioSinPassword } from '@sgia/types';
import { Pencil, Power, Trash2 } from 'lucide-react';

import { ICON_BUTTON_CLASS } from '@/components/ui/table-styles';
import { cn } from '@/lib/cn';

interface UsuarioRowActionsProps {
  usuario: UsuarioSinPassword;
  /** La cuenta de quien está conectado: no puede desactivarse ni eliminarse a sí misma. */
  isSelf: boolean;
  onEdit: (usuario: UsuarioSinPassword) => void;
  onToggleActivo: (usuario: UsuarioSinPassword) => void;
  onDelete?: (usuario: UsuarioSinPassword) => void;
}

const DISABLED_CLASS = 'disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent';

/** Botones de una fila del directorio: editar, activar o desactivar y eliminar. */
export function UsuarioRowActions({ usuario, isSelf, onEdit, onToggleActivo, onDelete }: UsuarioRowActionsProps) {
  return (
    <div className="flex items-center justify-end gap-0.5">
      <button
        type="button"
        onClick={() => onEdit(usuario)}
        aria-label={`Editar a ${usuario.nombre}`}
        title="Editar usuario"
        className={ICON_BUTTON_CLASS}
      >
        <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onToggleActivo(usuario)}
        disabled={isSelf}
        aria-label={
          isSelf
            ? 'No puedes desactivar tu propia cuenta'
            : usuario.activo
              ? `Desactivar a ${usuario.nombre}`
              : `Activar a ${usuario.nombre}`
        }
        title={
          isSelf
            ? 'No puedes desactivar tu propia cuenta de administrador'
            : usuario.activo
              ? 'Desactivar usuario'
              : 'Activar usuario'
        }
        className={cn(ICON_BUTTON_CLASS, DISABLED_CLASS)}
      >
        <Power aria-hidden="true" className="h-3.5 w-3.5" />
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(usuario)}
          disabled={isSelf}
          aria-label={isSelf ? 'No puedes eliminar tu propia cuenta' : `Eliminar a ${usuario.nombre}`}
          title={isSelf ? 'No puedes eliminar tu propia cuenta de administrador' : 'Eliminar usuario'}
          className={cn(ICON_BUTTON_CLASS, DISABLED_CLASS)}
        >
          <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
