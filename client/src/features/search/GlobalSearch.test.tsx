import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { GlobalSearch } from './GlobalSearch';

const navigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
}));

vi.mock('../boards/useBoards', () => ({
  useBoards: () => ({
    data: [
      { _id: 'b1', ownerId: 'dev-user', title: 'Website Redesign', members: [], createdAt: '', updatedAt: '2025-01-02T00:00:00Z' },
      { _id: 'b2', ownerId: 'u9', title: 'Mobile App', members: [], createdAt: '', updatedAt: '2025-01-05T00:00:00Z' },
    ],
  }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    getQueriesData: () => [],
  }),
}));

describe('GlobalSearch', () => {
  it('shows recent boards on focus before typing', () => {
    render(<GlobalSearch />);
    fireEvent.focus(screen.getByLabelText('Search boards and cards'));
    expect(screen.getByText('Recent boards')).toBeInTheDocument();
    expect(screen.getByText('Website Redesign')).toBeInTheDocument();
    expect(screen.getByText('Personal')).toBeInTheDocument();
  });

  it('filters board results as the user types', () => {
    render(<GlobalSearch />);
    const input = screen.getByLabelText('Search boards and cards');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'mobile' } });
    expect(screen.getByText('Mobile App')).toBeInTheDocument();
    expect(screen.queryByText('Website Redesign')).not.toBeInTheDocument();
    expect(screen.getByText('Workspace')).toBeInTheDocument();
  });

  it('navigates when a board is picked', () => {
    render(<GlobalSearch />);
    const input = screen.getByLabelText('Search boards and cards');
    fireEvent.focus(input);
    fireEvent.click(screen.getByText('Website Redesign'));
    expect(navigate).toHaveBeenCalledWith('/board/b1');
  });

  it('links to advanced search', () => {
    render(<GlobalSearch />);
    fireEvent.focus(screen.getByLabelText('Search boards and cards'));
    fireEvent.click(screen.getByText('Advanced search'));
    expect(navigate).toHaveBeenCalledWith('/search');
  });
});
