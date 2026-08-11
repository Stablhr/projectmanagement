import { Router } from 'express';
import { auth } from '../middleware/auth';
import { Board } from '../models/Board';
import { List } from '../models/List';
import { Card } from '../models/Card';
import { assertMember, assertOwner } from '../services/boardAccess';
import { resolveUser } from '../services/userContext';
import { parseTitle } from '../utils/http';

const router = Router();
router.use(auth);

router.get('/', async (req, res, next) => {
  try {
    const user = await resolveUser(req);
    const boards = await Board.find({
      $or: [{ ownerId: user._id }, { members: user._id }],
    })
      .sort({ updatedAt: -1 })
      .exec();
    res.json(boards);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const user = await resolveUser(req);
    const title = parseTitle(req.body.title);
    const board = await Board.create({
      ownerId: user._id,
      title,
      members: [user._id],
    });
    res.status(201).json(board);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const user = await resolveUser(req);
    const board = await assertMember(req.params.id, user._id);
    const lists = await List.find({ boardId: board._id })
      .sort({ position: 1 })
      .exec();
    const cards = await Card.find({
      listId: { $in: lists.map((l) => l._id) },
    })
      .sort({ position: 1 })
      .exec();
    res.json({ board, lists, cards });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const user = await resolveUser(req);
    const board = await assertMember(req.params.id, user._id);
    if (req.body.title !== undefined) {
      board.title = parseTitle(req.body.title);
    }
    await board.save();
    res.json(board);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const user = await resolveUser(req);
    const board = await assertOwner(req.params.id, user._id);
    const lists = await List.find({ boardId: board._id }).exec();
    await Card.deleteMany({ listId: { $in: lists.map((l) => l._id) } });
    await List.deleteMany({ boardId: board._id });
    await board.deleteOne();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

router.post('/:id/members', async (req, res, next) => {
  try {
    const user = await resolveUser(req);
    const board = await assertOwner(req.params.id, user._id);
    const memberId = String(req.body.userId);
    if (!memberId || board.members.some((m) => String(m) === memberId)) {
      return res.json(board);
    }
    board.members.push(memberId);
    await board.save();
    res.json(board);
  } catch (err) {
    next(err);
  }
});

export const boardsRoutes = router;
