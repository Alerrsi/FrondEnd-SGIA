import { useState } from 'react';
import { Mail, Pause, Play, Send, Trash2 } from 'lucide-react';
import {
  useDeleteReportSubscription,
  useReportSubscriptions,
  useSendReportSubscription,
  useUpdateReportSubscription,
} from '@sgia/api-client';
import type { ReportSubscription, ReportSubscriptionStatus } from '@sgia/types';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { SkeletonList } from '@/components/ui/skeleton-list';
import { apiErrorToMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';

import { formatReportCell } from '../lib/format-cell';
import { FREQUENCY_LABEL } from '../lib/subscription';
import { MailDisabledNotice } from './mail-disabled-notice';

export interface MySubscriptionsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_LABEL: Record<ReportSubscriptionStatus, string> = {
  sent: 'enviado',
  empty: 'sin movimientos',
  failed: 'falló',
};

function filtersText(filters: Record<string, string>): string {
  const parts = Object.entries(filters).map(([label, value]) => `${label}: ${value}`);
  return parts.length > 0 ? parts.join(' · ') : 'Reporte completo';
}

function lastSendText(subscription: ReportSubscription): string {
  if (!subscription.last_status) return 'Aún no se envía';
  const when = subscription.last_sent_at ? ` ${formatReportCell(subscription.last_sent_at, 'datetime')}` : '';
  // Un fallo no cambia `last_sent_at`: la fecha es la del último envío que sí salió.
  if (subscription.last_status === 'failed') return `El último intento falló${when ? ` · envío anterior:${when}` : ''}`;
  return `Último:${when} · ${STATUS_LABEL[subscription.last_status]}`;
}

/** «Mis suscripciones» (docs/suscripcion-reportes.md): pausar, «Enviar ahora» y quitar. */
export function MySubscriptions({ open, onOpenChange }: MySubscriptionsProps) {
  const { data, isLoading, isError, refetch } = useReportSubscriptions({ enabled: open });
  const update = useUpdateReportSubscription();
  const send = useSendReportSubscription();
  const remove = useDeleteReportSubscription();
  const [toRemove, setToRemove] = useState<ReportSubscription | null>(null);

  const toggle = async (s: ReportSubscription) => {
    try {
      await update.mutateAsync({ id: s.id, is_active: !s.is_active });
      toast.success(s.is_active ? `Pausada: ${s.title}` : `Reanudada: ${s.title}`);
    } catch (error) {
      toast.error({ title: 'No se pudo cambiar la suscripción', description: apiErrorToMessage(error) });
    }
  };

  const sendNow = async (s: ReportSubscription) => {
    try {
      await send.mutateAsync(s.id);
      toast.success(`Enviando a tu correo: ${s.title}`);
    } catch (error) {
      toast.error({ title: 'No se pudo enviar el reporte', description: apiErrorToMessage(error) });
    }
  };

  const confirmRemove = async () => {
    if (!toRemove) return;
    try {
      await remove.mutateAsync(toRemove.id);
      toast.success(`Suscripción quitada: ${toRemove.title}`);
      setToRemove(null);
    } catch (error) {
      toast.error({ title: 'No se pudo quitar la suscripción', description: apiErrorToMessage(error) });
    }
  };

  const subscriptions = data?.data ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>
            <Mail aria-hidden="true" className="h-4 w-4 text-zinc-500" />
            Mis suscripciones
          </SheetTitle>
          <SheetDescription>Reportes que te llegan por correo. «Enviar ahora» manda el último período completo.</SheetDescription>
        </SheetHeader>

        {data && !data.mail_enabled && <MailDisabledNotice />}

        {isLoading ? (
          <SkeletonList label="Cargando tus suscripciones…" rows={4} columns={2} />
        ) : isError ? (
          <ErrorState
            action={
              <Button variant="secondary" size="sm" onClick={() => refetch()}>
                Reintentar
              </Button>
            }
          >
            No se pudieron cargar tus suscripciones.
          </ErrorState>
        ) : subscriptions.length === 0 ? (
          <EmptyState icon={Mail} title="Sin suscripciones" description="Elige un reporte y pulsa «Recibir por correo»." />
        ) : (
          <ul className="flex flex-col">
            {subscriptions.map((s) => (
              <li key={s.id} className="flex flex-col gap-1 border-b border-zinc-200 py-2.5 last:border-b-0 dark:border-zinc-800">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">{s.title}</span>
                  <Badge tone="neutral">{FREQUENCY_LABEL[s.frequency]}</Badge>
                  {!s.is_active && <Badge tone="neutral">pausada</Badge>}
                </div>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">{filtersText(s.filters)}</span>
                <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                  {s.next_send_at ? `Próximo: ${formatReportCell(s.next_send_at, 'datetime')}` : 'Sin próximo envío'}
                </span>
                <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{lastSendText(s)}</span>
                {s.paused_reason && <span className="text-xs text-danger">{s.paused_reason}</span>}
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => void toggle(s)}
                    disabled={update.isPending}
                    aria-label={`${s.is_active ? 'Pausar' : 'Reanudar'} ${s.title}`}
                  >
                    {s.is_active ? (
                      <Pause aria-hidden="true" className="h-3.5 w-3.5" />
                    ) : (
                      <Play aria-hidden="true" className="h-3.5 w-3.5" />
                    )}
                    {s.is_active ? 'Pausar' : 'Reanudar'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => void sendNow(s)}
                    disabled={send.isPending}
                    aria-label={`Enviar ahora ${s.title}`}
                  >
                    <Send aria-hidden="true" className="h-3.5 w-3.5" />
                    Enviar ahora
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setToRemove(s)} aria-label={`Quitar ${s.title}`}>
                    <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                    Quitar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <ConfirmDialog
          open={toRemove !== null}
          title="Quitar suscripción"
          description={`Dejarás de recibir «${toRemove?.title ?? ''}» por correo.`}
          confirmLabel="Quitar suscripción"
          variant="danger"
          loading={remove.isPending}
          onConfirm={() => void confirmRemove()}
          onCancel={() => setToRemove(null)}
        />
      </SheetContent>
    </Sheet>
  );
}
