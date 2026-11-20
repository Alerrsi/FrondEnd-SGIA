import { useState } from 'react';
import { SUPPLIER_AREAS, SUPPLIER_AREA_LABELS, type Supplier, type SupplierArea } from '@sgia/types';
import { Building2, Check, Edit, Mail, MoreHorizontal, Pause, Phone, Tag, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SupplierAreaBadges } from '@/features/proveedores/components/supplier-area-badges';
import { FILTER_CONTROL_CLASS } from '@/components/ui/form-control';
import { MobileRow } from '@/components/ui/mobile-row';
import { SkeletonList } from '@/components/ui/skeleton-list';
import { TableFrame } from '@/components/ui/table-frame';
import { TableSearch } from '@/components/ui/table-search';
import {
  ICON_BUTTON_CLASS,
  ROW_CLASS,
  STICKY_COL_CLASS,
  TD_CLASS,
  TH_CLASS,
} from '@/components/ui/table-styles';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { STATE_TEXT_CLASS, TABLE_HEAD_CLASS } from '@/components/ui/typography';

export interface ProveedoresTableProps {
  suppliers: Supplier[];
  search?: string;
  onSearchChange?: (value: string) => void;
  categoryFilter?: string;
  onCategoryFilterChange?: (value: string) => void;
  areaFilter?: SupplierArea | '';
  onAreaFilterChange?: (value: SupplierArea | '') => void;
  isFetching?: boolean;
  isLoading?: boolean;
  onEdit: (supplier: Supplier) => void;
  onToggleStatus: (supplier: Supplier) => void;
  onDelete?: (supplier: Supplier) => void;
  onSelect?: (supplier: Supplier) => void;
}

const thClasses = TH_CLASS;
const tdClasses = `${TD_CLASS} whitespace-nowrap`;

export function ProveedoresTable({
  suppliers,
  search = '',
  onSearchChange,
  categoryFilter = '',
  onCategoryFilterChange,
  areaFilter = '',
  onAreaFilterChange,
  isFetching,
  isLoading,
  onEdit,
  onToggleStatus,
  onDelete,
}: ProveedoresTableProps) {
  const [internalSearch, setInternalSearch] = useState(search);

  const handleSearch = (value: string) => {
    setInternalSearch(value);
    onSearchChange?.(value);
  };

  const categories = [...new Set(suppliers.map((s) => s.category).filter(Boolean))] as string[];

  const toolbar = (
    <TableToolbar>
      <TableSearch
        value={internalSearch}
        onChange={handleSearch}
        placeholder="Buscar proveedor por nombre, contacto o correo…"
      />
      {onAreaFilterChange && (
        <select
          aria-label="Filtrar por área"
          value={areaFilter}
          onChange={(e) => onAreaFilterChange(e.target.value as SupplierArea | '')}
          className={FILTER_CONTROL_CLASS}
        >
          <option value="">Todas las áreas</option>
          {SUPPLIER_AREAS.map((area) => (
            <option key={area} value={area}>
              {SUPPLIER_AREA_LABELS[area]}
            </option>
          ))}
        </select>
      )}
      {categories.length > 0 && (
        <select
          aria-label="Filtrar por categoría"
          value={categoryFilter}
          onChange={(e) => onCategoryFilterChange?.(e.target.value)}
          className={FILTER_CONTROL_CLASS}
        >
          <option value="">Todas las categorías</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      )}
      {isFetching && <span className="text-[13px] text-zinc-500 dark:text-zinc-400">Buscando…</span>}
    </TableToolbar>
  );

  const mobile =
    !isLoading && suppliers.length > 0 ? (
      <ul>
        {suppliers.map((supplier) => (
          <MobileRow
            key={supplier.id}
            title={supplier.name}
            meta={supplier.contact_name ? `${supplier.contact_name} · ${supplier.email}` : supplier.email}
            trailing={
              <Badge tone={supplier.is_active !== false ? 'success' : 'neutral'} dot>
                {supplier.is_active !== false ? 'activo' : 'suspendido'}
              </Badge>
            }
            onClick={() => onEdit(supplier)}
          />
        ))}
      </ul>
    ) : undefined;

  return (
    <TableFrame toolbar={toolbar} mobile={mobile}>
        {isLoading ? (
          <SkeletonList label="Cargando catálogo de proveedores…" columns={4} />
        ) : (
          <table className="w-full min-w-[960px]">
            <thead className={TABLE_HEAD_CLASS}>
              <tr>
                <th className={`${thClasses} ${STICKY_COL_CLASS} max-md:bg-zinc-50`}>Empresa</th>
                <th className={thClasses}>Contacto</th>
                <th className={thClasses}>Correo</th>
                <th className={thClasses}>Teléfono</th>
                <th className={thClasses}>Áreas</th>
                <th className={thClasses}>Categoría</th>
                <th className={thClasses}>Estado</th>
                <th className={`${thClasses} text-right`}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className={`py-12 ${STATE_TEXT_CLASS}`}
                  >
                    No se encontraron proveedores registrados.
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier) => (
                  <tr key={supplier.id} className={ROW_CLASS}>
                    <td className={`${tdClasses} ${STICKY_COL_CLASS}`}>
                      <div className="flex items-center gap-2">
                        <Building2 aria-hidden="true" className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {supplier.name}
                        </span>
                      </div>
                    </td>
                    <td className={tdClasses}>
                      <span className="text-[13px] text-zinc-600 dark:text-zinc-400">
                        {supplier.contact_name || '—'}
                      </span>
                    </td>
                    <td className={tdClasses}>
                      <span className="inline-flex items-center gap-1 text-[13px] text-zinc-600 dark:text-zinc-400">
                        <Mail aria-hidden="true" className="h-3 w-3" />
                        {supplier.email}
                      </span>
                    </td>
                    <td className={tdClasses}>
                      <span className="inline-flex items-center gap-1 font-mono text-[13px] text-zinc-500 dark:text-zinc-400">
                        <Phone aria-hidden="true" className="h-3 w-3" />
                        {supplier.phone || '—'}
                      </span>
                    </td>
                    <td className={tdClasses}>
                      <SupplierAreaBadges areas={supplier.areas ?? []} />
                    </td>
                    <td className={tdClasses}>
                      {supplier.category ? (
                        <Badge tone="neutral" icon={<Tag aria-hidden="true" className="h-3 w-3" />}>
                          {supplier.category}
                        </Badge>
                      ) : (
                        <span className="text-[13px] text-zinc-400">—</span>
                      )}
                    </td>
                    <td className={tdClasses}>
                      <Badge
                        tone={supplier.is_active !== false ? 'success' : 'neutral'}
                        dot
                      >
                        {supplier.is_active !== false ? 'activo' : 'suspendido'}
                      </Badge>
                    </td>
                    <td className={`${tdClasses} text-right`}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          title="Editar proveedor"
                          aria-label={`Editar ${supplier.name}`}
                          onClick={() => onEdit(supplier)}
                          className={ICON_BUTTON_CLASS}
                        >
                          <Edit aria-hidden="true" className="h-3.5 w-3.5" />
                        </button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              title="Más acciones"
                              aria-label={`Más acciones para ${supplier.name}`}
                              className={ICON_BUTTON_CLASS}
                            >
                              <MoreHorizontal aria-hidden="true" className="h-3.5 w-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onToggleStatus(supplier)}>
                              {supplier.is_active !== false ? (
                                <>
                                  <Pause aria-hidden="true" className="h-3.5 w-3.5 mr-2" />
                                  Suspender proveedor
                                </>
                              ) : (
                                <>
                                  <Check aria-hidden="true" className="h-3.5 w-3.5 mr-2" />
                                  Activar proveedor
                                </>
                              )}
                            </DropdownMenuItem>
                            {onDelete && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => onDelete(supplier)}
                                  className="text-danger focus:text-danger hover:text-danger"
                                >
                                  <Trash2 aria-hidden="true" className="h-3.5 w-3.5 mr-2" />
                                  Eliminar proveedor
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
    </TableFrame>
  );
}
