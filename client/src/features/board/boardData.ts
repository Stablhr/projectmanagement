import type {
  BoardDetail,
  BoardLabel,
  List,
  MemberProfile,
} from '../../lib/types';

/**
 * Demo-data layer for the visual pieces that don't have a backend yet
 * (membership profiles and the per-list assignee subtitle).
 *
 * Everything here is a pure, deterministic function of ids so the same board
 * always renders the same way. Card detail fields (cover, labels, due dates,
 * assignees, comments, activity, ...) are stored on the server and read back
 * through the REST API.
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

export function enrichList(list: List, members: MemberProfile[]): List {
  return { ...list, assigneeId: members[pseudoInt(list._id, members.length)]?.id };
}

export function enrichBoardDetail(board: BoardDetail): BoardDetail {
  const members = boardMembers(board.board._id);
  return {
    ...board,
    lists: board.lists.map((l) => enrichList(l, members)),
    cards: board.cards,
  };
}
