import { Loader2, PackageCheck, PackageOpen } from 'lucide-react';
import { useUpdateCajon } from '@sgia/api-client';

import { Button } from '@/components/ui/button';
import { ICON_BUTTON_CLASS } from '@/components/ui/table-styles';
import { apiErrorToMessage } from '@/lib/api-error';
import { cn } from '@/lib/cn';
import { toast } from '@/lib/toast';

export interface CajonLlenoButtonProps {
  cajonId: number;
  /** Código que ve la persona (`L206-R1`), para el aviso y el nombre accesible. */
  codigo: string;
  lleno: boolean;
  /** Solo el ícono, para filas con otras acciones de ícono (lista de Ubicaciones). */
  compact?: boolean;
}

/**
 * Marca o desmarca un cajón como lleno (docs/cajones-llenos.md). Lo usan la lista de cajones de Ubicaciones y
 * el pop-up del estante; el mapa se refresca solo porque `useUpdateCajon` invalida salas y estantes.
 */
export function CajonLlenoButton({ cajonId, codigo, lleno, compact = false }: CajonLlenoButtonProps) {
  const update = useUpdateCajon();
  const Icon = update.isPending ? Loader2 : lleno ? PackageOpen : PackageCheck;

  const toggle = async () => {
    try {
      await update.mutateAsync({ id: cajonId, payload: { lleno: !lleno } });
      toast.success(lleno ? `El cajón ${codigo} ya no está lleno` : `Cajón ${codigo} marcado como lleno`);
    } catch (error) {
      toast.error(apiErrorToMessage(error));
    }
  };

  const label = lleno ? `Quitar lleno del cajón ${codigo}` : `Marcar lleno el cajón ${codigo}`;
  const iconClass = cn('h-3.5 w-3.5', update.isPending && 'animate-spin', compact && lleno && !update.isPending && 'text-info');

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={update.isPending}
        aria-pressed={lleno}
        aria-label={label}
        title={lleno ? 'Quitar lleno' : 'Marcar lleno'}
        className={cn(ICON_BUTTON_CLASS, 'disabled:cursor-not-allowed disabled:opacity-50')}
      >
        <Icon aria-hidden="true" className={iconClass} />
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={() => void toggle()}
      disabled={update.isPending}
      aria-pressed={lleno}
      aria-label={label}
    >
      <Icon aria-hidden="true" className={iconClass} />
      {lleno ? 'Quitar lleno' : 'Marcar lleno'}
    </Button>
  );
}
