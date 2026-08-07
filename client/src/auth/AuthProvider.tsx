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
import { api } from '../lib/api';
import { auth } from '../lib/firebase';
import { isFirebaseConfigured, useDevAuth } from '../lib/env';
import { setAuthTokenGetter } from '../lib/socket';

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

  setAuthTokenGetter(() => user?.uid ?? null);

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
      if (fbUser) {
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
    await signInWithEmailAndPassword(auth!, email, password);
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    if (requireFirebase()) return;
    await createUserWithEmailAndPassword(auth!, email, password);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (requireFirebase()) return;
    await signInWithPopup(auth!, new GoogleAuthProvider());
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
