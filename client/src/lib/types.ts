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

export interface CardFile {
  id: string;
  name: string;
  url: string;
  kind: 'image' | 'file';
  size?: number;
  addedAt: string;
}

export interface CardComment {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface CardActivityEntry {
  id: string;
  text: string;
  createdAt: string;
}

/** Emoji -> member ids that reacted. */
export type CardReactions = Record<string, string[]>;

export interface Card {
  _id: string;
  listId: string;
  title: string;
  description: string;
  position: number;
  createdAt: string;
  updatedAt: string;
  cover?: CardCover | null;
  /** References into the board label set. */
  labels?: string[];
  /** References into the board member set. */
  memberIds?: string[];
  dueDate?: string | null;
  location?: string;
  files?: CardFile[];
  reactions?: CardReactions;
  comments?: CardComment[];
  activity?: CardActivityEntry[];
  watched?: boolean;
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
  watch: boolean;
  background: { type: 'color' | 'image'; value: string };
}

export interface BoardDetail {
  board: Board;
  lists: List[];
  cards: Card[];
}
