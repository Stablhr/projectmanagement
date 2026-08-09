import { clsx } from 'clsx';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: 'md' | 'lg';
  children: ReactNode;
}

export function Modal({ open, onClose, title, size = 'md', children }: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 pt-20"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={clsx(
          'w-full rounded-2xl border border-line bg-surface shadow-lg',
          size === 'lg' ? 'max-w-2xl' : 'max-w-md',
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          {title && <h2 className="text-base font-semibold text-ink">{title}</h2>}
          <button
            onClick={onClose}
            className="rounded p-1 text-ink-secondary hover:bg-canvas"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
