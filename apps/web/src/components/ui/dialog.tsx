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

export function useDialog() {
  return useContext(DialogContext);
}

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
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
              className={cn(
                'relative w-full max-w-lg rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-md transition-all animate-in fade-in zoom-in-95 duration-150 focus:outline-none text-zinc-900 dark:text-zinc-100',
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
              <div className="flex items-start justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <div>
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
                  className="rounded p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4">{children}</div>
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
