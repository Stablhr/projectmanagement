import type { BoardDetail, Card } from '../../lib/types';

export function moveCardInCache(
  board: BoardDetail,
  cardId: string,
  destListId: string,
  overCardId: string | null,
): BoardDetail {
  const moving = board.cards.find((c) => c._id === cardId);
  if (!moving) return board;

  const rest = board.cards.filter((c) => c._id !== cardId);
  const destCards = rest
    .filter((c) => c.listId === destListId)
    .sort((a, b) => a.position - b.position);

  let insertIndex = destCards.length;
  if (overCardId) {
    const overIndex = destCards.findIndex((c) => c._id === overCardId);
    if (overIndex !== -1) insertIndex = overIndex;
  }

  const next: Card[] = [...rest.filter((c) => c.listId !== destListId)];
  destCards.forEach((c, i) => {
    const pos = i < insertIndex ? (i + 1) * 1024 : (i + 2) * 1024;
    next.push({ ...c, position: pos });
  });
  next.push({
    ...moving,
    listId: destListId,
    position: (insertIndex + 1) * 1024,
  });

  return { ...board, cards: next };
}

export function reorderListsInCache(board: BoardDetail, orderedIds: string[]): BoardDetail {
  const positions = new Map(orderedIds.map((id, i) => [id, (i + 1) * 1024]));
  return {
    ...board,
    lists: board.lists.map((l) =>
      positions.has(l._id) ? { ...l, position: positions.get(l._id)! } : l,
    ),
  };
}

export function listOrder(board: BoardDetail, listId: string): string[] {
  return board.cards
    .filter((c) => c.listId === listId)
    .sort((a, b) => a.position - b.position)
    .map((c) => c._id);
}
