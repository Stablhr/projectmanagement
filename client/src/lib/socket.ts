import { io, Socket } from 'socket.io-client';
import { socketUrl } from './env';
import { getAuthToken } from './token';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(socketUrl, {
      auth: (cb) => {
        void getAuthToken().then((token) => cb({ token }));
      },
    });
  }
  return socket;
}
