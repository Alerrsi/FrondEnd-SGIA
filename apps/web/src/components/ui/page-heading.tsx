import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { PAGE_SUBTITLE_CLASS, PAGE_TITLE_CLASS, type HeadingIcon } from './typography';

interface PageHeadingProps {
  /** Icono del módulo, a la izquierda del título. */
  icon?: HeadingIcon;
  title: ReactNode;
  /** Elementos junto al título (p. ej. el badge de estado en una vista de detalle). */
  aside?: ReactNode;
  /** Subtítulo de la página. */
  children?: ReactNode;
  className?: string;
}

/** Título (h1) y subtítulo de una página: uno por vista, igual en todas. */
export function PageHeading({ icon: Icon, title, aside, children, className }: PageHeadingProps) {
  const heading = (
    <h1 className={PAGE_TITLE_CLASS}>
      {Icon && <Icon className="h-5 w-5 shrink-0 text-zinc-700 dark:text-zinc-300" />}
      {title}
    </h1>
  );

  return (
    <div className={cn('min-w-0', className)}>
      {aside ? (
        <div className="flex flex-wrap items-center gap-2">
          {heading}
          {aside}
        </div>
      ) : (
        heading
      )}
      {children && <p className={PAGE_SUBTITLE_CLASS}>{children}</p>}
    </div>
  );
}
