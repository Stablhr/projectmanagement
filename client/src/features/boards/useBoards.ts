import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { Board } from '../../lib/types';

export function useBoards() {
  return useQuery({
    queryKey: ['boards'],
    queryFn: () => api.get<Board[]>('/boards'),
  });
}

export function useCreateBoard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (title: string) => api.post<Board>('/boards', { title }),
    onSuccess: (board) => {
      queryClient.setQueryData<Board[]>(['boards'], (old) =>
        old ? [board, ...old] : [board],
      );
    },
  });
}

export function useDeleteBoard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (boardId: string) => api.del(`/boards/${boardId}`),
    onSuccess: (_data, boardId) => {
      queryClient.setQueryData<Board[]>(['boards'], (old) =>
        old ? old.filter((b) => b._id !== boardId) : old,
      );
      queryClient.removeQueries({ queryKey: ['board', boardId] });
    },
  });
}
