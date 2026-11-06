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
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-150" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <DialogPrimitive.Content
              className={cn(
                'relative w-full max-w-lg rounded-md border border-border bg-surface p-6 shadow-md animate-in fade-in zoom-in-95 duration-150 focus:outline-none text-text',
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
              <div className="flex items-start justify-between gap-4 border-b border-border pb-3">
                <div>
                  <DialogPrimitive.Title className="text-base font-semibold text-text tracking-tight">
                    {title}
                  </DialogPrimitive.Title>
                  {description && (
                    <DialogPrimitive.Description className="mt-1 text-xs text-text-muted">
                      {description}
                    </DialogPrimitive.Description>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleAttemptClose}
                  aria-label="Cerrar modal"
                  className="rounded p-1 text-text-muted hover:bg-surface-raised hover:text-text transition-colors focus-visible:ring-2 focus-visible:ring-info cursor-pointer"
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
          <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-ink/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150" />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <DialogPrimitive.Content
              className="relative w-full max-w-sm rounded-md border border-border bg-surface p-5 shadow-lg animate-in fade-in zoom-in-95 duration-150 focus:outline-none text-text"
              onPointerDownOutside={(e) => e.preventDefault()}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-warn/30 bg-warn-bg text-warn">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <DialogPrimitive.Title className="text-sm font-semibold text-text tracking-tight">
                    {confirmExitTitle}
                  </DialogPrimitive.Title>
                  <DialogPrimitive.Description className="text-xs text-text-muted leading-relaxed">
                    {confirmExitDescription}
                  </DialogPrimitive.Description>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-3">
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
