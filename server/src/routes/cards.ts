import { Router } from 'express';
import { auth } from '../middleware/auth';
import { Card } from '../models/Card';
import { List } from '../models/List';
import { assertMember } from '../services/boardAccess';
import { resolveUser } from '../services/userContext';
import { applyOrder, nextPosition } from '../services/reorder';
import { parseTitle } from '../utils/http';
import { emitToBoard } from '../realtime/socket';

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
    if (req.body.title !== undefined) {
      card.title = parseTitle(req.body.title);
    }
    if (req.body.description !== undefined) {
      card.description = String(req.body.description ?? '').slice(0, 5000);
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

    card.listId = destList._id as any;
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
