import { useState } from 'react';
import type { Supplier } from '@sgia/types';
import {
  Building2,
  Check,
  Edit,
  Mail,
  MoreHorizontal,
  Pause,
  Phone,
  Search,
  Tag,
  Trash2,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface ProveedoresTableProps {
  suppliers: Supplier[];
  search?: string;
  onSearchChange?: (value: string) => void;
  categoryFilter?: string;
  onCategoryFilterChange?: (value: string) => void;
  isFetching?: boolean;
  isLoading?: boolean;
  onEdit: (supplier: Supplier) => void;
  onToggleStatus: (supplier: Supplier) => void;
  onDelete?: (supplier: Supplier) => void;
  onSelect?: (supplier: Supplier) => void;
}

const thClasses =
  'px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-muted';
const tdClasses =
  'px-3 py-2.5 text-sm text-text whitespace-nowrap';

export function ProveedoresTable({
  suppliers,
  search = '',
  onSearchChange,
  categoryFilter = '',
  onCategoryFilterChange,
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

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search aria-hidden="true" className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar proveedor por nombre, contacto o correo…"
            value={internalSearch}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full h-8 rounded-md border border-border bg-background pl-8 pr-3 text-xs text-text placeholder:text-text-muted focus:border-text-muted focus:outline-none focus:ring-1 focus:ring-info"
          />
        </div>

        {categories.length > 0 && (
          <select
            aria-label="Filtrar por categoría"
            value={categoryFilter}
            onChange={(e) => onCategoryFilterChange?.(e.target.value)}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs text-text focus:border-text-muted focus:outline-none focus:ring-1 focus:ring-info"
          >
            <option value="">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        )}

        {isFetching && (
          <span className="text-xs text-text-muted font-mono animate-pulse">
            Buscando…
          </span>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-surface overflow-hidden">
        {isLoading ? (
          <div
            className="flex items-center justify-center py-12 text-xs text-text-muted font-mono"
            role="progressbar"
            aria-label="Cargando proveedores"
          >
            Cargando catálogo de proveedores…
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className={thClasses}>Empresa</th>
                <th className={thClasses}>Contacto</th>
                <th className={thClasses}>Correo</th>
                <th className={thClasses}>Teléfono</th>
                <th className={thClasses}>Categoría</th>
                <th className={thClasses}>Estado</th>
                <th className={`${thClasses} text-right`}>Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {suppliers.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-xs text-text-muted"
                  >
                    No se encontraron proveedores registrados.
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier) => (
                  <tr
                    key={supplier.id}
                    className="hover:bg-surface-raised transition-colors"
                  >
                    <td className={tdClasses}>
                      <div className="flex items-center gap-2">
                        <Building2 aria-hidden="true" className="h-3.5 w-3.5 text-text-muted shrink-0" />
                        <span className="font-medium text-text">
                          {supplier.name}
                        </span>
                      </div>
                    </td>
                    <td className={tdClasses}>
                      <span className="text-xs text-text-muted">
                        {supplier.contact_name || '—'}
                      </span>
                    </td>
                    <td className={tdClasses}>
                      <span className="inline-flex items-center gap-1 font-mono text-xs text-text-muted">
                        <Mail aria-hidden="true" className="h-3 w-3" />
                        {supplier.email}
                      </span>
                    </td>
                    <td className={tdClasses}>
                      <span className="inline-flex items-center gap-1 font-mono text-xs text-text-muted">
                        <Phone aria-hidden="true" className="h-3 w-3" />
                        {supplier.phone || '—'}
                      </span>
                    </td>
                    <td className={tdClasses}>
                      {supplier.category ? (
                        <Badge tone="neutral" icon={<Tag aria-hidden="true" className="h-3 w-3" />}>
                          {supplier.category}
                        </Badge>
                      ) : (
                        <span className="text-xs text-text-muted">—</span>
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
                          onClick={() => onEdit(supplier)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:text-text hover:bg-surface-raised transition-colors"
                        >
                          <Edit aria-hidden="true" className="h-3.5 w-3.5" />
                        </button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              title="Más acciones"
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:text-text hover:bg-surface-raised transition-colors"
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
                                  className="text-danger"
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
      </div>
    </div>
  );
}
