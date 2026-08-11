import { api } from '../../lib/api';
import type { CardFile } from '../../lib/types';

/**
 * Upload a file to the card's attachments. The server stores the bytes under
 * `server/uploads/<cardId>/` and returns the file metadata to attach to the card.
 * Throws if the upload fails.
 */
export async function uploadAttachment(cardId: string, file: File): Promise<CardFile> {
  const form = new FormData();
  form.append('files', file);
  const data = await api.postForm<{ files: CardFile[] }>(
    `/cards/${cardId}/attachments`,
    form,
  );
  const attached = data.files ?? [];
  if (attached.length === 0) throw new Error('Upload failed');
  return attached[0];
}
