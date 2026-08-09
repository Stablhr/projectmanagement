import { auth } from './firebase';
import { useDevAuth } from './env';

/**
 * Returns the token to send to the API and socket.io.
 * In dev mode (no Firebase) this is the mock uid, which the server's
 * DEV_AUTH mode trusts. Otherwise it returns a fresh Firebase ID token.
 */
export async function getAuthToken(): Promise<string | null> {
  if (useDevAuth || !auth) return 'dev-user';
  const user = auth.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken();
  } catch {
    return null;
  }
}
