import { clsx } from 'clsx';
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-primary-400 text-primary-800 hover:bg-primary-500 focus-visible:ring-primary-600',
  secondary:
    'bg-surface text-ink border border-line hover:bg-canvas focus-visible:ring-primary-600',
  danger:
    'bg-danger text-white hover:bg-red-700 focus-visible:ring-red-700',
  ghost:
    'bg-transparent text-ink-secondary hover:bg-canvas focus-visible:ring-primary-600',
};

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors',
        size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-4 py-2',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    />
  );
}
