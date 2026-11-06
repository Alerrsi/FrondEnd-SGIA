import { useEquipmentUnitBarcode } from '@sgia/api-client';
import type { EquipmentUnit } from '@sgia/types';
import { Barcode, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';

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
      className="max-w-sm"
    >
      <div className="flex flex-col gap-3">
        <div
          data-testid="unit-barcode-container"
          className="flex min-h-[96px] flex-col items-center justify-center rounded-md border border-border bg-surface p-3 text-black"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
          ) : data?.svg ? (
            <div
              className="flex w-full justify-center [&>svg]:max-w-full [&>svg]:h-14"
              dangerouslySetInnerHTML={{ __html: data.svg }}
            />
          ) : (
            <div className="flex flex-col items-center gap-1 text-text-muted">
              <Barcode className="h-8 w-8 opacity-40" />
              <span className="text-xs font-mono">SVG no disponible</span>
            </div>
          )}
          <span className="mt-1 font-mono text-xs font-semibold tracking-widest">{unit.code}</span>
        </div>
        <div className="flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
            Cerrar
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
