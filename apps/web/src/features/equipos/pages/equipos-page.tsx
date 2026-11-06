import { useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Cpu,
  Download,
  Edit,
  ExternalLink,
  FileText,
  MapPin,
  MoreHorizontal,
  RefreshCw,
  Search,
} from 'lucide-react';
import type { Equipo, EquipmentStatus } from '@sgia/types';
import { useDownloadTechnicalSheet, useEquipos } from '@sgia/api-client';

import { Badge, type Tone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/features/auth/context/auth-context';
import { toast } from '@/lib/toast';

import { EquipmentMetricsStrip } from '../components/equipment-metrics-strip';
import { EquipmentSpecSheet } from '../components/equipment-spec-sheet';
import { EditSpecsDialog } from '../components/edit-specs-dialog';
import { calculateEquipmentLifeCycle } from '../utils/lifecycle';
import { downloadBlob } from '../utils/download';

export default function EquiposPage() {
  const { user } = useAuth();
  const canEdit = user?.rol === 'DIR-01' || user?.rol === 'AD-01';

  const { id: paramId } = useParams<{ id?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const directId = paramId || searchParams.get('id');

  const { data: rawEquipos, isLoading, isError, refetch } = useEquipos();
  const downloadSheetMutation = useDownloadTechnicalSheet();

  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [categoryFilter, setCategoryFilter] = useState<string>('todos');

  // Sheet y Dialog State
  const [selectedEquipo, setSelectedEquipo] = useState<Equipo | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [equipoToEdit, setEquipoToEdit] = useState<Equipo | null>(null);

  const equipos = useMemo(() => {
    return Array.isArray(rawEquipos) ? rawEquipos : [];
  }, [rawEquipos]);

  // Si hay un param ?id= o :id en la URL, auto-seleccionar el equipo correspondiente
  useMemo(() => {
    if (directId && equipos.length > 0 && !selectedEquipo) {
      const match = equipos.find((e) => String(e.id) === directId);
      if (match) {
        setSelectedEquipo(match);
        setIsSheetOpen(true);
      }
    }
  }, [directId, equipos, selectedEquipo]);

  // Extraer categorías únicas para el filtro
  const categories = useMemo(() => {
    const set = new Set<string>();
    equipos.forEach((e) => {
      if (e.categoria) set.add(e.categoria);
    });
    return Array.from(set);
  }, [equipos]);

  // Filtrado de datos
  const filteredData = useMemo(() => {
    return equipos.filter((item) => {
      const itemStatus = (item.estado ?? item.status ?? 'operativo').toLowerCase();
      if (statusFilter !== 'todos' && itemStatus !== statusFilter) {
        return false;
      }
      if (categoryFilter !== 'todos' && item.categoria !== categoryFilter) {
        return false;
      }
      if (globalFilter.trim()) {
        const query = globalFilter.toLowerCase();
        const code = (item.codigo ?? item.sku ?? '').toLowerCase();
        const name = item.nombre.toLowerCase();
        const brand = (item.marca ?? '').toLowerCase();
        const model = (item.modelo ?? '').toLowerCase();
        const location = (item.ubicacion ?? '').toLowerCase();
        return (
          code.includes(query) ||
          name.includes(query) ||
          brand.includes(query) ||
          model.includes(query) ||
          location.includes(query)
        );
      }
      return true;
    });
  }, [equipos, statusFilter, categoryFilter, globalFilter]);

  const handleOpenSheet = (equipo: Equipo) => {
    setSelectedEquipo(equipo);
    setIsSheetOpen(true);
    setSearchParams({ id: String(equipo.id) });
  };

  const handleCloseSheet = () => {
    setIsSheetOpen(false);
    setSelectedEquipo(null);
    setSearchParams({});
  };

  const handleOpenEdit = (equipo: Equipo) => {
    setEquipoToEdit(equipo);
    setIsEditDialogOpen(true);
  };

  const handleQuickDownloadPdf = async (equipo: Equipo) => {
    try {
      const blob = await downloadSheetMutation.mutateAsync(equipo.id);
      const filename = `ficha-tecnica-${equipo.codigo || `eq-${equipo.id}`}.pdf`;
      downloadBlob(blob, filename);
      toast.success('Ficha técnica descargada');
    } catch {
      toast.error('Error al descargar la ficha técnica');
    }
  };

  const columns = useMemo<ColumnDef<Equipo>[]>(
    () => [
      {
        accessorKey: 'codigo',
        header: 'Serial / Rotulado',
        cell: ({ row }) => {
          const item = row.original;
          const code = item.codigo || item.sku || `EQ-${item.id.toString().padStart(4, '0')}`;
          return (
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs px-2 py-0.5 rounded border border-border bg-surface-raised text-text font-semibold tracking-wide">
                {code}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'nombre',
        header: 'Equipo / Dispositivo',
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex flex-col">
              <span className="font-semibold text-xs text-text leading-tight">
                {item.nombre}
              </span>
              {(item.marca || item.modelo) && (
                <span className="text-xs text-text-muted font-mono">
                  {[item.marca, item.modelo].filter(Boolean).join(' · ')}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'categoria',
        header: 'Categoría y Ubicación',
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex flex-col gap-0.5">
              {item.categoria ? (
                <span className="text-xs text-text">
                  {item.categoria}
                </span>
              ) : (
                <span className="text-xs text-text-muted">Sin categoría</span>
              )}
              {item.ubicacion && (
                <span className="flex items-center gap-1 font-mono text-xs text-text-muted">
                  <MapPin aria-hidden="true" className="h-2.5 w-2.5 shrink-0" />
                  <span className="truncate max-w-[130px]">{item.ubicacion}</span>
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: 'estado',
        header: 'Estado Operativo',
        cell: ({ row }) => {
          const item = row.original;
          const raw = (item.estado ?? item.status ?? 'operativo') as EquipmentStatus;
          const toneMap: Record<EquipmentStatus, Tone> = {
            operativo: 'available',
            en_mantencion: 'maintenance',
            critico: 'critical',
            baja: 'retired',
            en_prestamo: 'loaned',
          };
          const labelMap: Record<EquipmentStatus, string> = {
            operativo: 'Operativo',
            en_mantencion: 'En Mantención',
            critico: 'Falla Crítica',
            baja: 'De Baja',
            en_prestamo: 'En Préstamo',
          };
          return (
            <Badge tone={toneMap[raw] || 'neutral'} dot>
              {labelMap[raw] || raw}
            </Badge>
          );
        },
      },
      {
        id: 'vida_util',
        header: 'Ciclo de Vida Útil',
        cell: ({ row }) => {
          const item = row.original;
          const pDate = item.purchase_date ?? item.specs?.purchase_date;
          const lYears = item.lifespan_years ?? item.specs?.lifespan_years;
          const { percentUsed, remainingYears, statusTone } =
            calculateEquipmentLifeCycle(pDate, lYears);

          return (
            <div className="flex flex-col gap-1 w-32">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-text-muted">
                  {remainingYears}a rest.
                </span>
                <span className="font-mono font-bold text-text">
                  {percentUsed}%
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-surface-raised overflow-hidden">
                <div
                  className={`h-full rounded-full transition-[width] ${
                    statusTone === 'critical'
                      ? 'bg-danger-bg0'
                      : statusTone === 'warning'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                  }`}
                  style={{ width: `${percentUsed}%` }}
                />
              </div>
            </div>
          );
        },
      },
      {
        id: 'manual',
        header: 'Manual',
        cell: ({ row }) => {
          const item = row.original;
          const manualUrl = item.user_manual_url ?? item.specs?.user_manual_url;
          if (!manualUrl) {
            return (
              <span className="text-xs text-text-muted italic">
                Pendiente
              </span>
            );
          }
          return (
            <a
              href={manualUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Abrir manual en AWS S3"
              className="inline-flex items-center gap-1 font-mono text-xs text-text-muted hover:text-danger hover:underline"
            >
              <FileText aria-hidden="true" className="h-3 w-3 text-danger" />
              <span>PDF S3</span>
              <ExternalLink aria-hidden="true" className="h-2.5 w-2.5" />
            </a>
          );
        },
      },
      {
        id: 'acciones',
        header: 'Acciones',
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-center justify-end gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenSheet(item)}
                className="h-7 px-2 text-xs font-medium"
                aria-label={`Ver ficha de ${item.nombre}`}
              >
                Ver Ficha
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-text-muted hover:text-text"
                    aria-label={`Opciones para ${item.nombre}`}
                  >
                    <MoreHorizontal aria-hidden="true" className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleOpenSheet(item)}>
                    <Cpu aria-hidden="true" className="h-3.5 w-3.5 text-text-muted" />
                    <span>Ver Ficha y Ciclo de Vida</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleQuickDownloadPdf(item)}>
                    <Download aria-hidden="true" className="h-3.5 w-3.5 text-text-muted" />
                    <span>Descargar Ficha Técnica (PDF)</span>
                  </DropdownMenuItem>
                  {canEdit && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleOpenEdit(item)}>
                        <Edit aria-hidden="true" className="h-3.5 w-3.5 text-text-muted" />
                        <span>Editar Especificaciones</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [canEdit, downloadSheetMutation],
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 15,
      },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Cabecera de Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text">
              Fichas Técnicas de Equipos
            </h1>
            <Badge tone="neutral" mono>
              FU-05 · REQ-12
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Gestión de especificaciones de hardware, ciclo de vida útil y manuales de activos críticos (INACAP Sede Temuco).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="h-8 gap-1.5 text-xs"
            aria-label="Actualizar catálogo de equipos"
          >
            <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
            <span>Actualizar</span>
          </Button>
        </div>
      </div>

      {/* Cinta Métrica Compacta (Metric Strip) */}
      <EquipmentMetricsStrip equipos={equipos} />

      {/* Contenedor Unificado: Toolbar + TanStack Table */}
      <div className="rounded-lg border border-border bg-surface shadow-xs overflow-hidden">
        {/* Toolbar Unificado */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-border p-3 sm:px-4 bg-background">
          <div className="flex flex-1 items-center gap-2.5">
            <div className="relative flex-1 sm:max-w-xs">
              <Search aria-hidden="true" className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-text-muted" />
              <input
                type="text"
                placeholder="Buscar por serial, modelo, marca o ubicación…"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="w-full rounded-md border border-border bg-surface pl-8 pr-3 py-1.5 text-xs text-text placeholder:text-text-muted focus:border-text-muted focus:outline-none focus:ring-1 focus:ring-info"
                aria-label="Buscar equipos"
              />
            </div>

            {/* Filtro por Categoría */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-text focus:border-text-muted focus:outline-none"
              aria-label="Filtrar por categoría"
            >
              <option value="todos">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Filtro por Estado */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-text focus:border-text-muted focus:outline-none"
              aria-label="Filtrar por estado operativo"
            >
              <option value="todos">Todos los estados</option>
              <option value="operativo">Operativo</option>
              <option value="en_mantencion">En Mantención</option>
              <option value="critico">Falla Crítica</option>
              <option value="en_prestamo">En Préstamo</option>
              <option value="baja">De Baja</option>
            </select>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 text-xs text-text-muted">
            <span className="font-mono tabular-nums">
              {filteredData.length} {filteredData.length === 1 ? 'equipo' : 'equipos'}
            </span>
          </div>
        </div>

        {/* Tabla de Alta Densidad */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="border-b border-border bg-background"
                >
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-text-muted select-none"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border/70">
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length} className="py-12 text-center text-text-muted">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw aria-hidden="true" className="h-5 w-5 animate-spin text-text-muted" />
                      <span>Cargando catálogo de equipamiento técnico…</span>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={columns.length} className="py-12 text-center text-danger">
                    Error al cargar los equipos. Por favor, reintenta más tarde.
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-12 text-center text-text-muted">
                    No se encontraron equipos que coincidan con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-surface-raised transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación Compacta */}
        {table.getPageCount() > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border text-xs">
            <span className="text-text-muted">
              Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="h-7 text-xs"
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="h-7 text-xs"
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Drawer Lateral para Inspección de Ficha y Ciclo de Vida */}
      <EquipmentSpecSheet
        open={isSheetOpen}
        onClose={handleCloseSheet}
        equipo={selectedEquipo}
        canEdit={canEdit}
        onOpenEdit={(eq) => handleOpenEdit(eq)}
      />

      {/* Modal para Edición de Especificaciones Técnicas */}
      <EditSpecsDialog
        open={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEquipoToEdit(null);
        }}
        equipo={equipoToEdit}
      />
    </div>
  );
}
