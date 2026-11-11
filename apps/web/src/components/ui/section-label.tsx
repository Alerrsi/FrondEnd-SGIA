import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { SECTION_LABEL_CLASS, type HeadingIcon } from './typography';

interface SectionLabelProps {
  icon?: HeadingIcon;
  /** Nivel semántico; no cambia el estilo. */
  as?: 'h2' | 'h3' | 'h4';
  children: ReactNode;
  className?: string;
  title?: string;
}

/** Rótulo en mayúsculas de un bloque dentro de un detalle (panel lateral, ficha, modal). */
export function SectionLabel({ icon: Icon, as: Tag = 'h3', children, className, title }: SectionLabelProps) {
  return (
    <Tag className={cn(SECTION_LABEL_CLASS, className)} title={title}>
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
      {children}
    </Tag>
  );
}
