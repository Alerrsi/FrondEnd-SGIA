import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  authKeys,
  configureApiClient,
  login as apiLogin,
  logout as apiLogout,
  useCurrentUser,
} from '@sgia/api-client';
import type { Usuario } from '@sgia/types';
import { useQueryClient } from '@tanstack/react-query';

import { tokenStorage } from '@/config/api';

interface AuthContextValue {
  user: Usuario | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<Usuario>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  // undefined = leyendo SecureStore (restauración de sesión)
  const [token, setToken] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    Promise.resolve(tokenStorage.getToken()).then(setToken, () => setToken(null));
  }, []);

  const { data: currentUser, isLoading: isUserLoading, isError } = useCurrentUser({
    enabled: Boolean(token),
  });

  const clearSession = useCallback(async () => {
    await tokenStorage.clearToken();
    setToken(null);
    qc.clear();
  }, [qc]);

  useEffect(() => {
    configureApiClient({ tokenStorage, onUnauthorized: () => void clearSession() });
  }, [clearSession]);

  const user = token && currentUser?.rol === 'PRO-01' ? currentUser : null;

  // Token restaurado inválido, o de un rol que no es profesor
  useEffect(() => {
    if (token && (isError || (currentUser && currentUser.rol !== 'PRO-01'))) {
      void Promise.resolve(tokenStorage.clearToken()).then(() => {
        setToken(null);
        qc.clear();
      });
    }
  }, [token, isError, currentUser, qc]);

  const login = useCallback(
    async (email: string, password: string) => {
      const usuario = await apiLogin({ email, password, device_name: 'mobile' }, tokenStorage);
      if (usuario.rol !== 'PRO-01') {
        await apiLogout(tokenStorage).catch(() => undefined);
        throw new Error('Acceso restringido: la app móvil es solo para profesores.');
      }
      qc.setQueryData(authKeys.currentUser, usuario);
      setToken(await tokenStorage.getToken());
      return usuario;
    },
    [qc],
  );

  const logout = useCallback(async () => {
    try {
      await apiLogout(tokenStorage);
    } finally {
      setToken(null);
      qc.clear();
    }
  }, [qc]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading: token === undefined || (Boolean(token) && isUserLoading),
      login,
      logout,
    }),
    [user, token, isUserLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  return context;
}
