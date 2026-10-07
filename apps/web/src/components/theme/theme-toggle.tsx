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
          'inline-flex items-center rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-950/60 p-0.5',
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
                    'flex h-6 w-6 items-center justify-center rounded transition-all cursor-pointer text-xs',
                    isActive
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs border border-zinc-200/80 dark:border-zinc-700 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50',
                  )}
                  aria-pressed={isActive}
                  aria-label={opt.label}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <span className="text-[11px] font-medium">{opt.label}</span>
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
            'flex h-7 w-7 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer',
            isSystem && 'text-red-600 dark:text-red-400',
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
