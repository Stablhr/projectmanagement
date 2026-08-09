import {
  ArrowLeft,
  Filter,
  MoreHorizontal,
  Pencil,
  Slack,
  Star,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AvatarStack } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { PlaceholderDialog } from '../../components/ui/PlaceholderDialog';
import { useDeleteBoard } from '../boards/useBoards';
import { BoardMenu } from './BoardMenu';
import { useBoardState } from './boardContext';
import { FilterPanel } from './FilterPanel';
import { LabelsManager } from './LabelsManager';
import { ShareBoardModal } from './ShareBoardModal';
import { VisibilityModal } from './VisibilityModal';
import { ViewSwitcher } from './ViewSwitcher';
import { useRenameBoard } from './useBoard';

export function BoardHeader({ boardId, title }: { boardId: string; title: string }) {
  const navigate = useNavigate();
  const rename = useRenameBoard(boardId);
  const del = useDeleteBoard();
  const { members, meta, setMeta, isFiltering } = useBoardState();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);

  const [menuOpen, setMenuOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [visibilityOpen, setVisibilityOpen] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [powerUpsOpen, setPowerUpsOpen] = useState(false);
  const [slackOpen, setSlackOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  function submit() {
    const next = draft.trim();
    if (next && next !== title) rename.mutate(next);
    setEditing(false);
  }

  async function remove() {
    if (!window.confirm(`Delete board "${title}"? This cannot be undone.`)) return;
    await del.mutateAsync(boardId);
    navigate('/');
  }

  const iconBtn =
    'rounded-lg p-2 text-ink-secondary transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600';

  return (
    <>
      <header className="flex items-center gap-2 border-b border-line bg-surface px-3 py-2.5">
        <button onClick={() => navigate('/')} className={iconBtn} aria-label="Back to boards">
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={submit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit();
                if (e.key === 'Escape') {
                  setDraft(title);
                  setEditing(false);
                }
              }}
              className="w-full max-w-sm rounded-lg border border-primary-500 bg-surface px-3 py-1.5 text-lg font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            />
          ) : (
            <div className="group flex items-center gap-1.5">
              <h1 className="text-lg font-semibold tracking-tight text-ink">{title}</h1>
              <button
                onClick={() => {
                  setDraft(title);
                  setEditing(true);
                }}
                className="rounded p-1.5 text-ink-secondary opacity-0 transition-opacity group-hover:opacity-100 hover:bg-canvas"
                aria-label="Rename board"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <ViewSwitcher />
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <AvatarStack members={members} max={3} />

          <button
            className={iconBtn}
            onClick={() => setSlackOpen(true)}
            aria-label="Slack integration"
            title="Slack integration"
          >
            <Slack className="h-4 w-4" />
          </button>

          <button
            onClick={() => setFiltersOpen(true)}
            className={`${iconBtn} ${isFiltering ? 'bg-primary-200/60 text-primary-800' : ''}`}
            aria-label="Filter cards"
            title={isFiltering ? 'Filters active' : 'Filter'}
          >
            <Filter className="h-4 w-4" />
          </button>

          <button
            onClick={() => setMeta({ starred: !meta.starred })}
            className={iconBtn}
            aria-label="Star board"
            title={meta.starred ? 'Unstar board' : 'Star board'}
          >
            <Star
              className={`h-4 w-4 ${meta.starred ? 'fill-warning text-warning' : ''}`}
            />
          </button>

          <button
            onClick={() => setShareOpen(true)}
            className={iconBtn}
            aria-label="Share board"
            title="Share board"
          >
            <Users className="h-4 w-4" />
          </button>

          <Button onClick={() => setShareOpen(true)} className="ml-1">
            Share
          </Button>

          <button
            onClick={() => setMenuOpen(true)}
            className={iconBtn}
            aria-label="Open board menu"
            title="Board menu"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </header>

      <FilterPanel open={filtersOpen} onClose={() => setFiltersOpen(false)} />
      <BoardMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onOpenShare={() => {
          setMenuOpen(false);
          setShareOpen(true);
        }}
        onOpenVisibility={() => {
          setMenuOpen(false);
          setVisibilityOpen(true);
        }}
        onOpenLabels={() => {
          setMenuOpen(false);
          setLabelsOpen(true);
        }}
        onOpenPowerUps={() => {
          setMenuOpen(false);
          setPowerUpsOpen(true);
        }}
        onDeleteBoard={() => {
          setMenuOpen(false);
          void remove();
        }}
      />
      <LabelsManager open={labelsOpen} onClose={() => setLabelsOpen(false)} />

      {shareOpen && <ShareBoardModal open onClose={() => setShareOpen(false)} />}
      {visibilityOpen && <VisibilityModal open onClose={() => setVisibilityOpen(false)} />}
      {powerUpsOpen && (
        <PlaceholderDialog
          open
          onClose={() => setPowerUpsOpen(false)}
          title="Power-Ups"
          hint="Browse and install integrations. Slack settings arrive in a later phase."
        />
      )}
      {slackOpen && (
        <PlaceholderDialog
          open
          onClose={() => setSlackOpen(false)}
          title="Slack integration"
          hint="Slack notifications settings are coming soon."
        />
      )}
    </>
  );
}
