import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { CalendarClock, CheckCircle2, Clock } from 'lucide-react';
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
  const queryClient = useQueryClient();
  const { data: boards = [], isLoading: loadingBoards } = useBoards();

  const toggleDone = useMutation({
    mutationFn: ({ cardId, complete }: { cardId: string; complete: boolean }) =>
      api.patch<Card>(`/cards/${cardId}`, { complete }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board'] });
    },
  });

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

  const unscheduled = useMemo(() => {
    const all: ScheduledCard[] = [];
    details.forEach((q) => {
      const bd = q.data;
      if (!bd) return;
      for (const card of bd.cards) {
        if (card.dueDate) continue;
        const list = bd.lists.find((l) => l._id === card.listId);
        all.push({
          card,
          boardId: bd.board._id,
          boardTitle: bd.board.title,
          listTitle: list?.title ?? '',
        });
      }
    });
    all.sort((a, b) => {
      const boardCmp = a.boardTitle.localeCompare(b.boardTitle);
      if (boardCmp !== 0) return boardCmp;
      const listCmp = a.listTitle.localeCompare(b.listTitle);
      if (listCmp !== 0) return listCmp;
      return a.card.title.localeCompare(b.card.title);
    });
    return all;
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

  const hasAnything = scheduled.size > 0 || unscheduled.length > 0;

  function CardRow({ entry }: { entry: ScheduledCard }) {
    const done = Boolean(entry.card.complete);
    return (
      <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2.5 shadow-sm transition-colors hover:border-primary-300 hover:bg-canvas">
        <Link
          to={`/board/${entry.boardId}`}
          className="flex min-w-0 flex-1 items-center gap-3"
        >
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: swatchFor(entry.boardTitle) }}
          />
          <span className="min-w-0 flex-1">
            <span
              className={clsx(
                'block truncate text-sm font-medium',
                done ? 'text-ink-secondary line-through' : 'text-ink',
              )}
            >
              {entry.card.title}
            </span>
            <span className="block truncate text-xs text-ink-secondary">
              {entry.boardTitle}
              {entry.listTitle ? ` · ${entry.listTitle}` : ''}
            </span>
          </span>
          {entry.card.dueDate && formatDueTime(entry.card.dueDate) && (
            <span className="inline-flex shrink-0 items-center gap-1 text-xs tabular text-ink-secondary">
              <Clock className="h-3 w-3" />
              {formatDueTime(entry.card.dueDate)}
            </span>
          )}
        </Link>
        <button
          onClick={() => toggleDone.mutate({ cardId: entry.card._id, complete: !done })}
          aria-label={done ? `Mark "${entry.card.title}" as not done` : `Mark "${entry.card.title}" as done`}
          title={done ? 'Mark as not done' : 'Mark as done'}
          className={clsx(
            'inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors',
            done
              ? 'border-success/30 bg-success/10 text-success hover:bg-success/20'
              : 'border-line text-ink-secondary hover:border-success/40 hover:text-success',
          )}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          {done ? 'Done' : 'Mark done'}
        </button>
      </div>
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
            Cards with a due date show up here so you can see what's coming. Cards without one
            are listed under Not yet scheduled. Cards marked done are removed automatically
            after 24 hours.
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

          {unscheduled.length > 0 && (
            <section>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
                Not yet scheduled
                <span className="text-xs font-normal text-ink-secondary tabular">
                  {unscheduled.length} card{unscheduled.length === 1 ? '' : 's'}
                </span>
              </h3>
              <div className="space-y-1.5">
                {unscheduled.map((entry) => (
                  <CardRow key={entry.card._id} entry={entry} />
                ))}
              </div>
            </section>
          )}
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
