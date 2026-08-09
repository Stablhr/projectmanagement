import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { clsx } from 'clsx';
import {
  Archive,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  GripVertical,
  MoveRight,
  Pencil,
  Plus,
  SortAsc,
  X,
} from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { Dropdown, MenuDivider, MenuItem } from '../../components/ui/Dropdown';
import type { Card as CardType, List as ListType } from '../../lib/types';
import { useCreateCard } from '../cards/useCards';
import { useCreateList, useDeleteList, useReorderLists, useRenameList } from '../lists/useLists';
import { useBoardState } from './boardContext';
import { Card } from './Card';

interface ListProps {
  boardId: string;
  list: ListType;
  cards: CardType[];
  onOpenCard: (card: CardType) => void;
}

type SortKey = 'manual' | 'title' | 'due';
type MenuSection = 'root' | 'move' | 'sort';

export function List({ boardId, list, cards, onOpenCard }: ListProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: list._id,
      data: { type: 'list', listId: list._id },
    });

  const { members, collapsed, toggleCollapsed, archiveList, archiveCard, visibleBoard } =
    useBoardState();

  const createCard = useCreateCard(boardId);
  const renameList = useRenameList(boardId);
  const deleteList = useDeleteList(boardId);
  const createList = useCreateList(boardId);
  const reorderLists = useReorderLists(boardId);

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(list.title);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [menuSection, setMenuSection] = useState<MenuSection>('root');
  const [sortKey, setSortKey] = useState<SortKey>('manual');

  const assignee = members.find((m) => m.id === list.assigneeId);
  const isCollapsed = Boolean(collapsed[list._id]);

  const sortedCards = useMemo(() => {
    if (sortKey === 'title') {
      return [...cards].sort((a, b) => a.title.localeCompare(b.title));
    }
    if (sortKey === 'due') {
      return [...cards].sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    }
    return cards;
  }, [cards, sortKey]);

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

  async function copyList() {
    const copy = await createList.mutateAsync(`${list.title} (copy)`);
    for (const card of cards) {
      await createCard.mutateAsync({ listId: copy._id, title: card.title });
    }
  }

  function moveListTo(targetId: string) {
    const ids = visibleBoard.lists.map((l) => l._id);
    const from = ids.indexOf(list._id);
    const to = ids.indexOf(targetId);
    if (from === -1 || to === -1) return;
    ids.splice(from, 1);
    ids.splice(to, 0, list._id);
    reorderLists.mutate(ids);
  }

  function archiveAllCards() {
    for (const card of cards) archiveCard(card._id);
  }

  // ----- Collapsed rendering: a thin vertical strip -----
  if (isCollapsed) {
    return (
      <div
        ref={setNodeRef}
        style={{ transform: CSS.Transform.toString(transform), transition }}
        data-list-id={list._id}
        className={clsx(
          'flex max-h-full w-11 shrink-0 flex-col items-center gap-3 rounded-xl border border-line bg-canvas py-2.5',
          isDragging && 'z-10 shadow-lg ring-2 ring-primary-400',
        )}
      >
        <button
          onClick={() => toggleCollapsed(list._id)}
          className="rounded p-1 text-ink-secondary hover:bg-line"
          aria-label={`Expand list ${list.title}`}
          title="Expand list"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
        <button
          {...attributes}
          {...listeners}
          className="flex-1 cursor-grab text-center active:cursor-grabbing"
          onClick={() => toggleCollapsed(list._id)}
          title={list.title}
          aria-label={list.title}
        >
          <span
            className="inline-block text-xs font-semibold uppercase tracking-[0.05em] text-ink-secondary"
            style={{ writingMode: 'vertical-rl' }}
          >
            {list.title}
          </span>
        </button>
        <span className="rounded-full bg-ink/10 px-1.5 py-0.5 text-[10px] font-semibold text-ink-secondary tabular">
          {cards.length}
        </span>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      data-list-id={list._id}
      className={clsx(
        'flex max-h-full w-72 shrink-0 flex-col rounded-xl bg-canvas border border-line',
        isDragging ? 'z-10 shadow-lg ring-2 ring-primary-400' : '',
      )}
    >
      <div className="flex items-start gap-1 px-3 py-2.5">
        <button
          className="mt-0.5 cursor-grab rounded p-1 text-ink-secondary hover:bg-line active:cursor-grabbing"
          aria-label="Drag list"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
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
                className="flex-1 cursor-text truncate text-sm font-semibold uppercase tracking-[0.05em] text-ink-secondary"
                onClick={() => {
                  setTitleDraft(list.title);
                  setEditingTitle(true);
                }}
                title={list.title}
              >
                {list.title}
              </h3>
            )}
            <span className="shrink-0 rounded-full bg-ink/10 px-1.5 py-0.5 text-[10px] font-semibold text-ink-secondary tabular">
              {cards.length}
            </span>
          </div>

          {assignee && (
            <p className="mt-0.5 truncate text-xs text-ink-secondary">
              {assignee.name}
            </p>
          )}
        </div>

        <button
          onClick={() => toggleCollapsed(list._id)}
          className="mt-0.5 rounded p-1 text-ink-secondary hover:bg-line"
          aria-label={`Collapse list ${list.title}`}
          title="Collapse list"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>

        <Dropdown
          align="right"
          trigger={({ open, toggle }) => (
            <button
              onClick={toggle}
              className={clsx(
                'mt-0.5 rounded p-1 text-ink-secondary hover:bg-line',
                open && 'bg-line',
              )}
              aria-label={`List menu for ${list.title}`}
              aria-haspopup="menu"
            >
              <span className="flex h-4 items-center gap-0.5 px-0.5">
                <span className="h-1 w-1 rounded-full bg-current" />
                <span className="h-1 w-1 rounded-full bg-current" />
                <span className="h-1 w-1 rounded-full bg-current" />
              </span>
            </button>
          )}
        >
          {({ close }) => {
            if (menuSection === 'move') {
              return (
                <>
                  <button
                    onClick={() => setMenuSection('root')}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-ink-secondary hover:bg-canvas"
                  >
                    <ChevronsLeft className="h-3.5 w-3.5" />
                    Move list
                  </button>
                  <MenuDivider />
                  {visibleBoard.lists.map((l) => (
                    <MenuItem
                      key={l._id}
                      label={`Move before “${l.title}”`}
                      icon={<MoveRight className="h-4 w-4" />}
                      onClick={() => {
                        moveListTo(l._id);
                        close();
                      }}
                    />
                  ))}
                </>
              );
            }
            if (menuSection === 'sort') {
              return (
                <>
                  <button
                    onClick={() => setMenuSection('root')}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-ink-secondary hover:bg-canvas"
                  >
                    <ChevronsLeft className="h-3.5 w-3.5" />
                    Sort cards
                  </button>
                  <MenuDivider />
                  <MenuItem
                    label="By title"
                    icon={<SortAsc className="h-4 w-4" />}
                    active={sortKey === 'title'}
                    onClick={() => {
                      setSortKey('title');
                      close();
                    }}
                  />
                  <MenuItem
                    label="By due date"
                    icon={<SortAsc className="h-4 w-4" />}
                    active={sortKey === 'due'}
                    onClick={() => {
                      setSortKey('due');
                      close();
                    }}
                  />
                </>
              );
            }
            return (
              <>
                <MenuItem
                  label="Rename list"
                  icon={<Pencil className="h-4 w-4" />}
                  onClick={() => {
                    close();
                    setTitleDraft(list.title);
                    setEditingTitle(true);
                  }}
                />
                <MenuItem
                  label="Move list"
                  icon={<MoveRight className="h-4 w-4" />}
                  onClick={() => setMenuSection('move')}
                />
                <MenuItem
                  label="Copy list"
                  icon={<Copy className="h-4 w-4" />}
                  onClick={() => {
                    close();
                    void copyList();
                  }}
                />
                <MenuItem
                  label="Sort cards"
                  icon={<SortAsc className="h-4 w-4" />}
                  onClick={() => setMenuSection('sort')}
                />
                <MenuDivider />
                <MenuItem
                  label="Archive all cards in list"
                  icon={<Archive className="h-4 w-4" />}
                  onClick={() => {
                    close();
                    archiveAllCards();
                  }}
                />
                <MenuItem
                  label="Archive list"
                  icon={<Archive className="h-4 w-4" />}
                  onClick={() => {
                    close();
                    archiveList(list._id);
                  }}
                />
                <MenuItem
                  label="Delete list…"
                  icon={<X className="h-4 w-4" />}
                  danger
                  onClick={() => {
                    close();
                    void remove();
                  }}
                />
              </>
            );
          }}
        </Dropdown>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-2">
        <SortableContext items={cards.map((c) => c._id)} strategy={verticalListSortingStrategy}>
          {sortedCards.map((card) => (
            <Card key={card._id} card={card} onOpen={onOpenCard} />
          ))}
        </SortableContext>

        {cards.length === 0 && !adding && (
          <p className="px-1 pt-1 text-xs text-ink-secondary/70">No cards yet</p>
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
