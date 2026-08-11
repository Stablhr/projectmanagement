import { Calendar, Inbox, LayoutGrid, LogOut, Plus } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { clsx } from 'clsx';

const navItems = [
  { to: '/', label: 'Boards', icon: LayoutGrid, end: true },
  { to: '/planner', label: 'Planner', icon: Calendar, end: false },
  { to: '/inbox', label: 'Inbox', icon: Inbox, end: false },
];

export function AppShell() {
  const { user, signOut } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="flex h-full w-[230px] shrink-0 flex-col border-r border-line bg-surface-alt px-4 py-5">
        <div className="mb-6 flex items-center gap-2.5 px-1">
          <div className="relative h-[26px] w-[26px] shrink-0 rounded-lg bg-gradient-to-br from-primary-500 to-accent">
            <div className="absolute inset-[6px] rounded-[3px] bg-surface opacity-90" />
          </div>
          <span className="text-[19px] font-bold tracking-tight text-ink">
            SchedFlow
          </span>
        </div>

        <nav className="flex flex-col gap-[3px]">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors',
                  isActive
                    ? 'bg-surface text-primary-600 shadow-sm'
                    : 'text-ink-secondary hover:bg-primary-500/10 hover:text-ink',
                )
              }
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-6 px-1 text-[11px] leading-relaxed text-ink-faint">
          A quick-look prototype — capture in <b>Inbox</b>, organize in{' '}
          <b>Boards</b>, schedule in <b>Planner</b>.
        </div>

        <div className="mt-auto">
          <div className="mb-3 rounded-xl border-[1.5px] border-line bg-surface p-3 shadow-sm">
            <div className="mb-2 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-faint">
              <Plus className="h-3 w-3" />
              Capture anything
            </div>
            <textarea
              disabled
              rows={1}
              placeholder="Coming soon…"
              className="h-10 w-full resize-none bg-transparent text-[13.5px] text-ink outline-none placeholder:text-ink-faint"
            />
          </div>

          <div className="flex items-center gap-2 rounded-lg px-2 py-1.5">
            <span className="min-w-0 flex-1 truncate text-xs text-ink-secondary">
              {user?.displayName ?? user?.email}
            </span>
            <button
              onClick={signOut}
              aria-label="Sign out"
              title="Sign out"
              className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-surface hover:text-ink"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="h-full flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
