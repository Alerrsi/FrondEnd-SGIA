import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme, type ThemePreference } from '@/contexts/theme-context';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';

interface ThemeToggleProps {
  variant?: 'compact' | 'segmented';
  className?: string;
}

export function ThemeToggle({ variant = 'compact', className }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme, isSystem } = useTheme();

  if (variant === 'segmented') {
    const options: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
      { value: 'system', label: 'Automático (SO)', icon: Monitor },
      { value: 'light', label: 'Claro', icon: Sun },
      { value: 'dark', label: 'Oscuro', icon: Moon },
    ];

    return (
      <div
        className={cn(
          'inline-flex items-center rounded-md border border-border bg-background p-0.5',
          className,
        )}
        role="group"
        aria-label="Selector de tema visual"
      >
        {options.map((opt) => {
          const Icon = opt.icon;
          const isActive = theme === opt.value;
          return (
            <Tooltip key={opt.value}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setTheme(opt.value)}
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded transition cursor-pointer text-xs',
                    isActive
                      ? 'bg-surface text-text shadow-xs border border-border font-semibold'
                      : 'text-text-muted hover:text-text hover:bg-surface-raised',
                  )}
                  aria-pressed={isActive}
                  aria-label={opt.label}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <span className="text-xs font-medium">{opt.label}</span>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    );
  }

  // Modo compacto (botón individual que cicla y muestra icono descriptivo)
  let tooltipText = 'Modo: Automático (Sigue al sistema)';
  let CurrentIcon = Monitor;

  if (theme === 'light') {
    tooltipText = 'Modo: Claro (Clic para cambiar a Oscuro)';
    CurrentIcon = Sun;
  } else if (theme === 'dark') {
    tooltipText = 'Modo: Oscuro (Clic para cambiar a Automático)';
    CurrentIcon = Moon;
  } else {
    tooltipText = `Modo: Automático (Resolución: ${resolvedTheme === 'dark' ? 'Oscuro' : 'Claro'})`;
    CurrentIcon = Monitor;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={toggleTheme}
          title={tooltipText}
          aria-label={tooltipText}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded border border-border text-text-muted transition-colors hover:bg-surface-raised hover:text-text cursor-pointer',
            isSystem && 'text-text',
            className,
          )}
        >
          <CurrentIcon className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">
        <span className="text-xs font-medium">{tooltipText}</span>
      </TooltipContent>
    </Tooltip>
  );
}
