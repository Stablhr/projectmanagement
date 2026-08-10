import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { uid } from '../../lib/ids';
import type { BoardDetail, Card } from '../../lib/types';

export type CardPatch = Partial<
  Pick<
    Card,
    | 'title'
    | 'description'
    | 'cover'
    | 'labels'
    | 'memberIds'
    | 'dueDate'
    | 'location'
    | 'files'
    | 'reactions'
    | 'comments'
    | 'activity'
    | 'watched'
    | 'complete'
  >
>;

export function useBoard(boardId: string) {
  return useQuery({
    queryKey: ['board', boardId],
    queryFn: () => api.get<BoardDetail>(`/boards/${boardId}`),
    enabled: Boolean(boardId),
  });
}

export function useRenameBoard(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (title: string) =>
      api.patch<{ title: string }>(`/boards/${boardId}`, { title }),
    onSuccess: (_data, title) => {
      queryClient.setQueryData<BoardDetail>(['board', boardId], (old) =>
        old ? { ...old, board: { ...old.board, title } } : old,
      );
    },
  });
}

export function useUpdateCard(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, patch }: { cardId: string; patch: CardPatch }) =>
      api.patch<Card>(`/cards/${cardId}`, patch),
    onSuccess: (updated) => {
      queryClient.setQueryData<BoardDetail>(['board', boardId], (old) => {
        if (!old) return old;
        return {
          ...old,
          cards: old.cards.map((c) => (c._id === updated._id ? { ...c, ...updated } : c)),
        };
      });
    },
  });
}

export function useReorderCards(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      cardId,
      destListId,
      orderedIds,
    }: {
      cardId: string;
      destListId: string;
      orderedIds: string[];
      moved?: boolean;
    }) => api.put('/cards/reorder', { cardId, destListId, orderedIds }),
    onSuccess: (_data, vars) => {
      queryClient.setQueryData<BoardDetail>(['board', boardId], (old) => {
        if (!old) return old;
        const order = new Map(vars.orderedIds.map((id, i) => [id, i]));
        return {
          ...old,
          cards: old.cards.map((c) => {
            const idx = order.get(c._id);
            return idx === undefined
              ? c
              : { ...c, listId: vars.destListId, position: (idx + 1) * 1024 };
          }),
        };
      });

      if (vars.moved) {
        void logListMoveActivity(boardId, queryClient, vars.cardId, vars.destListId);
      }
    },
  });
}

/** Append an activity entry when a card moves to another list. */
async function logListMoveActivity(
  boardId: string,
  queryClient: ReturnType<typeof useQueryClient>,
  cardId: string,
  destListId: string,
) {
  const board = queryClient.getQueryData<BoardDetail>(['board', boardId]);
  const list = board?.lists.find((l) => l._id === destListId);
  if (!board || !list) return;
  const entry = { id: uid(), text: `Moved card to “${list.title}”`, createdAt: new Date().toISOString() };
  const card = board.cards.find((c) => c._id === cardId);
  const activity = [entry, ...(card?.activity ?? [])].slice(0, 30);
  try {
    const updated = await api.patch<Card>(`/cards/${cardId}`, { activity });
    queryClient.setQueryData<BoardDetail>(['board', boardId], (old) =>
      old
        ? { ...old, cards: old.cards.map((c) => (c._id === updated._id ? { ...c, ...updated } : c)) }
        : old,
    );
  } catch {
    // non-fatal: reorder itself succeeded
  }
}
