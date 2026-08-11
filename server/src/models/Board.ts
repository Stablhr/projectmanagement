import { createModel, type StoreDoc } from '../db/fileStore';

export interface BoardDoc extends StoreDoc {
  ownerId: string;
  title: string;
  members: string[];
}

export const Board = createModel<BoardDoc>('boards');
