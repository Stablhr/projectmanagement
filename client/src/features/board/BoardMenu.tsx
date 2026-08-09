import { clsx } from 'clsx';
import {
  Archive,
  Bell,
  Blocks,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  CreditCard,
  Image,
  Info,
  Mail,
  Paperclip,
  Printer,
  Share2,
  Sticker,
  Star,
  Tags,
  Trash2,
  UserX,
  Users,
  X,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { PlaceholderDialog } from '../../components/ui/PlaceholderDialog';
import { Button } from '../../components/ui/Button';
import { useBoardState } from './boardContext';
import { BOARD_BACKGROUNDS } from './boardBackgrounds';

const VISIBILITY_LABEL: Record<string, string> = {
  private: 'Private',
  workspace: 'Workspace',
  organization: 'Organization',
  public: 'Public',
};

function Row({
  icon,
  label,
  onClick,
  danger,
  badge,
}: {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  danger?: boolean;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm text-ink hover:bg-canvas',
        danger && 'text-danger hover:bg-danger/5',
      )}
    >
      <span className="text-ink-secondary">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge && <span className="text-xs text-ink-secondary">{badge}</span>}
    </button>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line first:border-t-0">
      <h3 className="px-2 pb-1 pt-4 text-xs font-semibold uppercase tracking-[0.05em] text-ink-secondary">
        {title}
      </h3>
      <div className="space-y-0.5">{children}</div>
    </section>
  );
}

interface BoardMenuProps {
  open: boolean;
  onClose: () => void;
  onOpenShare: () => void;
  onOpenVisibility: () => void;
  onOpenLabels: () => void;
  onOpenPowerUps: () => void;
  onDeleteBoard?: () => void;
}

export function BoardMenu({
  open,
  onClose,
  onOpenShare,
  onOpenVisibility,
  onOpenLabels,
  onOpenPowerUps,
  onDeleteBoard,
}: BoardMenuProps) {
  const {
    meta,
    setMeta,
    labels,
    members,
    collapseAll,
    expandAll,
    archived,
    restoreCard,
    restoreList,
  } = useBoardState();

  const [openSection, setOpenSection] = useState<string | null>(null);
  const [descDraft, setDescDraft] = useState(meta.description);
  const [placeholder, setPlaceholder] = useState<{ title: string; hint: string } | null>(null);

  if (!open) return null;

  const toggle = (name: string) => setOpenSection((s) => (s === name ? null : name));

  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-label="Board menu">
      <div className="absolute inset-0 bg-ink/20" onClick={onClose} />
      <div className="relative z-10 flex h-full w-80 flex-col border-l border-line bg-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-base font-semibold text-ink">Board menu</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-ink-secondary hover:bg-canvas"
            aria-label="Close board menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-6">
          <Section title="Top actions">
            <Row icon={<Share2 className="h-4 w-4" />} label="Share" onClick={onOpenShare} />
            <Row
              icon={<Info className="h-4 w-4" />}
              label="About this board"
              onClick={() => {
                setDescDraft(meta.description);
                toggle('about');
              }}
            />
            {openSection === 'about' && (
              <div className="px-2 pb-2">
                <textarea
                  rows={3}
                  value={descDraft}
                  onChange={(e) => setDescDraft(e.target.value)}
                  placeholder="Add a description…"
                  className="w-full resize-y rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-secondary/60 focus:border-primary-500 focus:outline-none"
                />
                <Button
                  size="sm"
                  onClick={() => setMeta({ description: descDraft })}
                  className="mt-1.5"
                >
                  Save
                </Button>
              </div>
            )}
            <Row
              icon={<Users className="h-4 w-4" />}
              label={`Visibility: ${VISIBILITY_LABEL[meta.visibility] ?? meta.visibility}`}
              onClick={onOpenVisibility}
            />
            <Row
              icon={<Printer className="h-4 w-4" />}
              label="Print, export, and share"
              onClick={() => toggle('print')}
            />
            {openSection === 'print' && (
              <div className="space-y-0.5 px-2 pb-2">
                <Row
                  icon={<Printer className="h-4 w-4" />}
                  label="Print this board"
                  onClick={() => setPlaceholder({ title: 'Print this board', hint: 'Printing is coming soon.' })}
                />
                <Row
                  icon={<Copy className="h-4 w-4" />}
                  label="Export board as JSON"
                  onClick={() => setPlaceholder({ title: 'Export board', hint: 'Export is coming soon.' })}
                />
                <Row icon={<Share2 className="h-4 w-4" />} label="Share board" onClick={onOpenShare} />
              </div>
            )}
            <Row
              icon={<Star className={clsx('h-4 w-4', meta.starred && 'fill-warning text-warning')} />}
              label={meta.starred ? 'Starred (click to unstar)' : 'Star / favorite'}
              onClick={() => setMeta({ starred: !meta.starred })}
            />
          </Section>

          <Section title="Board configuration">
            <Row
              icon={<Image className="h-4 w-4" />}
              label="Change background"
              onClick={() => toggle('background')}
            />
            {openSection === 'background' && (
              <div className="px-2 pb-2">
                <div className="grid grid-cols-4 gap-2">
                  {BOARD_BACKGROUNDS.map((bg) => (
                    <button
                      key={bg.id}
                      title={bg.name}
                      onClick={() =>
                        setMeta({ background: { type: bg.type, value: bg.value } })
                      }
                      className={clsx(
                        'h-12 w-full rounded-lg',
                        meta.background.value === bg.value && 'ring-2 ring-primary-600 ring-offset-1',
                      )}
                      style={
                        bg.type === 'color'
                          ? { backgroundColor: bg.value }
                          : { backgroundImage: bg.value }
                      }
                      aria-label={bg.name}
                    />
                  ))}
                </div>
              </div>
            )}
            <Row
              icon={<CreditCard className="h-4 w-4" />}
              label="Custom Fields"
              onClick={() =>
                setPlaceholder({
                  title: 'Custom Fields',
                  hint: 'Define structured fields on cards (stub for MVP).',
                })
              }
            />
            <Row
              icon={<Blocks className="h-4 w-4" />}
              label="Power-Ups / Integrations"
              onClick={onOpenPowerUps}
            />
            <Row icon={<Tags className="h-4 w-4" />} label={`Labels (${labels.length})`} onClick={onOpenLabels} />
          </Section>

          <Section title="Stickers">
            <Row
              icon={<Sticker className="h-4 w-4" />}
              label="Stickers"
              onClick={() =>
                setPlaceholder({ title: 'Stickers', hint: 'Stickers are coming soon.' })
              }
            />
          </Section>

          <Section title="Board management">
            <Row
              icon={<Copy className="h-4 w-4" />}
              label="Make template"
              onClick={() =>
                setPlaceholder({ title: 'Make template', hint: 'Templates are coming soon.' })
              }
            />
            <Row
              icon={<Paperclip className="h-4 w-4" />}
              label="Activity"
              onClick={() => toggle('activity')}
            />
            {openSection === 'activity' && (
              <div className="space-y-2 px-2 pb-2 text-xs text-ink-secondary">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-400" />
                    <span>
                      <span className="font-medium text-ink">{m.name}</span> opened the board
                    </span>
                  </div>
                ))}
              </div>
            )}
            <Row
              icon={<Archive className="h-4 w-4" />}
              label={`Archived items (${archived.cards.length + archived.lists.length})`}
              onClick={() => toggle('archived')}
            />
            {openSection === 'archived' && (
              <div className="space-y-2 px-2 pb-2 text-sm">
                {archived.cards.length === 0 && archived.lists.length === 0 && (
                  <p className="text-xs text-ink-secondary">Nothing archived yet.</p>
                )}
                {archived.lists.map((l) => (
                  <div key={l._id} className="flex items-center gap-2">
                    <span className="flex-1 truncate text-xs text-ink-secondary">{l.title}</span>
                    <Button size="sm" variant="secondary" onClick={() => restoreList(l._id)}>
                      Restore
                    </Button>
                  </div>
                ))}
                {archived.cards.map((c) => (
                  <div key={c._id} className="flex items-center gap-2">
                    <span className="flex-1 truncate text-xs text-ink-secondary">{c.title}</span>
                    <Button size="sm" variant="secondary" onClick={() => restoreCard(c._id)}>
                      Restore
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Preferences">
            <Row
              icon={<Bell className={clsx('h-4 w-4', meta.watch && 'text-primary-700')} />}
              label={meta.watch ? 'Watching board' : 'Watch'}
              onClick={() => setMeta({ watch: !meta.watch })}
            />
            <Row
              icon={<ChevronsRight className="h-4 w-4" />}
              label="Expand all lists"
              onClick={expandAll}
            />
            <Row
              icon={<ChevronsLeft className="h-4 w-4" />}
              label="Collapse all lists"
              onClick={collapseAll}
            />
            <Row
              icon={<Copy className="h-4 w-4" />}
              label="Copy board"
              onClick={() =>
                setPlaceholder({ title: 'Copy board', hint: 'Copying a board is coming soon.' })
              }
            />
            <Row
              icon={<Mail className="h-4 w-4" />}
              label="Email-to-board"
              onClick={() =>
                setPlaceholder({
                  title: 'Email-to-board',
                  hint: 'Generate an email address that creates cards when mailed.',
                })
              }
            />
            <Row
              icon={<Trash2 className="h-4 w-4" />}
              label="Close board"
              danger
              onClick={() =>
                setPlaceholder({
                  title: 'Close board',
                  hint: 'Closing a board archives it for the workspace.',
                })
              }
            />
            {onDeleteBoard && (
              <Row
                icon={<Trash2 className="h-4 w-4" />}
                label="Delete board…"
                danger
                onClick={onDeleteBoard}
              />
            )}
            <Row
              icon={<UserX className="h-4 w-4" />}
              label="Leave board"
              danger
              onClick={() =>
                setPlaceholder({ title: 'Leave board', hint: 'Leaving removes you from this board.' })
              }
            />
            <Row
              icon={<Archive className="h-4 w-4" />}
              label="Report abuse"
              danger
              onClick={() =>
                setPlaceholder({ title: 'Report abuse', hint: 'Reporting is coming soon.' })
              }
            />
          </Section>
        </div>

        <div className="flex items-center gap-2 border-t border-line px-4 py-2.5">
          <span className="text-xs text-ink-secondary">
            Board activity is synced across members.
          </span>
        </div>
      </div>

      {placeholder && (
        <PlaceholderDialog
          open
          onClose={() => setPlaceholder(null)}
          title={placeholder.title}
          hint={placeholder.hint}
        />
      )}
    </div>
  );
}
