import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  hint?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, hint, action, className }: EmptyStateProps) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-surface px-6 py-10 text-center',
        className,
      )}
    >
      <p className="font-medium text-ink">{title}</p>
      {hint && <p className="text-sm text-ink-secondary">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
