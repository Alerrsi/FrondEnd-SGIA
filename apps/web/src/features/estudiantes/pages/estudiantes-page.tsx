import { PageEyebrow } from '@/components/shared/page-eyebrow';
import { useCallback, useEffect, useState } from 'react';
import { useCareers, useDeleteStudent, useStudents } from '@sgia/api-client';
import type { Student } from '@sgia/types';
import { AlertCircle, ChevronLeft, ChevronRight, GraduationCap, Plus, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useAuth } from '@/features/auth/context/auth-context';
import { StudentDetailSheet } from '@/features/estudiantes/components/student-detail-sheet';
import { StudentFormDialog } from '@/features/estudiantes/components/student-form-dialog';
import { StudentsTable } from '@/features/estudiantes/components/students-table';
import { apiErrorToMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';

const controlClasses =
  'h-8 rounded-md border border-border bg-background px-2 font-mono text-xs text-text focus:outline-none focus:ring-1 focus:ring-info';

export default function EstudiantesPage() {
  const { user } = useAuth();
  const canDelete = user?.rol === 'AD-01';
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [careerId, setCareerId] = useState<number | undefined>();
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [toDelete, setToDelete] = useState<Student | null>(null);

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
    page,
    per_page: 20,
  });
  const { data: careers } = useCareers({ per_page: 100 });
  const remove = useDeleteStudent();

  const openEdit = useCallback((s: Student) => {
    setEditing(s);
    setFormOpen(true);
  }, []);
  const openDetail = useCallback((s: Student) => setDetailId(s.id), []);

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await remove.mutateAsync(toDelete.id);
      toast.success('Estudiante eliminado');
    } catch (error) {
      // 422 (errors.student): tiene préstamos.
      toast.error(apiErrorToMessage(error));
    } finally {
      setToDelete(null);
    }
  };

  const meta = data?.meta;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <PageEyebrow area="PAÑOL TI" section="Estudiantes" />
          <h1 className="text-xl font-bold tracking-tight text-text flex items-center gap-2">
            <GraduationCap aria-hidden="true" className="h-5 w-5 text-text" />
            Estudiantes
          </h1>
          <p className="text-xs text-text-muted">
            Registro de estudiantes que retiran préstamos presenciales.
          </p>
        </div>
        <Button
          className="text-xs"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          Nuevo estudiante
        </Button>
      </div>

      <div className="rounded-md border border-border bg-surface overflow-hidden shadow-xs">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-2.5">
          <div className="relative flex-1 max-w-sm">
            <Search aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
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
        </div>

        {isLoading ? (
          <div className="py-12 text-center font-mono text-xs text-text-muted">Cargando estudiantes…</div>
        ) : isError ? (
          <div className="m-3 flex items-center gap-2 rounded-md border border-danger/30 bg-danger-bg p-4 text-xs font-medium text-danger">
            <AlertCircle aria-hidden="true" className="h-5 w-5 shrink-0" />
            No se pudieron cargar los estudiantes.
          </div>
        ) : (
          <StudentsTable
            rows={data?.data ?? []}
            canDelete={canDelete}
            onOpen={openDetail}
            onEdit={openEdit}
            onDelete={setToDelete}
          />
        )}

        {meta && meta.lastPage > 1 && (
          <div className="flex items-center justify-end gap-2 border-t border-border p-2 text-xs text-text-muted">
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
        open={toDelete !== null}
        title="Eliminar estudiante"
        description={`Se eliminará a ${toDelete?.full_name || toDelete?.rut || ''}. No se puede si tiene préstamos.`}
        confirmLabel="Eliminar"
        variant="danger"
        loading={remove.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
