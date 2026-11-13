import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import {
  useCreateMyDashboardTemplate,
  useDeleteMyDashboardTemplate,
  useMyDashboardTemplates,
  useUpdateMyDashboardTemplate,
} from '@sgia/api-client';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { apiErrorToMessage } from '@/lib/api-error';
import { cn } from '@/lib/cn';
import { toast } from '@/lib/toast';
import { DashboardTemplateFormDialog } from './dashboard-template-form-dialog';

interface DashboardTemplateBarProps {
  /** `null` = panel principal. */
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}

const TAB_BASE =
  'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer';
const TAB_ACTIVE =
  'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900';
const TAB_IDLE =
  'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800';

/** Pestañas de plantillas de dashboard con nombre: crear, cambiar, renombrar y borrar. */
export function DashboardTemplateBar({ selectedId, onSelect }: DashboardTemplateBarProps) {
  const templates = useMyDashboardTemplates().data ?? [];
  const create = useCreateMyDashboardTemplate();
  const update = useUpdateMyDashboardTemplate();
  const remove = useDeleteMyDashboardTemplate();

  const [formMode, setFormMode] = useState<'create' | 'rename' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const selected = templates.find((t) => t.id === selectedId) ?? null;

  const handleSubmit = async (name: string) => {
    try {
      if (formMode === 'rename' && selected) {
        await update.mutateAsync({ id: selected.id, payload: { name } });
        toast.success('Plantilla renombrada');
      } else {
        const created = await create.mutateAsync({ name });
        onSelect(created.id);
        toast.success(`Plantilla "${created.name}" creada: añade hasta 9 gráficos`);
      }
      setFormMode(null);
    } catch (error) {
      toast.error(apiErrorToMessage(error));
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await remove.mutateAsync(selected.id);
      onSelect(null);
      toast.success('Plantilla eliminada');
    } catch (error) {
      toast.error(apiErrorToMessage(error));
    } finally {
      setConfirmDelete(false);
    }
  };

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      role="tablist"
      aria-label="Plantillas de dashboard"
      data-testid="template-bar"
    >
      <button
        type="button"
        role="tab"
        aria-selected={selectedId === null}
        onClick={() => onSelect(null)}
        className={cn(TAB_BASE, selectedId === null ? TAB_ACTIVE : TAB_IDLE)}
      >
        Panel principal
      </button>
      {templates.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={t.id === selectedId}
          onClick={() => onSelect(t.id)}
          className={cn(TAB_BASE, t.id === selectedId ? TAB_ACTIVE : TAB_IDLE)}
        >
          {t.name}
          <span className="font-mono text-[10px] opacity-70">
            {t.charts_count}/{t.max_charts}
          </span>
        </button>
      ))}

      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setFormMode('create')}>
        <Plus className="h-3.5 w-3.5" />
        Nueva plantilla
      </Button>

      {selected && (
        <>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-zinc-400 hover:text-zinc-700"
            title="Renombrar plantilla"
            aria-label="Renombrar plantilla"
            onClick={() => setFormMode('rename')}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-zinc-400 hover:text-rose-600"
            title="Eliminar plantilla"
            aria-label="Eliminar plantilla"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </>
      )}

      <DashboardTemplateFormDialog
        open={formMode !== null}
        initialName={formMode === 'rename' ? (selected?.name ?? '') : ''}
        loading={create.isPending || update.isPending}
        onSubmit={(name) => void handleSubmit(name)}
        onClose={() => setFormMode(null)}
      />
      <ConfirmDialog
        open={confirmDelete}
        title="Eliminar plantilla"
        description={`Se eliminará "${selected?.name ?? ''}" junto con sus ${selected?.charts_count ?? 0} gráficos. No se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
        loading={remove.isPending}
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
