import { clsx } from 'clsx';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className, id, ...props }: InputProps) {
  const inputId = id ?? props.name ?? label;
  return (
    <label className="block" htmlFor={inputId}>
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-ink-secondary">
          {label}
        </span>
      )}
      <input
        id={inputId}
        className={clsx(
          'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink',
          'placeholder:text-ink-secondary/60',
          'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30',
          className,
        )}
        {...props}
      />
    </label>
  );
}
