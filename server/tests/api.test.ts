import { createRequire } from 'node:module';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../src/app';
import { initFileDb, resetStore } from '../src/db/fileStore';
import { Card } from '../src/models/Card';
import { List } from '../src/models/List';
import { purgeExpiredCompleted } from '../src/services/cleanupCompleted';

vi.mock('firebase-admin', () => {
  const verifyIdToken = vi.fn(async (token: string) => ({
    uid: token,
    email: `${token}@dev.local`,
    name: token,
  }));
  const appLike = { auth: () => ({ verifyIdToken }) };
  return {
    __esModule: true,
    default: {
      credential: {
        cert: vi.fn(() => 'cert'),
        applicationDefault: vi.fn(() => 'default'),
      },
      initializeApp: vi.fn(() => appLike),
    },
  };
});

const request = createRequire(import.meta.url)('supertest');

function authed(token: string) {
  const headers = { Authorization: `Bearer ${token}` };
  return {
    get: (url: string) => request(app).get(url).set(headers),
    post: (url: string, body?: unknown) =>
      request(app).post(url).set(headers).send(body),
    patch: (url: string, body?: unknown) =>
      request(app).patch(url).set(headers).send(body),
    put: (url: string, body?: unknown) =>
      request(app).put(url).set(headers).send(body),
    delete: (url: string) => request(app).delete(url).set(headers),
  };
}

const alice = authed('alice');
const bob = authed('bob');

beforeAll(() => {
  initFileDb();
});

beforeEach(() => {
  resetStore();
});

afterAll(() => {
  resetStore();
});

function createBoard(title = 'Board') {
  return alice.post('/api/v1/boards', { title });
}

describe('GET /health', () => {
  it('reports ok without auth', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.db).toBe('connected');
  });
});

describe('auth', () => {
  it('rejects requests without a token', async () => {
    await request(app).get('/api/v1/boards').expect(401);
  });

  it('upserts the user on /auth/sync', async () => {
    const res = await alice
      .post('/api/v1/auth/sync', { email: 'alice@dev.local' })
      .expect(200);
    expect(res.body.firebaseUid).toBe('alice');
  });
});

describe('boards', () => {
  it('creates and lists boards', async () => {
    const created = await createBoard();
    expect(created.body._id).toBeDefined();

    const res = await alice.get('/api/v1/boards').expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('Board');
  });

  it('does not leak other users boards', async () => {
    await createBoard();
    const res = await bob.get('/api/v1/boards').expect(200);
    expect(res.body).toHaveLength(0);
  });

  it('denies non-members access to a board', async () => {
    const created = await createBoard();
    await bob.get(`/api/v1/boards/${created.body._id}`).expect(403);
  });

  it('cascades delete of lists and cards', async () => {
    const board = await createBoard();
    const list = await alice
      .post(`/api/v1/boards/${board.body._id}/lists`, { title: 'To Do' })
      .expect(201);
    await alice
      .post(`/api/v1/lists/${list.body._id}/cards`, { title: 'Card A' })
      .expect(201);

    await alice.delete(`/api/v1/boards/${board.body._id}`).expect(204);

    const lists = await List.find({ boardId: board.body._id }).exec();
    const cards = await Card.find({ listId: list.body._id }).exec();
    expect(lists).toHaveLength(0);
    expect(cards).toHaveLength(0);
  });
});

describe('lists', () => {
  it('creates lists with increasing positions', async () => {
    const board = await createBoard();
    const l1 = await alice
      .post(`/api/v1/boards/${board.body._id}/lists`, { title: 'To Do' })
      .expect(201);
    const l2 = await alice
      .post(`/api/v1/boards/${board.body._id}/lists`, { title: 'Done' })
      .expect(201);
    expect(l2.body.position).toBeGreaterThan(l1.body.position);
  });

  it('reorders lists', async () => {
    const board = await createBoard();
    const l1 = await alice
      .post(`/api/v1/boards/${board.body._id}/lists`, { title: 'A' })
      .expect(201);
    const l2 = await alice
      .post(`/api/v1/boards/${board.body._id}/lists`, { title: 'B' })
      .expect(201);

    await alice
      .put(`/api/v1/boards/${board.body._id}/lists/reorder`, {
        orderedIds: [l2.body._id, l1.body._id],
      })
      .expect(200);

    const res = await alice.get(`/api/v1/boards/${board.body._id}`).expect(200);
    expect(res.body.lists.map((l: any) => l.title)).toEqual(['B', 'A']);
  });
});

describe('cards', () => {
  it('moves a card across lists', async () => {
    const board = await createBoard();
    const listA = await alice
      .post(`/api/v1/boards/${board.body._id}/lists`, { title: 'To Do' })
      .expect(201);
    const listB = await alice
      .post(`/api/v1/boards/${board.body._id}/lists`, { title: 'Done' })
      .expect(201);
    const card = await alice
      .post(`/api/v1/lists/${listA.body._id}/cards`, { title: 'Card A' })
      .expect(201);
    const cardB = await alice
      .post(`/api/v1/lists/${listB.body._id}/cards`, { title: 'Card B' })
      .expect(201);

    await alice
      .put('/api/v1/cards/reorder', {
        cardId: card.body._id,
        destListId: listB.body._id,
        orderedIds: [card.body._id, cardB.body._id],
      })
      .expect(200);

    const res = await alice.get(`/api/v1/boards/${board.body._id}`).expect(200);
    const moved = res.body.cards.find((c: any) => c._id === card.body._id);
    const other = res.body.cards.find((c: any) => c._id === cardB.body._id);
    expect(moved.listId).toBe(listB.body._id);
    expect(moved.position).toBeLessThan(other.position);
  });

  it('validates card title', async () => {
    const board = await createBoard();
    const list = await alice
      .post(`/api/v1/boards/${board.body._id}/lists`, { title: 'To Do' })
      .expect(201);
    await alice
      .post(`/api/v1/lists/${list.body._id}/cards`, { title: '   ' })
      .expect(400);
  });

  it('patches card detail fields and returns them on load', async () => {
    const board = await createBoard();
    const list = await alice
      .post(`/api/v1/boards/${board.body._id}/lists`, { title: 'To Do' })
      .expect(201);
    const card = await alice
      .post(`/api/v1/lists/${list.body._id}/cards`, { title: 'Card A' })
      .expect(201);
    const cardId = card.body._id;

    await alice
      .patch(`/api/v1/cards/${cardId}`, {
        cover: { type: 'color', value: '#EB5A46' },
        labels: ['board-1-label-1', 'board-1-label-2'],
        memberIds: ['dev-user', 'member-aria'],
        dueDate: '2026-09-01T00:00:00.000Z',
        location: 'Floor 3',
        watched: true,
        complete: true,
      })
      .expect(200);

    const res = await alice.get(`/api/v1/boards/${board.body._id}`).expect(200);
    const updated = res.body.cards.find((c: any) => c._id === cardId);
    expect(updated.cover).toEqual({ type: 'color', value: '#EB5A46' });
    expect(updated.labels).toEqual(['board-1-label-1', 'board-1-label-2']);
    expect(updated.memberIds).toEqual(['dev-user', 'member-aria']);
    expect(updated.location).toBe('Floor 3');
    expect(updated.watched).toBe(true);
    expect(updated.complete).toBe(true);
    expect(new Date(updated.dueDate).toISOString()).toBe('2026-09-01T00:00:00.000Z');
  });

  it('supports comments, activity, reactions, and files', async () => {
    const board = await createBoard();
    const list = await alice
      .post(`/api/v1/boards/${board.body._id}/lists`, { title: 'To Do' })
      .expect(201);
    const card = await alice
      .post(`/api/v1/lists/${list.body._id}/cards`, { title: 'Card A' })
      .expect(201);
    const cardId = card.body._id;

    await alice
      .patch(`/api/v1/cards/${cardId}`, {
        comments: [
          {
            id: 'c1',
            authorId: 'dev-user',
            authorName: 'Dev User',
            text: 'first!',
            createdAt: '2026-08-01T00:00:00.000Z',
          },
        ],
        activity: [{ id: 'a1', text: 'Added a comment', createdAt: '2026-08-01T00:00:00.000Z' }],
        reactions: { '👍': ['dev-user'], '❤️': ['member-aria'] },
        files: [
          { id: 'f1', name: 'spec.pdf', url: 'https://cdn.example.com/spec.pdf', kind: 'file' },
        ],
      })
      .expect(200);

    const res = await alice.get(`/api/v1/boards/${board.body._id}`).expect(200);
    const updated = res.body.cards.find((c: any) => c._id === cardId);
    expect(updated.comments).toHaveLength(1);
    expect(updated.comments[0].text).toBe('first!');
    expect(updated.activity).toHaveLength(1);
    expect(updated.activity[0].text).toBe('Added a comment');
    expect(updated.reactions).toEqual({ '👍': ['dev-user'], '❤️': ['member-aria'] });
    expect(updated.files).toHaveLength(1);
    expect(updated.files[0].name).toBe('spec.pdf');
    expect(updated.files[0].url).toContain('spec.pdf');
  });

  it('caps activity and clears optional fields', async () => {
    const board = await createBoard();
    const list = await alice
      .post(`/api/v1/boards/${board.body._id}/lists`, { title: 'To Do' })
      .expect(201);
    const card = await alice
      .post(`/api/v1/lists/${list.body._id}/cards`, { title: 'Card A' })
      .expect(201);
    const cardId = card.body._id;

    const activity = Array.from({ length: 40 }, (_, i) => ({
      id: `a${i}`,
      text: `step ${i}`,
      createdAt: `2026-08-0${(i % 9) + 1}T00:00:00.000Z`,
    }));
    await alice
      .patch(`/api/v1/cards/${cardId}`, { activity, dueDate: '2026-09-01T00:00:00.000Z', location: 'HQ' })
      .expect(200);

    await alice
      .patch(`/api/v1/cards/${cardId}`, { dueDate: null, location: '', cover: null, watched: false })
      .expect(200);

    const boardRes = await alice.get(`/api/v1/boards/${board.body._id}`).expect(200);
    const updated = boardRes.body.cards.find((c: any) => c._id === cardId);
    expect(updated.activity).toHaveLength(30);
    expect(updated.dueDate).toBeNull();
    expect(updated.location).toBe('');
    expect(updated.cover).toBeNull();
    expect(updated.watched).toBe(false);
  });
});

describe('completed cards auto-delete after 1 day', () => {
  it('records completedAt when marked done and clears it when reopened', async () => {
    const board = await createBoard();
    const list = await alice
      .post(`/api/v1/boards/${board.body._id}/lists`, { title: 'To Do' })
      .expect(201);
    const card = await alice
      .post(`/api/v1/lists/${list.body._id}/cards`, { title: 'Card A' })
      .expect(201);
    const cardId = card.body._id;

    const done = await alice.patch(`/api/v1/cards/${cardId}`, { complete: true }).expect(200);
    expect(done.body.complete).toBe(true);
    expect(done.body.completedAt).toBeDefined();

    const reopened = await alice.patch(`/api/v1/cards/${cardId}`, { complete: false }).expect(200);
    expect(reopened.body.complete).toBe(false);
    expect(reopened.body.completedAt).toBeNull();
  });

  it('keeps completedAt when an already-done card is patched as done again', async () => {
    const board = await createBoard();
    const list = await alice
      .post(`/api/v1/boards/${board.body._id}/lists`, { title: 'To Do' })
      .expect(201);
    const card = await alice
      .post(`/api/v1/lists/${list.body._id}/cards`, { title: 'Card A' })
      .expect(201);
    const cardId = card.body._id;

    await alice.patch(`/api/v1/cards/${cardId}`, { complete: true }).expect(200);
    const again = await alice.patch(`/api/v1/cards/${cardId}`, { complete: true }).expect(200);
    const boardRes = await alice.get(`/api/v1/boards/${board.body._id}`).expect(200);
    const stored = boardRes.body.cards.find((c: any) => c._id === cardId);
    expect(again.body.completedAt).toBe(stored.completedAt);
  });

  it('purges cards done more than 24h ago and keeps recent ones', async () => {
    const board = await createBoard();
    const list = await alice
      .post(`/api/v1/boards/${board.body._id}/lists`, { title: 'To Do' })
      .expect(201);
    const listId = list.body._id;

    const oldDone = await alice
      .post(`/api/v1/lists/${listId}/cards`, { title: 'Old done' })
      .expect(201);
    const recentDone = await alice
      .post(`/api/v1/lists/${listId}/cards`, { title: 'Recent done' })
      .expect(201);
    const open = await alice
      .post(`/api/v1/lists/${listId}/cards`, { title: 'Open' })
      .expect(201);

    await alice.patch(`/api/v1/cards/${oldDone.body._id}`, { complete: true }).expect(200);
    await alice.patch(`/api/v1/cards/${recentDone.body._id}`, { complete: true }).expect(200);

    const old = await Card.findById(oldDone.body._id).exec();
    const recent = await Card.findById(recentDone.body._id).exec();
    old!.completedAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    recent!.completedAt = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    await old!.save();
    await recent!.save();

    const result = await purgeExpiredCompleted();
    expect(result.deleted).toBe(1);

    expect(await Card.findById(oldDone.body._id).exec()).toBeNull();
    expect(await Card.findById(recentDone.body._id).exec()).not.toBeNull();
    expect(await Card.findById(open.body._id).exec()).not.toBeNull();
  });

  it('does not purge legacy done cards that have no completedAt', async () => {
    const board = await createBoard();
    const list = await alice
      .post(`/api/v1/boards/${board.body._id}/lists`, { title: 'To Do' })
      .expect(201);
    const card = await alice
      .post(`/api/v1/lists/${list.body._id}/cards`, { title: 'Legacy done' })
      .expect(201);

    const doc = await Card.findById(card.body._id).exec();
    doc!.complete = true;
    doc!.completedAt = null;
    await doc!.save();

    const result = await purgeExpiredCompleted();
    expect(result.deleted).toBe(0);
    expect(await Card.findById(card.body._id).exec()).not.toBeNull();
  });
});
