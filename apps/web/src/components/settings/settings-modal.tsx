import { KeyRound, Laptop, Monitor, Moon, Sparkles, Sun } from 'lucide-react';
import { Dialog, DialogCloseButton, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTheme, type ThemePreference } from '@/contexts/theme-context';
import { cn } from '@/lib/cn';
import { SectionLabel } from '@/components/ui/section-label';

export interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  onChangePassword?: () => void;
  onViewSessions?: () => void;
}

const THEME_OPTIONS: Array<{ id: ThemePreference; label: string; icon: typeof Sun }> = [
  { id: 'light', label: 'Claro', icon: Sun },
  { id: 'dark', label: 'Oscuro', icon: Moon },
  { id: 'system', label: 'Sistema', icon: Laptop },
];

export function SettingsModal({ open, onClose, onChangePassword, onViewSessions }: SettingsModalProps) {
  const { theme, setTheme } = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Ajustes del sistema"
      description="Tu cuenta y cómo se ve SGIA en este navegador."
      size="md"
    >
      <div className="flex flex-col gap-4">
        {(onChangePassword || onViewSessions) && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 pb-1 border-b border-zinc-200 dark:border-zinc-800">
              <KeyRound aria-hidden="true" className="h-4 w-4 text-zinc-700 dark:text-zinc-300 shrink-0" />
              <SectionLabel>Cuenta y seguridad</SectionLabel>
            </div>
            <div className="flex flex-wrap gap-2">
              {onChangePassword && (
                <Button variant="secondary" size="sm" onClick={onChangePassword}>
                  <KeyRound aria-hidden="true" className="h-3.5 w-3.5" />
                  Cambiar contraseña
                </Button>
              )}
              {onViewSessions && (
                <Button variant="secondary" size="sm" onClick={onViewSessions}>
                  <Monitor aria-hidden="true" className="h-3.5 w-3.5" />
                  Sesiones activas
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Tema: claro, oscuro o el del sistema */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 pb-1 border-b border-zinc-200 dark:border-zinc-800">
            <Sparkles aria-hidden="true" className="h-4 w-4 text-zinc-700 dark:text-zinc-300 shrink-0" />
            <SectionLabel>Modo de visualización</SectionLabel>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {THEME_OPTIONS.map((item) => {
              const active = theme === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTheme(item.id)}
                  aria-pressed={active}
                  className={cn(
                    'flex items-center justify-center gap-2 px-3 py-2 rounded-md border text-xs font-medium transition-colors cursor-pointer',
                    active
                      ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700',
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <DialogCloseButton>Cerrar</DialogCloseButton>
        </DialogFooter>
      </div>
    </Dialog>
  );
}
