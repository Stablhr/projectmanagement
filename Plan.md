# Project Plan: [App Name TBD] — A Trello-Inspired Task & Project Management Tool

## 1. Project Summary

A web-based task and project management platform inspired by Trello, giving individuals and teams a visual, flexible way to capture, organize, and schedule work.

The app is built around three core pillars — **Inbox**, **Boards**, and **Planner** — each solving a different stage of how work moves from "idea" to "done."

**Main objective:** Give users **one visual source of truth** for their work, reducing scattered notes, missed tasks, and unclear ownership — simple enough for solo users, flexible enough for full teams.

---

## 2. MVP Scope (Decided)

The MVP covers the core Kanban workspace only: **Auth + Boards + Lists + Cards**.

### In Scope
- User authentication (email/password + Google OAuth)
- Board dashboard/home view with board creation and switching
- Boards = projects or workflows, personal (private) or shared (team-visible)
- Lists = customizable stages/columns within a board (e.g., To Do → In Progress → Review → Done)
- Cards = individual tasks that move across lists via drag-and-drop
- Live sync of board/card changes between open clients

### Out of Scope (Deferred)
- Inbox (quick capture + triage)
- Planner (calendar view + drag-to-schedule)
- Card details (files, images, comments, users, cover, location, labels, due dates, reactions, activity log)
- Collaboration features beyond basic sharing (reactions, real-time cursors)

---

## 3. Tech Stack (Decided)

| Layer | Choice | Notes |
|---|---|---|
| **Frontend** | React + Vite, Tailwind CSS | Fast dev loop, familiar component model |
| **Drag-and-drop** | `dnd-kit` | Battle-tested, accessible, works well with lists |
| **Backend** | Node.js + Express (REST API) | Simple, widely known, easy to evolve |
| **Database** | MongoDB (MongoDB Atlas) via Mongoose | Flexible schema fits board/list/card data |
| **Auth** | Firebase Auth for login | Email/password + Google OAuth; `firebase-admin` verifies JWTs server-side |
| **Realtime** | Polling + Socket.io | Board load polling + live card/list moves between open clients |
| **Future** | FullCalendar | Reserved for the Planner phase |

---

## 4. Data Model

| Collection | Fields | Notes |
|---|---|---|
| `users` | `firebaseUid`, `email`, `displayName`, `createdAt` | Synced from Firebase Auth at signup/login |
| `boards` | `ownerId`, `title`, `members[]`, `createdAt`, `updatedAt` | `members` holds user IDs allowed to view/edit shared boards |
| `lists` | `boardId`, `title`, `position`, `createdAt` | `position` drives column ordering |
| `cards` | `listId`, `title`, `description`, `position`, `createdAt`, `updatedAt` | `position` drives order within a list |

### Relationships
- `users` → many `boards` (owner or member)
- `boards` → many `lists` → many `cards`
- Deleting a board cascades to its lists and cards

---

## 5. Architecture

- **Monorepo layout:**
  - `client/` — React + Vite frontend
  - `server/` — Express REST API, Mongoose models, Socket.io
  - Shared config/docs at repo root
- **Server responsibilities:**
  - REST endpoints for boards, lists, cards (CRUD + reorder)
  - `firebase-admin` middleware to verify Firebase JWTs on every request
  - Socket.io events (`list:move`, `card:move`, `card:update`, ...) to push changes to connected clients
- **Client responsibilities:**
  - Auth via Firebase SDK; board/home views; board view with drag-and-drop
  - Optimistic local reorder on drag, then persist via API and reconcile with Socket.io events

---

## 6. Milestones

| Milestone | Focus | Deliverables | Acceptance Criteria |
|---|---|---|---|
| **M0** | Scaffold & setup | Monorepo skeleton (`client/`, `server/`), MongoDB connection, Firebase project config, env handling | App boots locally; server connects to MongoDB; Firebase auth client initialized |
| **M1** | Auth | Firebase Auth (email/password + Google OAuth), server-side JWT verification middleware, `users` synced to MongoDB | Users can sign up / log in / log out; protected routes reject unauthenticated requests |
| **M2** | Boards | Board CRUD API + board dashboard/home view; create, rename, delete, switch boards | User can create and switch between boards; boards persist across sessions |
| **M3** | Lists | List CRUD + ordering within a board | User can add, rename, reorder, and delete lists |
| **M4** | Cards | Card CRUD + drag-and-drop across lists; optimistic reorder with API persistence | User can create/edit/delete cards and drag them across lists; order persists after refresh |
| **M5** | Realtime & polish | Polling + Socket.io live sync; empty/loading/error states; basic tests | Two open clients see each other's board changes live; clean UX for empty and error states |

---

## 7. Future Phases (Deferred)

| Phase | Focus |
|---|---|
| **Phase 2** | Card details — files, images, comments, user assignment, cover, location, labels, due dates, reactions, activity log |
| **Phase 3** | Inbox — quick capture bar + triage flow (to Board, to Planner, archive/delete) |
| **Phase 4** | Planner — calendar view (day/week/month), drag-to-schedule, two-way due-date sync with board cards |
| **Phase 5** | Collaboration — emoji reactions, real-time cursor presence, richer shared-board workflows |

---

## 8. Risks & Open Items

- **Auth security:** Firebase JWTs must be verified server-side on every request; protect all board/list/card routes and enforce board membership on shared boards
- **Ordering:** `position` fields need consistent handling across reorder operations; consider decimal gaps or re-indexing to avoid race conditions
- **Realtime conflicts:** Concurrent edits from multiple clients need a defined conflict strategy (last-write-wins for MVP, with a documented upgrade path)
- **Firestore security rules:** N/A with MongoDB — replace with Express middleware + board membership checks
- **Open items:** Finalize app name and branding; define data model for future Inbox/Planner features when those phases start
