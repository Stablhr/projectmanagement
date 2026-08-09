import { ArrowLeft, Filter, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { useDeleteBoard } from '../boards/useBoards';
import { useBoardState } from './boardContext';
import { useRenameBoard } from './useBoard';

export function BoardHeader({
  boardId,
  title,
  onOpenFilters,
}: {
  boardId: string;
  title: string;
  onOpenFilters: () => void;
}) {
  const navigate = useNavigate();
  const rename = useRenameBoard(boardId);
  const del = useDeleteBoard();
  const { isFiltering } = useBoardState();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);

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

  return (
    <header className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3">
      <button
        onClick={() => navigate('/')}
        className="rounded-lg p-2 text-ink-secondary hover:bg-canvas"
        aria-label="Back to boards"
      >
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
          <div className="group flex items-center gap-2">
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
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={onOpenFilters}
          className={`rounded-lg p-2 text-ink-secondary hover:bg-canvas ${
            isFiltering ? 'bg-primary-200/60 text-primary-800' : ''
          }`}
          aria-label="Filter cards"
          title={isFiltering ? 'Filters active' : 'Filter'}
        >
          <Filter className="h-4 w-4" />
        </button>

        <Button variant="ghost" onClick={remove} aria-label="Delete board">
          <Trash2 className="h-4 w-4 text-danger" />
        </Button>
      </div>
    </header>
  );
}
