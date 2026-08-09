import { describe, expect, it } from 'vitest';
import type { BoardDetail, Card, List } from '../../lib/types';
import { boardLabels, boardMembers, enrichBoardDetail } from './boardData';

function makeBoard(overrides: Partial<BoardDetail> = {}): BoardDetail {
  return {
    board: {
      _id: 'board-1',
      ownerId: 'u1',
      title: 'Website Redesign',
      members: ['dev-user'],
      createdAt: '',
      updatedAt: '',
    },
    lists: [
      { _id: 'list-1', boardId: 'board-1', title: 'To Do', position: 1024, createdAt: '', updatedAt: '' },
      { _id: 'list-2', boardId: 'board-1', title: 'Done', position: 2048, createdAt: '', updatedAt: '' },
    ],
    cards: [
      { _id: 'card-1', listId: 'list-1', title: 'Design hero', description: '', position: 1024, createdAt: '', updatedAt: '' },
      { _id: 'card-2', listId: 'list-1', title: 'Build API', description: '', position: 2048, createdAt: '', updatedAt: '' },
      { _id: 'card-3', listId: 'list-2', title: 'Ship v1', description: '', position: 1024, createdAt: '', updatedAt: '' },
    ],
    ...overrides,
  };
}

describe('boardData enrichment', () => {
  it('keeps the same structure and ids', () => {
    const base = makeBoard();
    const enriched = enrichBoardDetail(base);
    expect(enriched.board._id).toBe('board-1');
    expect(enriched.lists.map((l) => l._id)).toEqual(['list-1', 'list-2']);
    expect(enriched.cards.map((c) => c._id)).toEqual(['card-1', 'card-2', 'card-3']);
  });

  it('is deterministic for the same input', () => {
    const a = enrichBoardDetail(makeBoard());
    const b = enrichBoardDetail(makeBoard());
    expect(a.cards).toEqual(b.cards);
    expect(a.lists).toEqual(b.lists);
  });

  it('adds a per-list assignee', () => {
    const enriched = enrichBoardDetail(makeBoard());
    for (const list of enriched.lists) {
      expect(list.assigneeId).toBeTruthy();
    }
  });

  it('adds visual fields to every card', () => {
    const enriched = enrichBoardDetail(makeBoard());
    for (const card of enriched.cards) {
      expect(typeof card.labels).toBe('object');
      expect(typeof card.commentCount).toBe('number');
      expect(typeof card.attachmentCount).toBe('number');
      expect(typeof card.watched).toBe('boolean');
      expect(Array.isArray(card.memberIds)).toBe(true);
      expect('dueDate' in card).toBe(true);
    }
  });

  it('resolves label ids against the board label set', () => {
    const enriched = enrichBoardDetail(makeBoard());
    const labels = boardLabels('board-1');
    const labelIds = new Set(labels.map((l) => l.id));
    for (const card of enriched.cards) {
      for (const id of card.labels ?? []) {
        expect(labelIds.has(id)).toBe(true);
      }
    }
  });

  it('references only real members', () => {
    const enriched = enrichBoardDetail(makeBoard());
    const members = boardMembers('board-1');
    const ids = new Set(members.map((m) => m.id));
    for (const card of enriched.cards) {
      for (const id of card.memberIds ?? []) {
        expect(ids.has(id)).toBe(true);
      }
    }
  });

  it('does not mutate the source objects', () => {
    const base = makeBoard();
    const sourceCard = base.cards[0];
    enrichBoardDetail(base);
    expect(sourceCard).not.toHaveProperty('labels');
    const list: List = base.lists[0];
    expect(list).not.toHaveProperty('assigneeId');
    const card: Card = sourceCard;
    expect(card.cover).toBeUndefined();
  });
});
