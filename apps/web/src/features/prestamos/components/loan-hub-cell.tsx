import type { ComponentType, ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';

import { Cell } from '@/components/ui/cell';
import { SectionTitle } from '@/components/ui/section-title';

type HubIcon = ComponentType<{ className?: string }>;

interface LoanHubCellProps {
  to: string;
  icon: HubIcon;
  /** Estado a la derecha del icono (badge o «Al día»). */
  status?: ReactNode;
  title: string;
  description: string;
  detailIcon: HubIcon;
  detail: ReactNode;
  cta: string;
}

/** Celda de acceso del centro de préstamos: toda la celda es un enlace al módulo. */
export function LoanHubCell({ to, icon: Icon, status, title, description, detailIcon: DetailIcon, detail, cta }: LoanHubCellProps) {
  return (
    <Cell to={to}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          <Icon className="h-4 w-4" />
        </span>
        {status}
      </div>
      <div>
        <SectionTitle as="h2">{title}</SectionTitle>
        <p className="mt-1 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">{description}</p>
      </div>
      <div className="flex items-center gap-2 text-[13px] text-zinc-600 dark:text-zinc-400">
        <DetailIcon className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
        <span>{detail}</span>
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-dashed border-zinc-200 pt-3 dark:border-zinc-800">
        <span className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">{cta}</span>
        <ArrowRight
          aria-hidden="true"
          className="h-4 w-4 text-zinc-400 transition-colors duration-150 group-hover:text-zinc-900 dark:group-hover:text-zinc-100"
        />
      </div>
    </Cell>
  );
}
