import { useEquipmentUnitBarcode } from '@sgia/api-client';
import type { EquipmentUnit } from '@sgia/types';
import { Barcode, Loader2 } from 'lucide-react';

import { Dialog, DialogCloseButton, DialogFooter } from '@/components/ui/dialog';

export function UnidadBarcodeDialog({
  unit,
  onClose,
}: {
  unit: EquipmentUnit | null;
  onClose: () => void;
}) {
  const { data, isLoading } = useEquipmentUnitBarcode(unit?.id);

  if (!unit) return null;

  return (
    <Dialog
      open
      onClose={onClose}
      title="Código de la unidad"
      description={unit.serial_number ? `Serie ${unit.serial_number}` : 'Sin número de serie'}
      size="sm"
    >
      <div className="flex flex-col gap-4">
        <div
          data-testid="unit-barcode-container"
          className="flex min-h-[96px] flex-col items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-700 bg-white p-3 text-black"
        >
          {isLoading ? (
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin text-zinc-600" />
          ) : data?.svg ? (
            <div
              className="flex w-full justify-center [&>svg]:max-w-full [&>svg]:h-14"
              dangerouslySetInnerHTML={{ __html: data.svg }}
            />
          ) : (
            <div className="flex flex-col items-center gap-1 text-zinc-400">
              <Barcode aria-hidden="true" className="h-8 w-8 opacity-40" />
              <span className="text-xs">SVG no disponible</span>
            </div>
          )}
          <span className="mt-1 font-code text-xs">{unit.code}</span>
        </div>
        <DialogFooter>
          <DialogCloseButton>Cerrar</DialogCloseButton>
        </DialogFooter>
      </div>
    </Dialog>
  );
}
