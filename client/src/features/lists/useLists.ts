import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { BoardDetail, List } from '../../lib/types';

export function useCreateList(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (title: string) =>
      api.post<List>(`/boards/${boardId}/lists`, { title }),
    onSuccess: (list) => {
      queryClient.setQueryData<BoardDetail>(['board', boardId], (old) =>
        old
          ? {
              ...old,
              lists: [
                ...old.lists,
                { ...list, position: (old.lists.length + 1) * 1024 },
              ],
            }
          : old,
      );
    },
  });
}

export function useRenameList(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, title }: { listId: string; title: string }) =>
      api.patch<List>(`/lists/${listId}`, { title }),
    onSuccess: (updated) => {
      queryClient.setQueryData<BoardDetail>(['board', boardId], (old) =>
        old
          ? {
              ...old,
              lists: old.lists.map((l) =>
                l._id === updated._id ? { ...l, title: updated.title } : l,
              ),
            }
          : old,
      );
    },
  });
}

export function useDeleteList(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (listId: string) => api.del(`/lists/${listId}`),
    onSuccess: (_data, listId) => {
      queryClient.setQueryData<BoardDetail>(['board', boardId], (old) =>
        old
          ? {
              ...old,
              lists: old.lists.filter((l) => l._id !== listId),
              cards: old.cards.filter((c) => c.listId !== listId),
            }
          : old,
      );
    },
  });
}

export function useReorderLists(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) =>
      api.put(`/boards/${boardId}/lists/reorder`, { orderedIds }),
    onSuccess: (_data, orderedIds) => {
      queryClient.setQueryData<BoardDetail>(['board', boardId], (old) => {
        if (!old) return old;
        const positions = new Map(orderedIds.map((id, i) => [id, (i + 1) * 1024]));
        return {
          ...old,
          lists: old.lists.map((l) =>
            positions.has(l._id) ? { ...l, position: positions.get(l._id)! } : l,
          ),
        };
      });
    },
  });
}
