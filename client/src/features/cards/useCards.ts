import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { BoardDetail, Card } from '../../lib/types';

export function useCreateCard(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, title }: { listId: string; title: string }) =>
      api.post<Card>(`/lists/${listId}/cards`, { title }),
    onSuccess: (card) => {
      queryClient.setQueryData<BoardDetail>(['board', boardId], (old) => {
        if (!old) return old;
        const listCards = old.cards.filter((c) => c.listId === card.listId);
        return {
          ...old,
          cards: [
            ...old.cards,
            { ...card, position: (listCards.length + 1) * 1024 },
          ],
        };
      });
    },
  });
}

export function useDeleteCard(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cardId: string) => api.del(`/cards/${cardId}`),
    onSuccess: (_data, cardId) => {
      queryClient.setQueryData<BoardDetail>(['board', boardId], (old) =>
        old
          ? { ...old, cards: old.cards.filter((c) => c._id !== cardId) }
          : old,
      );
    },
  });
}
