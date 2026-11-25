import { Check, ChevronUp, Loader2, Users } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/features/auth/context/auth-context';
import { useDemoLogin } from '../hooks/use-demo-login';
import { DEMO_ACCOUNTS } from '../lib/demo-accounts';

/**
 * Botón flotante «Cambiar rol» para presentar el sistema (docs/accesos-demo.md). Solo existe con
 * contraseña de demostración; vive en `AppLayout`, así sirve con el layout de sidebar y el de header.
 */
export function DemoRoleSwitcher() {
  const { user } = useAuth();
  const { enabled, pendingEmail, enterAs } = useDemoLogin();
  if (!enabled || !user) return null;

  const current = DEMO_ACCOUNTS.find((a) => a.email === user.email);

  return (
    <div className="fixed bottom-4 right-4 z-40 print:hidden">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Cambiar rol de demostración"
            disabled={pendingEmail !== null}
            className="flex h-9 items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white/95 dark:bg-zinc-900/95 px-3 text-xs font-medium text-zinc-700 dark:text-zinc-300 shadow-[0_4px_16px_rgb(0_0_0/0.08)] backdrop-blur transition-colors hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer disabled:opacity-60 pointer-coarse:h-11"
          >
            {pendingEmail ? (
              <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Users aria-hidden="true" className="h-3.5 w-3.5 text-zinc-400" />
            )}
            <span>{current ? current.label : 'Cambiar rol'}</span>
            <ChevronUp aria-hidden="true" className="h-3.5 w-3.5 text-zinc-400" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="end" className="w-60">
          <p className="px-2 py-1.5 text-xs text-zinc-500 dark:text-zinc-400">Entrar como (demostración)</p>
          <DropdownMenuSeparator />
          {DEMO_ACCOUNTS.map((account) => {
            const isCurrent = account.email === user.email;
            return (
              <DropdownMenuItem
                key={account.email}
                disabled={isCurrent}
                onSelect={() => void enterAs(account)}
              >
                <span className="flex-1">{account.label}</span>
                <span className="font-mono text-xs text-zinc-400">{account.role}</span>
                {isCurrent && <Check aria-label="Rol actual" className="h-3.5 w-3.5 text-accent" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
