import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  BoardDetail,
  BoardLabel,
  BoardMeta,
  Card,
  MemberProfile,
} from '../../lib/types';
import { boardLabels, boardMembers, enrichCard } from './boardData';

export type BoardViewKind = 'board' | 'table' | 'calendar' | 'dashboard' | 'timeline' | 'map';

export interface FilterState {
  keyword: string;
  members: { none: boolean; me: boolean; selected: string[] };
  status: { complete: boolean; incomplete: boolean };
  due: { none: boolean; overdue: boolean; soon: boolean; week: boolean; month: boolean };
  labels: { none: boolean; selected: string[] };
  activity: { week: boolean; twoWeeks: boolean; month: boolean };
}

export const emptyFilters: FilterState = {
  keyword: '',
  members: { none: false, me: false, selected: [] },
  status: { complete: false, incomplete: false },
  due: { none: false, overdue: false, soon: false, week: false, month: false },
  labels: { none: false, selected: [] },
  activity: { week: false, twoWeeks: false, month: false },
};

const DEFAULT_META: BoardMeta = {
  description: '',
  visibility: 'workspace',
  starred: false,
  background: { type: 'color', value: '#F7FAF9' },
};

interface BoardContextValue {
  board: BoardDetail;
  visibleBoard: BoardDetail;
  members: MemberProfile[];
  labels: BoardLabel[];
  meta: BoardMeta;
  setMeta: (patch: Partial<BoardMeta>) => void;
  view: BoardViewKind;
  setView: (view: BoardViewKind) => void;
  collapsed: Record<string, boolean>;
  toggleCollapsed: (listId: string) => void;
  collapseAll: () => void;
  expandAll: () => void;
  filters: FilterState;
  setFilters: (patch: Partial<FilterState>) => void;
  clearFilters: () => void;
  isFiltering: boolean;
  archived: { cards: Card[]; lists: BoardDetail['lists'] };
  archiveCard: (cardId: string) => void;
  archiveList: (listId: string) => void;
  restoreCard: (cardId: string) => void;
  restoreList: (listId: string) => void;
  addLabel: (name: string, color: string) => void;
  updateLabel: (id: string, patch: Partial<Pick<BoardLabel, 'name' | 'color' | 'textColor'>>) => void;
  deleteLabel: (id: string) => void;
}

const BoardContext = createContext<BoardContextValue | undefined>(undefined);

export function BoardStateProvider({
  board,
  children,
}: {
  board: BoardDetail;
  children: ReactNode;
}) {
  const [meta, setMetaState] = useState<BoardMeta>(() => ({
    ...DEFAULT_META,
    background:
      board.board.title.length % 2 === 0
        ? { type: 'color', value: '#F7FAF9' }
        : { type: 'color', value: '#EEF3F1' },
  }));
  const [view, setView] = useState<BoardViewKind>('board');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [filters, setFiltersState] = useState<FilterState>(emptyFilters);
  const [archived, setArchived] = useState<{ cards: Card[]; lists: BoardDetail['lists'] }>({
    cards: [],
    lists: [],
  });
  const [labels, setLabels] = useState<BoardLabel[]>(() => boardLabels(board.board._id));

  const members = useMemo(() => boardMembers(board.board._id), [board.board._id]);

  const visibleBoard = useMemo(() => {
    const listIds = new Set(archived.lists.map((l) => l._id));
    const cardIds = new Set(archived.cards.map((c) => c._id));
    return {
      ...board,
      lists: board.lists.filter((l) => !listIds.has(l._id)),
      cards: board.cards.filter((c) => !cardIds.has(c._id)),
    };
  }, [board, archived]);

  const setMeta = useCallback((patch: Partial<BoardMeta>) => {
    setMetaState((prev) => ({ ...prev, ...patch }));
  }, []);

  const toggleCollapsed = useCallback((listId: string) => {
    setCollapsed((prev) => ({ ...prev, [listId]: !prev[listId] }));
  }, []);

  const collapseAll = useCallback(() => {
    setCollapsed(Object.fromEntries(visibleBoard.lists.map((l) => [l._id, true])));
  }, [visibleBoard.lists]);

  const expandAll = useCallback(() => setCollapsed({}), []);

  const setFilters = useCallback((patch: Partial<FilterState>) => {
    setFiltersState((prev) => ({ ...prev, ...patch }));
  }, []);

  const clearFilters = useCallback(() => setFiltersState(emptyFilters), []);

  const isFiltering = useMemo(
    () => JSON.stringify(filters) !== JSON.stringify(emptyFilters),
    [filters],
  );

  const archiveCard = useCallback(
    (cardId: string) => {
      setArchived((prev) => {
        const card = board.cards.find((c) => c._id === cardId);
        return card
          ? { ...prev, cards: [...prev.cards.filter((c) => c._id !== cardId), card] }
          : prev;
      });
    },
    [board.cards],
  );

  const archiveList = useCallback(
    (listId: string) => {
      setArchived((prev) => {
        const list = board.lists.find((l) => l._id === listId);
        if (!list) return prev;
        const listCards = board.cards.filter((c) => c.listId === listId);
        return {
          lists: [...prev.lists.filter((l) => l._id !== listId), list],
          cards: [...prev.cards.filter((c) => c.listId !== listId), ...listCards],
        };
      });
    },
    [board.lists, board.cards],
  );

  const restoreCard = useCallback((cardId: string) => {
    setArchived((prev) => ({ ...prev, cards: prev.cards.filter((c) => c._id !== cardId) }));
  }, []);

  const restoreList = useCallback((listId: string) => {
    setArchived((prev) => ({
      ...prev,
      lists: prev.lists.filter((l) => l._id !== listId),
    }));
  }, []);

  const addLabel = useCallback(
    (name: string, color: string) => {
      const id = `${board.board._id}-label-${Date.now()}`;
      setLabels((prev) => [...prev, { id, name, color, textColor: '#FFFFFF' }]);
    },
    [board.board._id],
  );

  const updateLabel = useCallback(
    (id: string, patch: Partial<Pick<BoardLabel, 'name' | 'color' | 'textColor'>>) => {
      setLabels((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    },
    [],
  );

  const deleteLabel = useCallback((id: string) => {
    setLabels((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const value = useMemo<BoardContextValue>(
    () => ({
      board,
      visibleBoard,
      members,
      labels,
      meta,
      setMeta,
      view,
      setView,
      collapsed,
      toggleCollapsed,
      collapseAll,
      expandAll,
      filters,
      setFilters,
      clearFilters,
      isFiltering,
      archived,
      archiveCard,
      archiveList,
      restoreCard,
      restoreList,
      addLabel,
      updateLabel,
      deleteLabel,
    }),
    [board, visibleBoard, members, labels, meta, setMeta, view, collapsed, toggleCollapsed, collapseAll, expandAll, filters, setFilters, clearFilters, isFiltering, archived, archiveCard, archiveList, restoreCard, restoreList, addLabel, updateLabel, deleteLabel],
  );

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
}

export function useBoardState() {
  const ctx = useContext(BoardContext);
  if (!ctx) throw new Error('useBoardState must be used within BoardStateProvider');
  return ctx;
}

/** Re-applies visual enrichment after a card is created/updated. */
export function reenrichCard(board: BoardDetail, card: Card): Card {
  return enrichCard(card, boardMembers(board.board._id), boardLabels(board.board._id));
}
