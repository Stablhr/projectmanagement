import {
  Calendar,
  GitBranch,
  LayoutDashboard,
  Map as MapIcon,
  Table,
} from 'lucide-react';
import { useMemo, type ComponentType } from 'react';
import type { BoardViewKind } from './boardContext';
import { useBoardState } from './boardContext';
import type { Card as CardType } from '../../lib/types';

const ICONS: Record<Exclude<BoardViewKind, 'board'>, ComponentType<{ className?: string }>> = {
  table: Table,
  calendar: Calendar,
  dashboard: LayoutDashboard,
  timeline: GitBranch,
  map: MapIcon,
};

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export function CalendarView() {
  const { visibleBoard } = useBoardState();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const monthLabel = now.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const { startOffset, daysInMonth } = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    return {
      startOffset: firstDay.getDay(),
      daysInMonth: new Date(year, month + 1, 0).getDate(),
    };
  }, [year, month]);

  const cardsByDay = useMemo(() => {
    const map = new Map<number, CardType[]>();
    for (const card of visibleBoard.cards) {
      if (!card.dueDate) continue;
      const d = new Date(card.dueDate);
      if (d.getFullYear() !== year || d.getMonth() !== month) continue;
      const day = d.getDate();
      const bucket = map.get(day) ?? [];
      bucket.push(card);
      map.set(day, bucket);
    }
    for (const bucket of map.values()) bucket.sort((a, b) => a.position - b.position);
    return map;
  }, [visibleBoard.cards, year, month]);

  const scheduledCount = useMemo(
    () => [...cardsByDay.values()].reduce((sum, bucket) => sum + bucket.length, 0),
    [cardsByDay],
  );

  const days: (number | null)[] = [
    ...Array.from({ length: startOffset }, () => null as number | null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink">{monthLabel}</h2>
        <span className="rounded-lg bg-surface px-3 py-1.5 text-xs font-medium text-ink-secondary shadow-sm">
          {scheduledCount} scheduled card{scheduledCount === 1 ? '' : 's'}
        </span>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {WEEKDAYS.map((d) => (
          <div key={d} className="pb-1 text-center text-[10px] font-semibold uppercase tracking-wider text-ink-secondary">
            {d}
          </div>
        ))}
        {days.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="h-24 rounded-lg border border-line/50" />;
          }
          const bucket = cardsByDay.get(day) ?? [];
          const isToday = day === now.getDate();
          return (
            <div
              key={day}
              className="flex h-24 flex-col gap-0.5 overflow-hidden rounded-lg border border-line bg-surface/70 p-1.5"
            >
              <span
                className={
                  isToday
                    ? 'inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-400 text-[11px] font-bold text-primary-800'
                    : 'text-[11px] text-ink-secondary'
                }
              >
                {day}
              </span>
              {bucket.slice(0, 3).map((card) => (
                <span
                  key={card._id}
                  title={card.title}
                  className="truncate rounded bg-primary-200/50 px-1 py-0.5 text-[10px] font-medium leading-tight text-primary-800"
                >
                  {card.title}
                </span>
              ))}
              {bucket.length > 3 && (
                <span className="px-1 text-[10px] text-ink-secondary">
                  +{bucket.length - 3} more
                </span>
              )}
            </div>
          );
        })}
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
