import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../../lib/firebase';
import { uid } from '../../lib/ids';
import type { CardFile } from '../../lib/types';

/**
 * Upload a file to Firebase Storage under the card's attachments path and
 * return its metadata for storing on the card. Throws if storage is not
 * configured or the upload fails.
 */
export async function uploadAttachment(cardId: string, file: File): Promise<CardFile> {
  if (!storage) {
    throw new Error('Firebase Storage is not configured for this app.');
  }
  const safeName = file.name.replace(/[^\w.-]+/g, '_');
  const fileRef = ref(storage, `card-attachments/${cardId}/${Date.now()}-${safeName}`);
  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);
  const isImage = file.type.startsWith('image/');
  return {
    id: uid(),
    name: file.name,
    url,
    kind: isImage ? 'image' : 'file',
    size: file.size,
    addedAt: new Date().toISOString(),
  };
}
