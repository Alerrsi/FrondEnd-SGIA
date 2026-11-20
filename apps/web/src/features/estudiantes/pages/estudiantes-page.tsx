import { useCallback, useEffect, useState } from 'react';
import { useCareers, useStudents, useUpdateStudentStatus } from '@sgia/api-client';
import type { Student } from '@sgia/types';
import { AlertCircle, ChevronLeft, ChevronRight, GraduationCap, Plus, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { StudentDetailSheet } from '@/features/estudiantes/components/student-detail-sheet';
import { StudentFormDialog } from '@/features/estudiantes/components/student-form-dialog';
import { StudentsTable } from '@/features/estudiantes/components/students-table';
import { apiErrorToMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';
import { PageHeading } from '@/components/ui/page-heading';
import { FILTER_CONTROL_CLASS } from '@/components/ui/form-control';
import { SkeletonList } from '@/components/ui/skeleton-list';

const controlClasses =
  FILTER_CONTROL_CLASS;

export default function EstudiantesPage() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [careerId, setCareerId] = useState<number | undefined>();
  // Por defecto solo activos: los desactivados se conservan por auditoría.
  const [status, setStatus] = useState<'activos' | 'desactivados' | 'todos'>('activos');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [toDeactivate, setToDeactivate] = useState<Student | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isError } = useStudents({
    search: debounced || undefined,
    career_id: careerId,
    is_active: status === 'todos' ? undefined : status === 'activos',
    page,
    per_page: 20,
  });
  const { data: careers } = useCareers({ per_page: 100 });
  const { mutateAsync: setStudentActive, isPending: savingStatus } = useUpdateStudentStatus();

  const openEdit = useCallback((s: Student) => {
    setEditing(s);
    setFormOpen(true);
  }, []);
  const openDetail = useCallback((s: Student) => setDetailId(s.id), []);

  const changeStatus = useCallback(
    async (student: Student, isActive: boolean) => {
      try {
        await setStudentActive({ id: student.id, isActive });
        toast.success(isActive ? 'Estudiante activado' : 'Estudiante desactivado');
      } catch (error) {
        toast.error(apiErrorToMessage(error));
      } finally {
        setToDeactivate(null);
      }
    },
    [setStudentActive],
  );

  // Desactivar pide confirmación; reactivar es inmediato.
  const toggleStatus = useCallback(
    (s: Student) => (s.is_active ? setToDeactivate(s) : void changeStatus(s, true)),
    [changeStatus],
  );

  const meta = data?.meta;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeading icon={GraduationCap} title="Estudiantes">
          Registro de estudiantes que retiran préstamos presenciales.
        </PageHeading>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          Nuevo estudiante
        </Button>
      </div>

      <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 p-2.5">
          <div className="relative flex-1 max-w-sm">
            <Search aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              aria-label="Buscar estudiante"
              placeholder="RUT o nombre…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${controlClasses} w-full pl-8`}
            />
          </div>
          <select
            aria-label="Filtrar por carrera"
            value={careerId ?? ''}
            onChange={(e) => {
              setCareerId(e.target.value ? Number(e.target.value) : undefined);
              setPage(1);
            }}
            className={controlClasses}
          >
            <option value="">Todas las carreras</option>
            {(careers?.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Filtrar por estado"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as typeof status);
              setPage(1);
            }}
            className={controlClasses}
          >
            <option value="activos">Activos</option>
            <option value="desactivados">Desactivados</option>
            <option value="todos">Todos</option>
          </select>
        </div>

        {isLoading ? (
          <SkeletonList label="Cargando estudiantes…" columns={4} />
        ) : isError ? (
          <div className="m-3 flex items-center gap-2 rounded-md border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/20 p-4 text-xs font-medium text-danger">
            <AlertCircle aria-hidden="true" className="h-5 w-5 shrink-0" />
            No se pudieron cargar los estudiantes.
          </div>
        ) : (
          <StudentsTable
            rows={data?.data ?? []}
            onOpen={openDetail}
            onEdit={openEdit}
            onToggleStatus={toggleStatus}
          />
        )}

        {meta && meta.lastPage > 1 && (
          <div className="flex items-center justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800 p-2 text-xs text-zinc-500">
            <span className="font-mono">
              {meta.currentPage} / {meta.lastPage} · {meta.total} estudiantes
            </span>
            <Button size="icon" variant="outline" aria-label="Página anterior" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft aria-hidden="true" className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="outline" aria-label="Página siguiente" disabled={page >= meta.lastPage} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      <StudentFormDialog
        open={formOpen}
        student={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
      />
      <StudentDetailSheet studentId={detailId} onClose={() => setDetailId(null)} />
      <ConfirmDialog
        open={toDeactivate !== null}
        title="Desactivar estudiante"
        description={`${toDeactivate?.full_name || toDeactivate?.rut || ''} no podrá recibir préstamos. Su historial se conserva y puedes reactivarlo cuando quieras.`}
        confirmLabel="Desactivar"
        variant="danger"
        loading={savingStatus}
        onConfirm={() => toDeactivate && changeStatus(toDeactivate, false)}
        onCancel={() => setToDeactivate(null)}
      />
    </div>
  );
}
