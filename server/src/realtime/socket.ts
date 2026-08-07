import { Request } from 'express';
import { Server } from 'socket.io';
import { verifyToken } from '../middleware/auth';

export type SocketServer = Server;

export function setupSocket(io: Server) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (typeof token !== 'string' || token.length === 0) {
        return next(new Error('unauthorized'));
      }
      const uid = await verifyToken(token);
      socket.data.uid = uid;
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('board:join', ({ boardId }: { boardId: string }) => {
      if (boardId) socket.join(`board:${boardId}`);
    });
    socket.on('board:leave', ({ boardId }: { boardId: string }) => {
      if (boardId) socket.leave(`board:${boardId}`);
    });
  });
}

export function getIo(req: Request): Server | undefined {
  return req.app.get('io') as Server | undefined;
}

export function emitToBoard(
  req: Request,
  boardId: string,
  event: string,
  payload: unknown,
) {
  const io = getIo(req);
  if (!io) return;
  io.to(`board:${boardId}`).emit(event, payload);
}
