import { NextFunction, Request, Response } from 'express';
import admin from 'firebase-admin';
import { env, isFirebaseConfigured } from '../config/env';
import { errorBody, unauthorizedError } from '../utils/http';

export interface AuthUser {
  firebaseUid: string;
  email?: string | null;
  displayName?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

let adminApp: admin.app.App | null = null;

function getAdmin(): admin.app.App {
  if (!adminApp) {
    if (!isFirebaseConfigured()) {
      throw new Error(
        'Firebase Admin is not configured (set FIREBASE_PROJECT_ID / FIREBASE_SERVICE_ACCOUNT_JSON)',
      );
    }
    const serviceAccount = env.firebaseServiceAccountJson
      ? (JSON.parse(env.firebaseServiceAccountJson) as admin.ServiceAccount)
      : undefined;
    adminApp = admin.initializeApp({
      credential: serviceAccount
        ? admin.credential.cert(serviceAccount)
        : admin.credential.applicationDefault(),
      projectId: env.firebaseProjectId || undefined,
    });
  }
  return adminApp;
}

/** True when the server should trust raw tokens (dev only, Firebase not configured). */
function isDevAuth() {
  return !isFirebaseConfigured() && env.devAuth;
}

/**
 * Verify a Firebase ID token and return the user's firebase uid.
 * In dev mode (DEV_AUTH=true, no Firebase config) the raw token is trusted
 * as the uid. Never used in production.
 */
export async function verifyToken(token: string): Promise<string> {
  if (isDevAuth()) {
    return token || 'dev-user';
  }
  const decoded = await getAdmin().auth().verifyIdToken(token);
  return decoded.uid;
}

export async function auth(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw unauthorizedError('Missing bearer token');
    }
    const token = header.slice(7);

    if (isDevAuth()) {
      const uid = token || 'dev-user';
      req.user = {
        firebaseUid: uid,
        email: `${uid}@dev.local`,
        displayName: 'Dev User',
      };
    } else {
      const decoded = await getAdmin().auth().verifyIdToken(token);
      req.user = {
        firebaseUid: decoded.uid,
        email: decoded.email ?? null,
        displayName: decoded.name ?? null,
      };
    }
    next();
  } catch {
    res.status(401).json(errorBody('UNAUTHORIZED', 'Invalid token'));
  }
}
