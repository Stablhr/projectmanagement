export interface Board {
  _id: string;
  ownerId: string;
  title: string;
  members: string[];
  createdAt: string;
  updatedAt: string;
}

export interface List {
  _id: string;
  boardId: string;
  title: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface Card {
  _id: string;
  listId: string;
  title: string;
  description: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface BoardDetail {
  board: Board;
  lists: List[];
  cards: Card[];
}
