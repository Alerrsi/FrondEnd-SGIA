import { useState, type ReactNode } from 'react';
import { Eye } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogCloseButton, DialogFooter } from '@/components/ui/dialog';

interface ChartExpandButtonProps {
  title: string;
  description?: string;
  /** Contenido ampliado (el gráfico); se renderiza en un contenedor de alto grande. */
  children: ReactNode;
  disabled?: boolean;
}

/** Botón de ojo que abre el gráfico en un pop-up grande. */
export function ChartExpandButton({ title, description, children, disabled }: ChartExpandButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="h-7 w-7 text-zinc-400 hover:text-zinc-700"
        title="Ampliar gráfico"
        aria-label="Ampliar gráfico"
      >
        <Eye className="h-3.5 w-3.5" />
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        description={description}
        size="2xl"
      >
        <div className="flex flex-col gap-4">
          {/* El gráfico ocupa el alto disponible sin forzar scroll: pantalla menos cabecera y pie. */}
          <div className="relative h-[min(65vh,calc(100dvh-15rem))] min-h-48 w-full" data-testid="chart-expanded">
            {children}
          </div>
          <DialogFooter>
            <DialogCloseButton>Cerrar</DialogCloseButton>
          </DialogFooter>
        </div>
      </Dialog>
    </>
  );
}
