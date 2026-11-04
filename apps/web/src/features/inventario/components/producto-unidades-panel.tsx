import { useState } from 'react';
import {
  fetchEquipmentUnitTechnicalSheet,
  useActiveMaintenance,
  useDeleteEquipmentUnit,
  useProductUnits,
  useUpdateEquipmentUnitStatus,
} from '@sgia/api-client';
import type { EquipmentUnit, EquipmentUnitStatus, Producto } from '@sgia/types';
import { Barcode, FileText, FolderOpen, Loader2, Plus, Trash2, Wrench } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { downloadBlob } from '@/features/equipos/utils/download';
import { MaintenanceChecklistSheet } from '@/features/mantenciones/components/maintenance-checklist-sheet';
import { OpenMaintenanceDialog } from '@/features/mantenciones/components/open-maintenance-dialog';
import { UnitDocumentsDialog } from '@/features/mantenciones/components/unit-documents-dialog';
import { apiErrorToMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';

import { AgregarUnidadesDialog } from './agregar-unidades-dialog';
import { UnidadBarcodeDialog } from './unidad-barcode-dialog';
import { UNIT_STATUS_LABELS, UnidadStatusBadge } from './unidad-status-badge';

const STATUS_FILTERS: Array<EquipmentUnitStatus | ''> = [
  '',
  'disponible',
  'prestado',
  'en_reparacion',
  'dado_de_baja',
];

/** Transiciones manuales permitidas: `prestado` solo lo cambian los préstamos; `dado_de_baja` es final. */
function allowedStatuses(unit: EquipmentUnit): EquipmentUnitStatus[] {
  switch (unit.status) {
    case 'disponible':
      return ['en_reparacion', 'dado_de_baja'];
    case 'en_reparacion':
      return ['disponible', 'dado_de_baja'];
    case 'prestado':
      return ['dado_de_baja'];
    default:
      return [];
  }
}

const controlClasses =
  'h-7 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-2 font-mono text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600';

/**
 * Con una mantención `en_curso` el backend rechaza `PATCH /equipment-units/{id}/status` (422): en ese
 * caso no se ofrece el selector y se enlaza a la mantención, que es quien cambia el estado.
 */
function UnitStatusControl({
  unit,
  disabled,
  onChange,
  onOpenMaintenance,
}: {
  unit: EquipmentUnit;
  disabled: boolean;
  onChange: (next: EquipmentUnitStatus) => void;
  onOpenMaintenance: (recordId: number) => void;
}) {
  const options = allowedStatuses(unit);
  const { data: active, isLoading } = useActiveMaintenance(unit.id, unit.status === 'en_reparacion');

  if (active) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 gap-1 text-xs"
        onClick={() => onOpenMaintenance(active.id)}
      >
        <Wrench className="h-3 w-3" />
        En mantención
      </Button>
    );
  }
  if (options.length === 0) return null;
  return (
    <select
      aria-label={`Cambiar estado de ${unit.code}`}
      className={controlClasses}
      value=""
      disabled={disabled || isLoading}
      onChange={(e) => e.target.value && onChange(e.target.value as EquipmentUnitStatus)}
    >
      <option value="">Estado…</option>
      {options.map((s) => (
        <option key={s} value={s}>
          {UNIT_STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}

export function ProductoUnidadesPanel({
  producto,
  canWrite = true,
  canDelete = true,
  canMaintain = true,
}: {
  producto: Producto;
  canWrite?: boolean;
  canDelete?: boolean;
  /** Mantenciones y documentos: escritura solo AD-01 y PAN-01. */
  canMaintain?: boolean;
}) {
  const [maintenanceUnit, setMaintenanceUnit] = useState<EquipmentUnit | null>(null);
  const [docsUnit, setDocsUnit] = useState<EquipmentUnit | null>(null);
  const [recordId, setRecordId] = useState<number | null>(null);
  const [status, setStatus] = useState<EquipmentUnitStatus | ''>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [barcodeUnit, setBarcodeUnit] = useState<EquipmentUnit | null>(null);
  const [deleteUnit, setDeleteUnit] = useState<EquipmentUnit | null>(null);
  const [sheetLoadingId, setSheetLoadingId] = useState<number | null>(null);

  const { data, isLoading, isError, error } = useProductUnits(producto.id, {
    status: status || undefined,
    search: search.trim() || undefined,
    page,
    per_page: 10,
  });
  const updateStatus = useUpdateEquipmentUnitStatus();
  const removeUnit = useDeleteEquipmentUnit();

  const units = data?.data ?? [];
  const meta = data?.meta;

  const handleStatusChange = async (unit: EquipmentUnit, next: EquipmentUnitStatus) => {
    try {
      await updateStatus.mutateAsync({ id: unit.id, status: next });
      toast.success(`${unit.code}: ${UNIT_STATUS_LABELS[next]}`);
    } catch (e) {
      toast.error(apiErrorToMessage(e));
    }
  };

  const handleSheet = async (unit: EquipmentUnit) => {
    setSheetLoadingId(unit.id);
    try {
      const blob = await fetchEquipmentUnitTechnicalSheet(unit.id);
      downloadBlob(blob, `hoja-de-vida-${unit.code}.pdf`);
    } catch (e) {
      toast.error(apiErrorToMessage(e));
    } finally {
      setSheetLoadingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteUnit) return;
    try {
      await removeUnit.mutateAsync(deleteUnit.id);
      toast.success(`Unidad ${deleteUnit.code} eliminada`);
    } catch (e) {
      toast.error(apiErrorToMessage(e));
    } finally {
      setDeleteUnit(null);
    }
  };

  return (
    <section
      aria-label="Unidades del producto"
      className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs"
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 p-2.5">
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
          Unidades{meta ? ` · ${meta.total}` : ''}
        </span>
        <input
          type="search"
          placeholder="Código o serie…"
          aria-label="Buscar unidad"
          className={`${controlClasses} ml-auto w-36`}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <select
          aria-label="Filtrar por estado"
          className={controlClasses}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as EquipmentUnitStatus | '');
            setPage(1);
          }}
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s || 'all'} value={s}>
              {s ? UNIT_STATUS_LABELS[s] : 'Todos los estados'}
            </option>
          ))}
        </select>
        {canWrite && (
          <Button
            type="button"
            size="sm"
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Agregar unidades
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 p-6 text-xs text-zinc-500 font-mono">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando unidades…
        </div>
      ) : isError ? (
        <p role="alert" className="p-4 text-xs text-rose-600 dark:text-rose-400">
          {apiErrorToMessage(error)}
        </p>
      ) : units.length === 0 ? (
        <p className="p-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
          Sin unidades registradas para este filtro.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40 font-mono text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <th className="px-2.5 py-1.5 font-medium">Código</th>
                <th className="px-2.5 py-1.5 font-medium">Serie</th>
                <th className="px-2.5 py-1.5 font-medium">Cajón</th>
                <th className="px-2.5 py-1.5 font-medium">Estado</th>
                <th className="px-2.5 py-1.5 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {units.map((unit) => {
                return (
                  <tr key={unit.id}>
                    <td className="px-2.5 py-1.5">
                      <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/60">
                        {unit.code}
                      </span>
                    </td>
                    <td className="px-2.5 py-1.5 font-mono text-zinc-600 dark:text-zinc-400">
                      {unit.serial_number || '—'}
                    </td>
                    <td className="px-2.5 py-1.5 font-mono text-zinc-600 dark:text-zinc-400">
                      {unit.cajon?.codigo ?? '—'}
                    </td>
                    <td className="px-2.5 py-1.5">
                      <div className="flex flex-col gap-0.5">
                        <UnidadStatusBadge status={unit.status} />
                        {unit.active_loan?.code && (
                          <span className="font-mono text-[10px] text-zinc-500">
                            {unit.active_loan.code}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-2.5 py-1.5">
                      <div className="flex items-center justify-end gap-1">
                        {canWrite && (
                          <UnitStatusControl
                            unit={unit}
                            disabled={updateStatus.isPending}
                            onChange={(next) => handleStatusChange(unit, next)}
                            onOpenMaintenance={setRecordId}
                          />
                        )}
                        {canMaintain && unit.status === 'disponible' && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Enviar ${unit.code} a mantención`}
                            title="Enviar a mantención"
                            onClick={() => setMaintenanceUnit(unit)}
                          >
                            <Wrench className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Documentos de ${unit.code}`}
                          title="Documentos de mantenimiento"
                          onClick={() => setDocsUnit(unit)}
                        >
                          <FolderOpen className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Ver código de ${unit.code}`}
                          title="Código de barras"
                          onClick={() => setBarcodeUnit(unit)}
                        >
                          <Barcode className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Hoja de vida de ${unit.code}`}
                          title="Hoja de vida (PDF)"
                          disabled={sheetLoadingId === unit.id}
                          onClick={() => handleSheet(unit)}
                        >
                          {sheetLoadingId === unit.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <FileText className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        {canDelete && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Eliminar ${unit.code}`}
                            title="Eliminar unidad"
                            onClick={() => setDeleteUnit(unit)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.lastPage > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 p-2 font-mono text-xs text-zinc-500">
          <span>
            Página {meta.currentPage} de {meta.lastPage}
          </span>
          <div className="flex gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= meta.lastPage}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      <AgregarUnidadesDialog open={addOpen} onClose={() => setAddOpen(false)} producto={producto} />
      <UnidadBarcodeDialog unit={barcodeUnit} onClose={() => setBarcodeUnit(null)} />
      <OpenMaintenanceDialog
        unit={maintenanceUnit}
        onClose={() => setMaintenanceUnit(null)}
        onOpened={setRecordId}
      />
      <UnitDocumentsDialog unit={docsUnit} canWrite={canMaintain} onClose={() => setDocsUnit(null)} />
      <MaintenanceChecklistSheet recordId={recordId} onClose={() => setRecordId(null)} />
      <ConfirmDialog
        open={deleteUnit !== null}
        title="Eliminar unidad"
        description={`Se eliminará la unidad ${deleteUnit?.code ?? ''}. No se puede si está prestada o tiene historial.`}
        confirmLabel="Eliminar"
        variant="danger"
        loading={removeUnit.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteUnit(null)}
      />
    </section>
  );
}
