import { Router } from 'express';
import { auth } from '../middleware/auth';
import { resolveUser } from '../services/userContext';

const router = Router();

router.post('/sync', auth, async (req, res, next) => {
  try {
    const user = await resolveUser(req);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

export const authRoutes = router;
