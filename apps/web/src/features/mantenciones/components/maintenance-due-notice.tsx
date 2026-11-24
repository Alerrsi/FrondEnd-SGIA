import type { EquipmentUnit } from '@sgia/types';
import { AlertTriangle } from 'lucide-react';

import { CODE_CHIP_CLASS } from '@/components/ui/typography';

export interface MaintenanceDueNoticeProps {
  total: number;
  units: Pick<EquipmentUnit, 'id' | 'code'>[];
}

/** Unidades con la mantención vencida (docs/mantenciones-por-carrera.md, decisión 5): tokens `warn`, sin ámbar a mano. */
export function MaintenanceDueNotice({ total, units }: MaintenanceDueNoticeProps) {
  const rest = total - units.length;
  return (
    <section
      aria-label="Unidades con mantención vencida"
      className="flex gap-3 rounded-lg border border-warn/30 bg-warn-bg px-4 py-3"
    >
      <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
      <div className="flex min-w-0 flex-col gap-2">
        <p className="text-sm font-medium text-warn">
          {total === 1 ? '1 unidad con la mantención vencida' : `${total} unidades con la mantención vencida`}
        </p>
        <ul aria-label="Unidades vencidas" className="flex flex-wrap gap-1.5">
          {units.map((u) => (
            <li key={u.id} className={CODE_CHIP_CLASS}>
              {u.code}
            </li>
          ))}
          {rest > 0 && <li className="text-[13px] text-zinc-600 dark:text-zinc-300">y {rest} más</li>}
        </ul>
        <p className="text-[13px] text-zinc-600 dark:text-zinc-300">Envíalas a mantención desde Inventario → unidades del producto.</p>
      </div>
    </section>
  );
}
