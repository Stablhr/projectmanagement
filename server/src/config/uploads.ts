import path from 'node:path';

/**
 * Files uploaded to cards are stored on disk under `server/uploads/<cardId>/`
 * and served statically at `/uploads/...`. The directory is git-ignored.
 */
export const uploadsDir = path.resolve(__dirname, '..', '..', 'uploads');
