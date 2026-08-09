import type {
  BoardDetail,
  BoardLabel,
  Card,
  List,
  MemberProfile,
} from '../../lib/types';

/**
 * MVP demo-data layer for the visual pieces that don't have a backend yet
 * (labels, covers, due dates, counts, membership profiles, assignees).
 *
 * Everything here is a pure, deterministic function of ids so the same card
 * always renders the same way. When persistence lands, replace `enrich*` with
 * data read from the backend and delete the mocks.
 *
 * Firestore mapping notes (for the eventual real implementation):
 *  - boards/{boardId}/labels            -> one doc per label
 *  - boards/{boardId}/members/{userId}  -> per-member role/profile ref
 *  - cards/{cardId}                     -> cover, labels, dueDate,
 *                                          commentCount, attachmentCount,
 *                                          watchedBy, memberIds, complete
 *  - lists/{listId}                     -> assigneeId
 */

export const ME_ID = 'dev-user';

const MOCK_TEAM: Omit<MemberProfile, 'isMe'>[] = [
  { id: 'member-aria', name: 'Aria Chen', email: 'aria@flowline.app', initials: 'AC', color: '#0F4C45' },
  { id: 'member-marcus', name: 'Marcus Reed', email: 'marcus@flowline.app', initials: 'MR', color: '#2563EB' },
  { id: 'member-lena', name: 'Lena Okafor', email: 'lena@flowline.app', initials: 'LO', color: '#B45309' },
  { id: 'member-diego', name: 'Diego Silva', email: 'diego@flowline.app', initials: 'DS', color: '#7C3AED' },
  { id: 'member-priya', name: 'Priya Nair', email: 'priya@flowline.app', initials: 'PN', color: '#DC2626' },
  { id: 'member-tom', name: 'Tom Becker', email: 'tom@flowline.app', initials: 'TB', color: '#1F9D6B' },
];

export function meProfile(): MemberProfile {
  return {
    id: ME_ID,
    name: 'Dev User',
    email: 'dev@local',
    initials: 'DU',
    color: '#99E1D9',
    isMe: true,
  };
}

/** Deterministic member roster for a board (current user + 3 teammates). */
export function boardMembers(boardId: string): MemberProfile[] {
  const me = meProfile();
  const h = hashOf(boardId);
  const roster: MemberProfile[] = [me];
  for (let i = 0; i < 3; i++) {
    const m = MOCK_TEAM[(h + i * 2) % MOCK_TEAM.length];
    if (!roster.some((r) => r.id === m.id)) roster.push({ ...m });
  }
  return roster;
}

export function memberById(members: MemberProfile[], id: string) {
  return members.find((m) => m.id === id);
}

const LABEL_PALETTE: Omit<BoardLabel, 'id'>[] = [
  { name: 'High priority', color: '#EB5A46', textColor: '#FFFFFF' },
  { name: 'Medium priority', color: '#FF9F1A', textColor: '#FFFFFF' },
  { name: 'Low priority', color: '#61BD4F', textColor: '#FFFFFF' },
  { name: 'Design', color: '#C377E0', textColor: '#FFFFFF' },
  { name: 'Frontend', color: '#0079BF', textColor: '#FFFFFF' },
  { name: 'Backend', color: '#00C2E0', textColor: '#FFFFFF' },
  { name: 'Bug', color: '#F2D600', textColor: '#1A2B2A' },
  { name: 'Blocked', color: '#FF78CB', textColor: '#FFFFFF' },
  { name: 'Needs review', color: '#51E898', textColor: '#1A2B2A' },
  { name: 'Docs', color: '#344563', textColor: '#FFFFFF' },
];

/** Deterministic label set (5 labels) for a board. */
export function boardLabels(boardId: string): BoardLabel[] {
  const h = hashOf(boardId);
  const picked: BoardLabel[] = [];
  for (let i = 0; i < 5; i++) {
    const source = LABEL_PALETTE[(h + i * 3) % LABEL_PALETTE.length];
    if (!picked.some((l) => l.name === source.name)) {
      picked.push({ ...source, id: `${boardId}-label-${i + 1}` });
    }
  }
  return picked;
}

const COVER_COLORS = ['#99E1D9', '#FF9F1A', '#C377E0', '#0079BF', '#61BD4F', '#F2D600', '#FF78CB'];

function hashOf(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function pseudoInt(input: string, range: number): number {
  return hashOf(input) % range;
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function deterministicDueDate(input: string): string | null {
  const roll = pseudoInt(input, 100);
  if (roll < 45) return null;
  const offsets = [-5 * DAY, -3 * DAY, -1 * DAY, -12 * HOUR, -6 * HOUR, 6 * HOUR, 1 * DAY, 2 * DAY, 5 * DAY, 12 * DAY];
  const offset = offsets[pseudoInt(input, offsets.length)];
  return new Date(Date.now() + offset).toISOString();
}

export function enrichCard(card: Card, members: MemberProfile[], labels: BoardLabel[]): Card {
  const h = hashOf(card._id);

  const coverRoll = h % 10;
  let cover: Card['cover'] = null;
  if (coverRoll < 3) {
    cover = { type: 'color', value: COVER_COLORS[h % COVER_COLORS.length] };
  } else if (coverRoll < 6) {
    const a = COVER_COLORS[h % COVER_COLORS.length];
    const b = COVER_COLORS[(h + 2) % COVER_COLORS.length];
    cover = { type: 'image', value: `linear-gradient(120deg, ${a}, ${b})` };
  }

  const labelCount = h % 3 === 0 ? 0 : 1 + ((h >> 3) % 2);
  const cardLabels: string[] = [];
  for (let i = 0; i < labelCount; i++) {
    const label = labels[(h + i * 5) % labels.length];
    if (label && !cardLabels.includes(label.id)) cardLabels.push(label.id);
  }

  const memberCount = h % 4 === 0 ? 0 : 1 + ((h >> 5) % Math.min(3, members.length));
  const cardMembers: string[] = [];
  for (let i = 0; i < memberCount; i++) {
    const m = members[(h + i * 7) % members.length];
    if (m && !cardMembers.includes(m.id)) cardMembers.push(m.id);
  }

  return {
    ...card,
    cover,
    labels: cardLabels,
    dueDate: deterministicDueDate(card._id),
    commentCount: h % 3 === 0 ? 0 : h % 8,
    attachmentCount: h % 5 === 0 ? 0 : h % 5,
    watched: h % 7 === 0,
    memberIds: cardMembers,
    complete: h % 11 === 0,
  };
}

export function enrichList(list: List, members: MemberProfile[]): List {
  return { ...list, assigneeId: members[pseudoInt(list._id, members.length)]?.id };
}

export function enrichBoardDetail(board: BoardDetail): BoardDetail {
  const members = boardMembers(board.board._id);
  const labels = boardLabels(board.board._id);
  return {
    ...board,
    lists: board.lists.map((l) => enrichList(l, members)),
    cards: board.cards.map((c) => enrichCard(c, members, labels)),
  };
}
