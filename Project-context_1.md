# Project Context: [App Name TBD] — A Trello-Inspired Task & Project Management Tool

## 1. Overview

This project is a web-based task and project management platform inspired by Trello. It gives individuals and teams a visual, flexible way to capture, organize, and schedule work — from a quick to-do jotted down on the go, to a fully structured project board, to a time-blocked calendar plan.

The app is built around three core pillars: **Inbox**, **Boards**, and **Planner** — each solving a different stage of how work moves from "idea" to "done."

---

## 2. Main Objective

To give users **one visual source of truth** for their work, reducing scattered notes, missed tasks, and unclear ownership — while staying simple enough for solo users and flexible enough for full teams.

---

## 3. Core Features

### 3.1 Inbox
**Purpose:** Capture to-dos from anywhere, anytime — a fast, frictionless entry point before a task gets organized.

- Quick-add bar (always accessible, minimal fields required)
- Tasks land unsorted in the Inbox until triaged
- From Inbox, a task can be:
  - Moved into a Board (assigned to a list)
  - Scheduled directly into the Planner
  - Deleted / archived
- Supports quick capture via text, and later, voice or forwarded email/message (future phase)

### 3.2 Boards
**Purpose:** The core "to-do to done" workspace — Kanban-style visual task management.

- **Boards** = projects or workflows (e.g., "Client Work," "Website Redesign")
- **Lists** = customizable stages/columns (e.g., To Do → In Progress → Review → Done)
- **Cards** = individual tasks that move across lists via drag-and-drop
- Multiple boards per user/team, switchable via a board dashboard/home view
- Boards can be personal (private) or shared (team-visible)

### 3.3 Planner
**Purpose:** Turn prioritized tasks into a scheduled plan — bridges "what needs doing" with "when it gets done."

- Calendar view (day/week/month)
- Drag, drop, and snap tasks/cards from Boards or Inbox directly onto calendar time slots
- Visual time-blocking of top-priority tasks
- Two-way sync: moving a card in the Planner reflects its due date on the original Board card, and vice versa

---

## 4. Card Capabilities

Each card is the atomic unit of work and supports rich detail:

| Feature | Description |
|---|---|
| **Files** | Attach documents relevant to the task |
| **Image** | Attach images directly to a card |
| **Add comment** | Threaded discussion per card for context/collaboration |
| **Add user** | Assign one or more members to a card |
| **Add cover image** | Set a visual cover/banner for quick card recognition on the board |
| **Add location** | Tag a physical or virtual location relevant to the task |
| **Add label** | Color-coded tags for category, priority, or status |
| **Add due date** | Set deadlines with reminders; drives Planner scheduling |
| **React** | Emoji/quick reactions on cards or comments for lightweight feedback |
| **Card activity** | Full audit log/history of all changes and actions taken on the card |

---

## 5. Target Users / Solutions For

The platform is designed to flexibly serve multiple team types and use cases:

- **Marketing** — campaign timelines, content calendars, asset approvals
- **Product Management** — roadmaps, feature backlogs, sprint tracking
- **Engineering Teams** — sprint boards, bug tracking, dev workflow stages
- **Design Teams** — creative review cycles, feedback loops, asset organization
- **Startups** — lightweight, all-in-one work management without heavy tooling overhead
- **Remote Teams** — async-friendly visibility so distributed members stay aligned without constant meetings

---

## 6. Design Principles

- **Visual first** — status and priority should be understandable at a glance
- **Low friction capture** — Inbox exists specifically to remove barriers to logging a task
- **Flexible structure** — Lists, labels, and boards should be fully customizable per user/team workflow, not prescriptive
- **Seamless movement between views** — Inbox → Board → Planner should feel like one continuous flow, not three disconnected tools

---

## 7. Suggested Tech Stack (Draft)

*(To be finalized — based on your existing stack experience)*

- **Frontend:** React + Tailwind CSS
- **Backend/Data:** Firebase (Firestore for real-time board/card sync, Firebase Auth for users)
- **Drag-and-drop:** `@hello-pangea/dnd` or `dnd-kit`
- **Calendar/Planner UI:** `FullCalendar` or custom Tailwind-based calendar grid
- **File/Image storage:** Firebase Storage

---

## 8. Open Questions / Next Steps

- [ ] Finalize app name and branding
- [ ] Decide MVP scope: is Planner phase 1, or phase 2 after Boards + Inbox are solid?
- [ ] Define data model (Users, Boards, Lists, Cards, Comments, Labels)
- [ ] Decide on real-time collaboration requirements (live cursors? live card moves?)
- [ ] Wireframe core screens: Inbox view, Board view, Planner/Calendar view, Card detail modal
- [ ] Determine auth approach (email/password, Google OAuth, or both)

---

## 9. Phase Roadmap (Draft)

| Phase | Focus |
|---|---|
| **Phase 1** | Auth + Boards + Lists + Cards (core Kanban functionality) |
| **Phase 2** | Card details (attachments, comments, labels, due dates, activity log) |
| **Phase 3** | Inbox (quick capture + triage flow) |
| **Phase 4** | Planner (calendar view + drag-to-schedule) |
| **Phase 5** | Collaboration features (reactions, user assignment, real-time sync) |
