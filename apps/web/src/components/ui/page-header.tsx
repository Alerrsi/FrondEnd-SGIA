import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';
import { PageHeading } from './page-heading';
import type { HeadingIcon } from './typography';

export interface PageHeaderProps {
  icon?: HeadingIcon;
  title: ReactNode;
  /** Subtítulo: toda página lleva uno. */
  description?: ReactNode;
  /** Junto al título (badge de estado en un detalle). */
  aside?: ReactNode;
  /** Botones a la derecha; bajo 640px pasan debajo del título y ocupan el ancho. */
  actions?: ReactNode;
  className?: string;
}

/** Cabecera de página: título y subtítulo a la izquierda, acciones a la derecha. Una por vista. */
export function PageHeader({ icon, title, description, aside, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between', className)}>
      <PageHeading icon={icon} title={title} aside={aside}>
        {description}
      </PageHeading>
      {actions && (
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:items-center [&>*]:w-full sm:[&>*]:w-auto">
          {actions}
        </div>
      )}
    </header>
  );
}
