# FlowPatch

Personal execution layer for invisible work around ADO. Local JSON storage, no database.

## Setup

```bash
npm install
npm install --prefix server
npm install --prefix client
```

## Dev

```bash
npm run dev
```

- Frontend: http://localhost:47292
- Backend API: http://localhost:47291

## Production

```bash
npm run build
node server/index.js
```

Open http://localhost:47291

## Quick Input

Type in the capture bar and press **Enter** to create immediately. Use **Details** only when you want to add context before saving.

| Prefix | Type |
|--------|------|
| `wait …` / `waiting …` | waiting |
| `ask …` / `follow …` / `check …` | followup |
| `shadow …` | shadow |
| `adhoc …` / `ad-hoc …` | ad-hoc |
| anything else | todo |

New quick-capture items default to **Inbox**.

## MVP Stories

The app now also tracks top-level MVP stories separately from day-to-day tasks.

- Each story has `mvp`, `title`, `link`, and `status`
- Stories live on a separate `Story List` page
- Stories are grouped by MVP, and the page shows one MVP at a time through an MVP switcher
- Story links open directly to ADO or any other tracker URL
- Story statuses use a fixed workflow: `New`, `Ready for Develop`, `In Progress`, `Blocked`, `In Review`, `Ready for QA`, `In QA`, `Done`, `Merged`, `Released`

Use the header tabs to switch between `Task Board` and `Story List`.

## Workflow

| Stage | Meaning |
|------|---------|
| **Inbox** | Newly captured work that still needs sorting |
| **Doing** | Work you are actively pushing |
| **Waiting** | Blocked or delegated work |
| **Done** | Finished work |

Cards can be dragged between columns to change status.

Within each column, higher-priority work is sorted first.

## Priorities

| Priority | Meaning |
|------|---------|
| **high** | Needs attention first |
| **medium** | Normal default |
| **low** | Useful, but not urgent |

## Task Types

| Type | Use for |
|------|---------|
| **todo** | Normal work items |
| **waiting** | Blocked on something external (build, approval, reply) |
| **followup** | Things you need to chase or check |
| **ad-hoc** | Small unplanned tasks |
| **shadow** | Work outside ADO (helping other teams, Excel sheets, etc.) |

## Editing

Tasks can be edited after creation. The editor supports:

- title
- type
- status
- priority
- notes
- ADO ticket
- `waitingOn`
- `followUpAt`
- `remindAt`

## Reminders

- Waiting/follow-up work can have a reminder timestamp.
- Cards also support a quick `+1h` reminder action for cases like "check pipeline in an hour".
- When the page is open, FlowPatch will raise an in-app reminder and optionally a browser notification.
- Browser notifications require permission and only work while the app is open. There is no background push/service worker yet.

## Data

Stored in `server/data/tasks.json`. Back up this file to preserve your tasks.

Stories are stored in `server/data/stories.json`.
