import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/features/auth/context/auth-context';
import { apiErrorToMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';
import { demoLoginPassword, type DemoAccount } from '../lib/demo-accounts';
import { getRoleDefaultPath } from '../types/roles';

export interface DemoLogin {
  /** `false` sin contraseña de demostración: no se muestra ningún acceso. */
  enabled: boolean;
  /** Correo de la cuenta con la que se está entrando, mientras dura la petición. */
  pendingEmail: string | null;
  enterAs: (account: DemoAccount) => Promise<void>;
}

/** Entra con una cuenta de demostración en un clic: desde el login o cambiando de rol dentro de la app. */
export function useDemoLogin(): DemoLogin {
  const { user, login, switchAccount } = useAuth();
  const navigate = useNavigate();
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const password = demoLoginPassword();

  const enterAs = useCallback(
    async (account: DemoAccount) => {
      if (!password) return;
      setPendingEmail(account.email);
      try {
        const payload = { email: account.email, password, device_name: 'web' as const };
        const usuario = user ? await switchAccount(payload) : await login(payload);
        toast.success(`Entraste como ${account.label}`);
        navigate(getRoleDefaultPath(usuario.rol), { replace: true });
      } catch (error) {
        toast.error(apiErrorToMessage(error));
      } finally {
        setPendingEmail(null);
      }
    },
    [password, user, login, switchAccount, navigate],
  );

  return { enabled: Boolean(password), pendingEmail, enterAs };
}
