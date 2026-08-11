import { createModel, type StoreDoc } from '../db/fileStore';

export interface UserDoc extends StoreDoc {
  firebaseUid: string;
  email: string;
  displayName: string | null;
}

export const User = createModel<UserDoc>('users');
