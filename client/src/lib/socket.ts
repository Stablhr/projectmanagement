import { io, Socket } from 'socket.io-client';
import { socketUrl } from './env';

let authToken: () => string | null = () => null;
let socket: Socket | null = null;

export function setAuthTokenGetter(fn: () => string | null) {
  authToken = fn;
}

export function getSocket(): Socket {
  if (!socket) {
    socket = io(socketUrl, {
      auth: (cb) => cb({ token: authToken() }),
    });
  }
  return socket;
}
