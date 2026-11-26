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
} from 'lucide-react';
import type { Equipo } from '@sgia/types';
import { productEstadoForEquipmentStatus, useDownloadTechnicalSheet, useEquipos, type ReportParams } from '@sgia/api-client';

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
import { EquipoStatusBadge } from '../components/equipo-status-badge';
import { EquipmentSpecSheet } from '../components/equipment-spec-sheet';
import { EditSpecsDialog } from '../components/edit-specs-dialog';
import { calculateEquipmentLifeCycle } from '../utils/lifecycle';
import { downloadBlob } from '../utils/download';
import { ErrorState } from '@/components/ui/error-state';
import { FILTER_CONTROL_CLASS } from '@/components/ui/form-control';
import { MobileRow } from '@/components/ui/mobile-row';
import { PageHeader } from '@/components/ui/page-header';
import { ExportExcelButton } from '@/components/shared/export-excel-button';
import { SkeletonRows } from '@/components/ui/skeleton-rows';
import { TableFrame } from '@/components/ui/table-frame';
import { TableSearch } from '@/components/ui/table-search';
import { ICON_BUTTON_CLASS, ROW_CLASS, STICKY_COL_CLASS, TD_CLASS, TH_CLASS } from '@/components/ui/table-styles';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { CODE_CHIP_CLASS, STATE_TEXT_CLASS, TABLE_HEAD_CLASS } from '@/components/ui/typography';
import { cn } from '@/lib/cn';

const SPECS_API_READY = false;

const equipoCode = (item: Equipo) => item.codigo || item.sku || `EQ-${item.id.toString().padStart(4, '0')}`;

export default function EquiposPage() {
  const { user } = useAuth();
  // shortcut: `PUT /api/equipment/{id}/specs` sigue pendiente en el backend (ENDPOINTS.md);
  // reactivar la edición cuando exista.
  const canEdit = SPECS_API_READY && user?.rol === 'DIR-01';

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

  // Filtros de la pantalla con los nombres de `/products/export` (docs/centro-reportes.md, decisión 14). La
  // categoría se elige por nombre: se envía el `oracle_category_id` de un equipo de esa categoría. «Falla
  // crítica» no tiene equivalente en el servidor y no filtra el Excel.
  const exportParams = useMemo<ReportParams>(() => {
    const categoryId =
      categoryFilter === 'todos' ? undefined : equipos.find((e) => e.categoria === categoryFilter)?.categoriaId;
    return {
      search: globalFilter.trim() || undefined,
      oracle_category_id: categoryId,
      estado: statusFilter === 'todos' ? undefined : productEstadoForEquipmentStatus(statusFilter),
    };
  }, [equipos, categoryFilter, globalFilter, statusFilter]);

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
          const code = equipoCode(item);
          return (
            <div className="flex items-center gap-1.5">
              <span className={CODE_CHIP_CLASS}>
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
              <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100 leading-tight">
                {item.nombre}
              </span>
              {(item.marca || item.modelo) && (
                <span className="text-[13px] text-zinc-500 dark:text-zinc-400">
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
                <span className="text-[13px] text-zinc-700 dark:text-zinc-300">
                  {item.categoria}
                </span>
              ) : (
                <span className="text-[13px] text-zinc-400">Sin categoría</span>
              )}
              {item.ubicacion && (
                <span className="flex items-center gap-1 font-mono text-[13px] text-zinc-500 dark:text-zinc-400">
                  <MapPin aria-hidden="true" className="h-3 w-3 shrink-0" />
                  <span className="max-w-40 truncate">{item.ubicacion}</span>
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
          return <EquipoStatusBadge equipo={item} />;
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
                <span className="font-mono text-zinc-500 dark:text-zinc-400">
                  {remainingYears}a rest.
                </span>
                <span className="font-mono font-medium text-zinc-700 dark:text-zinc-300">
                  {percentUsed}%
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-zinc-200/70 dark:bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    statusTone === 'critical'
                      ? 'bg-danger'
                      : statusTone === 'warning'
                        ? 'bg-warn'
                        : 'bg-ok'
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
              <span className="text-[13px] text-zinc-500 dark:text-zinc-400">
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
              className="inline-flex items-center gap-1 whitespace-nowrap text-[13px] text-accent hover:underline"
            >
              <FileText aria-hidden="true" className="h-3.5 w-3.5" />
              <span>PDF S3</span>
              <ExternalLink aria-hidden="true" className="h-3 w-3" />
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
                aria-label={`Ver ficha de ${item.nombre}`}
              >
                Ver ficha
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={ICON_BUTTON_CLASS}
                    aria-label={`Opciones para ${item.nombre}`}
                  >
                    <MoreHorizontal aria-hidden="true" className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleOpenSheet(item)}>
                    <Cpu aria-hidden="true" className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Ver ficha y ciclo de vida</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleQuickDownloadPdf(item)}>
                    <Download aria-hidden="true" className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Descargar ficha técnica (PDF)</span>
                  </DropdownMenuItem>
                  {canEdit && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleOpenEdit(item)}>
                        <Edit aria-hidden="true" className="h-3.5 w-3.5 text-zinc-400" />
                        <span>Editar especificaciones</span>
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

  const toolbar = (
    <TableToolbar>
      <TableSearch
        value={globalFilter}
        onChange={setGlobalFilter}
        placeholder="Buscar por serial, modelo, marca o ubicación…"
        label="Buscar equipos"
      />
      <select
        value={categoryFilter}
        onChange={(e) => setCategoryFilter(e.target.value)}
        className={FILTER_CONTROL_CLASS}
        aria-label="Filtrar por categoría"
      >
        <option value="todos">Todas las categorías</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className={FILTER_CONTROL_CLASS}
        aria-label="Filtrar por estado operativo"
      >
        <option value="todos">Todos los estados</option>
        <option value="operativo">Operativo</option>
        <option value="en_mantencion">En mantención</option>
        <option value="critico">Falla crítica</option>
        <option value="en_prestamo">En préstamo</option>
        <option value="baja">De baja</option>
      </select>
      <span className="font-mono text-[13px] text-zinc-500 dark:text-zinc-400 sm:ml-auto">
        {filteredData.length} {filteredData.length === 1 ? 'equipo' : 'equipos'}
      </span>
    </TableToolbar>
  );

  const pageRows = table.getRowModel().rows;

  const footer =
    table.getPageCount() > 1 ? (
      <>
        <span>
          Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
        </span>
        <div className="flex items-center gap-1.5">
          <Button variant="secondary" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Anterior
          </Button>
          <Button variant="secondary" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Siguiente
          </Button>
        </div>
      </>
    ) : undefined;

  const mobile =
    !isLoading && !isError && pageRows.length > 0 ? (
      <ul>
        {pageRows.map((row) => (
          <MobileRow
            key={row.id}
            title={row.original.nombre}
            meta={<span className="font-code">{equipoCode(row.original)}</span>}
            trailing={<EquipoStatusBadge equipo={row.original} />}
            onClick={() => handleOpenSheet(row.original)}
          />
        ))}
      </ul>
    ) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={Cpu}
        title="Fichas técnicas de equipos"
        description="Especificaciones, ciclo de vida útil y manuales de los equipos del pañol."
        actions={
          <>
            {/* Productos `equipo` con sus hojas «Productos» y «Unidades», con los filtros de la pantalla. */}
            <ExportExcelButton path="/products/export?type=equipo" params={exportParams} filenamePrefix="equipos" />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => refetch()}
              aria-label="Actualizar catálogo de equipos"
            >
              <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
              Actualizar
            </Button>
          </>
        }
      />

      <EquipmentMetricsStrip equipos={equipos} />

      <TableFrame toolbar={toolbar} footer={footer} mobile={mobile}>
        {isError ? (
          <ErrorState className="m-4">Error al cargar los equipos. Por favor, reintenta más tarde.</ErrorState>
        ) : (
          <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
            <thead className={TABLE_HEAD_CLASS}>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header, index) => (
                    <th
                      key={header.id}
                      className={cn(
                        TH_CLASS,
                        'select-none',
                        header.column.id === 'acciones' && 'text-right',
                        index === 0 && `${STICKY_COL_CLASS} max-md:bg-zinc-50`,
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonRows columns={columns.length} label="Cargando catálogo de equipamiento técnico…" />
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className={`py-12 ${STATE_TEXT_CLASS}`}>
                    No se encontraron equipos que coincidan con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                pageRows.map((row) => (
                  <tr key={row.id} className={ROW_CLASS}>
                    {row.getVisibleCells().map((cell, index) => (
                      <td key={cell.id} className={cn(TD_CLASS, 'align-middle', index === 0 && STICKY_COL_CLASS)}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </TableFrame>

      {/* Drawer Lateral para Inspección de Ficha y Ciclo de Vida */}
      <EquipmentSpecSheet
        open={isSheetOpen}
        onClose={handleCloseSheet}
        equipo={selectedEquipo}
        canEdit={canEdit}
        onOpenEdit={(eq) => handleOpenEdit(eq)}
      />

      {/* Modal para Edición de Especificaciones técnicas */}
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
