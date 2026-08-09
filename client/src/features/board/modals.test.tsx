import { fireEvent, render, screen } from '@testing-library/react';
import type { BoardDetail } from '../../lib/types';
import { BoardStateProvider, useBoardState } from './boardContext';
import { enrichBoardDetail } from './boardData';
import { ShareBoardModal } from './ShareBoardModal';
import { SlackSettingsModal } from './SlackSettingsModal';
import { VisibilityModal } from './VisibilityModal';

function makeBoard(): BoardDetail {
  return {
    board: { _id: 'board-1', ownerId: 'u1', title: 'Test', members: ['dev-user'], createdAt: '', updatedAt: '' },
    lists: [],
    cards: [],
  };
}

function renderModal(children: React.ReactNode) {
  const enriched = enrichBoardDetail(makeBoard(), 1_700_000_000_000);
  return render(<BoardStateProvider board={enriched}>{children}</BoardStateProvider>);
}

describe('ShareBoardModal', () => {
  it('renders invite input, role dropdown, share button, and tabs', () => {
    renderModal(<ShareBoardModal open onClose={() => {}} />);
    expect(screen.getByPlaceholderText('e.g. aria@flowline.app')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Invite role' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /share board/i })).toBeInTheDocument();
    expect(screen.getByText(/board members \(/i)).toBeInTheDocument();
    expect(screen.getByText('Join requests (2)')).toBeInTheDocument();
  });

  it('adds an invited member to the members tab', () => {
    renderModal(<ShareBoardModal open onClose={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('e.g. aria@flowline.app'), {
      target: { value: 'sam@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /share board/i }));
    expect(screen.getByText('sam')).toBeInTheDocument();
  });

  it('creates an invite link', () => {
    renderModal(<ShareBoardModal open onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Create link' }));
    expect(screen.getByDisplayValue(/\/invite\//)).toBeInTheDocument();
  });

  it('shows join requests tab', () => {
    renderModal(<ShareBoardModal open onClose={() => {}} />);
    fireEvent.click(screen.getByText('Join requests (2)'));
    expect(screen.getByText('Diego Silva')).toBeInTheDocument();
    expect(screen.getByText('Priya Nair')).toBeInTheDocument();
  });
});

describe('VisibilityModal', () => {
  it('renders all four options with the current one marked', () => {
    renderModal(<VisibilityModal open onClose={() => {}} />);
    for (const label of ['Private', 'Workspace', 'Organization', 'Public']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText('Current')).toBeInTheDocument();
    expect(screen.getByText(/Anyone on the internet/)).toBeInTheDocument();
  });

  it('disables organization visibility with an enterprise note', () => {
    renderModal(<VisibilityModal open onClose={() => {}} />);
    const orgButton = screen.getByText('Organization').closest('button') as HTMLButtonElement;
    expect(orgButton.disabled).toBe(true);
    expect(screen.getByText(/Requires an enterprise-tier workspace/)).toBeInTheDocument();
  });

  it('updates board visibility when an option is selected', () => {
    const Probe = () => {
      const { meta } = useBoardState();
      return <div data-testid="vis">{meta.visibility}</div>;
    };
    renderModal(
      <>
        <VisibilityModal open onClose={() => {}} />
        <Probe />
      </>,
    );
    expect(screen.getByTestId('vis')).toHaveTextContent('workspace');
    fireEvent.click(screen.getByText('Private').closest('button') as HTMLElement);
    expect(screen.getByTestId('vis')).toHaveTextContent('private');
  });
});

describe('SlackSettingsModal', () => {
  it('renders workspace, channel, and notification toggles', () => {
    renderModal(<SlackSettingsModal open onClose={() => {}} />);
    expect(screen.getByText('Slack notifications')).toBeInTheDocument();
    expect(screen.getAllByRole('combobox')).toHaveLength(2);
    expect(screen.getByRole('switch', { name: 'Enable Slack notifications' })).toBeChecked();
    expect(screen.getByText(/A card is moved/)).toBeInTheDocument();
  });

  it('disables notification options when Slack is turned off', () => {
    renderModal(<SlackSettingsModal open onClose={() => {}} />);
    fireEvent.click(screen.getByRole('switch', { name: 'Enable Slack notifications' }));
    expect(screen.getByRole('switch', { name: 'Enable Slack notifications' })).not.toBeChecked();
    const channel = screen.getAllByRole('combobox')[0] as HTMLSelectElement;
    expect(channel.closest('div')?.parentElement?.className).toContain('opacity-50');
  });

  it('dismisses on save', () => {
    const onClose = vi.fn();
    renderModal(<SlackSettingsModal open onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save settings' }));
    expect(onClose).toHaveBeenCalled();
  });
});
