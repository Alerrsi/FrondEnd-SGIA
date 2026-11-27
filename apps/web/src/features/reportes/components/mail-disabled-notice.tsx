import { MailWarning } from 'lucide-react';

/** Aviso fijo cuando el servidor no entrega correos (docs/suscripcion-reportes.md, decisión 13). */
export function MailDisabledNotice() {
  return (
    <p className="flex items-start gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-[13px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-300">
      <MailWarning aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
      El envío por correo no está configurado en este servidor.
    </p>
  );
}
