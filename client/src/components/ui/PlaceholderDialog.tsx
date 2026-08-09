import { Clock } from 'lucide-react';
import type { ReactNode } from 'react';
import { Modal } from './Modal';

interface PlaceholderDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  hint?: string;
  children?: ReactNode;
}

/**
 * Generic "not built yet" modal used to make the board menu fully navigable.
 * Replace with a real implementation as each feature lands.
 */
export function PlaceholderDialog({
  open,
  onClose,
  title,
  hint,
  children,
}: PlaceholderDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <Clock className="h-8 w-8 text-primary-500" />
        <p className="text-sm font-medium text-ink">{title}</p>
        {hint && <p className="text-xs text-ink-secondary">{hint}</p>}
        {children}
      </div>
    </Modal>
  );
}
