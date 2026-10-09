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
  'px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500';
const tdClasses =
  'px-3 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 whitespace-nowrap';

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
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar proveedor por nombre, contacto o correo…"
            value={internalSearch}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full h-8 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 pl-8 pr-3 text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
          />
        </div>

        {categories.length > 0 && (
          <select
            aria-label="Filtrar por categoría"
            value={categoryFilter}
            onChange={(e) => onCategoryFilterChange?.(e.target.value)}
            className="h-8 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-2 text-xs text-zinc-700 dark:text-zinc-300 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
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
          <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono animate-pulse">
            Buscando…
          </span>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        {isLoading ? (
          <div
            className="flex items-center justify-center py-12 text-xs text-zinc-400 dark:text-zinc-500 font-mono"
            role="progressbar"
            aria-label="Cargando proveedores"
          >
            Cargando catálogo de proveedores…
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                <th className={thClasses}>Empresa</th>
                <th className={thClasses}>Contacto</th>
                <th className={thClasses}>Correo</th>
                <th className={thClasses}>Teléfono</th>
                <th className={thClasses}>Categoría</th>
                <th className={thClasses}>Estado</th>
                <th className={`${thClasses} text-right`}>Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {suppliers.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-xs text-zinc-400 dark:text-zinc-500"
                  >
                    No se encontraron proveedores registrados.
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier) => (
                  <tr
                    key={supplier.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className={tdClasses}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {supplier.name}
                        </span>
                      </div>
                    </td>
                    <td className={tdClasses}>
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">
                        {supplier.contact_name || '—'}
                      </span>
                    </td>
                    <td className={tdClasses}>
                      <span className="inline-flex items-center gap-1 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                        <Mail className="h-3 w-3" />
                        {supplier.email}
                      </span>
                    </td>
                    <td className={tdClasses}>
                      <span className="inline-flex items-center gap-1 font-mono text-xs text-zinc-500">
                        <Phone className="h-3 w-3" />
                        {supplier.phone || '—'}
                      </span>
                    </td>
                    <td className={tdClasses}>
                      {supplier.category ? (
                        <Badge tone="neutral" icon={<Tag className="h-3 w-3" />}>
                          {supplier.category}
                        </Badge>
                      ) : (
                        <span className="text-xs text-zinc-400">—</span>
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
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              title="Más acciones"
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onToggleStatus(supplier)}>
                              {supplier.is_active !== false ? (
                                <>
                                  <Pause className="h-3.5 w-3.5 mr-2" />
                                  Suspender proveedor
                                </>
                              ) : (
                                <>
                                  <Check className="h-3.5 w-3.5 mr-2" />
                                  Activar proveedor
                                </>
                              )}
                            </DropdownMenuItem>
                            {onDelete && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => onDelete(supplier)}
                                  className="text-red-600 dark:text-red-400"
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-2" />
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
