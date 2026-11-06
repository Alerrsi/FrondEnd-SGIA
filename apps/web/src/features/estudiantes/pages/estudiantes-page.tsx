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
  'h-8 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-2 font-mono text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-400';

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
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
            Estudiantes
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
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
          <Plus className="h-4 w-4" />
          Nuevo estudiante
        </Button>
      </div>

      <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 p-2.5">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
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
          <div className="py-12 text-center font-mono text-xs text-zinc-500">Cargando estudiantes…</div>
        ) : isError ? (
          <div className="m-3 flex items-center gap-2 rounded-md border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/20 p-4 text-xs font-medium text-red-700 dark:text-red-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
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
          <div className="flex items-center justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800 p-2 text-xs text-zinc-500">
            <span className="font-mono">
              {meta.currentPage} / {meta.lastPage} · {meta.total} estudiantes
            </span>
            <Button size="icon" variant="outline" aria-label="Página anterior" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="outline" aria-label="Página siguiente" disabled={page >= meta.lastPage} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-3.5 w-3.5" />
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
