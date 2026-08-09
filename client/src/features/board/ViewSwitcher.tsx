import {
  Calendar,
  GitBranch,
  LayoutDashboard,
  LayoutGrid,
  Map,
  Table,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { Dropdown } from '../../components/ui/Dropdown';
import { useBoardState } from './boardContext';
import type { BoardViewKind } from './boardContext';

const VIEWS: { key: BoardViewKind; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { key: 'board', label: 'Board', icon: LayoutGrid },
  { key: 'table', label: 'Table', icon: Table },
  { key: 'calendar', label: 'Calendar', icon: Calendar },
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'timeline', label: 'Timeline', icon: GitBranch },
  { key: 'map', label: 'Map', icon: Map },
];

export function ViewSwitcher() {
  const { view, setView } = useBoardState();

  return (
    <Dropdown
      trigger={({ toggle }) => (
        <button
          onClick={toggle}
          aria-label="Switch view"
          title="Switch view"
          className="rounded-lg p-1.5 text-ink-secondary transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
        >
          <LayoutGrid className="h-4 w-4" />
        </button>
      )}
    >
      {({ close }) => (
        <>
          <p className="px-3 pb-1 pt-2.5 text-xs font-semibold uppercase tracking-[0.05em] text-ink-secondary">
            View
          </p>
          {VIEWS.map((v) => {
            const Icon = v.icon;
            const active = view === v.key;
            return (
              <button
                key={v.key}
                onClick={() => {
                  setView(v.key);
                  close();
                }}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                  active ? 'bg-primary-100/60 font-medium text-primary-800' : 'text-ink hover:bg-canvas'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-primary-700' : 'text-ink-secondary'}`} />
                {v.label}
                {active && <span className="ml-auto text-xs text-primary-700">Current</span>}
              </button>
            );
          })}
        </>
      )}
    </Dropdown>
  );
}
