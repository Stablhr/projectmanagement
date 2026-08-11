import { createModel, type StoreDoc } from '../db/fileStore';

export interface CardCover {
  type: 'color' | 'image';
  value: string;
}

export interface CardFile {
  id: string;
  name: string;
  url: string;
  kind: 'image' | 'file';
  size?: number;
  addedAt: string | Date;
}

export interface CardComment {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string | Date;
}

export interface CardActivityEntry {
  id: string;
  text: string;
  createdAt: string | Date;
}

export interface CardDoc extends StoreDoc {
  listId: string;
  title: string;
  description: string;
  position: number;
  cover: CardCover | null;
  labels: string[];
  memberIds: string[];
  dueDate: string | Date | null;
  location: string;
  files: CardFile[];
  reactions: Record<string, string[]>;
  comments: CardComment[];
  activity: CardActivityEntry[];
  watched: boolean;
  complete: boolean;
}

export const Card = createModel<CardDoc>('cards');
