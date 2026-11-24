import { Edit2, Trash2 } from 'lucide-react';
import type { LocationEntity } from '@sgia/types';

import { FORM_CONTROL_CLASS } from '@/components/ui/form-control';
import { ICON_BUTTON_CLASS } from '@/components/ui/table-styles';
import { FIELD_LABEL_CLASS } from '@/components/ui/typography';

export interface SalaSelectProps {
  locations: LocationEntity[];
  active: LocationEntity;
  onSelect: (location: LocationEntity) => void;
  onEdit: (location: LocationEntity) => void;
  onDelete: (location: LocationEntity) => void;
}

/** Sala elegida en pantallas angostas (docs/ubicaciones-distribucion.md): selector nativo con editar y eliminar al lado. */
export function SalaSelect({ locations, active, onSelect, onEdit, onDelete }: SalaSelectProps) {
  return (
    <div className="flex items-end gap-1">
      <label className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className={FIELD_LABEL_CLASS}>Sala o recinto</span>
        <select
          value={active.id}
          onChange={(e) => {
            const next = locations.find((loc) => loc.id === Number(e.target.value));
            if (next) onSelect(next);
          }}
          className={FORM_CONTROL_CLASS}
        >
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.code ? `${loc.code} · ${loc.nombre}` : loc.nombre}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        onClick={() => onEdit(active)}
        className={ICON_BUTTON_CLASS}
        title="Editar ubicación"
        aria-label={`Editar ${active.nombre}`}
      >
        <Edit2 aria-hidden="true" className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onDelete(active)}
        className={ICON_BUTTON_CLASS}
        title="Eliminar ubicación"
        aria-label={`Eliminar ${active.nombre}`}
      >
        <Trash2 aria-hidden="true" className="h-3.5 w-3.5 text-danger" />
      </button>
    </div>
  );
}
