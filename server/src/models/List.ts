import { createModel, type StoreDoc } from '../db/fileStore';

export interface ListDoc extends StoreDoc {
  boardId: string;
  title: string;
  position: number;
}

export const List = createModel<ListDoc>('lists');
