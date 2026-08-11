import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Minimal embedded JSON file store with a Mongoose-like query API.
 *
 * Data lives in a single local JSON file (default: server/data/dev-db.json)
 * so development works without MongoDB Atlas or a local mongod. Every write
 * is persisted atomically (write temp file, then rename).
 *
 * Supported query surface (enough for the current routes):
 *   - equality and `$in` / `$ne` operators, `$or` / `$and`
 *   - `$set` updates, upsert on findOneAndUpdate
 *   - sort by field with `1 | -1` direction
 */

export interface StoreDoc {
  _id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

export type Query = Record<string, unknown>;
export type SortSpec = Record<string, 1 | -1>;
export interface UpdateOp {
  $set?: Record<string, unknown>;
}

export type Hydrated<T> = T & {
  save(): Promise<T>;
  deleteOne(): Promise<void>;
  equals(other: unknown): boolean;
};

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v) && !(v instanceof Date);

function valueMatches(docValue: unknown, cond: unknown): boolean {
  if (isPlainObject(cond)) {
    const inValues = cond.$in;
    if (Array.isArray(inValues)) {
      const values = Array.isArray(docValue) ? docValue : [docValue];
      return values.some((v) => inValues.map(String).includes(String(v)));
    }
    if ('$ne' in cond) {
      return String(docValue) !== String(cond.$ne);
    }
    return false;
  }
  if (Array.isArray(docValue)) {
    return docValue.some((v) => String(v) === String(cond));
  }
  return String(docValue) === String(cond);
}

function matchesQuery(doc: StoreDoc, query: Query): boolean {
  for (const [key, cond] of Object.entries(query)) {
    if (key === '$or') {
      if (!Array.isArray(cond) || !cond.some((q) => matchesQuery(doc, q as Query))) return false;
      continue;
    }
    if (key === '$and') {
      if (!Array.isArray(cond) || !cond.every((q) => matchesQuery(doc, q as Query))) return false;
      continue;
    }
    if (!valueMatches(doc[key], cond)) return false;
  }
  return true;
}

function compareDocs(a: StoreDoc, b: StoreDoc, sort: SortSpec): number {
  for (const [key, dir] of Object.entries(sort)) {
    const av = a[key];
    const bv = b[key];
    let cmp = 0;
    if (av == null && bv == null) cmp = 0;
    else if (av == null) cmp = -1;
    else if (bv == null) cmp = 1;
    else if (typeof av === 'number' && typeof bv === 'number') cmp = av - bv;
    else cmp = String(av).localeCompare(String(bv));
    if (cmp !== 0) return cmp * dir;
  }
  return 0;
}

const DEFAULT_FILE = path.join(__dirname, '..', '..', 'data', 'dev-db.json');

function fileInfo() {
  const raw = process.env.DEV_DATA_FILE;
  return {
    inMemory: raw === ':memory:',
    path: raw ? path.resolve(raw) : DEFAULT_FILE,
  };
}

class FileStore {
  private data: Record<string, StoreDoc[]> = {};
  private loaded = false;
  private writeChain: Promise<void> = Promise.resolve();

  get inMemory(): boolean {
    return fileInfo().inMemory;
  }

  get filePath(): string {
    return fileInfo().path;
  }

  get status(): string {
    return this.loaded ? 'connected' : 'disconnected';
  }

  load() {
    if (this.loaded) return;
    if (!this.inMemory && fs.existsSync(this.filePath)) {
      this.data = JSON.parse(fs.readFileSync(this.filePath, 'utf8')) as Record<
        string,
        StoreDoc[]
      >;
    } else {
      this.data = {};
    }
    this.loaded = true;
  }

  collection(name: string): StoreDoc[] {
    return this.data[name] ?? (this.data[name] = []);
  }

  replaceCollection(name: string, docs: StoreDoc[]) {
    this.data[name] = docs;
  }

  persist(): Promise<void> {
    if (this.inMemory) return Promise.resolve();
    this.writeChain = this.writeChain.then(() => {
      const dir = path.dirname(this.filePath);
      fs.mkdirSync(dir, { recursive: true });
      const tmp = `${this.filePath}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2));
      fs.renameSync(tmp, this.filePath);
    });
    return this.writeChain;
  }

  reset() {
    this.data = {};
    if (!this.inMemory && fs.existsSync(this.filePath)) {
      fs.rmSync(this.filePath);
    }
  }
}

export const store = new FileStore();

export function initFileDb() {
  store.load();
  console.log(
    `[db] local ${store.inMemory ? 'in-memory store' : `file store: ${store.filePath}`}`,
  );
}

export function resetStore() {
  store.reset();
}

export class Model<T extends StoreDoc = StoreDoc> {
  constructor(readonly name: string) {}

  all(): T[] {
    return store.collection(this.name) as T[];
  }

  runQuery(query: Query, sort: SortSpec | null): Hydrated<T>[] {
    let docs = this.all().filter((d) => matchesQuery(d, query));
    if (sort) docs = [...docs].sort((a, b) => compareDocs(a, b, sort));
    return docs.map((d) => hydrate(this, d));
  }

  find(query: Query): ManyQuery<T> {
    return new ManyQuery(this, query);
  }

  findOne(query: Query): OneQuery<T> {
    return new OneQuery(this, query);
  }

  findById(id: string): OneQuery<T> {
    return new OneQuery(this, { _id: id });
  }

  async create(fields: Partial<T>): Promise<Hydrated<T>> {
    const now = new Date().toISOString();
    const doc = {
      ...fields,
      _id: (fields as { _id?: string })._id ?? randomUUID(),
      createdAt: now,
      updatedAt: now,
    } as T;
    this.all().push(doc);
    await store.persist();
    return hydrate(this, doc);
  }

  findOneAndUpdate(
    query: Query,
    update: UpdateOp,
    opts: { upsert?: boolean } = {},
  ): OneQuery<T> {
    return new OneQuery(this, query, () => {
      let doc = this.all().find((d) => matchesQuery(d, query)) ?? null;
      if (!doc && opts.upsert) {
        const now = new Date().toISOString();
        doc = {
          ...(update.$set ?? {}),
          ...query,
          _id: randomUUID(),
          createdAt: now,
          updatedAt: now,
        } as T;
        this.all().push(doc);
      }
      if (doc) this.applySet(doc, update.$set ?? {});
      return doc ? hydrate(this, doc) : null;
    });
  }

  async updateOne(query: Query, update: UpdateOp): Promise<{ modifiedCount: number }> {
    const docs = this.all().filter((d) => matchesQuery(d, query));
    for (const doc of docs) this.applySet(doc, update.$set ?? {});
    await store.persist();
    return { modifiedCount: docs.length };
  }

  async deleteMany(query: Query): Promise<{ deletedCount: number }> {
    const before = this.all().length;
    store.replaceCollection(
      this.name,
      this.all().filter((d) => !matchesQuery(d, query)),
    );
    const deletedCount = before - this.all().length;
    await store.persist();
    return { deletedCount };
  }

  private applySet(doc: T, set: Record<string, unknown>) {
    for (const [k, v] of Object.entries(set)) {
      if (k.startsWith('$')) continue;
      (doc as Record<string, unknown>)[k] = v;
    }
    doc.updatedAt = new Date().toISOString();
  }
}

export class ManyQuery<T extends StoreDoc> {
  private sortSpec: SortSpec | null = null;
  constructor(private model: Model<T>, private query: Query) {}

  sort(spec: SortSpec): this {
    this.sortSpec = spec;
    return this;
  }

  exec(): Promise<Hydrated<T>[]> {
    return Promise.resolve(this.model.runQuery(this.query, this.sortSpec));
  }
}

export class OneQuery<T extends StoreDoc> {
  private sortSpec: SortSpec | null = null;
  constructor(
    private model: Model<T>,
    private query: Query,
    private run?: () => Hydrated<T> | null,
  ) {}

  sort(spec: SortSpec): this {
    this.sortSpec = spec;
    return this;
  }

  exec(): Promise<Hydrated<T> | null> {
    if (this.run) return Promise.resolve(this.run());
    return Promise.resolve(this.model.runQuery(this.query, this.sortSpec)[0] ?? null);
  }
}

function hydrate<T extends StoreDoc>(model: Model<T>, doc: T): Hydrated<T> {
  Object.defineProperties(doc, {
    save: {
      value: async () => {
        doc.updatedAt = new Date().toISOString();
        await store.persist();
        return doc;
      },
      enumerable: false,
      configurable: true,
    },
    deleteOne: {
      value: async () => {
        store.replaceCollection(
          model.name,
          model.all().filter((d) => d._id !== doc._id),
        );
        await store.persist();
      },
      enumerable: false,
      configurable: true,
    },
    equals: {
      value: (other: unknown) =>
        String(doc._id) === String((other as { _id?: unknown } | null)?._id ?? other),
      enumerable: false,
      configurable: true,
    },
  });
  return doc as Hydrated<T>;
}

export function createModel<T extends StoreDoc>(name: string): Model<T> {
  return new Model<T>(name);
}
