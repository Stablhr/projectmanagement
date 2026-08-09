import { NextFunction, Request, Response } from 'express';
import admin from 'firebase-admin';
import fs from 'node:fs';
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
    const serviceAccount = loadServiceAccount();
    adminApp = admin.initializeApp({
      credential: serviceAccount
        ? admin.credential.cert(serviceAccount)
        : admin.credential.applicationDefault(),
      projectId: env.firebaseProjectId || undefined,
    });
  }
  return adminApp;
}

function loadServiceAccount(): admin.ServiceAccount | undefined {
  if (!env.firebaseServiceAccountJson) return undefined;
  if (env.firebaseServiceAccountJson.trim().startsWith('{')) {
    return JSON.parse(env.firebaseServiceAccountJson) as admin.ServiceAccount;
  }
  // Treated as a path to a service-account JSON file.
  return JSON.parse(
    fs.readFileSync(env.firebaseServiceAccountJson, 'utf8'),
  ) as admin.ServiceAccount;
}

/** True when the server should trust raw tokens (dev only, Firebase not configured). */
function isDevAuth() {
  return !isFirebaseConfigured() && env.devAuth;
}

/** Only the owner email(s) may use the app. Empty allowlist = open access. */
function isOwnerEmail(email: string | null | undefined): boolean {
  if (env.ownerEmails.length === 0) return true;
  if (!email) return false;
  return env.ownerEmails.includes(email.trim().toLowerCase());
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
  if (!isOwnerEmail(decoded.email)) {
    throw new Error('Account not authorized');
  }
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
      if (!isOwnerEmail(decoded.email)) {
        res
          .status(403)
          .json(errorBody('FORBIDDEN', 'Account not authorized'));
        return;
      }
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
