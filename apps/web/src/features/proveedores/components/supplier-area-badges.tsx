import { SUPPLIER_AREA_LABELS, type SupplierArea } from '@sgia/types';

import { Badge } from '@/components/ui/badge';

/** Áreas del proveedor; un proveedor antiguo sin áreas muestra el aviso para completarlas. */
export function SupplierAreaBadges({ areas }: { areas: SupplierArea[] }) {
  if (areas.length === 0) {
    return (
      <Badge tone="warning" title="Edita el proveedor y asígnale al menos un área">
        Sin área
      </Badge>
    );
  }
  return (
    <span className="inline-flex flex-wrap gap-1">
      {areas.map((area) => (
        <Badge key={area} tone="neutral">
          {SUPPLIER_AREA_LABELS[area]}
        </Badge>
      ))}
    </span>
  );
}
