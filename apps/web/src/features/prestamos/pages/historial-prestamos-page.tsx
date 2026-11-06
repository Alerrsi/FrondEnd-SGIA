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
import { CareerSelect } from '@/components/shared/career-select';
import { LaboratorySelect } from '@/components/shared/laboratory-select';
import { StoreroomSelect } from '@/components/shared/storeroom-select';
import { Button } from '@/components/ui/button';
import {
  loanCareer,
  loanLaboratory,
  loanSubject,
  loanStoreroom,
  loanTeacher,
} from '@/features/prestamos/lib/loan-display';
import { LoanDetailSheet } from '@/features/prestamos/components/loan-detail-sheet';
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
  const [careerFilter, setCareerFilter] = useState<number | undefined>(undefined);
  const [storeroomFilter, setStoreroomFilter] = useState<number | undefined>(undefined);
  const [locationFilter, setLocationFilter] = useState<number | undefined>(undefined);
  const [loanDateFilter, setLoanDateFilter] = useState('');
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
      career_id: careerFilter,
      storeroom_id: storeroomFilter,
      location_id: locationFilter,
      loan_date: loanDateFilter || undefined,
      page,
      per_page: pageSize,
    }),
    [
      search,
      estadoFilter,
      startDate,
      endDate,
      careerFilter,
      storeroomFilter,
      locationFilter,
      loanDateFilter,
      page,
      pageSize,
    ],
  );

  const { data, isLoading, isFetching, refetch } = useLoans(queryParams);
  const exportMutation = useExportLoans();

  const loans = data?.data ?? [];
  const meta = data?.meta;

  // Metric strip data
  const { data: allActiveData } = useLoans({
    estado: LoanStatus.ACTIVO,
    per_page: 1,
  });
  const { data: allOverdueData } = useLoans({
    estado: LoanStatus.ATRASADO,
    per_page: 1,
  });
  const { data: allReturnedData } = useLoans({
    estado: LoanStatus.DEVUELTO,
    per_page: 1,
  });

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
        career_id: careerFilter,
        storeroom_id: storeroomFilter,
        location_id: locationFilter,
        loan_date: loanDateFilter || undefined,
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
          <span className="font-mono text-xs font-semibold text-text">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor((row) => loanTeacher(row), {
        id: 'docente',
        header: 'Docente Solicitante',
        cell: (info) => {
          const loan = info.row.original;
          return (
            <div className="flex flex-col gap-0.5">
              <span className="font-sans font-medium text-text">
                {info.getValue()}
              </span>
              {loan.solicitanteRun && (
                <span className="font-mono text-xs text-text-muted tabular-nums">
                  RUN: {loan.solicitanteRun}
                </span>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor((row) => loanSubject(row), {
        id: 'asignatura',
        header: 'Asignatura / Carrera',
        cell: (info) => (
          <div className="flex flex-col font-sans text-xs">
            <span className="text-text-muted">{info.getValue()}</span>
            <span className="text-xs text-text-muted">
              {loanCareer(info.row.original)}
            </span>
          </div>
        ),
      }),
      columnHelper.accessor((row) => loanLaboratory(row), {
        id: 'sala',
        header: 'Laboratorio / Pañol',
        cell: (info) => (
          <div className="flex flex-col text-xs">
            <span className="font-medium text-text">{info.getValue()}</span>
            <span className="text-xs text-text-muted">{loanStoreroom(info.row.original)}</span>
          </div>
        ),
      }),
      columnHelper.accessor((row) => row.items?.length ?? 0, {
        id: 'items',
        header: 'Ítems',
        cell: (info) => {
          const items = info.row.original.items || [];
          const totalUnits = items.reduce((acc, it) => acc + (it.cantidad ?? 1), 0);
          return (
            <span className="font-mono text-xs tabular-nums text-text-muted">
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
              <span className="font-mono text-xs text-text-muted tabular-nums">{formatted}</span>
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
              return <span className="font-mono text-xs text-text-muted">Pendiente</span>;
            }
            const formatted = raw.length >= 10 ? raw.slice(0, 10) : raw;
            return (
              <span className="font-mono text-xs text-text-muted tabular-nums">{formatted}</span>
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
                <span className="font-mono text-xs text-danger font-semibold tabular-nums">
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
            className="h-7 w-7 text-text-muted hover:text-text"
            title="Ver bitácora y detalle"
            aria-label={`Ver detalle del préstamo #${info.row.original.codigo ?? info.row.original.id}`}
          >
            <Eye aria-hidden="true" className="h-3.5 w-3.5" />
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
    'h-8.5 rounded-md border border-border bg-background font-mono text-xs text-text placeholder:text-text-muted focus:border-text-muted focus:outline-none';

  return (
    <div className="flex flex-col gap-4">
      {/* Header técnico con miga de pan */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span
            data-sede-badge="true"
            className="sede-badge inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand-soft px-2 py-0.5 text-xs font-mono font-medium text-brand-strong"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
            SEDE TEMUCO · PAÑOL TI
          </span>
          <span className="text-text-muted text-xs font-mono">/</span>
          <span className="font-mono text-xs text-text-muted uppercase tracking-wider">
            Auditoría de Préstamos
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-text flex items-center gap-2">
              <History aria-hidden="true" className="h-5 w-5 text-text" />
              Historial y Auditoría de Préstamos
            </h1>
            <p className="text-xs text-text-muted">
              Trazabilidad física completa de solicitudes remotas y de mesón, bitácora de eventos y
              reportes semestrales.
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
              <FileSpreadsheet aria-hidden="true" className="h-3.5 w-3.5 text-ok" />
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
              <FileText aria-hidden="true" className="h-3.5 w-3.5 text-danger" />
              <span>Exportar PDF</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Cinta Métrica Compacta */}
      <div className="flex flex-wrap items-center divide-x divide-border rounded-md border border-border bg-surface px-4 py-2 text-xs font-mono shadow-xs">
        <div className="flex items-center gap-2 pr-4">
          <History aria-hidden="true" className="h-3 w-3 text-text-muted" />
          <span className="text-text-muted">Total Histórico:</span>
          <strong className="text-text tabular-nums font-semibold">
            {totalLoans}
          </strong>
        </div>

        <div className="flex items-center gap-2 px-4">
          <Clock aria-hidden="true" className="h-3 w-3 text-blue-500" />
          <span className="text-text-muted">Activos en Sala:</span>
          <strong className="text-info tabular-nums font-semibold">
            {activeCount}
          </strong>
        </div>

        <div className="flex items-center gap-2 px-4">
          <AlertTriangle aria-hidden="true"
            className={cn('h-3 w-3', overdueCount > 0 ? 'text-danger' : 'text-text-muted')}
          />
          <span className="text-text-muted">Atrasados Críticos:</span>
          <strong
            className={cn(
              'tabular-nums font-semibold',
              overdueCount > 0
                ? 'text-danger'
                : 'text-text',
            )}
          >
            {overdueCount}
          </strong>
        </div>

        <div className="flex items-center gap-2 pl-4">
          <CheckCircle aria-hidden="true" className="h-3 w-3 text-emerald-500" />
          <span className="text-text-muted">Devueltos Conformes:</span>
          <strong className="text-text tabular-nums font-semibold">
            {returnedCount}
          </strong>
        </div>
      </div>

      {/* TanStack Table Frame y Toolbar Unificado */}
      <div className="rounded-md border border-border bg-surface overflow-hidden shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-border p-3 bg-surface-raised">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            {/* Buscador con / shortcut */}
            <div className="relative min-w-0 flex-1 sm:h-8.5 sm:w-64 sm:flex-none">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
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
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
                >
                  <X aria-hidden="true" className="h-3.5 w-3.5" />
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

            {/* Filtro Carrera */}
            <CareerSelect
              value={careerFilter}
              onChange={(id) => {
                setCareerFilter(id);
                setPage(1);
              }}
              placeholder="Todas las carreras"
              aria-label="Filtro de carrera"
              className={cn(controlClasses, 'px-2.5')}
            />

            {/* Filtros de pañol y laboratorio (el laboratorio depende del pañol elegido) */}
            <StoreroomSelect
              value={storeroomFilter}
              onChange={(id) => {
                setStoreroomFilter(id);
                setLocationFilter(undefined);
                setPage(1);
              }}
              aria-label="Filtro de pañol"
              className={cn(controlClasses, 'px-2.5')}
            />
            <LaboratorySelect
              value={locationFilter}
              storeroomId={storeroomFilter}
              onChange={(id) => {
                setLocationFilter(id);
                setPage(1);
              }}
              aria-label="Filtro de laboratorio"
              className={cn(controlClasses, 'px-2.5')}
            />
            <input
              type="date"
              value={loanDateFilter}
              onChange={(e) => {
                setLoanDateFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Fecha de la actividad"
              title="Fecha de la actividad"
              className={cn(controlClasses, 'px-2')}
            />

            {/* Filtro Rango Fechas */}
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={cn(controlClasses, 'px-2')}
              title="Fecha inicial"
            />
            <span className="text-text-muted font-mono text-xs">a</span>
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
              <RefreshCw aria-hidden="true" className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
              <span>Refrescar</span>
            </Button>
          </div>
        </div>

        {/* Tabla TanStack */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs font-mono">
            <thead className="bg-surface-raised border-b border-border text-xs uppercase tracking-wider text-text-muted font-semibold">
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

            <tbody className="divide-y divide-border font-mono text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center text-text-muted">
                    <RefreshCw aria-hidden="true" className="mx-auto mb-2 h-5 w-5 animate-spin" />
                    Cargando bitácora histórica de préstamos…
                  </td>
                </tr>
              ) : loans.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center text-text-muted">
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
                        'transition-colors hover:bg-surface-raised',
                        isReturned && 'opacity-75',
                        isOverdue && 'bg-danger-bg',
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-2.5 text-xs text-text-muted font-mono bg-surface-raised">
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
                className="h-7 rounded border border-border bg-surface px-1 text-xs"
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
                <ChevronLeft aria-hidden="true" className="h-3.5 w-3.5" />
              </Button>
              <span className="px-2 text-text tabular-nums">
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
                <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <LoanDetailSheet loan={selectedLoan} onClose={() => setSelectedLoan(null)} />
    </div>
  );
}
