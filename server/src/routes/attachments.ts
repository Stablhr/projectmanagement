import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { NextFunction, Request, Response, Router } from 'express';
import multer from 'multer';
import { uploadsDir } from '../config/uploads';
import type { Hydrated } from '../db/fileStore';
import { auth } from '../middleware/auth';
import { Card, type CardDoc, type CardFile } from '../models/Card';
import { List } from '../models/List';
import { assertMember } from '../services/boardAccess';
import { resolveUser } from '../services/userContext';
import { errorBody, notFoundError } from '../utils/http';
import { emitToBoard } from '../realtime/socket';

const MAX_FILES_PER_UPLOAD = 10;
const MAX_FILE_SIZE_MB = 20;

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, _file, cb) => {
      const dir = path.join(uploadsDir, req.params.id);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^\w.-]+/g, '_') || 'file';
      cb(null, `${Date.now()}-${safe}`);
    },
  }),
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
});

/**
 * Verify the caller is a board member before multer writes anything to disk.
 */
async function authorizeCard(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await resolveUser(req);
    const card = await Card.findById(req.params.id).exec();
    if (!card) throw notFoundError('Card not found');
    const list = await List.findById(card.listId).exec();
    if (!list) throw notFoundError('List not found');
    await assertMember(String(list.boardId), user._id);
    res.locals.card = card;
    res.locals.boardId = String(list.boardId);
    next();
  } catch (err) {
    next(err);
  }
}

const router = Router();
router.use(auth);

router.post(
  '/cards/:id/attachments',
  authorizeCard,
  upload.array('files', MAX_FILES_PER_UPLOAD),
  async (req, res, next) => {
    try {
      const card = res.locals.card as Hydrated<CardDoc>;
      const boardId = res.locals.boardId as string;
      const files = (req.files as Express.Multer.File[] | undefined) ?? [];
      if (files.length === 0) {
        return res
          .status(400)
          .json(errorBody('VALIDATION', 'No files provided (use a "files" form field)'));
      }

      const attached: CardFile[] = files.map((f) => ({
        id: randomUUID(),
        name: f.originalname,
        url: `/uploads/${req.params.id}/${f.filename}`,
        kind: f.mimetype.startsWith('image/') ? 'image' : 'file',
        size: f.size,
        addedAt: new Date().toISOString(),
      }));

      card.files = [...(card.files ?? []), ...attached];
      await card.save();
      emitToBoard(req, boardId, 'card:updated', { card });
      res.status(201).json({ files: attached, card });
    } catch (err) {
      next(err);
    }
  },
);

export const attachmentsRoutes = router;
