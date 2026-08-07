import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useCreateCard } from '../cards/useCards';
import { useDeleteList, useRenameList } from '../lists/useLists';
import type { Card as CardType, List as ListType } from '../../lib/types';
import { Card } from './Card';

interface ListProps {
  boardId: string;
  list: ListType;
  cards: CardType[];
  onOpenCard: (card: CardType) => void;
}

export function List({ boardId, list, cards, onOpenCard }: ListProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: list._id,
      data: { type: 'list', listId: list._id },
    });

  const createCard = useCreateCard(boardId);
  const renameList = useRenameList(boardId);
  const deleteList = useDeleteList(boardId);

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(list.title);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  function submitTitle() {
    const next = titleDraft.trim();
    if (next && next !== list.title) {
      renameList.mutate({ listId: list._id, title: next });
    }
    setEditingTitle(false);
  }

  function submitCard(e: FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    createCard.mutate({ listId: list._id, title });
    setNewTitle('');
    setAdding(false);
  }

  async function remove() {
    if (!window.confirm(`Delete list "${list.title}" and all its cards?`)) return;
    await deleteList.mutateAsync(list._id);
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={[
        'flex max-h-full w-72 shrink-0 flex-col rounded-xl bg-canvas border border-line',
        isDragging ? 'z-10 shadow-lg ring-2 ring-primary-400' : '',
      ].join(' ')}
    >
      <div className="flex items-center gap-1 px-3 py-2.5">
        <button
          className="cursor-grab rounded p-1 text-ink-secondary hover:bg-line active:cursor-grabbing"
          aria-label="Drag list"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {editingTitle ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={submitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitTitle();
              if (e.key === 'Escape') {
                setTitleDraft(list.title);
                setEditingTitle(false);
              }
            }}
            className="w-full rounded border border-primary-500 bg-surface px-2 py-0.5 text-sm font-semibold text-ink focus:outline-none"
          />
        ) : (
          <h3
            className="flex-1 cursor-text text-sm font-semibold uppercase tracking-[0.05em] text-ink-secondary"
            onClick={() => {
              setTitleDraft(list.title);
              setEditingTitle(true);
            }}
          >
            {list.title}
          </h3>
        )}

        <button
          onClick={remove}
          className="rounded p-1 text-ink-secondary hover:bg-line"
          aria-label={`Delete list ${list.title}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-2">
        <SortableContext items={cards.map((c) => c._id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <Card key={card._id} card={card} onOpen={onOpenCard} />
          ))}
        </SortableContext>

        {cards.length === 0 && !adding && (
          <p className="px-1 pt-1 text-xs text-ink-secondary/70">
            No cards yet
          </p>
        )}

        {adding && (
          <form onSubmit={submitCard}>
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onBlur={() => !newTitle.trim() && setAdding(false)}
              placeholder="Card title…"
              className="w-full rounded-lg border border-primary-400 bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            />
            <div className="mt-2 flex items-center gap-1">
              <button
                type="submit"
                className="rounded-lg bg-primary-400 px-3 py-1.5 text-sm font-medium text-primary-800 hover:bg-primary-500"
              >
                Add card
              </button>
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="rounded p-1.5 text-ink-secondary hover:bg-line"
                aria-label="Cancel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}
      </div>

      {!adding && (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 rounded-b-xl px-3 py-2.5 text-sm text-ink-secondary hover:bg-line"
        >
          <Plus className="h-4 w-4" />
          Add a card
        </button>
      )}
    </div>
  );
}
