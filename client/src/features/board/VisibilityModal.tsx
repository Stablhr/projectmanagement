import { Building2, Check, Globe, Lock, LockOpen } from 'lucide-react';
import { clsx } from 'clsx';
import { Modal } from '../../components/ui/Modal';
import { useBoardState } from './boardContext';
import type { BoardVisibility } from '../../lib/types';

/**
 * Organization visibility requires an enterprise workspace. Set to true once
 * the workspace tier check is wired to the backend.
 */
const ORG_TIER_ENABLED = false;

const OPTIONS: {
  value: BoardVisibility;
  title: string;
  icon: typeof Lock;
  description: string;
}[] = [
  {
    value: 'private',
    title: 'Private',
    icon: Lock,
    description: 'Board members and workspace admins can see and edit this board.',
  },
  {
    value: 'workspace',
    title: 'Workspace',
    icon: Building2,
    description: 'All members of the workspace can see and edit this board.',
  },
  {
    value: 'organization',
    title: 'Organization',
    icon: LockOpen,
    description: 'All members of the organization can see this board.',
  },
  {
    value: 'public',
    title: 'Public',
    icon: Globe,
    description: 'Anyone on the internet can see this board. Only board members can edit.',
  },
];

interface VisibilityModalProps {
  open: boolean;
  onClose: () => void;
}

export function VisibilityModal({ open, onClose }: VisibilityModalProps) {
  const { meta, setMeta } = useBoardState();

  return (
    <Modal open={open} onClose={onClose} title="Board visibility">
      <p className="mb-3 text-xs text-ink-secondary">Choose who can see and edit this board.</p>
      <div className="space-y-2">
        {OPTIONS.map((opt) => {
          const isOrg = opt.value === 'organization';
          const disabled = isOrg && !ORG_TIER_ENABLED;
          const active = meta.visibility === opt.value;
          const Icon = opt.icon;

          return (
            <button
              key={opt.value}
              disabled={disabled}
              onClick={() => setMeta({ visibility: opt.value })}
              className={clsx(
                'flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors',
                active ? 'border-primary-500 bg-primary-100/40' : 'border-line hover:bg-canvas',
                disabled && 'cursor-not-allowed opacity-50 hover:bg-transparent',
              )}
            >
              <span
                className={clsx(
                  'mt-0.5 flex h-6 w-6 items-center justify-center rounded-full',
                  active ? 'bg-primary-600 text-white' : 'bg-ink/10 text-ink-secondary',
                )}
              >
                {active ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-ink">{opt.title}</span>
                  {active && (
                    <span className="rounded bg-primary-200/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-800">
                      Current
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-ink-secondary">
                  {opt.description}
                </span>
                {isOrg && !ORG_TIER_ENABLED && (
                  <span className="mt-1 block text-[11px] font-medium text-warning">
                    Requires an enterprise-tier workspace. Upgrade to enable.
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
