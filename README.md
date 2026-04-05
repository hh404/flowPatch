# FlowPatch

Personal execution layer — supplements ADO with waiting tasks, follow-ups, ad-hoc and shadow work. JSON file storage, no database needed.

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

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Production

```bash
npm run build
node server/index.js
```

Open http://localhost:3001

## Quick Input

Type in the input bar and press **Enter**. Keywords auto-detect the task type:

| Prefix | Type |
|--------|------|
| `wait …` / `waiting …` | waiting |
| `ask …` / `follow …` / `check …` | followup |
| `shadow …` | shadow |
| `adhoc …` / `ad-hoc …` | ad-hoc |
| anything else | todo |

## Task Types

| Type | Use for |
|------|---------|
| **todo** | Normal work items |
| **waiting** | Blocked on something external (build, approval, reply) |
| **followup** | Things you need to chase or check |
| **ad-hoc** | Small unplanned tasks |
| **shadow** | Work outside ADO (helping other teams, Excel sheets, etc.) |

## Columns

| Column | Shows tasks with status |
|--------|------------------------|
| **Doing** | `doing` |
| **Waiting** | `pending` |
| **Done** | `done` |

## Data

Stored in `server/data/tasks.json`. Back up this file to preserve your tasks.
