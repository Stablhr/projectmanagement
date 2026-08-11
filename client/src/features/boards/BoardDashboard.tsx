import { Plus, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Spinner';
import type { Board } from '../../lib/types';
import { GlobalSearch } from '../search/GlobalSearch';
import { useBoards, useCreateBoard, useDeleteBoard } from './useBoards';

export function BoardDashboard() {
  const { data: boards, isLoading, isError } = useBoards();
  const createBoard = useCreateBoard();
  const deleteBoard = useDeleteBoard();

  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    const next = title.trim();
    if (!next) return;
    createBoard.mutate(next, {
      onSuccess: () => {
        setTitle('');
        setAdding(false);
      },
    });
  }

  return (
    <div className="min-h-full">
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              Your boards
            </h1>
            <p className="mt-1 text-sm text-ink-secondary">
              Everything you're tracking, in one place.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <GlobalSearch />
            <Button onClick={() => setAdding(true)}>
              <Plus className="h-4 w-4" />
              New board
            </Button>
          </div>
        </div>

        {adding && (
          <form onSubmit={submit} className="mb-6 max-w-sm">
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => !title.trim() && setAdding(false)}
              onKeyDown={(e) => e.key === 'Escape' && setAdding(false)}
              placeholder="Board title…"
              className="w-full rounded-lg border border-primary-400 bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            />
          </form>
        )}

        {isLoading && (
          <div className="py-10">
            <Spinner label="Loading boards…" />
          </div>
        )}

        {isError && (
          <p className="text-danger">Could not load your boards.</p>
        )}

        {!isLoading && !isError && boards && boards.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {boards.map((board) => (
              <BoardCard
                key={board._id}
                board={board}
                onDelete={() => deleteBoard.mutate(board._id)}
              />
            ))}
          </div>
        )}

        {!isLoading && !isError && boards && boards.length === 0 && (
          <EmptyState
            title="No boards yet"
            hint="Create a board to start organizing work with lists and cards."
            action={<Button onClick={() => setAdding(true)}>Create your first board</Button>}
          />
        )}
      </main>
    </div>
  );
}

function BoardCard({ board, onDelete }: { board: Board; onDelete: () => void }) {
  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`Delete “${board.title}”?`)) onDelete();
  }

  return (
    <div className="group relative overflow-hidden rounded-xl border border-line bg-surface shadow-sm transition-shadow hover:shadow-md">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-500 to-accent" />
      <Link to={`/board/${board._id}`} className="block p-5">
        <h3 className="text-lg font-semibold text-ink group-hover:text-primary-700">
          {board.title}
        </h3>
        <p className="mt-1 tabular text-xs text-ink-secondary">
          {board.members.length} member{board.members.length === 1 ? '' : 's'}
        </p>
      </Link>
      <button
        type="button"
        onClick={handleDelete}
        aria-label={`Delete ${board.title}`}
        title="Delete board"
        className="absolute right-2 top-2 rounded-lg p-1.5 text-ink-secondary opacity-0 transition-opacity hover:bg-danger/10 hover:text-danger focus:opacity-100 group-hover:opacity-100"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
