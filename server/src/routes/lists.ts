import { Router } from 'express';
import { auth } from '../middleware/auth';
import { Board } from '../models/Board';
import { List } from '../models/List';
import { Card } from '../models/Card';
import { assertMember } from '../services/boardAccess';
import { resolveUser } from '../services/userContext';
import { applyOrder, nextPosition } from '../services/reorder';
import { parseTitle } from '../utils/http';
import { emitToBoard } from '../realtime/socket';

const router = Router();
router.use(auth);

router.post('/boards/:boardId/lists', async (req, res, next) => {
  try {
    const user = await resolveUser(req);
    const board = await assertMember(req.params.boardId, user._id);
    const title = parseTitle(req.body.title);
    const position = await nextPosition(List, { boardId: board._id });
    const list = await List.create({ boardId: board._id, title, position });
    emitToBoard(req, String(board._id), 'list:created', { list });
    res.status(201).json(list);
  } catch (err) {
    next(err);
  }
});

router.put('/boards/:boardId/lists/reorder', async (req, res, next) => {
  try {
    const user = await resolveUser(req);
    const board = await assertMember(req.params.boardId, user._id);
    const orderedIds = Array.isArray(req.body.orderedIds)
      ? req.body.orderedIds.map(String)
      : [];
    await applyOrder(List, orderedIds);
    emitToBoard(req, String(board._id), 'list:reordered', { orderedIds });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.patch('/lists/:id', async (req, res, next) => {
  try {
    const user = await resolveUser(req);
    const list = await List.findById(req.params.id).exec();
    if (!list) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'List not found' } });
    await assertMember(String(list.boardId), user._id);
    if (req.body.title !== undefined) {
      list.title = parseTitle(req.body.title);
    }
    await list.save();
    emitToBoard(req, String(list.boardId), 'list:updated', { list });
    res.json(list);
  } catch (err) {
    next(err);
  }
});

router.delete('/lists/:id', async (req, res, next) => {
  try {
    const user = await resolveUser(req);
    const list = await List.findById(req.params.id).exec();
    if (!list) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'List not found' } });
    await assertMember(String(list.boardId), user._id);
    const boardId = String(list.boardId);
    await Card.deleteMany({ listId: list._id });
    await list.deleteOne();
    emitToBoard(req, boardId, 'list:deleted', { listId: req.params.id });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export const listsRoutes = router;
