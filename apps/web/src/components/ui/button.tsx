import type { ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

type ButtonVariant = 'primary' | 'ghost' | 'secondary' | 'danger' | 'outline';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * `primary` es el único botón relleno (burdeo; rosa en oscuro): una acción principal por vista.
   * `secondary` y `outline` son el mismo botón con borde. `ghost` para acciones de barra. `danger` destructiva.
   */
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

const OUTLINE =
  'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/60';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-ink hover:bg-accent-muted border border-transparent',
  secondary: OUTLINE,
  outline: OUTLINE,
  ghost:
    'bg-transparent text-zinc-700 dark:text-zinc-300 border border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100',
  danger: 'bg-danger text-white dark:text-zinc-900 border border-transparent hover:opacity-90',
};

// Con puntero táctil todos los botones miden 44px (tamaño mínimo de toque).
const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 pointer-coarse:h-11 pointer-coarse:px-4',
  md: 'h-9 px-4 text-[13px] gap-2 pointer-coarse:h-11',
  lg: 'h-10 px-5 text-sm gap-2 pointer-coarse:h-11',
  icon: 'h-8 w-8 p-0 pointer-coarse:h-11 pointer-coarse:w-11',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      data-variant={variant}
      className={cn(
        'ui-press inline-flex shrink-0 items-center justify-center rounded-full font-sans font-medium whitespace-nowrap cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
