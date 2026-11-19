import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        // Panel «Trazo»: superficie con línea de 1px, radio 8px y sin sombra.
        'rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 p-4',
        className,
      )}
      {...props}
    />
  );
}
