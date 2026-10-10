import { Check, Laptop, Moon, Palette, Sparkles, Sun } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTheme, type ColorPalette, type ThemePreference } from '@/contexts/theme-context';
import { cn } from '@/lib/cn';

export interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

interface PaletteOption {
  id: ColorPalette;
  name: string;
  badge: string;
  description: string;
  swatches: Array<{ name: string; hex: string; role?: string }>;
}

const PALETTE_OPTIONS: PaletteOption[] = [
  {
    id: 'default',
    name: 'Paleta Principal (Industrial INACAP)',
    badge: 'Predeterminada',
    description:
      'Estética técnica y densa de ingeniería basada en escala neutra Zinc, acento institucional INACAP y estados semánticos estandarizados.',
    swatches: [
      { name: 'Canvas Zinc', hex: '#f4f4f5', role: 'Fondo' },
      { name: 'Superficie', hex: '#ffffff', role: 'Panel' },
      { name: 'Acento INACAP', hex: '#dc2626', role: 'Institucional' },
      { name: 'Disponible / Activo', hex: '#10b981', role: 'Óptimo' },
      { name: 'En Préstamo', hex: '#3b82f6', role: 'Asignado' },
      { name: 'Stock Crítico', hex: '#f43f5e', role: 'Alerta' },
      { name: 'Mantención', hex: '#f59e0b', role: 'Taller' },
      { name: 'Zinc Oscuro', hex: '#18181b', role: 'Texto/Canvas' },
    ],
  },
  {
    id: 'b1',
    name: 'Paleta B1 (Azul Acero & Indigo)',
    badge: 'Alternativa B1',
    description:
      'Esquema cromático de alta concentración basado en tonos aeroespaciales e industriales de AGENTS.md (Smart Blue, Steel Azure, Prussian Blue y Cool Steel).',
    swatches: [
      { name: 'Smart Blue', hex: '#0466c8', role: 'Acento Principal' },
      { name: 'Steel Azure', hex: '#0353a4', role: 'Acción Secundaria' },
      { name: 'Regal Navy', hex: '#023e7d', role: 'Superficie Profunda' },
      { name: 'Prussian Blue', hex: '#002855', role: 'Base Nocturna' },
      { name: 'Twilight Indigo', hex: '#33415c', role: 'Bordes / Divisores' },
      { name: 'Blue Slate', hex: '#5c677d', role: 'Metadatos' },
      { name: 'Slate Grey', hex: '#7d8597', role: 'Neutro Frío' },
      { name: 'Cool Steel', hex: '#979dac', role: 'Detalle Técnico' },
    ],
  },
];

const THEME_OPTIONS: Array<{ id: ThemePreference; label: string; icon: typeof Sun }> = [
  { id: 'light', label: 'Claro', icon: Sun },
  { id: 'dark', label: 'Oscuro', icon: Moon },
  { id: 'system', label: 'Sistema', icon: Laptop },
];

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { palette, setPalette, theme, setTheme } = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Ajustes del Sistema"
      description="Personaliza las preferencias cromáticas y la apariencia visual de la consola SGIA."
      className="max-w-2xl w-full"
    >
      <div className="flex flex-col gap-6 py-2">
        {/* Apartado 1: Paleta de Colores */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 pb-1 border-b border-zinc-200 dark:border-zinc-800">
            <Palette className="h-4 w-4 text-zinc-700 dark:text-zinc-300 shrink-0" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Paleta de Colores de Interfaz
            </h3>
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Selecciona la identidad cromática del sistema. Ambas configuraciones cumplen con normas de
            ergonomía visual para jornadas de alta densidad operativa.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            {PALETTE_OPTIONS.map((opt) => {
              const isSelected = palette === opt.id;
              return (
                <div
                  key={opt.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setPalette(opt.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setPalette(opt.id);
                    }
                  }}
                  className={cn(
                    'group relative flex flex-col justify-between rounded-lg border p-3.5 text-left transition-all cursor-pointer select-none',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100',
                    isSelected
                      ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-50/80 dark:bg-zinc-900/90 shadow-xs ring-1 ring-zinc-900/10 dark:ring-zinc-100/20'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/40 dark:hover:bg-zinc-900/40',
                  )}
                  aria-pressed={isSelected}
                  aria-label={`Seleccionar ${opt.name}`}
                >
                  <div className="flex flex-col gap-2 min-w-0">
                    {/* Header de la Tarjeta */}
                    <div className="flex items-start justify-between gap-2 min-w-0">
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {opt.name}
                        </span>
                        <span className="inline-block mt-0.5 text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                          {opt.badge}
                        </span>
                      </div>

                      <div
                        className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                          isSelected
                            ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                            : 'border-zinc-300 dark:border-zinc-700 bg-transparent text-transparent group-hover:border-zinc-400',
                        )}
                        aria-hidden="true"
                      >
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                    </div>

                    {/* Descripción de la paleta */}
                    <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400 line-clamp-2">
                      {opt.description}
                    </p>
                  </div>

                  {/* Muestrario de Chips Cromáticos (Swatches) */}
                  <div className="mt-3 pt-2.5 border-t border-zinc-200/70 dark:border-zinc-800/80">
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-500 mb-1.5 font-mono">
                      <span>Muestrario de tonos</span>
                      <span className="tabular-nums">{opt.swatches.length} tonos</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap" role="list">
                      {opt.swatches.map((swatch) => (
                        <div
                          key={swatch.hex + swatch.name}
                          role="listitem"
                          title={`${swatch.name} (${swatch.hex})${swatch.role ? ` - ${swatch.role}` : ''}`}
                          className="h-5 w-5 rounded shrink-0 border border-black/10 dark:border-white/10 shadow-2xs transition-transform group-hover:scale-105"
                          style={{ backgroundColor: swatch.hex }}
                          aria-label={`${swatch.name}: ${swatch.hex}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Apartado 2: Tema (Claro, Oscuro, Sistema) */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 pb-1 border-b border-zinc-200 dark:border-zinc-800">
            <Sparkles className="h-4 w-4 text-zinc-700 dark:text-zinc-300 shrink-0" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Modo de Visualización
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
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
                    'flex items-center justify-center gap-2 px-3 py-2 rounded-md border text-xs font-medium transition-all cursor-pointer',
                    active
                      ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold shadow-xs'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/80',
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800 pt-3">
        <Button variant="outline" size="sm" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </Dialog>
  );
}
