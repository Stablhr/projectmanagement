import { Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useBoards } from '../boards/useBoards';
import type { Board, BoardDetail } from '../../lib/types';

const SWATCHES = ['#99E1D9', '#4AAFA5', '#0F4C45', '#1F9D6B', '#B45309', '#2563EB', '#1A2B2A'];

function swatchFor(value: string): string {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) | 0;
  return SWATCHES[Math.abs(h) % SWATCHES.length];
}

function workspaceLabel(board: Board): string {
  return board.ownerId === 'dev-user' ? 'Personal' : 'Workspace';
}

interface CardHit {
  cardId: string;
  cardTitle: string;
  boardId: string;
  boardTitle: string;
  listTitle: string;
}

export function GlobalSearch() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: boards = [] } = useBoards();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent | TouchEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const recentBoards = useMemo(
    () => [...boards].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6),
    [boards],
  );

  const trimmed = query.trim().toLowerCase();

  const boardMatches = useMemo(
    () => (trimmed ? boards.filter((b) => b.title.toLowerCase().includes(trimmed)).slice(0, 5) : []),
    [boards, trimmed],
  );

  const cardMatches = useMemo<CardHit[]>(() => {
    if (!trimmed) return [];
    const hits: CardHit[] = [];
    const boardEntries = queryClient.getQueriesData({ queryKey: ['board'] });
    for (const [, data] of boardEntries) {
      const bd = data as BoardDetail | undefined;
      if (!bd) continue;
      for (const card of bd.cards) {
        if (!card.title.toLowerCase().includes(trimmed)) continue;
        const list = bd.lists.find((l) => l._id === card.listId);
        hits.push({
          cardId: card._id,
          cardTitle: card.title,
          boardId: bd.board._id,
          boardTitle: bd.board.title,
          listTitle: list?.title ?? '',
        });
        if (hits.length >= 6) return hits;
      }
    }
    return hits;
  }, [trimmed, queryClient]);

  const showRecent = !trimmed && open;
  const showResults = trimmed && open;

  function goBoard(id: string) {
    setOpen(false);
    setQuery('');
    navigate(`/board/${id}`);
  }

  return (
    <div ref={rootRef} className="relative w-56 md:w-72">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-2 h-4 w-4 text-ink-secondary" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search…"
          aria-label="Search boards and cards"
          className="w-full rounded-lg border border-line bg-canvas py-2 pl-8 pr-3 text-sm text-ink placeholder:text-ink-secondary/60 focus:border-primary-500 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500/30"
        />
      </div>

      {open && (showRecent || showResults) && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-line bg-surface shadow-lg">
          {showRecent && (
            <>
              <p className="px-3 pb-1 pt-2.5 text-xs font-semibold uppercase tracking-[0.05em] text-ink-secondary">
                Recent boards
              </p>
              {recentBoards.length === 0 && (
                <p className="px-3 pb-2 text-xs text-ink-secondary">No boards yet.</p>
              )}
              {recentBoards.map((b) => (
                <button
                  key={b._id}
                  onClick={() => goBoard(b._id)}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-canvas"
                >
                  <span className="h-5 w-5 shrink-0 rounded" style={{ backgroundColor: swatchFor(b.title) }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{b.title}</span>
                    <span className="block truncate text-xs text-ink-secondary">{workspaceLabel(b)}</span>
                  </span>
                </button>
              ))}
            </>
          )}

          {showResults && boardMatches.length === 0 && cardMatches.length === 0 && (
            <p className="px-3 py-3 text-sm text-ink-secondary">No boards or cards match “{query}”.</p>
          )}

          {showResults && boardMatches.length > 0 && (
            <>
              <p className="px-3 pb-1 pt-2.5 text-xs font-semibold uppercase tracking-[0.05em] text-ink-secondary">
                Boards
              </p>
              {boardMatches.map((b) => (
                <button
                  key={b._id}
                  onClick={() => goBoard(b._id)}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-canvas"
                >
                  <span className="h-5 w-5 shrink-0 rounded" style={{ backgroundColor: swatchFor(b.title) }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{b.title}</span>
                    <span className="block truncate text-xs text-ink-secondary">{workspaceLabel(b)}</span>
                  </span>
                </button>
              ))}
            </>
          )}

          {showResults && cardMatches.length > 0 && (
            <>
              <p className="px-3 pb-1 pt-2.5 text-xs font-semibold uppercase tracking-[0.05em] text-ink-secondary">
                Cards
              </p>
              {cardMatches.map((hit) => (
                <button
                  key={hit.cardId}
                  onClick={() => goBoard(hit.boardId)}
                  className="flex w-full items-start gap-2.5 px-3 py-2 text-left hover:bg-canvas"
                >
                  <span
                    className="mt-1 h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: swatchFor(hit.boardTitle) }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{hit.cardTitle}</span>
                    <span className="block truncate text-xs text-ink-secondary">
                      {hit.boardTitle}
                      {hit.listTitle ? ` · ${hit.listTitle}` : ''}
                    </span>
                  </span>
                </button>
              ))}
            </>
          )}

          <button
            onClick={() => {
              setOpen(false);
              navigate('/search');
            }}
            className="flex w-full items-center gap-2 border-t border-line px-3 py-2.5 text-sm font-medium text-primary-800 hover:bg-canvas"
          >
            <Search className="h-4 w-4" />
            Advanced search
          </button>
        </div>
      )}
    </div>
  );
}
