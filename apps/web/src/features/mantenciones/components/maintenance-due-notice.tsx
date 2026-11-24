import type { EquipmentUnit } from '@sgia/types';
import { AlertTriangle } from 'lucide-react';

import { CODE_CHIP_CLASS } from '@/components/ui/typography';

export interface MaintenanceDueNoticeProps {
  total: number;
  units: Pick<EquipmentUnit, 'id' | 'code'>[];
}

/** Unidades con la mantención vencida (docs/mantenciones-por-carrera.md, decisión 11): franja neutra y compacta. */
export function MaintenanceDueNotice({ total, units }: MaintenanceDueNoticeProps) {
  const rest = total - units.length;
  return (
    <section
      aria-label="Unidades con mantención vencida"
      className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-[13px] dark:border-zinc-800 dark:bg-zinc-900"
    >
      <span className="flex items-center gap-2 font-medium text-zinc-900 dark:text-zinc-100">
        <AlertTriangle aria-hidden="true" className="h-4 w-4 shrink-0 text-accent" />
        {total === 1 ? '1 unidad con la mantención vencida' : `${total} unidades con la mantención vencida`}
      </span>
      <ul aria-label="Unidades vencidas" className="flex flex-wrap items-center gap-1.5">
        {units.map((u) => (
          <li key={u.id} className={CODE_CHIP_CLASS}>
            {u.code}
          </li>
        ))}
        {rest > 0 && <li className="text-zinc-500 dark:text-zinc-400">y {rest} más</li>}
      </ul>
      <span className="text-zinc-500 dark:text-zinc-400">Envíalas desde Inventario → unidades del producto.</span>
    </section>
  );
}
