export const useDevAuth = import.meta.env.VITE_DEV_AUTH === 'true';
export const apiUrl = import.meta.env.VITE_API_URL || '';
export const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;

const ownerEmails = (import.meta.env.VITE_OWNER_EMAILS || '')
  .split(',')
  .map((email: string) => email.trim().toLowerCase())
  .filter(Boolean);

/** True when `email` is allowed to use the app. Empty allowlist = open access. */
export function isOwnerEmail(email: string | null | undefined): boolean {
  if (ownerEmails.length === 0) return true;
  if (!email) return false;
  return ownerEmails.includes(email.trim().toLowerCase());
}

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey);
