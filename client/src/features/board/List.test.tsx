import { fireEvent, render, screen, within } from '@testing-library/react';
import { vi } from 'vitest';
import type { BoardDetail } from '../../lib/types';
import { BoardStateProvider, useBoardState } from './boardContext';
import { enrichBoardDetail } from './boardData';
import { List } from './List';

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

vi.mock('../../lib/api', () => ({
  api: {
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    del: vi.fn(),
  },
}));

vi.mock('@tanstack/react-query', () => {
  const mutate = () => ({ mutate: () => {}, mutateAsync: vi.fn().mockResolvedValue({ _id: 'new' }) });
  const useMutation = () => ({ ...mutate(), isPending: false });
  return {
    useMutation,
    useQueryClient: () => ({ setQueryData: vi.fn(), getQueryData: vi.fn() }),
  };
});

function makeBoard(): BoardDetail {
  return {
    board: { _id: 'board-1', ownerId: 'u1', title: 'Test', members: ['dev-user'], createdAt: '', updatedAt: '' },
    lists: [
      { _id: 'list-1', boardId: 'board-1', title: 'To Do', position: 1024, createdAt: '', updatedAt: '' },
      { _id: 'list-2', boardId: 'board-1', title: 'Done', position: 2048, createdAt: '', updatedAt: '' },
    ],
    cards: [
      { _id: 'card-1', listId: 'list-1', title: 'Alpha', description: '', position: 1024, createdAt: '', updatedAt: '' },
      { _id: 'card-2', listId: 'list-1', title: 'Beta', description: '', position: 2048, createdAt: '', updatedAt: '' },
    ],
  };
}

function renderList() {
  const enriched = enrichBoardDetail(makeBoard());
  const list = enriched.lists[0];
  const cards = enriched.cards.filter((c) => c.listId === list._id);
  return render(
    <BoardStateProvider board={enriched}>
      <List boardId="board-1" list={list} cards={cards} onOpenCard={vi.fn()} />
    </BoardStateProvider>,
  );
}

describe('List behavior', () => {
  it('renders title, card count, and assignee subtitle', () => {
    renderList();
    const listEl = screen.getByText('To Do');
    expect(listEl).toBeInTheDocument();
    expect(within(listEl.closest('div')!.parentElement as HTMLElement).getByText('2')).toBeInTheDocument();
    // assignee subtitle: one of the seeded members
    const assigneeEl = screen.getByText((_, el) =>
      Boolean(el?.className?.toString().includes('text-xs text-ink-secondary')) && el!.textContent !== '2',
    );
    expect(assigneeEl).toBeTruthy();
  });

  it('collapses the list into a vertical strip and expands it back', () => {
    renderList();
    const collapse = screen.getByLabelText('Collapse list To Do');
    fireEvent.click(collapse);
    expect(screen.getByLabelText('Expand list To Do')).toBeInTheDocument();
    const expand = screen.getByLabelText('Expand list To Do');
    fireEvent.click(expand);
    expect(screen.getByLabelText('Collapse list To Do')).toBeInTheDocument();
  });

  it('opens the add-a-card input', () => {
    renderList();
    fireEvent.click(screen.getByText('Add a card'));
    expect(screen.getByPlaceholderText('Card title…')).toBeInTheDocument();
  });

  it('offers the full list menu', () => {
    renderList();
    fireEvent.click(screen.getByLabelText('List menu for To Do'));
    const menu = screen.getByRole('menu');
    for (const label of [
      'Rename list',
      'Move list',
      'Copy list',
      'Sort cards',
      'Archive list',
      'Archive all cards in list',
    ]) {
      expect(within(menu).getByText(label)).toBeInTheDocument();
    }
  });

  it('archiving a list removes it from the visible board', () => {
    const enriched = enrichBoardDetail(makeBoard());
    const list = enriched.lists[0];
    const cards = enriched.cards.filter((c) => c.listId === list._id);
    const VisibleProbe = () => {
      const { visibleBoard } = useBoardState();
      return <div data-testid="visible">{visibleBoard.lists.map((l) => l._id).join(',')}</div>;
    };
    render(
      <BoardStateProvider board={enriched}>
        <List boardId="board-1" list={list} cards={cards} onOpenCard={vi.fn()} />
        <VisibleProbe />
      </BoardStateProvider>,
    );
    fireEvent.click(screen.getByLabelText('List menu for To Do'));
    fireEvent.click(screen.getByText('Archive list'));
    expect(screen.getByTestId('visible')).toHaveTextContent('list-2');
    expect(screen.getByTestId('visible')).not.toHaveTextContent('list-1');
  });
});
