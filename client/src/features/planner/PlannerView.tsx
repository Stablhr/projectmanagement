import { useQueries } from '@tanstack/react-query';
import { CalendarClock, Clock } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import type { BoardDetail, Card } from '../../lib/types';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Spinner';
import { useBoards } from '../boards/useBoards';

const SWATCHES = ['#99E1D9', '#4AAFA5', '#0F4C45', '#1F9D6B', '#B45309', '#2563EB', '#1A2B2A'];

function swatchFor(value: string): string {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) | 0;
  return SWATCHES[Math.abs(h) % SWATCHES.length];
}

function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

const DAY = 24 * 60 * 60 * 1000;

function formatDay(key: string): string {
  const date = new Date(`${key}T12:00:00`);
  const todayKey = dayKey(startOfToday());
  if (key === todayKey) return 'Today';
  if (key === dayKey(new Date(startOfToday().getTime() + DAY))) return 'Tomorrow';
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatDueTime(dueDate: string): string {
  const date = new Date(dueDate);
  const isNoonOnly = dueDate.slice(11, 16) === '12:00';
  if (isNoonOnly) return '';
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

interface ScheduledCard {
  card: Card;
  boardId: string;
  boardTitle: string;
  listTitle: string;
}

export function PlannerView() {
  const { data: boards = [], isLoading: loadingBoards } = useBoards();

  const details = useQueries({
    queries: boards.map((b) => ({
      queryKey: ['board', b._id],
      queryFn: () => api.get<BoardDetail>(`/boards/${b._id}`),
      staleTime: 30_000,
    })),
  });

  const loading = loadingBoards || details.some((q) => q.isPending);
  const failed = !loading && details.some((q) => q.isError);

  const scheduled = useMemo(() => {
    const byDay = new Map<string, ScheduledCard[]>();
    details.forEach((q) => {
      const bd = q.data;
      if (!bd) return;
      for (const card of bd.cards) {
        if (!card.dueDate) continue;
        const list = bd.lists.find((l) => l._id === card.listId);
        const entry: ScheduledCard = {
          card,
          boardId: bd.board._id,
          boardTitle: bd.board.title,
          listTitle: list?.title ?? '',
        };
        const key = dayKey(new Date(card.dueDate));
        const bucket = byDay.get(key);
        if (bucket) bucket.push(entry);
        else byDay.set(key, [entry]);
      }
    });
    for (const entries of byDay.values()) {
      entries.sort((a, b) => a.card.dueDate!.localeCompare(b.card.dueDate!));
    }
    return byDay;
  }, [details]);

  const todayKey = dayKey(startOfToday());
  const keys = useMemo(() => {
    const all = [...scheduled.keys()].sort();
    const overdueKeys = all.filter((k) => k < todayKey);
    const upcoming: string[] = [];
    for (let i = 0; i <= 30; i++) {
      const k = dayKey(new Date(startOfToday().getTime() + i * DAY));
      if (scheduled.has(k)) upcoming.push(k);
    }
    return { overdueKeys, upcoming };
  }, [scheduled, todayKey]);

  const hasAnything = scheduled.size > 0;

  function CardRow({ entry }: { entry: ScheduledCard }) {
    return (
      <Link
        to={`/board/${entry.boardId}`}
        className="flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2.5 shadow-sm transition-colors hover:border-primary-300 hover:bg-canvas"
      >
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: swatchFor(entry.boardTitle) }}
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-ink">{entry.card.title}</span>
          <span className="block truncate text-xs text-ink-secondary">
            {entry.boardTitle}
            {entry.listTitle ? ` · ${entry.listTitle}` : ''}
          </span>
        </span>
        {entry.card.complete && (
          <span className="shrink-0 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
            Done
          </span>
        )}
        {formatDueTime(entry.card.dueDate!) && (
          <span className="inline-flex shrink-0 items-center gap-1 text-xs tabular text-ink-secondary">
            <Clock className="h-3 w-3" />
            {formatDueTime(entry.card.dueDate!)}
          </span>
        )}
      </Link>
    );
  }

  function DaySection({ title, day, accent }: { title: string; day: string; accent?: string }) {
    const entries = scheduled.get(day) ?? [];
    return (
      <section>
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
          <span className={accent ? `inline-block h-2 w-2 rounded-full ${accent}` : ''} />
          {title}
          <span className="text-xs font-normal text-ink-secondary tabular">
            {entries.length} card{entries.length === 1 ? '' : 's'}
          </span>
        </h3>
        <div className="space-y-1.5">
          {entries.map((entry) => (
            <CardRow key={entry.card._id} entry={entry} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <div className="mx-auto min-h-full max-w-3xl px-6 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface shadow-sm">
          <CalendarClock className="h-5 w-5 text-primary-700" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Planner</h1>
          <p className="mt-0.5 text-sm text-ink-secondary">
            Cards with a due date show up here so you can see what's coming.
          </p>
        </div>
      </div>

      {loading && (
        <div className="py-12">
          <Spinner label="Loading planner…" />
        </div>
      )}

      {!loading && failed && (
        <p className="text-danger">Could not load your scheduled cards.</p>
      )}

      {!loading && !failed && hasAnything && (
        <div className="space-y-6">
          {keys.overdueKeys.map((k) => (
            <DaySection key={k} title={`Overdue · ${formatDay(k)}`} day={k} accent="bg-danger" />
          ))}
          {scheduled.has(todayKey) && (
            <DaySection title="Today" day={todayKey} accent="bg-primary-500" />
          )}
          {keys.upcoming.map((k) => (
            <DaySection key={k} title={formatDay(k)} day={k} />
          ))}
        </div>
      )}

      {!loading && !failed && !hasAnything && (
        <EmptyState
          title="Nothing scheduled yet"
          hint="Set a due date on any card and it will show up here on the right day."
        />
      )}
    </div>
  );
}
