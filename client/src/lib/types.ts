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
  /** Optional owner/assignee rendered as a subtitle (UI-only for MVP). */
  assigneeId?: string | null;
}

export type CardCover = { type: 'color' | 'image'; value: string };

export interface Card {
  _id: string;
  listId: string;
  title: string;
  description: string;
  position: number;
  createdAt: string;
  updatedAt: string;
  /** UI-only visual enrichment (client-side for MVP; not yet persisted). */
  cover?: CardCover | null;
  /** References into the board label set. */
  labels?: string[];
  dueDate?: string | null;
  commentCount?: number;
  attachmentCount?: number;
  watched?: boolean;
  memberIds?: string[];
  complete?: boolean;
}

export interface BoardLabel {
  id: string;
  name: string;
  color: string;
  textColor: string;
}

export type BoardVisibility = 'private' | 'workspace' | 'organization' | 'public';

export interface MemberProfile {
  id: string;
  name: string;
  email: string;
  initials: string;
  color: string;
  isMe?: boolean;
}

export interface BoardMeta {
  description: string;
  visibility: BoardVisibility;
  starred: boolean;
  background: { type: 'color' | 'image'; value: string };
}

export interface BoardDetail {
  board: Board;
  lists: List[];
  cards: Card[];
}
