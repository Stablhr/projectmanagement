import { describe, expect, it } from 'vitest';
import type { BoardLabel, Card, MemberProfile } from '../../lib/types';
import { emptyFilters, type FilterState } from './boardContext';
import { filterCards, matchesFilters } from './filterBoard';

const members: MemberProfile[] = [
  { id: 'me', name: 'Me', email: 'me@x', initials: 'ME', color: '#000', isMe: true },
  { id: 'u2', name: 'Ann', email: 'a@x', initials: 'AN', color: '#000' },
];
const labels: BoardLabel[] = [
  { id: 'l1', name: 'Bug', color: '#EB5A46', textColor: '#fff' },
  { id: 'l2', name: 'Design', color: '#C377E0', textColor: '#fff' },
];
const ctx = { members, labels, meId: 'me' };

function card(overrides: Partial<Card>): Card {
  return {
    _id: 'c',
    listId: 'list-1',
    title: 'Task',
    description: '',
    position: 1024,
    createdAt: '',
    updatedAt: '',
    labels: [],
    memberIds: [],
    complete: false,
    dueDate: null,
    ...overrides,
  };
}

const DAY = 24 * 60 * 60 * 1000;
function iso(ms: number) {
  return new Date(Date.now() + ms).toISOString();
}

describe('filterBoard', () => {
  it('returns all cards when no filters are set', () => {
    const cards = [card({ _id: 'a' }), card({ _id: 'b' })];
    expect(filterCards(cards, emptyFilters, ctx).length).toBe(2);
  });

  it('matches keyword across title, labels, and member names', () => {
    const cards = [
      card({ _id: 'a', title: 'Fix login bug', labels: ['l1'], memberIds: ['u2'] }),
      card({ _id: 'b', title: 'Ship marketing page' }),
    ];
    expect(matchesFilters(cards[0], { ...emptyFilters, keyword: 'bug' }, ctx)).toBe(true);
    expect(matchesFilters(cards[0], { ...emptyFilters, keyword: 'ann' }, ctx)).toBe(true);
    expect(matchesFilters(cards[1], { ...emptyFilters, keyword: 'login' }, ctx)).toBe(false);
  });

  it('uses OR logic within the members section', () => {
    const f: FilterState = {
      ...emptyFilters,
      members: { none: false, me: false, selected: ['u2'] },
    };
    const cards = [
      card({ _id: 'a', memberIds: ['u2'] }),
      card({ _id: 'b', memberIds: ['me'] }),
      card({ _id: 'c', memberIds: [] }),
    ];
    expect(filterCards(cards, f, ctx).map((c) => c._id)).toEqual(['a']);
  });

  it('uses AND logic across sections', () => {
    const f: FilterState = {
      ...emptyFilters,
      members: { none: false, me: true, selected: [] },
      status: { complete: true, incomplete: false },
    };
    const cards = [
      card({ _id: 'a', memberIds: ['me'], complete: true }),
      card({ _id: 'b', memberIds: ['me'], complete: false }),
      card({ _id: 'c', memberIds: ['u2'], complete: true }),
    ];
    expect(filterCards(cards, f, ctx).map((c) => c._id)).toEqual(['a']);
  });

  it('matches due-date windows with correct urgency', () => {
    const overdue = card({ _id: 'a', dueDate: iso(-DAY) });
    const soon = card({ _id: 'b', dueDate: iso(12 * 60 * 60 * 1000) });
    const nextWeek = card({ _id: 'c', dueDate: iso(3 * DAY) });
    const none = card({ _id: 'd', dueDate: null });

    const fOverdue: FilterState = { ...emptyFilters, due: { none: false, overdue: true, soon: false, week: false, month: false } };
    expect(filterCards([overdue, soon, nextWeek, none], fOverdue, ctx).map((c) => c._id)).toEqual(['a']);

    const fSoon: FilterState = { ...emptyFilters, due: { none: false, overdue: false, soon: true, week: false, month: false } };
    expect(filterCards([overdue, soon, nextWeek, none], fSoon, ctx).map((c) => c._id)).toEqual(['a', 'b']);

    const fNone: FilterState = { ...emptyFilters, due: { none: true, overdue: false, soon: false, week: false, month: false } };
    expect(filterCards([overdue, soon, nextWeek, none], fNone, ctx).map((c) => c._id)).toEqual(['d']);
  });

  it('matches label selections and no-label', () => {
    const fLabel: FilterState = { ...emptyFilters, labels: { none: false, selected: ['l2'] } };
    const cards = [
      card({ _id: 'a', labels: ['l1'] }),
      card({ _id: 'b', labels: ['l2'] }),
      card({ _id: 'c', labels: [] }),
    ];
    expect(filterCards(cards, fLabel, ctx).map((c) => c._id)).toEqual(['b']);

    const fNone: FilterState = { ...emptyFilters, labels: { none: true, selected: [] } };
    expect(filterCards(cards, fNone, ctx).map((c) => c._id)).toEqual(['c']);
  });
});
