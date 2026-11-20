import { useCallback, useMemo, useState } from 'react';
import { useBudgetSummary, useDeleteBudget } from '@sgia/api-client';
import type { BudgetSummaryRow } from '@sgia/types';
import { Plus, Wallet } from 'lucide-react';

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
import { Cell } from '@/components/ui/cell';
import { CellGrid } from '@/components/ui/cell-grid';
import { ErrorState } from '@/components/ui/error-state';
import { Metric } from '@/components/ui/metric';
import { PageHeader } from '@/components/ui/page-header';
import { SegmentedFilter } from '@/components/shared/segmented-filter';
import { SkeletonList } from '@/components/ui/skeleton-list';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR + 1, CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

export default function PresupuestosPage() {
  const { user } = useAuth();
  // DIR-01 (director del Área de Informática) administra todas las carreras.
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

  const yearOptions = YEARS.map((y) => ({ value: y, label: String(y) }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={Wallet}
        title="Presupuestos anuales"
        description="Ejecución por carrera: las compras reservan y las facturas confirmadas consumen."
        actions={
          canManage && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus aria-hidden="true" className="h-4 w-4" />
              Nuevo presupuesto
            </Button>
          )
        }
      />

      <CellGrid columns={4} aria-label={`Totales ${year}`}>
        <Cell>
          <Metric
            label="Inicial"
            value={formatCLP(totals.initial)}
            hint={`${rows?.length ?? 0} carreras`}
          />
        </Cell>
        <Cell>
          <Metric
            label="Reservado"
            value={formatCLP(totals.reserved)}
            hint="Órdenes de compra pendientes"
          />
        </Cell>
        <Cell>
          <Metric
            label="Consumido"
            value={formatCLP(totals.consumed)}
            hint="Facturas confirmadas"
          />
        </Cell>
        <Cell>
          <Metric
            label="Libre"
            value={formatCLP(totals.free)}
            hint="Lo que aún se puede gastar"
            tone={totals.free < 0 ? 'danger' : 'neutral'}
          />
        </Cell>
      </CellGrid>

      <section className="flex flex-col gap-3" aria-label="Presupuestos por carrera">
        <SegmentedFilter
          label="Año del presupuesto"
          options={yearOptions}
          value={year}
          onChange={setYear}
          className="self-start font-mono"
        />

        {isLoading ? (
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <SkeletonList label="Cargando presupuestos…" rows={4} columns={5} />
          </div>
        ) : isError ? (
          <ErrorState>No se pudieron cargar los presupuestos desde el servidor.</ErrorState>
        ) : (
          <BudgetSummaryGrid
            rows={rows ?? []}
            canManage={canManage}
            onOpen={(r) => setSelectedId(r.id)}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </section>

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
