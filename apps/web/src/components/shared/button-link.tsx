import { Link, type LinkProps } from 'react-router-dom';

import { cn } from '@/lib/cn';

type ButtonLinkVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonLinkProps extends LinkProps {
  variant?: ButtonLinkVariant;
  size?: 'sm' | 'md';
}

// Mismas clases que `Button` (components/ui/button.tsx): un enlace que navega, con aspecto de botón.
const VARIANTS: Record<ButtonLinkVariant, string> = {
  primary: 'bg-accent text-accent-ink hover:bg-accent-muted border border-transparent',
  secondary:
    'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/60',
  ghost:
    'bg-transparent text-zinc-700 dark:text-zinc-300 border border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100',
};

const SIZES = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 pointer-coarse:h-11 pointer-coarse:px-4',
  md: 'h-9 px-4 text-[13px] gap-2 pointer-coarse:h-11',
} as const;

/** Enlace con forma de botón (para acciones que llevan a otra pantalla). Sin `asChild` en `Button`. */
export function ButtonLink({ variant = 'secondary', size = 'md', className, ...props }: ButtonLinkProps) {
  return (
    <Link
      {...props}
      data-variant={variant}
      className={cn(
        'ui-press inline-flex shrink-0 items-center justify-center rounded-full font-sans font-medium whitespace-nowrap',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
    />
  );
}
