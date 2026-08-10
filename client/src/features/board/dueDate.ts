import { clsx } from 'clsx';

export type DueUrgency = 'overdue' | 'soon' | 'on-time' | 'none';

const DAY = 24 * 60 * 60 * 1000;
const SOON_WINDOW = 2 * DAY;

export function dueUrgency(dueDate?: string | null): DueUrgency {
  if (!dueDate) return 'none';
  const diff = new Date(dueDate).getTime() - Date.now();
  if (diff < 0) return 'overdue';
  if (diff <= SOON_WINDOW) return 'soon';
  return 'on-time';
}

export function formatDueDate(dueDate?: string | null): string {
  if (!dueDate) return '';
  const date = new Date(dueDate);
  const now = new Date();
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  if (sameDay(date, now)) return 'Today';
  if (sameDay(date, new Date(now.getTime() + DAY))) return 'Tomorrow';
  if (sameDay(date, new Date(now.getTime() - DAY))) return 'Yesterday';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const badgeClasses: Record<DueUrgency, string> = {
  overdue: 'bg-danger/10 text-danger',
  soon: 'bg-warning/15 text-warning',
  'on-time': 'bg-ink/10 text-ink-secondary',
  none: '',
};

const dotClasses: Record<DueUrgency, string> = {
  overdue: 'bg-danger',
  soon: 'bg-warning',
  'on-time': 'bg-ink/30',
  none: 'bg-ink/20',
};

export function dueBadgeClass(urgency: DueUrgency) {
  return badgeClasses[urgency];
}

export function dueDotClass(urgency: DueUrgency) {
  return clsx('inline-block h-1.5 w-1.5 rounded-full', dotClasses[urgency]);
}
