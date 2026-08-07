import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { BoardDetail } from '../../lib/types';

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
    mutationFn: ({
      cardId,
      title,
      description,
    }: {
      cardId: string;
      title?: string;
      description?: string;
    }) => api.patch(`/cards/${cardId}`, { title, description }),
    onSuccess: (updated: any) => {
      queryClient.setQueryData<BoardDetail>(['board', boardId], (old) => {
        if (!old) return old;
        return {
          ...old,
          cards: old.cards.map((c) =>
            c._id === updated._id ? { ...c, ...updated } : c,
          ),
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
    },
  });
}
