import type { ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

type ButtonVariant = 'primary' | 'ghost' | 'secondary' | 'danger' | 'outline';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white hover:brightness-90 shadow-sm font-medium',
  secondary:
    'bg-surface-raised text-text hover:brightness-95 border border-border font-medium',
  ghost: 'bg-transparent text-text hover:bg-surface-raised font-medium',
  outline: 'bg-surface text-text hover:bg-surface-raised border border-border font-medium',
  danger: 'bg-danger text-white hover:brightness-90 font-medium shadow-sm',
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
        'inline-flex items-center justify-center rounded-md font-sans transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-info focus-visible:outline-none cursor-pointer',
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
