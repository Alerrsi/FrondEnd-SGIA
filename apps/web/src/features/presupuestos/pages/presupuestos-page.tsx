import { useCallback, useMemo, useState } from 'react';
import { useBudgetSummary, useDeleteBudget } from '@sgia/api-client';
import type { BudgetSummaryRow } from '@sgia/types';
import { AlertCircle, Plus, Wallet } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { canDo } from '@/features/auth/types/roles';
import { useAuth } from '@/features/auth/context/auth-context';
import { formatCLP } from '@/features/compras/lib/format';
import { BudgetDetailSheet } from '@/features/presupuestos/components/budget-detail-sheet';
import { BudgetSummaryGrid } from '@/features/presupuestos/components/budget-summary-grid';
import { CreateBudgetDialog } from '@/features/presupuestos/components/create-budget-dialog';
import { EditBudgetDialog } from '@/features/presupuestos/components/edit-budget-dialog';
import { careerLabel } from '@/features/presupuestos/lib/budget-label';
import { apiErrorToMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';
import { PageHeading } from '@/components/ui/page-heading';
import { STATE_TEXT_CLASS } from '@/components/ui/typography';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR + 1, CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

export default function PresupuestosPage() {
  const { user } = useAuth();
  // AD-01 y DIR-01 (director del Área de Informática) administran todas las carreras.
  const canManage = canDo(user?.rol, 'manageBudgets');

  const [year, setYear] = useState<number>(CURRENT_YEAR);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetSummaryRow | null>(null);
  const [deleting, setDeleting] = useState<BudgetSummaryRow | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: rows, isLoading, isError } = useBudgetSummary({ year });
  const deleteBudget = useDeleteBudget();

  // El detalle se deriva del resumen vivo para reflejar los cambios tras invalidar la caché.
  const selected = rows?.find((r) => r.id === selectedId) ?? null;

  const totals = useMemo(
    () =>
      (rows ?? []).reduce(
        (acc, r) => ({
          initial: acc.initial + r.initial_amount,
          reserved: acc.reserved + r.reserved_amount,
          consumed: acc.consumed + r.consumed_amount,
          free: acc.free + r.free_amount,
        }),
        { initial: 0, reserved: 0, consumed: 0, free: 0 },
      ),
    [rows],
  );

  const handleEdit = useCallback((row: BudgetSummaryRow) => setEditing(row), []);
  const handleDelete = useCallback((row: BudgetSummaryRow) => setDeleting(row), []);

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteBudget.mutateAsync(deleting.id);
      toast.success('Presupuesto eliminado.');
      if (selectedId === deleting.id) setSelectedId(null);
    } catch (error) {
      toast.error(apiErrorToMessage(error));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">

        <div className="flex flex-wrap items-center justify-between gap-3">
          <PageHeading icon={Wallet} title="Presupuestos anuales">
            Ejecución por carrera: las compras reservan y las facturas confirmadas consumen.
          </PageHeading>
          {canManage && (
            <Button onClick={() => setCreateOpen(true)} className="text-xs">
              <Plus className="h-4 w-4" />
              Nuevo presupuesto
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2.5 text-xs shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 dark:text-zinc-400">Carreras:</span>
          <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
            {rows?.length ?? 0}
          </span>
        </div>
        <div className="h-3 w-px bg-zinc-200 dark:bg-zinc-800" />
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 dark:text-zinc-400">Inicial:</span>
          <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
            {formatCLP(totals.initial)}
          </span>
        </div>
        <div className="h-3 w-px bg-zinc-200 dark:bg-zinc-800" />
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 dark:text-zinc-400">Reservado:</span>
          <span className="font-mono text-zinc-700 dark:text-zinc-300">
            {formatCLP(totals.reserved)}
          </span>
        </div>
        <div className="h-3 w-px bg-zinc-200 dark:bg-zinc-800" />
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 dark:text-zinc-400">Consumido:</span>
          <span className="font-mono text-zinc-700 dark:text-zinc-300">
            {formatCLP(totals.consumed)}
          </span>
        </div>
        <div className="h-3 w-px bg-zinc-200 dark:bg-zinc-800" />
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 dark:text-zinc-400">Libre:</span>
          <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
            {formatCLP(totals.free)}
          </span>
        </div>
      </div>

      <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
        <div className="flex items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 p-2.5">
          <div className="flex gap-1" role="group" aria-label="Año del presupuesto">
            {YEARS.map((y) => (
              <Button
                key={y}
                size="sm"
                variant={year === y ? 'primary' : 'outline'}
                aria-pressed={year === y}
                onClick={() => setYear(y)}
                className="font-mono"
              >
                {y}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className={`py-12 ${STATE_TEXT_CLASS}`}>
            Cargando presupuestos…
          </div>
        ) : isError ? (
          <div className="m-3 flex items-center gap-2 rounded-md border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/20 p-4 text-xs font-medium text-red-700 dark:text-red-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>No se pudieron cargar los presupuestos desde el servidor.</span>
          </div>
        ) : (
          <div className="bg-zinc-50/60 dark:bg-zinc-950/40 p-3">
            <BudgetSummaryGrid
              rows={rows ?? []}
              canManage={canManage}
              onOpen={(r) => setSelectedId(r.id)}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        )}
      </div>

      {canManage && (
        <>
          <CreateBudgetDialog
            open={createOpen}
            onClose={() => setCreateOpen(false)}
            defaultYear={year}
          />
          {editing && <EditBudgetDialog open onClose={() => setEditing(null)} budget={editing} />}
        </>
      )}

      <BudgetDetailSheet budget={selected} onClose={() => setSelectedId(null)} />

      <ConfirmDialog
        open={deleting !== null}
        title="Eliminar presupuesto"
        description={
          deleting
            ? `Se eliminará el presupuesto ${deleting.year} de ${careerLabel(deleting)}. No se puede eliminar si ya tiene compras o facturas asociadas.`
            : ''
        }
        confirmLabel="Eliminar"
        variant="danger"
        loading={deleteBudget.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
