import { Building2, Edit2, Plus, Trash2 } from 'lucide-react';
import type { LocationEntity } from '@sgia/types';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { FILTER_CONTROL_CLASS } from '@/components/ui/form-control';
import { SectionTitle } from '@/components/ui/section-title';
import { SkeletonList } from '@/components/ui/skeleton-list';
import { ICON_BUTTON_CLASS } from '@/components/ui/table-styles';
import { TableSearch } from '@/components/ui/table-search';
import { CODE_CHIP_CLASS } from '@/components/ui/typography';
import { cn } from '@/lib/cn';
import { locationTipoLabel } from '../lib/location-tipo';

export interface SalasListProps {
  locations: LocationEntity[];
  isLoading: boolean;
  activeId: number | null;
  onSelect: (location: LocationEntity) => void;
  onEdit: (location: LocationEntity) => void;
  onDelete: (location: LocationEntity) => void;
  onCreate: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  tipo: string;
  onTipoChange: (value: string) => void;
}

/**
 * Columna de salas de Ubicaciones (docs/ubicaciones-distribucion.md): una línea por sala con su código y nombre.
 * Tipo y descripción van en el `title` y para el lector de pantalla; editar y eliminar aparecen al pasar el mouse,
 * con foco dentro de la fila, en la sala elegida y siempre en pantallas táctiles (ocultos no ocupan sitio).
 */
export function SalasList({
  locations,
  isLoading,
  activeId,
  onSelect,
  onEdit,
  onDelete,
  onCreate,
  search,
  onSearchChange,
  tipo,
  onTipoChange,
}: SalasListProps) {
  return (
    <section aria-label="Salas y recintos" className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-200 px-3 py-2.5 dark:border-zinc-800">
        <SectionTitle as="h2" icon={Building2}>
          Salas y recintos
        </SectionTitle>
        <span className="font-mono text-[13px] text-zinc-500 dark:text-zinc-400">{locations.length}</span>
      </div>
      <div className="flex flex-col gap-2 border-b border-zinc-200 p-2 dark:border-zinc-800">
        <TableSearch
          value={search}
          onChange={onSearchChange}
          placeholder="Buscar sala…"
          label="Buscar por nombre o descripción"
          className="w-full sm:min-w-0!"
        />
        <select
          value={tipo}
          onChange={(e) => onTipoChange(e.target.value)}
          aria-label="Filtrar por tipo"
          className={cn(FILTER_CONTROL_CLASS, 'w-full')}
        >
          <option value="">Todos los tipos</option>
          <option value="sala">Salas</option>
          <option value="panol">Pañoles</option>
          <option value="taller">Talleres</option>
          <option value="bodega">Bodegas</option>
        </select>
      </div>

      {isLoading ? (
        <SkeletonList label="Cargando ubicaciones…" rows={5} columns={1} />
      ) : locations.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No se encontraron salas o ubicaciones registradas."
          action={
            <Button type="button" variant="secondary" size="sm" onClick={onCreate}>
              <Plus aria-hidden="true" className="h-3.5 w-3.5" />
              Nueva sala / pañol
            </Button>
          }
        />
      ) : (
        <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {locations.map((loc) => {
            const isSelected = activeId === loc.id;
            const detail = [locationTipoLabel(loc.tipo), loc.descripcion].filter(Boolean).join(' · ');
            return (
              <li
                key={loc.id}
                onClick={() => onSelect(loc)}
                onKeyDown={(e) => {
                  if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onSelect(loc);
                  }
                }}
                tabIndex={0}
                title={detail || undefined}
                aria-current={isSelected ? 'true' : undefined}
                className={cn(
                  'group relative flex cursor-pointer items-center gap-1 border-b border-zinc-200 py-1.5 pl-3 pr-1.5 transition-colors duration-150 last:border-b-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent dark:border-zinc-800 pointer-coarse:py-1',
                  isSelected
                    ? 'bg-accent-soft before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-accent'
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40',
                )}
              >
                <div className="flex min-w-0 flex-1 items-center gap-1.5">
                  {loc.code && <span className={`${CODE_CHIP_CLASS} shrink-0`}>{loc.code}</span>}
                  <span className="truncate text-sm text-zinc-900 dark:text-zinc-100">{loc.nombre}</span>
                  {detail && <span className="sr-only">, {detail}</span>}
                </div>
                {/* Ocultas no ocupan sitio, así el nombre usa todo el ancho; `focus-within` las muestra al tabular. */}
                <div
                  className={cn(
                    'shrink-0 items-center group-hover:flex group-focus-within:flex pointer-coarse:flex',
                    isSelected ? 'flex' : 'hidden',
                  )}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(loc);
                    }}
                    className={ICON_BUTTON_CLASS}
                    title="Editar ubicación"
                    aria-label={`Editar ${loc.nombre}`}
                  >
                    <Edit2 aria-hidden="true" className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(loc);
                    }}
                    className={ICON_BUTTON_CLASS}
                    title="Eliminar ubicación"
                    aria-label={`Eliminar ${loc.nombre}`}
                  >
                    <Trash2 aria-hidden="true" className="h-3.5 w-3.5 text-danger" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
