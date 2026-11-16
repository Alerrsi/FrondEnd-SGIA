import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { AlertTriangle, X } from 'lucide-react';

import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/cn';

interface DialogContextValue {
  attemptClose: () => void;
  hasUnsavedChanges: boolean | (() => boolean);
}

const DialogContext = createContext<DialogContextValue | null>(null);

/**
 * Anchos estándar de los modales. Cada modal elige uno por contenido, nunca un `max-w-*` propio:
 *   sm  confirmaciones y formularios de 1 a 4 campos (448px)
 *   md  formularios de una columna, por defecto (512px)
 *   lg  formularios de dos columnas o con tablas cortas (672px)
 *   xl  fichas y revisiones con tablas o varias secciones (768px)
 *   2xl gráficos ampliados (1024px)
 */
export type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const SIZE_CLASSES: Record<DialogSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
  '2xl': 'max-w-5xl',
};

export function useDialog() {
  return useContext(DialogContext);
}

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Ancho estándar del modal (ver `DialogSize`). Por defecto `md`. */
  size?: DialogSize;
  /**
   * Clases extra del contenedor. No usar para el ancho (`size`) ni para el alto o el scroll:
   * el modal ya se limita al alto de la pantalla y su cuerpo hace scroll.
   */
  className?: string;
  /**
   * Si es true o una función que retorne true, y el usuario intenta cerrar
   * el modal (por Esc, clic fuera o botón X), se intercepta el cierre y
   * se solicita confirmación antes de salir para evitar pérdida de datos.
   */
  hasUnsavedChanges?: boolean | (() => boolean);
  /**
   * Título y descripción personalizados para el diálogo de confirmación de salida.
   */
  confirmExitTitle?: string;
  confirmExitDescription?: string;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  className,
  hasUnsavedChanges = false,
  confirmExitTitle = '¿Descartar cambios?',
  confirmExitDescription = 'Tienes datos escritos en el formulario. Si sales ahora, se perderán los cambios ingresados.',
}: DialogProps) {
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  useEffect(() => {
    if (!open) {
      setShowExitConfirm(false);
    }
  }, [open]);

  const checkHasChanges = (): boolean => {
    if (typeof hasUnsavedChanges === 'function') {
      try {
        return Boolean(hasUnsavedChanges());
      } catch {
        return false;
      }
    }
    return Boolean(hasUnsavedChanges);
  };

  const handleAttemptClose = () => {
    if (checkHasChanges()) {
      setShowExitConfirm(true);
    } else {
      onClose();
    }
  };

  const handleForceClose = () => {
    setShowExitConfirm(false);
    onClose();
  };

  return (
    <DialogContext.Provider
      value={{
        attemptClose: handleAttemptClose,
        hasUnsavedChanges,
      }}
    >
      <DialogPrimitive.Root
        open={open}
        onOpenChange={(val) => {
          if (!val) {
            handleAttemptClose();
          }
        }}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-zinc-950/50 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-150" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <DialogPrimitive.Content
              data-dialog-size={size}
              className={cn(
                // Nunca más alto que la pantalla: cabecera fija, cuerpo con scroll y pie fijo abajo.
                'relative flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-md transition-all animate-in fade-in zoom-in-95 duration-150 focus:outline-none text-zinc-900 dark:text-zinc-100',
                SIZE_CLASSES[size],
                className,
              )}
              onPointerDownOutside={(e) => {
                if (checkHasChanges()) {
                  e.preventDefault();
                  setShowExitConfirm(true);
                }
              }}
              onEscapeKeyDown={(e) => {
                if (checkHasChanges()) {
                  e.preventDefault();
                  setShowExitConfirm(true);
                }
              }}
            >
              <div className="flex shrink-0 items-start justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 px-6 pt-5 pb-3">
                <div className="min-w-0">
                  <DialogPrimitive.Title className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                    {title}
                  </DialogPrimitive.Title>
                  {description && (
                    <DialogPrimitive.Description className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {description}
                    </DialogPrimitive.Description>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleAttemptClose}
                  aria-label="Cerrar modal"
                  className="-mr-1 shrink-0 rounded p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div data-dialog-body className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
                {children}
              </div>
            </DialogPrimitive.Content>
          </div>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      {/* Sub-diálogo de confirmación para descartar cambios si hay datos escritos */}
      <DialogPrimitive.Root
        open={showExitConfirm}
        onOpenChange={(val) => {
          if (!val) setShowExitConfirm(false);
        }}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-zinc-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150" />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <DialogPrimitive.Content
              className="relative w-full max-w-sm rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-lg transition-all animate-in fade-in zoom-in-95 duration-150 focus:outline-none text-zinc-900 dark:text-zinc-100"
              onPointerDownOutside={(e) => e.preventDefault()}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <DialogPrimitive.Title className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                    {confirmExitTitle}
                  </DialogPrimitive.Title>
                  <DialogPrimitive.Description className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {confirmExitDescription}
                  </DialogPrimitive.Description>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800 pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowExitConfirm(false)}
                >
                  Seguir editando
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={handleForceClose}
                >
                  Descartar y salir
                </Button>
              </div>
            </DialogPrimitive.Content>
          </div>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </DialogContext.Provider>
  );
}

/**
 * Pie de acciones estándar de un modal: va como último hijo del contenido (dentro del `<form>`
 * si lo hay, para que el botón `submit` funcione). Queda pegado abajo aunque el cuerpo haga scroll.
 * Botones: `DialogCloseButton` (ghost, sm) a la izquierda y la acción principal `Button size="sm"`.
 * `className` solo para cambiar la alineación (p. ej. `sm:justify-between` con un texto a la izquierda).
 */
export function DialogFooter({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      data-dialog-footer
      className={cn(
        // sticky se ancla al borde del contenido del cuerpo (sin su padding): -bottom-4 compensa el py-4.
        'sticky -bottom-4 z-10 -mx-6 -mb-4 mt-2 flex flex-wrap items-center justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-3',
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface DialogCloseButtonProps extends Omit<ButtonProps, 'onClick'> {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export function DialogCloseButton({
  children = 'Cancelar',
  variant = 'ghost',
  size = 'sm',
  disabled,
  className,
  onClick,
  ...props
}: DialogCloseButtonProps) {
  const dialog = useDialog();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    if (!e.defaultPrevented) {
      if (dialog) {
        dialog.attemptClose();
      }
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={disabled}
      className={className}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Button>
  );
}
