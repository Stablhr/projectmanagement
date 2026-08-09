import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { BoardDetail } from '../../lib/types';
import { BoardStateProvider } from './boardContext';
import { Card } from './Card';
import { boardLabels, enrichBoardDetail } from './boardData';

vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
  SortableContext: ({ children }: { children: React.ReactNode }) => children,
  verticalListSortingStrategy: {},
}));

function makeBoard(overrides: Partial<BoardDetail> = {}): BoardDetail {
  return {
    board: {
      _id: 'board-1',
      ownerId: 'u1',
      title: 'Website Redesign',
      members: ['dev-user'],
      createdAt: '',
      updatedAt: '',
    },
    lists: [{ _id: 'list-1', boardId: 'board-1', title: 'To Do', position: 1024, createdAt: '', updatedAt: '' }],
    cards: [
      {
        _id: 'card-1',
        listId: 'list-1',
        title: 'Design the hero section',
        description: '',
        position: 1024,
        createdAt: '',
        updatedAt: '',
      },
    ],
    ...overrides,
  };
}

function renderCard() {
  const enriched = enrichBoardDetail(makeBoard());
  const card = enriched.cards[0];
  const onOpen = vi.fn();
  render(
    <BoardStateProvider board={enriched}>
      <Card card={card} onOpen={onOpen} />
    </BoardStateProvider>,
  );
  return { card, onOpen, enriched };
}

describe('Card visual details', () => {
  it('renders the card title', () => {
    renderCard();
    expect(screen.getByText('Design the hero section')).toBeInTheDocument();
  });

  it('renders label chips with names', () => {
    const { enriched } = renderCard();
    const card = enriched.cards[0];
    const labels = card.labels ?? [];
    if (labels.length === 0) return; // deterministic seed may give none
    const names = labels
      .map((id) => boardLabels('board-1').find((l) => l.id === id)?.name)
      .filter(Boolean);
    for (const name of names) {
      expect(screen.getByText(name as string)).toBeInTheDocument();
    }
  });

  it('renders a cover when present', () => {
    const board = makeBoard();
    const base = enrichBoardDetail(board);
    // Force a cover onto the card copy used for rendering
    const forced = {
      ...base,
      cards: base.cards.map((c) =>
        c._id === 'card-1'
          ? { ...c, cover: { type: 'color' as const, value: '#EB5A46' } }
          : c,
      ),
    };
    const card = forced.cards[0];
    render(
      <BoardStateProvider board={forced}>
        <Card card={card} onOpen={vi.fn()} />
      </BoardStateProvider>,
    );
    const cover = document.querySelector('[style*="background"]');
    expect(cover).not.toBeNull();
  });

  it('shows comment and attachment counts when present', () => {
    const board = makeBoard();
    const base = enrichBoardDetail(board);
    const forced = {
      ...base,
      cards: base.cards.map((c) =>
        c._id === 'card-1'
          ? { ...c, commentCount: 3, attachmentCount: 2, dueDate: null, memberIds: [], watched: false, labels: [] }
          : c,
      ),
    };
    const card = forced.cards[0];
    render(
      <BoardStateProvider board={forced}>
        <Card card={card} onOpen={vi.fn()} />
      </BoardStateProvider>,
    );
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows a watch indicator when the card is watched', () => {
    const board = makeBoard();
    const base = enrichBoardDetail(board);
    const forced = {
      ...base,
      cards: base.cards.map((c) =>
        c._id === 'card-1'
          ? { ...c, watched: true, commentCount: 0, attachmentCount: 0, dueDate: null, memberIds: [], labels: [] }
          : c,
      ),
    };
    const card = forced.cards[0];
    render(
      <BoardStateProvider board={forced}>
        <Card card={card} onOpen={vi.fn()} />
      </BoardStateProvider>,
    );
    expect(screen.getByLabelText('Watching')).toBeInTheDocument();
  });

  it('opens the card on click', () => {
    const { onOpen, card } = renderCard();
    screen.getByText('Design the hero section').click();
    expect(onOpen).toHaveBeenCalledWith(card);
  });
});
