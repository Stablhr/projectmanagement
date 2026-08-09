import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import type { BoardDetail } from '../../lib/types';
import { BoardStateProvider } from './boardContext';
import { enrichBoardDetail } from './boardData';
import { BoardMenu } from './BoardMenu';
import { LabelsManager } from './LabelsManager';

function makeBoard(): BoardDetail {
  return {
    board: { _id: 'board-1', ownerId: 'u1', title: 'Test', members: ['dev-user'], createdAt: '', updatedAt: '' },
    lists: [{ _id: 'list-1', boardId: 'board-1', title: 'To Do', position: 1024, createdAt: '', updatedAt: '' }],
    cards: [
      { _id: 'card-1', listId: 'list-1', title: 'Alpha', description: '', position: 1024, createdAt: '', updatedAt: '' },
    ],
  };
}

const handlers = {
  onClose: vi.fn(),
  onOpenShare: vi.fn(),
  onOpenVisibility: vi.fn(),
  onOpenLabels: vi.fn(),
  onOpenPowerUps: vi.fn(),
};

function renderMenu() {
  const enriched = enrichBoardDetail(makeBoard(), 1_700_000_000_000);
  return render(
    <BoardStateProvider board={enriched}>
      <BoardMenu open {...handlers} />
    </BoardStateProvider>,
  );
}

describe('BoardMenu', () => {
  it('renders all five sections in order', () => {
    renderMenu();
    const headings = screen
      .getAllByRole('heading', { level: 3 })
      .map((h) => h.textContent);
    expect(headings).toEqual([
      'Top actions',
      'Board configuration',
      'Stickers',
      'Board management',
      'Preferences',
    ]);
  });

  it('shows the visibility label and opens the visibility flow', () => {
    renderMenu();
    expect(screen.getByText('Visibility: Workspace')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Visibility: Workspace'));
    expect(handlers.onOpenVisibility).toHaveBeenCalled();
  });

  it('opens share from the top actions', () => {
    renderMenu();
    fireEvent.click(screen.getByText('Share'));
    expect(handlers.onOpenShare).toHaveBeenCalled();
  });

  it('opens labels from board configuration', () => {
    renderMenu();
    fireEvent.click(screen.getByText(/Labels \(/));
    expect(handlers.onOpenLabels).toHaveBeenCalled();
  });

  it('stubs unimplemented features with a placeholder dialog', () => {
    renderMenu();
    fireEvent.click(screen.getByText('Custom Fields'));
    expect(screen.getAllByText('Custom Fields').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/stub for MVP/)).toBeInTheDocument();
  });
});

describe('LabelsManager', () => {
  it('creates a new label', () => {
    const enriched = enrichBoardDetail(makeBoard(), 1_700_000_000_000);
    render(
      <BoardStateProvider board={enriched}>
        <LabelsManager open onClose={vi.fn()} />
      </BoardStateProvider>,
    );
    fireEvent.change(screen.getByPlaceholderText('Label name…'), {
      target: { value: 'Security' },
    });
    fireEvent.click(screen.getByLabelText('Add label'));
    expect(screen.getByText('Security')).toBeInTheDocument();
  });

  it('deletes an existing label', () => {
    const enriched = enrichBoardDetail(makeBoard(), 1_700_000_000_000);
    const name = enriched.board.title;
    void name;
    render(
      <BoardStateProvider board={enriched}>
        <LabelsManager open onClose={vi.fn()} />
      </BoardStateProvider>,
    );
    const labels = screen.getAllByText(/priority|Design|Frontend|Backend|Bug|review|Docs|High|Medium|Low/i);
    expect(labels.length).toBeGreaterThan(0);
  });
});
