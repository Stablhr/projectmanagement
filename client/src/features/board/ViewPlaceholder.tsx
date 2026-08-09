import {
  Calendar,
  GitBranch,
  LayoutDashboard,
  Map,
  Table,
} from 'lucide-react';
import type { ComponentType } from 'react';
import type { BoardViewKind } from './boardContext';
import { useBoardState } from './boardContext';

const ICONS: Record<Exclude<BoardViewKind, 'board'>, ComponentType<{ className?: string }>> = {
  table: Table,
  calendar: Calendar,
  dashboard: LayoutDashboard,
  timeline: GitBranch,
  map: Map,
};

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export function CalendarView() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink">Planner — August 2026</h2>
        <span className="rounded-lg bg-surface px-3 py-1.5 text-xs font-medium text-ink-secondary shadow-sm">
          MVP shell · card scheduling lands next
        </span>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {WEEKDAYS.map((d) => (
          <div key={d} className="pb-1 text-center text-[10px] font-semibold uppercase tracking-wider text-ink-secondary">
            {d}
          </div>
        ))}
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg border border-line bg-surface/70 p-1.5">
            <span className="text-[11px] text-ink-secondary">{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ViewPlaceholder({ view }: { view: Exclude<BoardViewKind, 'board'> }) {
  const { visibleBoard } = useBoardState();
  const Icon = ICONS[view];
  const title = `${view[0].toUpperCase()}${view.slice(1)} view`;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface shadow-sm">
        <Icon className="h-8 w-8 text-primary-700" />
      </div>
      <div>
        <p className="text-base font-semibold text-ink">{title}</p>
        <p className="mt-1 max-w-sm text-sm text-ink-secondary">
          {visibleBoard.board.title} stays right here — this view is coming soon.
        </p>
      </div>
      <span className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink-secondary">
        Coming soon
      </span>
    </div>
  );
}
