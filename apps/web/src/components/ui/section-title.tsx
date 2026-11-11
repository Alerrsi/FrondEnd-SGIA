import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { SECTION_TITLE_CLASS, type HeadingIcon } from './typography';

interface SectionTitleProps {
  icon?: HeadingIcon;
  /** Nivel semántico; no cambia el estilo. */
  as?: 'h2' | 'h3' | 'h4';
  children: ReactNode;
  className?: string;
  title?: string;
}

/** Título de una sección, tarjeta o panel dentro de una página. */
export function SectionTitle({ icon: Icon, as: Tag = 'h2', children, className, title }: SectionTitleProps) {
  return (
    <Tag className={cn(SECTION_TITLE_CLASS, className)} title={title}>
      {Icon && <Icon className="h-4 w-4 shrink-0 text-zinc-400" />}
      {children}
    </Tag>
  );
}
