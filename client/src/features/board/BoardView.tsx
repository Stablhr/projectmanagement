import {
  closestCorners,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { horizontalListSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import { useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Spinner';
import type { BoardDetail, Card as CardType } from '../../lib/types';
import { useCreateList, useReorderLists } from '../lists/useLists';
import { enrichBoardDetail } from './boardData';
import { BoardStateProvider } from './boardContext';
import { BoardHeader } from './BoardHeader';
import { CardModal } from './CardModal';
import { List } from './List';
import { listOrder, moveCardInCache, reorderListsInCache } from './reorderUtils';
import { useBoard, useReorderCards } from './useBoard';
import { useBoardSocket } from './useBoardSocket';

interface DragState {
  type: 'card' | 'list';
  id: string;
  currentListId: string;
}

function computeListOrder(lists: BoardDetail['lists'], activeId: string, overId: string) {
  const ids = lists.map((l) => l._id);
  const oldIndex = ids.indexOf(activeId);
  const newIndex = ids.indexOf(overId);
  if (oldIndex === -1 || newIndex === -1) return ids;
  const [moved] = ids.splice(oldIndex, 1);
  ids.splice(newIndex, 0, moved);
  return ids;
}

export function BoardView() {
  const { boardId = '' } = useParams();
  const { data, isLoading, isError } = useBoard(boardId);

  const enriched = useMemo(
    () => (data ? enrichBoardDetail(data) : undefined),
    [data],
  );

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner label="Loading board…" />
      </div>
    );
  }

  if (isError || !enriched) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-danger">Could not load this board.</p>
      </div>
    );
  }

  return (
    <BoardStateProvider board={enriched}>
      <BoardShell key={boardId} boardId={boardId} board={enriched} />
    </BoardStateProvider>
  );
}

function BoardShell({ boardId, board }: { boardId: string; board: BoardDetail }) {
  const queryClient = useQueryClient();
  const createList = useCreateList(boardId);
  const reorderLists = useReorderLists(boardId);
  const reorderCards = useReorderCards(boardId);

  const [dragState, setDragState] = useState<DragState | null>(null);
  const snapshotRef = useRef<BoardDetail | null>(null);
  const [openCard, setOpenCard] = useState<CardType | null>(null);
  const [addingList, setAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  useBoardSocket(boardId);

  const lists = board.lists;

  const cardsByList = useMemo(() => {
    const map: Record<string, CardType[]> = {};
    for (const list of lists) {
      map[list._id] = board.cards
        .filter((c) => c.listId === list._id)
        .sort((a, b) => a.position - b.position);
    }
    return map;
  }, [board.cards, lists]);

  function readBoard() {
    return queryClient.getQueryData<BoardDetail>(['board', boardId]) ?? board;
  }

  function onDragStart(event: DragStartEvent) {
    const activeData = event.active.data.current as
      | { type: 'card' | 'list'; listId?: string }
      | undefined;
    if (!activeData) return;
    const boardData = readBoard();
    if (boardData) snapshotRef.current = boardData;
    setDragState({
      type: activeData.type,
      id: String(event.active.id),
      currentListId: activeData.listId ?? '',
    });
  }

  function onDragOver(event: DragOverEvent) {
    const { over } = event;
    if (!over || !dragState || dragState.type !== 'card') return;

    const overData = over.data.current as
      | { type: 'card' | 'list'; listId?: string }
      | undefined;
    if (!overData?.listId) return;

    const boardData = readBoard();
    if (!boardData) return;

    const destListId = overData.listId;
    const overCardId =
      overData.type === 'card' ? String(over.id) : null;

    const moved = moveCardInCache(boardData, dragState.id, destListId, overCardId);
    queryClient.setQueryData<BoardDetail>(['board', boardId], moved);
    setDragState((prev) =>
      prev ? { ...prev, currentListId: destListId } : prev,
    );
  }

  function onDragEnd(event: DragEndEvent) {
    const { over } = event;
    const state = dragState;

    if (!state) return;

    if (state.type === 'list') {
      const boardData = readBoard();
      if (over && boardData && String(over.id) !== state.id) {
        const orderedIds = computeListOrder(boardData.lists, state.id, String(over.id));
        queryClient.setQueryData<BoardDetail>(
          ['board', boardId],
          reorderListsInCache(boardData, orderedIds),
        );
        reorderLists.mutate(orderedIds);
      }
    } else if (state.type === 'card') {
      const boardData = readBoard();
      if (!over || !boardData) {
        if (snapshotRef.current) {
          queryClient.setQueryData(['board', boardId], snapshotRef.current);
        }
      } else {
        const destListId = state.currentListId;
        reorderCards.mutate({
          cardId: state.id,
          destListId,
          orderedIds: listOrder(boardData, destListId),
        });
      }
    }

    setDragState(null);
    snapshotRef.current = null;
  }

  function onDragCancel() {
    if (snapshotRef.current) {
      queryClient.setQueryData(['board', boardId], snapshotRef.current);
    }
    setDragState(null);
    snapshotRef.current = null;
  }

  function submitList(e: React.FormEvent) {
    e.preventDefault();
    const title = newListTitle.trim();
    if (!title) return;
    createList.mutate(title);
    setNewListTitle('');
    setAddingList(false);
  }

  return (
    <div className="flex h-screen flex-col">
      <BoardHeader boardId={board.board._id} title={board.board.title} />

      <div className="flex-1 overflow-x-auto overflow-y-hidden px-4 py-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
          onDragCancel={onDragCancel}
        >
          <SortableContext
            items={lists.map((l) => l._id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex h-full items-start gap-3">
              {lists.map((list) => (
                <List
                  key={list._id}
                  boardId={boardId}
                  list={list}
                  cards={cardsByList[list._id] ?? []}
                  onOpenCard={setOpenCard}
                />
              ))}

              <div className="w-72 shrink-0">
                {addingList ? (
                  <form
                    onSubmit={submitList}
                    className="rounded-xl border border-primary-400 bg-surface p-2 shadow-sm"
                  >
                    <input
                      autoFocus
                      value={newListTitle}
                      onChange={(e) => setNewListTitle(e.target.value)}
                      onBlur={() => !newListTitle.trim() && setAddingList(false)}
                      onKeyDown={(e) =>
                        e.key === 'Escape' && setAddingList(false)
                      }
                      placeholder="List title…"
                      className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                    />
                    <button
                      type="submit"
                      className="mt-2 w-full rounded-lg bg-primary-400 px-3 py-2 text-sm font-medium text-primary-800 hover:bg-primary-500"
                    >
                      Add list
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setAddingList(true)}
                    className="flex w-full items-center gap-1.5 rounded-xl bg-ink/5 px-3 py-2.5 text-sm font-medium text-ink-secondary backdrop-blur hover:bg-ink/10"
                  >
                    <Plus className="h-4 w-4" />
                    Add another list
                  </button>
                )}
              </div>
            </div>
          </SortableContext>
        </DndContext>

        {lists.length === 0 && (
          <div className="mt-6 max-w-md">
            <EmptyState
              title="This board has no lists yet"
              hint="Add your first column — like “To Do”, “In Progress”, or “Done”."
            />
          </div>
        )}
      </div>

      {openCard && (
        <CardModal
          boardId={boardId}
          card={openCard}
          onClose={() => setOpenCard(null)}
        />
      )}
    </div>
  );
}
