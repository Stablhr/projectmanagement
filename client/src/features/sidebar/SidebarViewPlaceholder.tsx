import { Calendar, Inbox } from 'lucide-react';
import type { ComponentType } from 'react';

const VIEWS: Record<string, { title: string; caption: string; icon: ComponentType<{ className?: string }> }> = {
  planner: {
    title: 'Planner',
    caption: 'Drag unscheduled cards onto a week grid and time-box your day.',
    icon: Calendar,
  },
  inbox: {
    title: 'Inbox',
    caption: 'Capture loose tasks quickly — anything you add shows up here first.',
    icon: Inbox,
  },
};

export function SidebarViewPlaceholder({ view }: { view: 'planner' | 'inbox' }) {
  const { title, caption, icon: Icon } = VIEWS[view];

  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface shadow-sm">
        <Icon className="h-8 w-8 text-primary-700" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-ink">{title}</h2>
        <p className="mt-1 max-w-sm text-sm text-ink-secondary">{caption}</p>
      </div>
      <span className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink-secondary">
        Coming soon
      </span>
    </div>
  );
}
