import { useMemo, useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import {
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  FileSpreadsheet,
  FileText,
  History,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { useExportLoans, useLoans } from '@sgia/api-client';
import { LoanStatus, type Prestamo } from '@sgia/types';

import { LoanStatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/cn';
import { toast } from '@/lib/toast';

const columnHelper = createColumnHelper<Prestamo>();

export default function HistorialPrestamosPage() {
  // Estados de filtros y paginación
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('todos');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);

  // Detalle Drawer
  const [selectedLoan, setSelectedLoan] = useState<Prestamo | null>(null);

  // Queries y Mutaciones
  const queryParams = useMemo(
    () => ({
      search: search.trim() || undefined,
      estado: estadoFilter === 'todos' ? undefined : estadoFilter,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      page,
      per_page: pageSize,
    }),
    [search, estadoFilter, startDate, endDate, page, pageSize],
  );

  const { data, isLoading, isFetching, refetch } = useLoans(queryParams);
  const exportMutation = useExportLoans();

  const loans = data?.data ?? [];
  const meta = data?.meta;

  // Metric strip data
  const { data: allActiveData } = useLoans({ estado: LoanStatus.ACTIVO, per_page: 1 });
  const { data: allOverdueData } = useLoans({ estado: LoanStatus.ATRASADO, per_page: 1 });
  const { data: allReturnedData } = useLoans({ estado: LoanStatus.DEVUELTO, per_page: 1 });

  const totalLoans = meta?.total ?? loans.length;
  const activeCount = allActiveData?.meta?.total ?? 0;
  const overdueCount = allOverdueData?.meta?.total ?? 0;
  const returnedCount = allReturnedData?.meta?.total ?? 0;

  // Export handlers
  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      toast.info(`Generando archivo de reporte ${format.toUpperCase()}…`);
      const blob = await exportMutation.mutateAsync({
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        format,
      });

      // Crear URL de descarga del Blob
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const extension = format === 'excel' ? 'xlsx' : 'pdf';
      const dateStr = new Date().toISOString().slice(0, 10);
      link.setAttribute('download', `SGIA_Auditoria_Prestamos_${dateStr}.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Reporte ${format.toUpperCase()} descargado exitosamente`);
    } catch {
      toast.error(`Error al exportar archivo ${format.toUpperCase()}`);
    }
  };

  // Definición de columnas de TanStack Table
  const columns = useMemo(
    () => [
      columnHelper.accessor((row) => row.codigo ?? `#${row.id}`, {
        id: 'codigo',
        header: 'Código',
        cell: (info) => (
          <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor((row) => row.solicitanteNombre || row.usuario?.name || 'Docente', {
        id: 'docente',
        header: 'Docente Solicitante',
        cell: (info) => {
          const loan = info.row.original;
          return (
            <div className="flex flex-col gap-0.5">
              <span className="font-sans font-medium text-zinc-800 dark:text-zinc-200">
                {info.getValue()}
              </span>
              {loan.solicitanteRun && (
                <span className="font-mono text-[10px] text-zinc-400 tabular-nums">
                  RUN: {loan.solicitanteRun}
                </span>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor((row) => row.asignatura || 'General', {
        id: 'asignatura',
        header: 'Asignatura / Carrera',
        cell: (info) => (
          <span className="font-sans text-xs text-zinc-600 dark:text-zinc-300">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor((row) => row.sala || 'Pañol', {
        id: 'sala',
        header: 'Sala / Taller',
        cell: (info) => (
          <span className="font-mono text-xs font-medium text-zinc-700 dark:text-zinc-300">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor((row) => row.items?.length ?? 0, {
        id: 'items',
        header: 'Ítems',
        cell: (info) => {
          const items = info.row.original.items || [];
          const totalUnits = items.reduce((acc, it) => acc + (it.cantidad ?? 1), 0);
          return (
            <span className="font-mono text-xs tabular-nums text-zinc-600 dark:text-zinc-300">
              {items.length} ({totalUnits} un.)
            </span>
          );
        },
      }),
      columnHelper.accessor(
        (row) =>
          row.fechaPrestamo || row.fechaSolicitud || row.fechaSolicitada || row.created_at || '—',
        {
          id: 'fechaPrestamo',
          header: 'Fecha Préstamo',
          cell: (info) => {
            const raw = info.getValue();
            if (!raw || raw === '—') return '—';
            const formatted = raw.length >= 10 ? raw.slice(0, 10) : raw;
            return (
              <span className="font-mono text-[11px] text-zinc-500 tabular-nums">
                {formatted}
              </span>
            );
          },
        },
      ),
      columnHelper.accessor(
        (row) => row.fechaDevolucion || row.return_date || row.returned_at || '—',
        {
          id: 'fechaDevolucion',
          header: 'Fecha Retorno',
          cell: (info) => {
            const raw = info.getValue();
            if (!raw || raw === '—') {
              return (
                <span className="font-mono text-[11px] text-zinc-400">
                  Pendiente
                </span>
              );
            }
            const formatted = raw.length >= 10 ? raw.slice(0, 10) : raw;
            return (
              <span className="font-mono text-[11px] text-zinc-500 tabular-nums">
                {formatted}
              </span>
            );
          },
        },
      ),
      columnHelper.accessor('estado', {
        header: 'Estado',
        cell: (info) => {
          const estado = info.getValue();
          const loan = info.row.original;
          const isOverdue = String(estado).toLowerCase() === 'atrasado';

          return (
            <div className="flex items-center gap-2">
              <LoanStatusBadge estado={estado} />
              {isOverdue && loan.diasAtraso && (
                <span className="font-mono text-[10px] text-rose-600 dark:text-rose-400 font-semibold tabular-nums">
                  ({loan.diasAtraso}d atraso)
                </span>
              )}
            </div>
          );
        },
      }),
      columnHelper.display({
        id: 'acciones',
        header: 'Detalle',
        cell: (info) => (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setSelectedLoan(info.row.original)}
            className="h-7 w-7 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            title="Ver bitácora y detalle"
            aria-label={`Ver detalle del préstamo #${info.row.original.codigo ?? info.row.original.id}`}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: loans,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: meta?.lastPage ?? 1,
  });

  const totalPages = meta?.lastPage ?? 1;
  const currentPage = meta?.currentPage ?? page;
  const firstShown = (currentPage - 1) * pageSize + 1;
  const lastShown = Math.min(currentPage * pageSize, totalLoans);

  const controlClasses =
    'h-8.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 font-mono text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none';

  return (
    <div className="flex flex-col gap-4">
      {/* Header técnico con miga de pan */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] font-mono font-medium text-red-600 dark:text-red-400">
            <span className="h-1.5 w-1.5 rounded-full bg-red-600 dark:bg-red-500 animate-pulse" />
            SEDE TEMUCO · PAÑOL TI
          </span>
          <span className="text-zinc-400 text-xs font-mono">/</span>
          <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Auditoría de Préstamos
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <History className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
              Historial y Auditoría de Préstamos
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Trazabilidad física completa de solicitudes remotas y de mesón, bitácora de eventos y reportes semestrales.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleExport('excel')}
              disabled={exportMutation.isPending}
              className="text-xs gap-1.5"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Exportar Excel</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleExport('pdf')}
              disabled={exportMutation.isPending}
              className="text-xs gap-1.5"
            >
              <FileText className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
              <span>Exportar PDF</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Cinta Métrica Compacta */}
      <div className="flex flex-wrap items-center divide-x divide-zinc-200 dark:divide-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2 text-xs font-mono shadow-xs">
        <div className="flex items-center gap-2 pr-4">
          <History className="h-3 w-3 text-zinc-400" />
          <span className="text-zinc-400 dark:text-zinc-500">Total Histórico:</span>
          <strong className="text-zinc-900 dark:text-zinc-100 tabular-nums font-semibold">
            {totalLoans}
          </strong>
        </div>

        <div className="flex items-center gap-2 px-4">
          <Clock className="h-3 w-3 text-blue-500" />
          <span className="text-zinc-400 dark:text-zinc-500">Activos en Sala:</span>
          <strong className="text-blue-600 dark:text-blue-400 tabular-nums font-semibold">
            {activeCount}
          </strong>
        </div>

        <div className="flex items-center gap-2 px-4">
          <AlertTriangle className={cn('h-3 w-3', overdueCount > 0 ? 'text-rose-500' : 'text-zinc-400')} />
          <span className="text-zinc-400 dark:text-zinc-500">Atrasados Críticos:</span>
          <strong
            className={cn(
              'tabular-nums font-semibold',
              overdueCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-700 dark:text-zinc-300',
            )}
          >
            {overdueCount}
          </strong>
        </div>

        <div className="flex items-center gap-2 pl-4">
          <CheckCircle className="h-3 w-3 text-emerald-500" />
          <span className="text-zinc-400 dark:text-zinc-500">Devueltos Conformes:</span>
          <strong className="text-zinc-700 dark:text-zinc-300 tabular-nums font-semibold">
            {returnedCount}
          </strong>
        </div>
      </div>

      {/* TanStack Table Frame y Toolbar Unificado */}
      <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-zinc-200 dark:border-zinc-800 p-3 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            {/* Buscador con / shortcut */}
            <div className="relative min-w-0 flex-1 sm:h-8.5 sm:w-64 sm:flex-none">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Código, docente, sala…"
                aria-label="Buscar préstamos"
                className={cn(controlClasses, 'w-full py-1.5 pl-9 pr-8')}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filtro Estado */}
            <select
              value={estadoFilter}
              onChange={(e) => {
                setEstadoFilter(e.target.value);
                setPage(1);
              }}
              className={cn(controlClasses, 'px-2.5')}
              aria-label="Filtro de estado"
            >
              <option value="todos">Todos los Estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="preparado">Preparados</option>
              <option value="activo">En Préstamo (Activos)</option>
              <option value="devuelto">Devueltos</option>
              <option value="atrasado">Atrasados</option>
              <option value="rechazada">Rechazados</option>
            </select>

            {/* Filtro Rango Fechas */}
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={cn(controlClasses, 'px-2')}
              title="Fecha inicial"
            />
            <span className="text-zinc-400 font-mono text-xs">a</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={cn(controlClasses, 'px-2')}
              title="Fecha final"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="text-xs gap-1.5"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
              <span>Refrescar</span>
            </Button>
          </div>
        </div>

        {/* Tabla TanStack */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs font-mono">
            <thead className="bg-zinc-50/90 dark:bg-zinc-900/90 border-b border-zinc-200 dark:border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-3.5 py-2.5">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-mono text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center text-zinc-400">
                    <RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin" />
                    Cargando bitácora histórica de préstamos…
                  </td>
                </tr>
              ) : loans.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center text-zinc-400">
                    No se encontraron registros de préstamos con los criterios aplicados.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => {
                  const loan = row.original;
                  const isReturned = String(loan.estado).toLowerCase() === 'devuelto';
                  const isOverdue = String(loan.estado).toLowerCase() === 'atrasado';

                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        'transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40',
                        isReturned && 'opacity-75',
                        isOverdue && 'bg-rose-50/20 dark:bg-rose-950/20',
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-3.5 py-2.5">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Technical Pagination Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 dark:border-zinc-800 p-2.5 text-xs text-zinc-500 font-mono bg-zinc-50/30 dark:bg-zinc-900/30">
          <div>
            Mostrando {firstShown} a {lastShown} de {totalLoans} registros
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span>Por pág:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="h-7 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-1 text-xs"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="h-7 w-7 p-0"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="px-2 text-zinc-700 dark:text-zinc-300 tabular-nums">
                {totalPages === 0 ? 0 : currentPage} / {totalPages}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
                className="h-7 w-7 p-0"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Sheet / Drawer Lateral de Detalle y Bitácora */}
      <Sheet open={selectedLoan !== null} onOpenChange={(open) => !open && setSelectedLoan(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          {selectedLoan && (
            <div className="flex flex-col gap-5 py-2">
              <SheetHeader className="text-left border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {selectedLoan.codigo ?? `#${selectedLoan.id}`}
                  </span>
                  <LoanStatusBadge estado={selectedLoan.estado} />
                </div>
                <SheetTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {selectedLoan.solicitanteNombre}
                </SheetTitle>
                <SheetDescription className="font-mono text-xs text-zinc-400">
                  RUN: {selectedLoan.solicitanteRun || 'No registrado'} · Origen:{' '}
                  {selectedLoan.origen === 'remoto' ? 'Solicitud Remota (App)' : 'Presencial Mesón'}
                </SheetDescription>
              </SheetHeader>

              {/* Parámetros de la Clase */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-zinc-50 dark:bg-zinc-950 p-3 rounded border border-zinc-200 dark:border-zinc-800">
                <div>
                  <span className="text-zinc-400 text-[10px]">Asignatura / Carrera</span>
                  <p className="font-medium text-zinc-800 dark:text-zinc-200">
                    {selectedLoan.asignatura || '—'}
                  </p>
                </div>
                <div>
                  <span className="text-zinc-400 text-[10px]">Sala / Taller</span>
                  <p className="font-medium text-zinc-800 dark:text-zinc-200">
                    {selectedLoan.sala || '—'}
                  </p>
                </div>
                <div>
                  <span className="text-zinc-400 text-[10px]">Bloque Horario</span>
                  <p className="font-medium text-zinc-800 dark:text-zinc-200">
                    {selectedLoan.bloqueHorario || selectedLoan.time_block || 'No especificado'}
                  </p>
                </div>
                <div>
                  <span className="text-zinc-400 text-[10px]">Días de Atraso</span>
                  <p
                    className={cn(
                      'font-medium tabular-nums',
                      selectedLoan.diasAtraso ? 'text-rose-600 font-bold' : 'text-zinc-600',
                    )}
                  >
                    {selectedLoan.diasAtraso ? `${selectedLoan.diasAtraso} días` : '0 días (Al día)'}
                  </p>
                </div>
              </div>

              {/* Lista de Ítems */}
              <div className="flex flex-col gap-2">
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Ítems Prestados ({selectedLoan.items?.length ?? 0})
                </span>
                <div className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
                  {selectedLoan.items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 text-xs font-mono"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-sans font-medium text-zinc-800 dark:text-zinc-200">
                          {item.productoNombre || item.nombre || `Producto #${item.productoId}`}
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          SKU: {item.codigoBarras || '—'}
                        </span>
                      </div>
                      <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                        {item.cantidad ?? 1} un.
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bitácora / Timeline de Eventos */}
              <div className="flex flex-col gap-2">
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Bitácora y Trazabilidad
                </span>

                {selectedLoan.eventos && selectedLoan.eventos.length > 0 ? (
                  <div className="relative pl-6 border-l-2 border-zinc-200 dark:border-zinc-800 flex flex-col gap-4 py-1 ml-2">
                    {selectedLoan.eventos.map((evt, idx) => (
                      <div key={idx} className="relative flex flex-col gap-0.5 text-xs">
                        {/* Dot del timeline */}
                        <span className="absolute -left-[31px] top-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-400 dark:bg-zinc-600" />
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">
                            {evt.evento || evt.titulo}
                          </span>
                          <span className="font-mono text-[10px] text-zinc-400">
                            {evt.fecha ? evt.fecha.slice(0, 16).replace('T', ' ') : ''}
                          </span>
                        </div>
                        {evt.usuario && (
                          <span className="font-mono text-[11px] text-zinc-500">
                            Operador: {evt.usuario}
                          </span>
                        )}
                        {evt.descripcion && (
                          <p className="text-[11px] text-zinc-500 italic">
                            {evt.descripcion}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-mono text-zinc-400 italic">
                    Sin eventos registrados en la bitácora.
                  </p>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
