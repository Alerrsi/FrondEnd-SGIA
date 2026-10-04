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
  type LoginPayload,
} from '@sgia/api-client';
import type { Usuario } from '@sgia/types';
import { useQueryClient } from '@tanstack/react-query';

import { tokenStorage } from '@/config/api';
import { isWebRole } from '../types/roles';

interface AuthContextValue {
  user: Usuario | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<Usuario>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [token, setToken] = useState<string | null>(() => {
    const stored = tokenStorage.getToken();
    return typeof stored === 'string' ? stored : null;
  });

  const {
    data: currentUser,
    isLoading: isUserLoading,
    isError: isUserError,
  } = useCurrentUser({
    enabled: Boolean(token),
  });

  // Handle unauthorized/401 automatically across API calls
  const handleUnauthorized = useCallback(() => {
    tokenStorage.clearToken();
    setToken(null);
    qc.setQueryData(authKeys.currentUser, null);
    qc.clear();
  }, [qc]);

  useEffect(() => {
    configureApiClient({
      tokenStorage,
      onUnauthorized: handleUnauthorized,
    });
  }, [handleUnauthorized]);

  // If token was present but fetching user resulted in error, clear token
  useEffect(() => {
    if (token && isUserError) {
      handleUnauthorized();
    }
  }, [token, isUserError, handleUnauthorized]);

  const user = token && currentUser ? currentUser : null;
  const isAuthenticated = Boolean(user);
  const isLoading = Boolean(token) && isUserLoading;

  const login = useCallback(
    async (payload: LoginPayload): Promise<Usuario> => {
      const usuario = await apiLogin(payload, tokenStorage);

      if (!isWebRole(usuario.rol)) {
        await tokenStorage.clearToken();
        throw new Error(
          `Acceso restringido: el rol ${usuario.rol} debe acceder exclusivamente a través de la aplicación móvil de SGIA.`,
        );
      }

      const storedToken = tokenStorage.getToken();
      setToken(typeof storedToken === 'string' ? storedToken : null);
      qc.setQueryData(authKeys.currentUser, usuario);
      return usuario;
    },
    [qc],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await apiLogout(tokenStorage);
    } finally {
      setToken(null);
      qc.setQueryData(authKeys.currentUser, null);
      qc.clear();
    }
  }, [qc]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated,
      isLoading,
      login,
      logout,
    }),
    [user, token, isAuthenticated, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
