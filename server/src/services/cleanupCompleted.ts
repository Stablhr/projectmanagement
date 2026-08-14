import type { SocketServer } from '../realtime/socket';
import { Card } from '../models/Card';
import { List } from '../models/List';

const TTL_MS = 24 * 60 * 60 * 1000;
const SWEEP_INTERVAL_MS = 15 * 60 * 1000;

/**
 * Delete cards that were marked done more than 24h ago so finished work
 * disappears from boards automatically. Emits `card:deleted` per affected
 * board so connected clients update live.
 */
export async function purgeExpiredCompleted(io?: SocketServer): Promise<{ deleted: number }> {
  const cutoff = Date.now() - TTL_MS;
  const cards = await Card.find({ complete: true }).exec();
  let deleted = 0;
  for (const card of cards) {
    const completedAt = card.completedAt ? new Date(card.completedAt).getTime() : null;
    if (completedAt === null || completedAt > cutoff) continue;
    const list = await List.findById(card.listId).exec();
    await card.deleteOne();
    deleted++;
    if (io) {
      const room = `board:${list ? String(list.boardId) : 'unknown'}`;
      io.to(room).emit('card:deleted', {
        cardId: String(card._id),
        listId: card.listId,
      });
    }
  }
  return { deleted };
}

/** Run a sweep at startup, then keep purging on an interval. */
export function startCompletedCleanup(io?: SocketServer) {
  void purgeExpiredCompleted(io);
  const timer = setInterval(() => void purgeExpiredCompleted(io), SWEEP_INTERVAL_MS);
  timer.unref();
}
