import { Request } from 'express';
import { User } from '../models/User';

/**
 * Upsert the Mongo user record for the authenticated Firebase user.
 * Ensures the caller has a matching Mongo `_id` for board ownership queries.
 */
export async function resolveUser(req: Request) {
  const { firebaseUid, email, displayName } = req.user!;
  return User.findOneAndUpdate(
    { firebaseUid },
    {
      $set: {
        email: email ?? `${firebaseUid}@dev.local`,
        displayName: displayName ?? null,
      },
    },
    { upsert: true, new: true },
  ).exec();
}
