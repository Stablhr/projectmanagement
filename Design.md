# Design Document: [App Name TBD] — Trello-Inspired Task & Project Management Tool

Implementation-level design for the **MVP (Auth + Boards + Lists + Cards)**. Companion docs: `Project-context_1.md` (vision/features) and `Plan.md` (scope, stack, milestones).

---

## 1. System Overview

```
[React SPA (Vercel)]  <--REST/JSON-->  [Express API (Render)]  <--Mongoose-->  [MongoDB Atlas]
        |                                       |
        |-- Firebase SDK (Auth) --------------->|
        |                                       |-- firebase-admin (JWT verify)
        |-- Socket.io client <--> Socket.io ----|
```

- **Client:** React + Vite + Tailwind CSS, TanStack Query for server state, Socket.io for live updates, `dnd-kit` for drag-and-drop.
- **Server:** Node.js + Express REST API, Mongoose for MongoDB Atlas, `firebase-admin` for JWT verification, Socket.io for realtime events.
- **Auth:** Firebase Auth (email/password + Google OAuth). Server trusts only Firebase-verified JWTs. User profiles live in MongoDB keyed by Firebase UID.

---

## 2. Repository Layout

```
repo/
├── client/                    # React + Vite SPA
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── src/
│       ├── main.tsx
│       ├── App.tsx            # routes + providers
│       ├── lib/
│       │   ├── firebase.ts    # Firebase client init
│       │   ├── api.ts         # typed fetch wrapper (attaches Bearer token)
│       │   └── socket.ts      # Socket.io client singleton
│       ├── auth/
│       │   ├── AuthProvider.tsx
│       │   ├── useAuth.ts
│       │   ├── LoginPage.tsx
│       │   └── ProtectedRoute.tsx
│       ├── features/
│       │   ├── boards/
│       │   │   ├── useBoards.ts
│       │   │   ├── BoardDashboard.tsx
│       │   │   └── BoardCard.tsx
│       │   ├── board/
│       │   │   ├── useBoard.ts
│       │   │   ├── BoardView.tsx
│       │   │   ├── List.tsx
│       │   │   ├── Card.tsx
│       │   │   ├── CardModal.tsx
│       │   │   └── BoardHeader.tsx
│       │   └── lists/
│       │       └── useLists.ts
│       └── components/ui/     # shared primitives (Button, Input, Modal, Spinner)
└── server/
    ├── src/
    │   ├── index.ts           # Express + Socket.io bootstrap
    │   ├── app.ts             # middleware, routes, error handler
    │   ├── config/env.ts      # env validation
    │   ├── db/mongoose.ts
    │   ├── middleware/auth.ts # firebase-admin JWT guard
    │   ├── models/            # User, Board, List, Card
    │   ├── routes/            # boards, lists, cards
    │   ├── services/          # business logic (reorder, cascade delete)
    │   └── realtime/socket.ts # Socket.io handlers
    └── tests/                 # API integration tests
```

---

## 3. Data Model (Mongoose Schemas)

### User
```
{ _id, firebaseUid: string (unique), email: string (unique),
  displayName?: string, createdAt: Date }
```
- Created/updated by the auth sync endpoint when a user signs in for the first time.

### Board
```
{ _id, ownerId: ObjectId(users), title: string, members: [ObjectId(users)],
  createdAt, updatedAt }
```
- `ownerId` is the creator. `members` includes all users with access (owner always included).
- Soft-deleted or hard-deleted (MVP: hard delete with cascade).

### List
```
{ _id, boardId: ObjectId(boards), title: string, position: number,
  createdAt, updatedAt }
```
- `position` is a float; reorder uses the midpoint technique (below).

### Card
```
{ _id, listId: ObjectId(lists), title: string, description?: string,
  position: number, createdAt, updatedAt }
```

### Indexes
- `boards.ownerId`, `boards.members` (multikey)
- `lists.boardId + position`
- `cards.listId + position`

### Ordering Strategy
- Insert between two siblings: `position = (prev.position + next.position) / 2`.
- If no gap remains (tie/underflow), re-index the whole list/board to 0, 1024, 2048, ... in one transaction.
- All reorder writes are atomic per document and idempotent for MVP (last-write-wins on concurrent conflicts).

---

## 4. REST API

Base URL: `{SERVER}/api/v1`. Every route (except `POST /api/v1/auth/sync`) requires `Authorization: Bearer <firebase-id-token>`.

### Auth
| Method | Path | Body | Response | Notes |
|---|---|---|---|---|
| POST | `/auth/sync` | `{ email, displayName }` | `200 User` | Called on every login; upserts the Mongo user by `firebaseUid` (from verified JWT) |

### Boards
| Method | Path | Body | Response | Notes |
|---|---|---|---|---|
| GET | `/boards` | — | `200 [Board]` | Boards where user is owner or member |
| POST | `/boards` | `{ title }` | `201 Board` | Sets `ownerId`, adds owner to `members` |
| GET | `/boards/:id` | — | `200 Board` + nested `lists` + `cards` | Loads full board in one call |
| PATCH | `/boards/:id` | `{ title? }` | `200 Board` | Owner/member only |
| DELETE | `/boards/:id` | — | `204` | Owner only; cascades to lists + cards |
| POST | `/boards/:id/members` | `{ userId }` | `200 Board` | Owner adds a member (future UI) |

### Lists
| Method | Path | Body | Response | Notes |
|---|---|---|---|---|
| POST | `/boards/:boardId/lists` | `{ title }` | `201 List` | Appends at end |
| PATCH | `/lists/:id` | `{ title? }` | `200 List` | |
| DELETE | `/lists/:id` | — | `204` | Cascades to its cards |
| PUT | `/boards/:boardId/lists/reorder` | `{ orderedIds: string[] }` | `200` | Reorders all lists |

### Cards
| Method | Path | Body | Response | Notes |
|---|---|---|---|---|
| POST | `/lists/:listId/cards` | `{ title }` | `201 Card` | Appends at end |
| PATCH | `/cards/:id` | `{ title?, description? }` | `200 Card` | |
| DELETE | `/cards/:id` | — | `204` | |
| PUT | `/cards/reorder` | `{ sourceListId, destListId, cardId, position }` | `200` | Handles cross-list move + position |

### Error Contract
```json
{ "error": { "code": "NOT_FOUND" | "FORBIDDEN" | "UNAUTHORIZED" | "VALIDATION", "message": "..." } }
```
HTTP statuses: `400` validation, `401` missing/invalid token, `403` not a member, `404` not found, `500` server error.

### Access Control
- Middleware `auth()` verifies the Firebase JWT → sets `req.user.firebaseUid`.
- Board-scoped middleware loads the board and checks `ownerId`/`members` before list/card mutations.

---

## 5. Socket.io Events

Room per board: client joins `board:{id}` on board open.

| Event (client→server) | Payload | Purpose |
|---|---|---|
| `board:join` | `{ boardId }` | Join room |
| `board:leave` | `{ boardId }` | Leave room |

| Event (server→client) | Payload | Purpose |
|---|---|---|
| `card:moved` | `{ cardId, listId, position, boardId }` | Live card move |
| `card:updated` | `{ card: Card }` | Live edit |
| `card:created` | `{ card: Card, listId }` | Live create |
| `card:deleted` | `{ cardId, listId }` | Live delete |
| `list:reordered` | `{ orderedIds }` | Live list reorder |
| `board:updated` | `{ board: Board }` | Title changes etc. |

- The server emits to a board room **after** the corresponding REST mutation commits, with the committed document.
- Polling fallback: clients refetch the board on reconnect and on Socket.io error/timeout.
- MVP rule: last-write-wins for concurrent card edits.

---

## 6. Client Architecture

### Routing
- `/` → `BoardDashboard` (protected)
- `/login` → `LoginPage`
- `/board/:id` → `BoardView` (protected)

### Auth Flow
1. `AuthProvider` wraps the app; on mount, `onAuthStateChanged` restores the Firebase session.
2. On login/signup, get the Firebase ID token and call `POST /auth/sync`.
3. `AuthProvider` exposes `user`, `token`, `logout`; `ProtectedRoute` redirects to `/login`.
4. `api.ts` attaches the token as a Bearer header and clears the Firebase session on `401`.

### State & Data Fetching (TanStack Query)
| Query | Key | Source |
|---|---|---|
| `useBoards()` | `['boards']` | `GET /boards` |
| `useBoard(id)` | `['board', id]` | `GET /boards/:id` (contains lists+cards) |

- Mutations: `useMutation` for boards/lists/cards CRUD.
- Optimistic updates: on `card:move`, `dragEnd` applies the local reorder immediately via `queryClient.setQueryData`, then fires `PUT /cards/reorder`; on failure, rollback to the pre-drag snapshot.
- Socket.io updates arrive as events; the socket hook maps them to `queryClient.invalidateQueries(['board', id])` or targeted `setQueryData` patches.

### Drag-and-Drop (`dnd-kit`)
- `DndContext` wraps the board; `SortableContext` per list with `verticalListSortingStrategy`.
- Lists themselves are also sortable via a horizontal `SortableContext`.
- On drag end, compute `sourceListId`, `destListId`, and new `position` from the droppable containers, apply optimistic update, persist via API, and let Socket.io reconcile other clients.

### UI Primitives
`Button`, `Input`, `Textarea`, `Modal`, `Spinner`, `EmptyState`, `ErrorState`, `ConfirmDialog` — unstyled, Tailwind-composed.

---

## 7. Branding & Visual System

### 7.1 Color Palette

Turquoise is the brand color. It is used as an accent (buttons, active states, focus rings, drag-and-drop highlights) over predominantly neutral surfaces to keep a business/professional look.

| Token | Hex | Usage |
|---|---|---|
| `--turquoise-400` (primary) | `#99E1D9` | Brand color, primary buttons, active states |
| `--turquoise-300` | `#A5E5DD` | Hover / lighter accents |
| `--turquoise-200` | `#B8EBE3` | Selected/active backgrounds, chips |
| `--turquoise-600` | `#4AAFA5` | Primary button hover/active |
| `--turquoise-700` | `#2E8C83` | Text on turquoise (accessible) |
| `--turquoise-800` | `#0F4C45` | Dark text on light turquoise backgrounds |

Neutrals (slate-teal):

| Token | Hex | Usage |
|---|---|---|
| `--surface` | `#FFFFFF` | Cards, modals, inputs |
| `--background` | `#F7FAF9` | App background |
| `--border` | `#E2E8E6` | Borders, dividers |
| `--text-primary` | `#1A2B2A` | Primary text |
| `--text-secondary` | `#5B6B68` | Muted text, labels |

Semantic:

| Token | Hex | Usage |
|---|---|---|
| `--success` | `#1F9D6B` | Success feedback |
| `--warning` | `#B45309` | Warnings |
| `--danger` | `#DC2626` | Errors, destructive actions |
| `--info` | `#2563EB` | Informational feedback |

### 7.2 Contrast Rules

- `#99E1D9` fails WCAG AA as body text on white — never use it for small text.
- Text on turquoise backgrounds uses `--turquoise-800` (`#0F4C45`).
- Buttons/labels with turquoise backgrounds use `--turquoise-800` text to meet AA.
- Body text on white uses `--text-primary` (`#1A2B2A`).

### 7.3 Typography

**Inter** (business/professional sans), self-hosted via `@fontsource/inter` (no runtime dependency on Google Fonts). Weights: 400, 500, 600, 700.

| Style | Weight | Size | Notes |
|---|---|---|---|
| Dashboard header | 700 | 30px | Board dashboard title |
| Page/board title | 600 | 24px | |
| Card/list titles | 600 | 16px | |
| Body | 400 | 15px | |
| Muted/labels | 400 | 14px | Column labels: uppercase + letter-spacing `0.05em` |
| Buttons | 500 | 14px | |
| Positions/dates | 400 | 14px | Use tabular numerics (`font-variant-numeric: tabular-nums`) |

Rules: single family only — no mixing with a second typeface; headings 600/700, buttons 500/600.

### 7.4 Tokens in Code

Exposed as Tailwind theme extensions (see client config) and CSS variables:

```
primary     → #99E1D9
primaryDark → #0F4C45
...
```

Future phases (Inbox, Planner, Collaboration) inherit the same tokens.

---

## 8. Server Structure

- **`middleware/auth.ts`:** initializes `firebase-admin` with a service account; verifies `idToken`; attaches `req.user = { firebaseUid, email }`.
- **`services/boardAccess.ts`:** `assertMember(boardId, user)` used by list/card routes.
- **`services/reorder.ts`:** midpoint-position logic + re-index fallback + cross-list card move.
- **`realtime/socket.ts`:** connects on the same HTTP server, authenticates handshake with the Firebase token, manages board rooms, and emits after mutations.
- **Validation:** minimal hand-rolled validators (title required, non-empty, ≤ 200 chars) or `zod` if added; returns `400` contract errors.

---

## 9. Deployment

| Piece | Target | Notes |
|---|---|---|
| Client SPA | Vercel | Static build from `client/`; `VERCEL` env for Firebase web config |
| Express API | Render (web service) | Runs `server/`, long-lived for Socket.io |
| Database | MongoDB Atlas | Single free-tier cluster, VPC/IP allowlist for Render + dev |
| Auth | Firebase project | Web app + Google OAuth provider enabled |

### Environment Variables
```
# client/.env
VITE_FIREBASE_API_KEY / AUTH_DOMAIN / PROJECT_ID / STORAGE_BUCKET / MESSAGING_SENDER_ID / APP_ID
VITE_API_URL=https://api.example.com/api/v1
VITE_SOCKET_URL=https://api.example.com

# server/.env
MONGODB_URI
FIREBASE_PROJECT_ID
FIREBASE_SERVICE_ACCOUNT_JSON   # JSON string (secret)
CLIENT_ORIGIN=https://app.example.com
PORT
```
- Socket.io `cors` origin locked to `CLIENT_ORIGIN`; cookie/header auth only (no unauthenticated connections).

---

## 10. Testing

### Server (Vitest + Supertest)
- **Auth middleware:** valid/invalid/expired token → pass/401.
- **Boards CRUD:** create/list/get/update/delete + cascade delete of lists/cards.
- **Access control:** member vs non-member → 200 vs 403.
- **Reorder:** midpoint positions, cross-list moves, re-index fallback (unit-test the service).
- Test DB: `mongodb-memory-server` per suite.

### Client (Vitest + React Testing Library)
- **Auth:** login redirects, protected routes block anonymous users.
- **Board dashboard:** renders boards, creates one.
- **Board view:** renders lists/cards; optimistic card move + rollback on API failure (mock TanStack Query + socket).
- **Realtime:** mock socket events drive query invalidation.

### Scripts
- `client`: `npm test` (Vitest), `npm run lint`, `npm run typecheck`
- `server`: `npm test`, `npm run lint`, `npm run typecheck`
- Manual acceptance per Plan.md milestones M1–M5.

---

## 11. Non-Functional Requirements

- **Performance:** board view loads lists+cards in one request; query caching prevents refetch churn.
- **Accessibility:** keyboard-accessible drag-and-drop (dnd-kit defaults), semantic labels, focus management in `CardModal`.
- **Error handling:** central error boundary + toast for mutation failures; empty/error states per view.
- **Security:** server verifies every request; board membership enforced server-side; Socket.io handshake authenticated; env secrets never shipped to the client.

---

## 12. Deferred to Future Phases

| Phase | Design work deferred |
|---|---|
| Card details | `comments`, `labels`, `attachments`, `dueDate`, `activityLog` subcollections + card-detail API |
| Inbox | `inboxItems` collection + quick-add + triage mutations |
| Planner | calendar service + FullCalendar integration + two-way due-date sync |
| Collaboration | reactions, presence/cursors, richer membership/roles |

Open: app name/branding (resolves tokens like `[App Name TBD]` throughout these docs).
