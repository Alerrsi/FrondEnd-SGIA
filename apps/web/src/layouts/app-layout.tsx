import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROLE_LABELS, type RoleCode } from '@sgia/types';

import { SettingsModal } from '@/components/settings/settings-modal';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useLayoutPreference } from '@/contexts/layout-context';
import { useAuth } from '@/features/auth/context/auth-context';
import { ChangePasswordDialog } from '@/features/auth/components/change-password-dialog';
import { DemoRoleSwitcher } from '@/features/auth/components/demo-role-switcher';
import { SessionsDialog } from '@/features/auth/components/sessions-dialog';
import { canAccessRoute, type WebRoleCode } from '@/features/auth/types/roles';
import { toast } from '@/lib/toast';
import { CommandPalette } from './command-palette';
import { HeaderLayout } from './header-layout';
import { navForRole } from './nav-config';
import { ShortcutsDialog } from './shortcuts-dialog';
import { SidebarLayout } from './sidebar-layout';
import { useGlobalShortcuts } from './use-global-shortcuts';

/**
 * Contenedor de la app autenticada (rediseño «Trazo»): elige el layout del usuario (sidebar o header,
 * en Ajustes) y monta lo común a ambos: buscador `Ctrl K`, atajos, ajustes, contraseña y sesiones.
 */
export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { layout } = useLayoutPreference();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const openHelp = useCallback(() => setHelpOpen(true), []);
  useGlobalShortcuts({ onSearch: openPalette, onHelp: openHelp });

  const role = (user?.rol as WebRoleCode) ?? 'PAN-01';
  const entries = useMemo(() => navForRole(role), [role]);
  const nombre = user?.nombre ?? 'Usuario';
  const shellUser = {
    nombre,
    roleLabel: ROLE_LABELS[role as RoleCode] ?? role,
    initials: nombre
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase(),
  };

  const handleLogout = () => {
    logout();
    toast.info('Sesión cerrada correctamente');
    navigate('/login');
  };

  const shell = {
    entries,
    user: shellUser,
    showBell: canAccessRoute(role, '/alertas'),
    onSearch: openPalette,
    onOpenSettings: () => setSettingsOpen(true),
    onLogout: handleLogout,
  };

  return (
    <TooltipProvider>
      {layout === 'header' ? <HeaderLayout {...shell} /> : <SidebarLayout {...shell} />}

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} role={role} />
      <ShortcutsDialog open={helpOpen} onClose={() => setHelpOpen(false)} role={role} />
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onChangePassword={() => {
          setSettingsOpen(false);
          setPasswordOpen(true);
        }}
        onViewSessions={() => {
          setSettingsOpen(false);
          setSessionsOpen(true);
        }}
      />
      <ChangePasswordDialog open={passwordOpen} onClose={() => setPasswordOpen(false)} />
      <SessionsDialog open={sessionsOpen} onClose={() => setSessionsOpen(false)} />
      <DemoRoleSwitcher />
    </TooltipProvider>
  );
}
