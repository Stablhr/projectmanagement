import { Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Spinner';
import type { Board } from '../../lib/types';
import { GlobalSearch } from '../search/GlobalSearch';
import { useBoards, useCreateBoard } from './useBoards';

export function BoardDashboard() {
  const { user, signOut } = useAuth();
  const { data: boards, isLoading, isError } = useBoards();
  const createBoard = useCreateBoard();

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
    <div className="min-h-screen">
      <header className="flex items-center justify-between gap-4 border-b border-line bg-surface px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary-400" />
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            Kanban
          </h1>
        </div>
        <GlobalSearch />
        <div className="flex items-center gap-3">
          <span className="text-sm text-ink-secondary">
            {user?.displayName ?? user?.email}
          </span>
          <button
            onClick={signOut}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink-secondary hover:bg-canvas"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight text-ink">
            Your boards
          </h2>
          <Button onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" />
            New board
          </Button>
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
              <BoardCard key={board._id} board={board} />
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

function BoardCard({ board }: { board: Board }) {
  return (
    <Link
      to={`/board/${board._id}`}
      className="group relative overflow-hidden rounded-xl border border-line bg-surface p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-primary-400" />
      <h3 className="font-semibold text-ink group-hover:text-primary-800">
        {board.title}
      </h3>
      <p className="mt-2 text-xs text-ink-secondary">
        {board.members.length} member{board.members.length === 1 ? '' : 's'}
      </p>
    </Link>
  );
}
