import { Request } from 'express';
import { User, type UserDoc } from '../models/User';
import { unauthorizedError } from '../utils/http';

/**
 * Upsert the local user record for the authenticated Firebase user.
 * Ensures the caller has a matching `_id` for board ownership queries.
 */
export async function resolveUser(req: Request): Promise<UserDoc> {
  const { firebaseUid, email, displayName } = req.user!;
  const user = await User.findOneAndUpdate(
    { firebaseUid },
    {
      $set: {
        email: email ?? `${firebaseUid}@dev.local`,
        displayName: displayName ?? null,
      },
    },
    { upsert: true },
  ).exec();
  if (!user) throw unauthorizedError('Failed to sync user');
  return user;
}
