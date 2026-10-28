import { useRevokeOtherTokens, useTokens } from '@sgia/api-client';
import { Loader2, Monitor, Smartphone } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogCloseButton } from '@/components/ui/dialog';
import { apiErrorToMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';

function formatDate(iso?: string | null): string {
  return iso ? new Date(iso).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' }) : '—';
}

export function SessionsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: tokens = [], isLoading, isError } = useTokens({ enabled: open });
  const revokeOthers = useRevokeOtherTokens();

  const handleRevokeOthers = async () => {
    try {
      await revokeOthers.mutateAsync();
      toast.success('Se cerraron las demás sesiones.');
    } catch (error) {
      toast.error(apiErrorToMessage(error));
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Sesiones activas"
      description="Dispositivos con la sesión abierta en tu cuenta."
      className="max-w-lg"
    >
      <div className="flex flex-col gap-3 text-zinc-900 dark:text-zinc-100">
        {isLoading && <p className="text-xs text-zinc-500 dark:text-zinc-400">Cargando sesiones…</p>}
        {isError && <p className="text-xs text-red-600 dark:text-red-400">No se pudieron cargar las sesiones.</p>}

        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/60 rounded-md border border-zinc-200 dark:border-zinc-800">
          {tokens.map((token) => {
            const Icon = token.device_name === 'mobile' ? Smartphone : Monitor;
            return (
              <li key={token.id} className="flex items-center gap-3 px-3 py-2.5 text-xs">
                <Icon className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="font-medium capitalize">{token.device_name ?? token.name}</div>
                  <div className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                    Último uso {formatDate(token.last_used_at)}
                  </div>
                </div>
                <div className="text-right font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                  Vence {formatDate(token.expires_at)}
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-1 flex justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
          <DialogCloseButton className="text-xs">Cerrar</DialogCloseButton>
          <Button
            variant="primary"
            className="text-xs"
            disabled={revokeOthers.isPending || tokens.length < 2}
            onClick={handleRevokeOthers}
          >
            {revokeOthers.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Cerrar otras sesiones
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
