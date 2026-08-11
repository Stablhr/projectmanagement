import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { auth } from '../middleware/auth';
import { Card, type CardActivityEntry, type CardComment, type CardFile } from '../models/Card';
import { List } from '../models/List';
import { assertMember } from '../services/boardAccess';
import { resolveUser } from '../services/userContext';
import { applyOrder, nextPosition } from '../services/reorder';
import { parseTitle } from '../utils/http';
import { emitToBoard } from '../realtime/socket';

const MAX_ACTIVITY = 30;
const MAX_COMMENTS = 30;
const MAX_FILES = 50;

function uid(): string {
  return randomUUID();
}

function str(v: unknown, max = 2000): string {
  return String(v ?? '').slice(0, max);
}

function normalizeFile(f: unknown): CardFile {
  const file = (f ?? {}) as Record<string, unknown>;
  return {
    id: str(file.id, 100) || uid(),
    name: str(file.name, 255),
    url: str(file.url, 2000),
    kind: file.kind === 'image' ? 'image' : 'file',
    size: typeof file.size === 'number' ? file.size : undefined,
    addedAt: file.addedAt ? new Date(String(file.addedAt)) : new Date(),
  };
}

function normalizeComment(c: unknown): CardComment {
  const comment = (c ?? {}) as Record<string, unknown>;
  return {
    id: str(comment.id, 100) || uid(),
    authorId: str(comment.authorId, 100),
    authorName: str(comment.authorName, 200),
    text: str(comment.text, 5000),
    createdAt: comment.createdAt ? new Date(String(comment.createdAt)) : new Date(),
  };
}

function normalizeActivity(a: unknown): CardActivityEntry {
  const entry = (a ?? {}) as Record<string, unknown>;
  return {
    id: str(entry.id, 100) || uid(),
    text: str(entry.text, 500),
    createdAt: entry.createdAt ? new Date(String(entry.createdAt)) : new Date(),
  };
}

function sanitizeReactions(reactions: unknown): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  if (reactions && typeof reactions === 'object') {
    for (const [emoji, ids] of Object.entries(reactions as Record<string, unknown>)) {
      if (Array.isArray(ids)) result[emoji] = ids.map(String).slice(0, 100);
    }
  }
  return result;
}

const router = Router();
router.use(auth);

async function loadListOr404(listId: string) {
  const list = await List.findById(listId).exec();
  if (!list) {
    const err: any = new Error('List not found');
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }
  return list;
}

router.post('/lists/:listId/cards', async (req, res, next) => {
  try {
    const user = await resolveUser(req);
    const list = await loadListOr404(req.params.listId);
    await assertMember(String(list.boardId), user._id);
    const title = parseTitle(req.body.title);
    const position = await nextPosition(Card, { listId: list._id });
    const card = await Card.create({ listId: list._id, title, position });
    emitToBoard(req, String(list.boardId), 'card:created', { card, listId: String(list._id) });
    res.status(201).json(card);
  } catch (err) {
    next(err);
  }
});

router.patch('/cards/:id', async (req, res, next) => {
  try {
    const user = await resolveUser(req);
    const card = await Card.findById(req.params.id).exec();
    if (!card) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Card not found' } });
    const list = await List.findById(card.listId).exec();
    if (!list) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'List not found' } });
    await assertMember(String(list.boardId), user._id);
    const b = req.body as Record<string, unknown>;

    if (b.title !== undefined) {
      card.title = parseTitle(b.title);
    }
    if (b.description !== undefined) {
      card.description = String(b.description ?? '').slice(0, 5000);
    }
    if (b.cover !== undefined) {
      card.cover =
        b.cover && typeof b.cover === 'object'
          ? {
              type: (b.cover as Record<string, unknown>).type === 'image' ? 'image' : 'color',
              value: str((b.cover as Record<string, unknown>).value, 500),
            }
          : null;
    }
    if (b.labels !== undefined) {
      card.labels = Array.isArray(b.labels) ? b.labels.map(String).slice(0, 50) : card.labels;
    }
    if (b.memberIds !== undefined) {
      card.memberIds = Array.isArray(b.memberIds)
        ? b.memberIds.map(String).slice(0, 50)
        : card.memberIds;
    }
    if (b.dueDate !== undefined) {
      card.dueDate = b.dueDate ? new Date(String(b.dueDate)) : null;
    }
    if (b.location !== undefined) {
      card.location = String(b.location ?? '').slice(0, 500);
    }
    if (b.files !== undefined) {
      card.files = Array.isArray(b.files)
        ? b.files.slice(-MAX_FILES).map(normalizeFile)
        : card.files;
    }
    if (b.reactions !== undefined) {
      card.reactions = sanitizeReactions(b.reactions);
    }
    if (b.comments !== undefined) {
      card.comments = Array.isArray(b.comments)
        ? b.comments.slice(-MAX_COMMENTS).map(normalizeComment)
        : card.comments;
    }
    if (b.activity !== undefined) {
      card.activity = Array.isArray(b.activity)
        ? b.activity.slice(-MAX_ACTIVITY).map(normalizeActivity)
        : card.activity;
    }
    if (b.watched !== undefined) {
      card.watched = Boolean(b.watched);
    }
    if (b.complete !== undefined) {
      card.complete = Boolean(b.complete);
    }
    await card.save();
    emitToBoard(req, String(list.boardId), 'card:updated', { card });
    res.json(card);
  } catch (err) {
    next(err);
  }
});

router.delete('/cards/:id', async (req, res, next) => {
  try {
    const user = await resolveUser(req);
    const card = await Card.findById(req.params.id).exec();
    if (!card) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Card not found' } });
    const list = await List.findById(card.listId).exec();
    if (!list) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'List not found' } });
    await assertMember(String(list.boardId), user._id);
    const boardId = String(list.boardId);
    await card.deleteOne();
    emitToBoard(req, boardId, 'card:deleted', { cardId: req.params.id, listId: String(list._id) });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

router.put('/cards/reorder', async (req, res, next) => {
  try {
    const user = await resolveUser(req);
    const { cardId, destListId, orderedIds } = req.body;
    const card = await Card.findById(cardId).exec();
    if (!card) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Card not found' } });
    const destList = await List.findById(destListId).exec();
    if (!destList) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'List not found' } });
    await assertMember(String(destList.boardId), user._id);

    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ error: { code: 'VALIDATION', message: 'orderedIds is required' } });
    }

    const idx = orderedIds.map(String).indexOf(String(card._id));
    if (idx === -1) {
      return res.status(400).json({ error: { code: 'VALIDATION', message: 'cardId missing from orderedIds' } });
    }

    card.listId = destList._id;
    card.position = (idx + 1) * 1024;
    await card.save();
    await applyOrder(Card, orderedIds.map(String));

    emitToBoard(req, String(destList.boardId), 'card:moved', {
      cardId: String(card._id),
      listId: String(destList._id),
      orderedIds: orderedIds.map(String),
      boardId: String(destList.boardId),
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export const cardsRoutes = router;
