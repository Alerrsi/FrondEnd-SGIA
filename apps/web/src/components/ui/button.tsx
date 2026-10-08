import type { ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

type ButtonVariant = 'primary' | 'ghost' | 'secondary' | 'danger' | 'outline';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

const variantClasses: Record<ButtonVariant, string> = {
  // Botón de Acción Principal Global (CTA): Monocromático de alto contraste técnico según Design.md
  primary:
    'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white shadow-xs font-medium focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600',
  secondary:
    'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 font-medium focus-visible:ring-zinc-400',
  ghost:
    'bg-transparent text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium focus-visible:ring-zinc-400',
  outline:
    'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 font-medium focus-visible:ring-zinc-400',
  danger:
    'bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-700 font-medium shadow-xs focus-visible:ring-rose-500',
};

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-8.5 px-3.5 text-xs gap-2',
  lg: 'h-10 px-4 text-sm gap-2',
  icon: 'h-8 w-8 p-0',
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
      className={cn(
        'inline-flex items-center justify-center rounded-md font-sans transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 cursor-pointer',
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
