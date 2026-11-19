import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

const COLUMNS = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4',
} as const;

export interface CellGridProps {
  /** Columnas en pantalla ancha; bajo 640px siempre una. */
  columns?: keyof typeof COLUMNS;
  as?: 'div' | 'ul' | 'section';
  className?: string;
  children: ReactNode;
  'aria-label'?: string;
}

/**
 * Grilla de celdas con bordes compartidos (sistema «Trazo»): un marco de 1px y líneas entre celdas, sin
 * espacio entre ellas. Sus hijos directos son `Cell` (o `<li>` con un `Cell` adentro cuando `as="ul"`).
 */
export function CellGrid({ columns = 3, as: Tag = 'div', className, children, ...rest }: CellGridProps) {
  return (
    <Tag className={cn('cell-grid', COLUMNS[columns], className)} {...rest}>
      {children}
    </Tag>
  );
}
