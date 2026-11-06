import { useRevokeOtherTokens, useTokens } from '@sgia/api-client';
import { Loader2, Monitor, Smartphone } from 'lucide-react';
import { formatDateTime } from '@/lib/format';

import { Button } from '@/components/ui/button';
import { Dialog, DialogCloseButton } from '@/components/ui/dialog';
import { apiErrorToMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';

const formatDate = formatDateTime;

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
      <div className="flex flex-col gap-3 text-text">
        {isLoading && <p className="text-xs text-text-muted">Cargando sesiones…</p>}
        {isError && <p className="text-xs text-danger">No se pudieron cargar las sesiones.</p>}

        <ul className="divide-y divide-border/60 rounded-md border border-border">
          {tokens.map((token) => {
            const Icon = token.device_name === 'mobile' ? Smartphone : Monitor;
            return (
              <li key={token.id} className="flex items-center gap-3 px-3 py-2.5 text-xs">
                <Icon className="h-4 w-4 shrink-0 text-text-muted" aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="font-medium capitalize">{token.device_name ?? token.name}</div>
                  <div className="font-mono text-xs text-text-muted">
                    Último uso {formatDate(token.last_used_at)}
                  </div>
                </div>
                <div className="text-right font-mono text-xs text-text-muted">
                  Vence {formatDate(token.expires_at)}
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-1 flex justify-end gap-2 border-t border-border pt-3">
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
