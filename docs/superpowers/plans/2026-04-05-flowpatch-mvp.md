# FlowPatch MVP Plan

> Rewrite of the original MVP plan. The first version optimized for stack setup and CRUD completion; this version optimizes for a tool that is actually useful day-to-day.

## Product Goal

Build a personal execution layer for invisible work around ADO:

- capture work the moment it appears
- distinguish active work from blocked work
- surface what needs attention today
- let the user add detail after capture instead of during capture

## Core User Jobs

1. I need to dump a task in under 5 seconds before context-switching.
2. I need to see what I am waiting on without mixing it with active work.
3. I need follow-ups to come back to me at the right time.
4. I need to attach context later without recreating the task.

## MVP Principles

- Capture first. Enter should create immediately.
- Edit later. Notes, ticket links, and metadata are secondary.
- Attention beats taxonomy. `waiting` and `followup` must change behavior, not only color.
- Derived views beat manual grooming. The app should show what needs action now.

## MVP Scope

### In

- Local-only app with JSON persistence
- Fast capture input
- Editable task detail sheet/modal
- Separate MVP story tracker
- Drag cards between status columns
- Status buckets: `inbox`, `doing`, `waiting`, `done`
- Priorities: `high`, `medium`, `low`
- Types: `todo`, `waiting`, `followup`, `ad-hoc`, `shadow`
- Attention section for items that need review today
- Optional ADO reference and notes
- Local reminder timestamps with in-app/browser notifications while the app is open

### Out

- Auth
- Multi-user sync
- Rich drag-and-drop board
- Notifications
- Full calendar/planner

## Working Model

### Status

- `inbox`: newly captured, not yet sorted
- `doing`: active work
- `waiting`: blocked or delegated, requires follow-up logic
- `done`: archived completion

### Type

- `todo`: normal execution item
- `waiting`: blocked on another person/system
- `followup`: something I need to chase/check later
- `ad-hoc`: unplanned small work
- `shadow`: work not represented in ADO

### Priority

- `high`: should float to the top of its column
- `medium`: default priority
- `low`: worth keeping visible, but not urgent

### Story

Each MVP story should have at least:

- `mvp`
- `title`
- `link`
- `status`

Story status should use a fixed delivery flow:

- `New`
- `Next Release`
- `Ready for Develop`
- `In Progress`
- `Blocked`
- `In Review`
- `Ready for QA`
- `In QA`
- `Done`
- `Merged`
- `Released`

### Attention Rules

An item appears in the attention list when any of the following are true:

- status is `inbox`
- type is `waiting` or `followup` and `followUpAt` is empty
- `followUpAt` is today or overdue

## Data Model

Each task should support:

```json
{
  "id": "uuid",
  "title": "Follow up with infra on flaky deploy",
  "type": "followup",
  "status": "inbox",
  "priority": "high",
  "note": "",
  "related": "ADO-1234",
  "waitingOn": "Infra team",
  "followUpAt": "2026-04-07",
  "remindAt": "2026-04-05T11:00:00.000Z",
  "remindedAt": null,
  "createdAt": "2026-04-05T10:00:00.000Z",
  "updatedAt": "2026-04-05T10:00:00.000Z"
}
```

### Field Rules

- `title` is required
- quick capture defaults to `status = inbox`
- quick capture defaults to `priority = medium`
- `waitingOn` is only meaningful for `waiting`
- `followUpAt` is meaningful for `waiting` and `followup`

### Story Rules

- story `title`, `link`, and `status` are required
- story `mvp` is required and used to group stories into separate MVP streams
- stories are a separate list from tasks
- stories represent top-level MVP scope, not daily execution steps
- story status should come from the fixed workflow list instead of free text

## UX Plan

### 1. Fast Capture Bar

- single-line input at top
- inferred type badge while typing
- `Enter` creates immediately
- secondary `Details` action opens full editor before create

### 2. Task Detail Editor

- reused for create and edit
- fields: title, type, status, priority, note, related, waitingOn, followUpAt, remindAt
- edit existing cards without delete/recreate

### 3. Main Layout

- top summary row:
  - attention count
  - doing count
  - waiting count
- page one: `Task Board` with quick capture, reminders, and columns for `Inbox`, `Doing`, `Waiting`, `Done`
- page two: `Story List` with an MVP switcher so only one MVP group is shown at a time
- header tabs switch between board and story views

### 4. Card Behavior

- primary text is title
- compact metadata row for ADO, follow-up date, waiting-on, reminder
- priority badge should be visible without opening the editor
- quick actions:
  - move to doing
  - move to waiting
  - complete
  - drag between columns
  - set quick reminder
  - edit
  - delete

## Implementation Slices

## Task 1: Stabilize The App Shell

- [ ] Stop coupling tests to a real TCP port
- [ ] Make `server/index.js` import-safe
- [ ] Keep root `npm test` green in local/dev environments
- [ ] Remove doc/code drift around ports and create flow

## Task 2: Restore Capture-First Flow

- [ ] `QuickInput` submits directly on `Enter`
- [ ] Quick capture creates `status = inbox`
- [ ] Add explicit `Details` path for slower capture
- [ ] Keep keyword type inference, but do not force a modal

## Task 3: Make Tasks Editable

- [ ] Reuse the modal/editor for both create and edit
- [ ] Allow editing note, ADO link, type, status, waiting metadata
- [ ] Add an edit affordance on each card

## Task 4: Add Attention Semantics

- [ ] Extend backend schema with `waitingOn` and `followUpAt`
- [ ] Render a `Needs Attention` section
- [ ] Show overdue/today follow-ups first
- [ ] Give `waiting` and `followup` real behavior beyond styling

## Task 4.5: Add Story Tracker

- [ ] Persist MVP stories in a separate JSON file
- [ ] Render a dedicated story panel with `title`, `link`, and `status`
- [ ] Support create/edit/delete for stories
- [ ] Keep stories distinct from execution tasks

## Task 5: Tighten The UI

- [ ] Replace generic kanban-demo feel with a denser productivity layout
- [ ] Improve empty states so each column explains what belongs there
- [ ] Show useful metadata on cards without making them noisy

## Task 6: Smoke Test And Readme

- [ ] Confirm capture, edit, move, persist, and reopen flows
- [ ] Update README so it matches actual ports and actual behavior
- [ ] Document the attention rules and quick-capture shortcuts

## Acceptance Criteria

- Typing `wait on QA` and pressing `Enter` creates a task immediately.
- A newly captured task lands in `Inbox`, not `Waiting`.
- I can open the task later and add notes, ADO link, and follow-up date.
- Waiting/follow-up work appears in a dedicated attention section when it needs review.
- I never need to delete and recreate a task just to add metadata.
- `npm test --prefix client` passes.
- Backend tests do not require a hard-coded localhost TCP port.

## Immediate Cleanup Order

This is the order to execute right now:

1. Rewrite the plan and README so the product direction is honest.
2. Fix fast capture and edit-after-create in the frontend.
3. Repair broken tests caused by the current contract drift.
4. Then add attention semantics instead of polishing the old 3-column demo.
