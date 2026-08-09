import { createRequire } from 'node:module';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../src/app';

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
const mallory = authed('mallory');

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('GET /health', () => {
  it('reports ok without auth', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.db).toBe('connected');
  });
});

beforeEach(async () => {
  await mongoose.connection.dropDatabase();
});

function createBoard(title = 'Board') {
  return alice.post('/api/v1/boards').send({ title });
}

describe('auth', () => {
  it('rejects requests without a token', async () => {
    await request(app).get('/api/v1/boards').expect(401);
  });

  it('upserts the user on /auth/sync', async () => {
    const res = await alice
      .post('/api/v1/auth/sync')
      .send({ email: 'alice@dev.local' })
      .expect(200);
    expect(res.body.firebaseUid).toBe('alice');
  });

  it('rejects tokens from non-owner emails', async () => {
    await mallory.get('/api/v1/boards').expect(403);
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
      .post(`/api/v1/boards/${board.body._id}/lists`)
      .send({ title: 'To Do' })
      .expect(201);
    await alice
      .post(`/api/v1/lists/${list.body._id}/cards`)
      .send({ title: 'Card A' })
      .expect(201);

    await alice.delete(`/api/v1/boards/${board.body._id}`).expect(204);

    const lists = await mongoose.model('List').find({ boardId: board.body._id });
    const cards = await mongoose.model('Card').find({ listId: list.body._id });
    expect(lists).toHaveLength(0);
    expect(cards).toHaveLength(0);
  });
});

describe('lists', () => {
  it('creates lists with increasing positions', async () => {
    const board = await createBoard();
    const l1 = await alice
      .post(`/api/v1/boards/${board.body._id}/lists`)
      .send({ title: 'To Do' })
      .expect(201);
    const l2 = await alice
      .post(`/api/v1/boards/${board.body._id}/lists`)
      .send({ title: 'Done' })
      .expect(201);
    expect(l2.body.position).toBeGreaterThan(l1.body.position);
  });

  it('reorders lists', async () => {
    const board = await createBoard();
    const l1 = await alice
      .post(`/api/v1/boards/${board.body._id}/lists`)
      .send({ title: 'A' })
      .expect(201);
    const l2 = await alice
      .post(`/api/v1/boards/${board.body._id}/lists`)
      .send({ title: 'B' })
      .expect(201);

    await alice
      .put(`/api/v1/boards/${board.body._id}/lists/reorder`)
      .send({ orderedIds: [l2.body._id, l1.body._id] })
      .expect(200);

    const res = await alice.get(`/api/v1/boards/${board.body._id}`).expect(200);
    expect(res.body.lists.map((l: any) => l.title)).toEqual(['B', 'A']);
  });
});

describe('cards', () => {
  it('moves a card across lists', async () => {
    const board = await createBoard();
    const listA = await alice
      .post(`/api/v1/boards/${board.body._id}/lists`)
      .send({ title: 'To Do' })
      .expect(201);
    const listB = await alice
      .post(`/api/v1/boards/${board.body._id}/lists`)
      .send({ title: 'Done' })
      .expect(201);
    const card = await alice
      .post(`/api/v1/lists/${listA.body._id}/cards`)
      .send({ title: 'Card A' })
      .expect(201);
    const cardB = await alice
      .post(`/api/v1/lists/${listB.body._id}/cards`)
      .send({ title: 'Card B' })
      .expect(201);

    await alice
      .put('/api/v1/cards/reorder')
      .send({
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
      .post(`/api/v1/boards/${board.body._id}/lists`)
      .send({ title: 'To Do' })
      .expect(201);
    await alice
      .post(`/api/v1/lists/${list.body._id}/cards`)
      .send({ title: '   ' })
      .expect(400);
  });
});
