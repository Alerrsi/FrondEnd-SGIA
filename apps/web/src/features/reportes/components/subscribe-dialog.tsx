import { useId, useState } from 'react';
import { useCareers, useCreateReportSubscription, useStorerooms } from '@sgia/api-client';
import type { ReportSubscriptionFrequency } from '@sgia/types';

import { Button } from '@/components/ui/button';
import { Dialog, DialogCloseButton, DialogFooter } from '@/components/ui/dialog';
import { apiErrorToMessage } from '@/lib/api-error';
import { cn } from '@/lib/cn';
import { toast } from '@/lib/toast';

import type { ReportDefinition } from '../catalog';
import type { ReportFilterValues } from '../lib/report-params';
import { describeFilters, FREQUENCIES, FREQUENCY_LABEL, frequencyOption } from '../lib/subscription';
import { MailDisabledNotice } from './mail-disabled-notice';

export interface SubscribeDialogProps {
  open: boolean;
  onClose: () => void;
  report: ReportDefinition;
  values: ReportFilterValues;
  /** Filtros que se guardan (sin período). */
  params: Record<string, string | number | boolean>;
  mailEnabled: boolean;
}

/** «Recibir por correo» (docs/suscripcion-reportes.md, decisión 1): frecuencia y los filtros elegidos. */
export function SubscribeDialog({ open, onClose, ...props }: SubscribeDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Recibir por correo" description={props.report.title} size="sm">
      <SubscribeForm onClose={onClose} {...props} />
    </Dialog>
  );
}

// Aparte para que cada apertura parta de cero (el contenido del modal se desmonta al cerrar).
function SubscribeForm({ onClose, report, values, params, mailEnabled }: Omit<SubscribeDialogProps, 'open'>) {
  const name = useId();
  const [frequency, setFrequency] = useState<ReportSubscriptionFrequency>('monthly');
  const create = useCreateReportSubscription();
  const careers = useCareers({ per_page: 100 });
  const storerooms = useStorerooms({ per_page: 100 });
  const filters = describeFilters(report, values, {
    careers: careers.data?.data ?? [],
    storerooms: storerooms.data?.data ?? [],
  });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await create.mutateAsync({ report_id: report.id, title: report.title, path: report.path, params, frequency });
      toast.success(`Suscripción ${FREQUENCY_LABEL[frequency]} creada: ${report.title}`);
      onClose();
    } catch {
      // El mensaje queda en el formulario.
    }
  };

  return (
    <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-4">
      {!mailEnabled && <MailDisabledNotice />}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-[13px] font-medium text-zinc-900 dark:text-zinc-100">Frecuencia</legend>
        {FREQUENCIES.map((value) => {
          const option = frequencyOption(report, value);
          return (
            <label
              key={value}
              className={cn(
                'flex cursor-pointer items-start gap-2.5 rounded-md border px-3 py-2',
                frequency === value ? 'border-accent bg-accent-soft' : 'border-zinc-200 dark:border-zinc-800',
              )}
            >
              <input
                type="radio"
                name={name}
                value={value}
                checked={frequency === value}
                onChange={() => setFrequency(value)}
                className="mt-0.5 accent-[var(--color-accent)]"
              />
              <span className="flex flex-col">
                <span className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">{option.title}</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">{option.description}</span>
              </span>
            </label>
          );
        })}
      </fieldset>

      <div className="flex flex-col gap-1 text-[13px]">
        <span className="font-medium text-zinc-900 dark:text-zinc-100">Filtros que se guardan</span>
        {filters.length === 0 ? (
          <span className="text-zinc-500 dark:text-zinc-400">Ninguno: reporte completo.</span>
        ) : (
          <ul className="text-zinc-600 dark:text-zinc-300">
            {filters.map((f) => (
              <li key={f.label}>
                {f.label}: {f.text}
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {report.kind === 'period' ? 'El período se calcula en cada envío. ' : ''}Llega a tu correo a las 07:00 de Chile.
        </p>
        {report.personal && (
          <p className="text-xs text-zinc-700 dark:text-zinc-300">
            Llega solo el resumen y un enlace; el archivo se descarga en SGIA.
          </p>
        )}
      </div>

      {create.error && (
        <p role="alert" className="text-[13px] text-danger">
          {apiErrorToMessage(create.error)}
        </p>
      )}

      <DialogFooter>
        <DialogCloseButton disabled={create.isPending} />
        <Button type="submit" size="sm" disabled={create.isPending} aria-busy={create.isPending || undefined}>
          {create.isPending ? 'Guardando…' : 'Suscribirme'}
        </Button>
      </DialogFooter>
    </form>
  );
}
