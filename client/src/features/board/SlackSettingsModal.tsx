import { Slack } from 'lucide-react';
import { clsx } from 'clsx';
import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

const WORKSPACES = ['Acme Engineering', 'Design Guild', 'Personal'];
const CHANNELS = ['#general', '#product', '#design-crit', '#standup', '#announcements'];

const EVENTS: { key: string; label: string; hint: string }[] = [
  { key: 'list_add', label: 'A list is created', hint: 'e.g. a new sprint column appears' },
  { key: 'card_move', label: 'A card is moved', hint: 'between lists on any board' },
  { key: 'card_due', label: 'A card becomes due', hint: 'and when a due date is set' },
  { key: 'card_done', label: 'A card is completed', hint: 'moved to a completed list' },
  { key: 'comment', label: 'A comment is added', hint: 'on cards you watch' },
];

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors',
        checked ? 'bg-primary-500' : 'bg-ink/15',
      )}
    >
      <span
        className={clsx(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-[22px]' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}

interface SlackSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SlackSettingsModal({ open, onClose }: SlackSettingsModalProps) {
  const [enabled, setEnabled] = useState(true);
  const [workspace, setWorkspace] = useState(WORKSPACES[0]);
  const [channel, setChannel] = useState(CHANNELS[0]);
  const [events, setEvents] = useState<Record<string, boolean>>({
    list_add: true,
    card_move: true,
    card_due: true,
    card_done: false,
    comment: false,
  });
  const [saved, setSaved] = useState(false);

  const selectClass =
    'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-primary-500 focus:outline-none';

  function save() {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Slack integration">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-canvas p-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4A154B]">
              <Slack className="h-5 w-5 text-white" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">Slack notifications</p>
              <p className="text-xs text-ink-secondary">Post board activity to a Slack channel</p>
            </div>
          </div>
          <Toggle checked={enabled} onChange={setEnabled} label="Enable Slack notifications" />
        </div>

        <div className={clsx('space-y-3', !enabled && 'pointer-events-none opacity-50')}>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-secondary">Workspace</label>
            <select value={workspace} onChange={(e) => setWorkspace(e.target.value)} className={selectClass}>
              {WORKSPACES.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-secondary">Channel</label>
            <select value={channel} onChange={(e) => setChannel(e.target.value)} className={selectClass}>
              {CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-ink-secondary">Notify me when…</p>
            <div className="space-y-1.5">
              {EVENTS.map((ev) => (
                <div
                  key={ev.key}
                  className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">{ev.label}</p>
                    <p className="text-xs text-ink-secondary">{ev.hint}</p>
                  </div>
                  <Toggle
                    checked={events[ev.key]}
                    onChange={(next) => setEvents((prev) => ({ ...prev, [ev.key]: next }))}
                    label={ev.label}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {saved && <p className="text-xs font-medium text-success">Slack settings saved.</p>}

        <div className="flex justify-end gap-2 border-t border-line pt-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Save settings</Button>
        </div>
      </div>
    </Modal>
  );
}
