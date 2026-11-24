import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import { cn } from '@/lib/cn';
import { isToasterEvent } from '@/lib/is-toaster-event';

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;
export const SheetPortal = DialogPrimitive.Portal;

export const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'ui-overlay fixed inset-0 z-50 bg-zinc-950/40',
      className,
    )}
    {...props}
  />
));
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName;

export const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    side?: 'left' | 'right' | 'center';
    overlayClassName?: string;
  }
>(({ side = 'right', className, overlayClassName, children, onInteractOutside, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay className={overlayClassName} />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        // El panel nunca se corta: si su contenido es más alto que la pantalla, hace scroll.
        // Bajo 640px ocupa la pantalla completa; desde 640px, 512px de ancho.
        'fixed z-50 flex flex-col gap-4 overflow-y-auto overscroll-contain bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 p-4 sm:p-6 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_8px_24px_rgb(0_0_0/0.08)] focus:outline-none',
        side === 'right' &&
          'ui-sheet-right inset-y-0 right-0 h-dvh w-full sm:max-w-lg sm:border-l border-zinc-200 dark:border-zinc-800',
        side === 'left' &&
          'ui-sheet-left inset-y-0 left-0 h-dvh w-full sm:max-w-lg sm:border-r border-zinc-200 dark:border-zinc-800',
        side === 'center' &&
          'ui-sheet-center inset-0 h-dvh w-full sm:inset-y-0 sm:left-0 sm:right-0 sm:mx-auto sm:w-[90vw] sm:border-x border-zinc-200 dark:border-zinc-800',
        className,
      )}
      onInteractOutside={(e) => {
        // Quitar un aviso con clic no cierra la hoja (docs/avisos-emergentes.md).
        if (isToasterEvent(e)) e.preventDefault();
        onInteractOutside?.(e);
      }}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-3 top-3 sm:right-4 sm:top-4 flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors pointer-coarse:h-11 pointer-coarse:w-11">
        <X aria-hidden="true" className="h-4 w-4" />
        <span className="sr-only">Cerrar</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = 'SheetContent';

export const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col space-y-1 pb-3 border-b border-zinc-200 dark:border-zinc-800 text-left',
      className,
    )}
    {...props}
  />
);
SheetHeader.displayName = 'SheetHeader';

export const SheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      'flex items-center gap-2 pr-10 text-base font-medium tracking-[-0.01em] text-zinc-900 dark:text-zinc-100',
      className,
    )}
    {...props}
  />
));
SheetTitle.displayName = 'SheetTitle';

export const SheetDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-[13px] text-zinc-500 dark:text-zinc-400', className)}
    {...props}
  />
));
SheetDescription.displayName = 'SheetDescription';
