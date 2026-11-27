import type { LucideIcon } from 'lucide-react';

import { FILTER_CONTROL_CLASS } from '@/components/ui/form-control';
import { SectionLabel } from '@/components/ui/section-label';
import { cn } from '@/lib/cn';
import { useMediaQuery } from '@/lib/use-media-query';

import { REPORT_GROUPS, REPORT_KIND_LABEL, type ReportDefinition } from '../catalog';

export interface ReportCatalogProps {
  reports: ReportDefinition[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  /** Lo propio del usuario («Mis suscripciones», «Mis descargas»), fijo al pie del catálogo. */
  shortcuts?: CatalogShortcut[];
}

export interface CatalogShortcut {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  /** Cantidad a la derecha; no se muestra si es 0. */
  count?: number;
}

const ITEM_CLASS =
  'flex h-7 w-full cursor-pointer items-center gap-2 rounded-md px-2 text-left text-[13px] transition-colors duration-150 pointer-coarse:h-11';

const IDLE_CLASS =
  'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100';

function Shortcuts({ items, className }: { items: CatalogShortcut[]; className?: string }) {
  return (
    <ul className={className}>
      {items.map(({ label, icon: Icon, onClick, count }) => (
        <li key={label}>
          <button type="button" onClick={onClick} className={cn(ITEM_CLASS, IDLE_CLASS)}>
            <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
            <span className="min-w-0 flex-1 truncate">{label}</span>
            {Boolean(count) && <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">{count}</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}

/**
 * Catálogo de reportes del rol (docs/centro-reportes.md, decisión 2): agrupado, una línea por reporte con
 * su etiqueta «foto» o «período», dentro de un recuadro como la vista previa, el seleccionado con la barra burdeo del menú. Bajo 1024 px es un selector, con los accesos debajo.
 */
export function ReportCatalog({ reports, selectedId, onSelect, shortcuts = [] }: ReportCatalogProps) {
  const compact = useMediaQuery('(max-width: 1023px)');
  const groups = REPORT_GROUPS.map((group) => ({
    group,
    items: reports.filter((r) => r.group === group),
  })).filter((g) => g.items.length > 0);

  if (compact) {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="flex flex-col gap-1.5">
          <span className="sr-only">Reporte</span>
          <select
            aria-label="Reporte"
            value={selectedId ?? ''}
            onChange={(e) => onSelect(e.target.value)}
            className={cn(FILTER_CONTROL_CLASS, 'w-full')}
          >
            {groups.map(({ group, items }) => (
              <optgroup key={group} label={group}>
                {items.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title} ({REPORT_KIND_LABEL[r.kind]})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <Shortcuts items={shortcuts} className="flex flex-wrap gap-1" />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-col rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <nav aria-label="Catálogo de reportes" className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-2 [scrollbar-width:thin]">
        {groups.map(({ group, items }) => (
          <div key={group} className="flex flex-col gap-0.5">
            <SectionLabel as="h2" className="px-2 pt-1">
              {group}
            </SectionLabel>
            <ul className="flex flex-col">
              {items.map((r) => {
                const active = r.id === selectedId;
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(r.id)}
                      aria-current={active ? 'true' : undefined}
                      className={cn(
                        ITEM_CLASS,
                        'relative justify-between',
                        active
                          ? 'bg-zinc-100 font-medium text-accent before:absolute before:top-1.5 before:bottom-1.5 before:left-0 before:w-0.5 before:rounded-r before:bg-accent dark:bg-zinc-800'
                          : IDLE_CLASS,
                      )}
                    >
                      <span className="min-w-0 truncate">{r.title}</span>
                      <span className="shrink-0 text-xs font-normal text-zinc-500 dark:text-zinc-400">
                        {REPORT_KIND_LABEL[r.kind]}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      {shortcuts.length > 0 && <Shortcuts items={shortcuts} className="shrink-0 border-t border-zinc-200 p-2 dark:border-zinc-800" />}
    </div>
  );
}
