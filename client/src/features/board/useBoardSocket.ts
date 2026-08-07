import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { getSocket } from '../../lib/socket';

const EVENTS = [
  'card:created',
  'card:updated',
  'card:deleted',
  'card:moved',
  'list:created',
  'list:updated',
  'list:deleted',
  'list:reordered',
  'board:updated',
];

export function useBoardSocket(boardId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user || !boardId) return;
    const socket = getSocket();

    socket.emit('board:join', { boardId });
    const handlers = EVENTS.map((event) => {
      const handler = () => {
        queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      };
      socket.on(event, handler);
      return { event, handler };
    });

    return () => {
      socket.emit('board:leave', { boardId });
      handlers.forEach(({ event, handler }) => socket.off(event, handler));
    };
  }, [user, boardId, queryClient]);
}
