import { clsx } from 'clsx';
import { ChevronDown, Search, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { ME_ID } from './boardData';
import { useBoardState, type FilterState } from './boardContext';
import { dueDotClass } from './dueDate';
import { filterCards } from './filterBoard';

function Toggle({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: () => void;
  children: ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-line accent-primary-600"
      />
      <span className="flex-1">{children}</span>
    </label>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line px-4 py-3">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.05em] text-ink-secondary">
        {title}
      </h3>
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}

export function FilterPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { filters, setFilters, clearFilters, labels, members, visibleBoard } = useBoardState();
  const [showMembers, setShowMembers] = useState(false);

  if (!open) return null;

  const set = (patch: Partial<FilterState>) => setFilters(patch);

  const matching = filterCards(
    visibleBoard.cards,
    filters,
    { members, labels, meId: ME_ID },
  );

  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-label="Filter panel">
      <div className="absolute inset-0 bg-ink/20" onClick={onClose} />
      <div className="relative z-10 flex h-full w-80 flex-col border-l border-line bg-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-base font-semibold text-ink">Filters</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-ink-secondary hover:bg-canvas"
            aria-label="Close filters"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <Section title="Keyword">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2 h-4 w-4 text-ink-secondary" />
              <input
                value={filters.keyword}
                onChange={(e) => set({ keyword: e.target.value })}
                placeholder="Search cards, members, labels…"
                className="w-full rounded-lg border border-line bg-surface py-2 pl-8 pr-3 text-sm text-ink placeholder:text-ink-secondary/60 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              />
            </div>
          </Section>

          <Section title="Members">
            <Toggle
              checked={filters.members.none}
              onChange={() => set({ members: { ...filters.members, none: !filters.members.none } })}
            >
              No members
            </Toggle>
            <Toggle
              checked={filters.members.me}
              onChange={() => set({ members: { ...filters.members, me: !filters.members.me } })}
            >
              Cards assigned to me
            </Toggle>
            <button
              onClick={() => setShowMembers((s) => !s)}
              className="flex items-center gap-1 text-sm font-medium text-primary-700 hover:text-primary-800"
            >
              <ChevronDown
                className={clsx('h-4 w-4 transition-transform', showMembers && 'rotate-180')}
              />
              Select members
            </button>
            {showMembers && (
              <div className="space-y-1.5 pl-1">
                {members.map((m) => (
                  <Toggle
                    key={m.id}
                    checked={filters.members.selected.includes(m.id)}
                    onChange={() =>
                      set({
                        members: {
                          ...filters.members,
                          selected: filters.members.selected.includes(m.id)
                            ? filters.members.selected.filter((id) => id !== m.id)
                            : [...filters.members.selected, m.id],
                        },
                      })
                    }
                  >
                    <span className="flex items-center gap-2">
                      <Avatar member={m} />
                      {m.name}
                    </span>
                  </Toggle>
                ))}
              </div>
            )}
          </Section>

          <Section title="Card status">
            <Toggle
              checked={filters.status.complete}
              onChange={() =>
                set({ status: { ...filters.status, complete: !filters.status.complete } })
              }
            >
              Marked as complete
            </Toggle>
            <Toggle
              checked={filters.status.incomplete}
              onChange={() =>
                set({ status: { ...filters.status, incomplete: !filters.status.incomplete } })
              }
            >
              Not marked as complete
            </Toggle>
          </Section>

          <Section title="Due date">
            <Toggle
              checked={filters.due.none}
              onChange={() => set({ due: { ...filters.due, none: !filters.due.none } })}
            >
              <span className="flex items-center gap-2">
                <span className={dueDotClass('none')} />
                No dates
              </span>
            </Toggle>
            <Toggle
              checked={filters.due.overdue}
              onChange={() => set({ due: { ...filters.due, overdue: !filters.due.overdue } })}
            >
              <span className="flex items-center gap-2">
                <span className={dueDotClass('overdue')} />
                Overdue
              </span>
            </Toggle>
            <Toggle
              checked={filters.due.soon}
              onChange={() => set({ due: { ...filters.due, soon: !filters.due.soon } })}
            >
              <span className="flex items-center gap-2">
                <span className={dueDotClass('soon')} />
                Due in the next day
              </span>
            </Toggle>
            <Toggle
              checked={filters.due.week}
              onChange={() => set({ due: { ...filters.due, week: !filters.due.week } })}
            >
              <span className="flex items-center gap-2">
                <span className={dueDotClass('on-time')} />
                Due in the next week
              </span>
            </Toggle>
            <Toggle
              checked={filters.due.month}
              onChange={() => set({ due: { ...filters.due, month: !filters.due.month } })}
            >
              <span className="flex items-center gap-2">
                <span className={dueDotClass('on-time')} />
                Due in the next month
              </span>
            </Toggle>
          </Section>

          <Section title="Labels">
            <Toggle
              checked={filters.labels.none}
              onChange={() => set({ labels: { ...filters.labels, none: !filters.labels.none } })}
            >
              No labels
            </Toggle>
            {labels.map((label) => {
              const checked = filters.labels.selected.includes(label.id);
              return (
                <Toggle
                  key={label.id}
                  checked={checked}
                  onChange={() =>
                    set({
                      labels: {
                        ...filters.labels,
                        selected: checked
                          ? filters.labels.selected.filter((id) => id !== label.id)
                          : [...filters.labels.selected, label.id],
                      },
                    })
                  }
                >
                  <span
                    className="inline-block rounded px-2 py-0.5 text-[11px] font-semibold"
                    style={{ backgroundColor: label.color, color: label.textColor }}
                  >
                    {label.name}
                  </span>
                </Toggle>
              );
            })}
          </Section>

          <Section title="Activity">
            <Toggle
              checked={filters.activity.week}
              onChange={() =>
                set({ activity: { ...filters.activity, week: !filters.activity.week } })
              }
            >
              Active in the last week
            </Toggle>
            <Toggle
              checked={filters.activity.twoWeeks}
              onChange={() =>
                set({ activity: { ...filters.activity, twoWeeks: !filters.activity.twoWeeks } })
              }
            >
              Active in the last two weeks
            </Toggle>
            <Toggle
              checked={filters.activity.month}
              onChange={() =>
                set({ activity: { ...filters.activity, month: !filters.activity.month } })
              }
            >
              Active in the last four weeks
            </Toggle>
          </Section>
        </div>

        <div className="border-t border-line px-4 py-3">
          <div className="mb-2 text-xs text-ink-secondary">
            {matching.length} of {visibleBoard.cards.length} cards shown
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={clearFilters} className="flex-1">
              Clear all
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
