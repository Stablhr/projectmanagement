import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, setTokenGetter } from '../lib/api';
import { auth } from '../lib/firebase';
import { isFirebaseConfigured, isOwnerEmail, useDevAuth } from '../lib/env';
import { getAuthToken } from '../lib/token';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(!useDevAuth);

  setTokenGetter(getAuthToken);

  const syncUser = useCallback(async (u: AuthUser) => {
    try {
      await api.post('/auth/sync', {
        email: u.email,
        displayName: u.displayName,
      });
    } catch {
      // non-fatal: server will upsert on next request anyway
    }
  }, []);

  useEffect(() => {
    if (useDevAuth || !isFirebaseConfigured || !auth) {
      setUser({
        uid: 'dev-user',
        email: 'dev@local',
        displayName: 'Dev User',
      });
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!auth) return;
      if (fbUser) {
        if (!isOwnerEmail(fbUser.email)) {
          await firebaseSignOut(auth);
          setUser(null);
          setLoading(false);
          return;
        }
        const nextUser = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName,
        };
        setUser(nextUser);
        syncUser(nextUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [syncUser]);

  useEffect(() => {
    if (!auth || useDevAuth) return;
    const unsubscribe = onIdTokenChanged(auth, () => {
      // keeps the token getter fresh via user state
    });
    return unsubscribe;
  }, []);

  const requireFirebase = () => {
    if (useDevAuth || !isFirebaseConfigured || !auth) {
      return true; // dev mode: any call is a no-op success
    }
    return false;
  };

  const signIn = useCallback(async (email: string, password: string) => {
    if (requireFirebase()) return;
    if (!isOwnerEmail(email)) {
      throw new Error('This account is not authorized to sign in.');
    }
    await signInWithEmailAndPassword(auth!, email, password);
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    if (requireFirebase()) return;
    if (!isOwnerEmail(email)) {
      throw new Error('Sign-up is invite-only. This email is not allowed.');
    }
    await createUserWithEmailAndPassword(auth!, email, password);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (requireFirebase()) return;
    const result = await signInWithPopup(auth!, new GoogleAuthProvider());
    if (!isOwnerEmail(result.user.email)) {
      await firebaseSignOut(auth!);
      throw new Error('This Google account is not authorized.');
    }
  }, []);

  const signOut = useCallback(async () => {
    if (useDevAuth || !auth) {
      setUser(null);
      return;
    }
    await firebaseSignOut(auth);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, signIn, signUp, signInWithGoogle, signOut }),
    [user, loading, signIn, signUp, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
