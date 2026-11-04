import { useState } from 'react';
import { useStudent, useStudentLoans } from '@sgia/api-client';
import { Loader2 } from 'lucide-react';

import { LoanStatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { formatDate } from '@/features/compras/lib/format';
import { formatRun } from '@/features/usuarios/lib/run';
import { apiErrorToMessage } from '@/lib/api-error';

/** Ficha del estudiante: datos + historial de préstamos (`GET /students/{id}` y `/loans`). */
export function StudentDetailSheet({
  studentId,
  onClose,
}: {
  studentId: number | null;
  onClose: () => void;
}) {
  const [page, setPage] = useState(1);
  const id = studentId ?? undefined;
  const { data: student, isLoading } = useStudent(id);
  const loans = useStudentLoans(id, { page, per_page: 8 });
  const meta = loans.data?.meta;

  return (
    <Sheet open={studentId !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{student?.full_name || 'Estudiante'}</SheetTitle>
          <SheetDescription>
            <span className="font-mono">{student ? formatRun(student.rut) : '…'}</span>
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
        ) : (
          student && (
            <dl className="grid grid-cols-2 gap-2 text-xs">
              <dt className="text-zinc-500">Correo</dt>
              <dd className="font-mono">{student.email || '—'}</dd>
              <dt className="text-zinc-500">Carrera</dt>
              <dd>{student.career?.name ?? '—'}</dd>
              <dt className="text-zinc-500">Préstamos</dt>
              <dd className="font-mono">{student.loans_count ?? 0}</dd>
            </dl>
          )
        )}

        <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Historial de préstamos
        </h3>
        <div className="flex-1 overflow-y-auto">
          {loans.isError ? (
            <p role="alert" className="text-xs text-rose-600">
              {apiErrorToMessage(loans.error)}
            </p>
          ) : (loans.data?.data ?? []).length === 0 ? (
            <p className="text-xs text-zinc-500">Sin préstamos registrados.</p>
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {loans.data?.data.map((loan) => (
                <li key={loan.id} className="flex items-center justify-between gap-2 py-2 text-xs">
                  <div>
                    <span className="font-mono font-semibold">{loan.codigo}</span>
                    <p className="text-zinc-500">
                      {formatDate(loan.loan_date ?? loan.created_at)} ·{' '}
                      {loan.items.map((i) => i.nombre).join(', ') || 'Sin ítems'}
                    </p>
                  </div>
                  <LoanStatusBadge estado={String(loan.status ?? loan.estado)} />
                </li>
              ))}
            </ul>
          )}
        </div>
        {meta && meta.lastPage > 1 && (
          <div className="flex items-center justify-between font-mono text-xs text-zinc-500">
            <span>
              {meta.currentPage} / {meta.lastPage}
            </span>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Anterior
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= meta.lastPage}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
