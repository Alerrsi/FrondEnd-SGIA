import { FILTER_CONTROL_CLASS } from '@/components/ui/form-control';
import { SectionLabel } from '@/components/ui/section-label';
import { cn } from '@/lib/cn';
import { useMediaQuery } from '@/lib/use-media-query';

import { REPORT_GROUPS, REPORT_KIND_LABEL, type ReportDefinition } from '../catalog';

export interface ReportCatalogProps {
  reports: ReportDefinition[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
}

/**
 * Catálogo de reportes del rol (docs/centro-reportes.md, decisión 2): agrupado, una línea por reporte con
 * su etiqueta «foto» o «período», dentro de un recuadro como la vista previa, el seleccionado con la barra burdeo del menú. Bajo 1024 px es un selector.
 */
export function ReportCatalog({ reports, selectedId, onSelect }: ReportCatalogProps) {
  const compact = useMediaQuery('(max-width: 1023px)');
  const groups = REPORT_GROUPS.map((group) => ({
    group,
    items: reports.filter((r) => r.group === group),
  })).filter((g) => g.items.length > 0);

  if (compact) {
    return (
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
    );
  }

  return (
    <nav aria-label="Catálogo de reportes" className="flex min-h-0 flex-col gap-3 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-2 [scrollbar-width:thin] dark:border-zinc-800 dark:bg-zinc-900">
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
                      'relative flex h-7 w-full cursor-pointer items-center justify-between gap-2 rounded-md px-2 text-left text-[13px] transition-colors duration-150 pointer-coarse:h-11',
                      active
                        ? 'bg-zinc-100 font-medium text-accent before:absolute before:top-1.5 before:bottom-1.5 before:left-0 before:w-0.5 before:rounded-r before:bg-accent dark:bg-zinc-800'
                        : 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100',
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
  );
}
