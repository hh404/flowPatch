# FlowPatch MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a personal "Reality Tracker" web app that supplements ADO by managing waiting tasks, ad-hoc work, follow-ups, and other invisible work — stored in a local JSON file.

**Architecture:** Node.js/Express backend exposes a REST API and reads/writes a single `tasks.json` file. React + Vite frontend renders a kanban-style board (Doing / Waiting / Done columns) with a quick-input bar. In dev, Vite proxies API calls to Express; in prod, Express serves the built static files.

**Tech Stack:** Node.js 18+, Express 4, React 18, Vite 5, Tailwind CSS 3, Vitest + @testing-library/react (frontend tests), Supertest + Node test runner (backend tests), concurrently (dev runner)

---

## File Map

```
flowPatch/
├── package.json                          # root: scripts only (dev, build, test)
├── server/
│   ├── package.json                      # backend deps: express, cors, uuid
│   ├── index.js                          # Express entry: mounts routes, serves static in prod
│   ├── routes/
│   │   └── tasks.js                      # GET/POST/PATCH/DELETE /api/tasks
│   ├── store.js                          # read/write tasks.json (pure functions)
│   ├── data/
│   │   └── tasks.json                    # persistent data store (created on first run)
│   └── __tests__/
│       ├── store.test.js                 # unit tests for store.js
│       └── tasks.route.test.js           # supertest integration tests
├── client/
│   ├── package.json                      # frontend deps: react, vite, tailwindcss, testing-library
│   ├── vite.config.js                    # proxy /api → localhost:3001
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                       # root: layout + state wiring
│       ├── api.js                        # fetch wrapper for /api/tasks
│       ├── hooks/
│       │   └── useTasks.js               # React hook: tasks state + CRUD actions
│       ├── utils/
│       │   └── detectType.js             # keyword → task type heuristic
│       └── components/
│           ├── QuickInput.jsx            # top bar: type title, press Enter
│           ├── Column.jsx                # one kanban column
│           └── TaskCard.jsx              # individual card with type badge + actions
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json` (root)
- Create: `server/package.json`
- Create: `client/package.json`
- Create: `server/data/tasks.json`
- Create: `server/index.js` (skeleton)
- Create: `client/index.html`
- Create: `client/src/main.jsx`
- Create: `client/vite.config.js`
- Create: `client/tailwind.config.js`
- Create: `client/postcss.config.js`

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "flowpatch",
  "private": true,
  "scripts": {
    "dev": "concurrently \"npm run dev --prefix server\" \"npm run dev --prefix client\"",
    "build": "npm run build --prefix client",
    "test": "npm test --prefix server && npm test --prefix client"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

- [ ] **Step 2: Create server/package.json**

```json
{
  "name": "flowpatch-server",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "node --watch index.js",
    "test": "node --test __tests__/*.test.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.19.2",
    "uuid": "^9.0.1"
  }
}
```

- [ ] **Step 3: Create client/package.json**

```json
{
  "name": "flowpatch-client",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest run"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.6",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.2",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "jsdom": "^24.1.0",
    "postcss": "^8.4.39",
    "tailwindcss": "^3.4.6",
    "vite": "^5.3.4",
    "vitest": "^2.0.3"
  }
}
```

- [ ] **Step 4: Create server/data/tasks.json (empty store)**

```json
[]
```

- [ ] **Step 5: Create server/index.js skeleton**

```js
import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { join, dirname } from 'path'
import taskRoutes from './routes/tasks.js'

const app = express()
const PORT = process.env.PORT ?? 3001
const __dirname = dirname(fileURLToPath(import.meta.url))

app.use(cors())
app.use(express.json())
app.use('/api/tasks', taskRoutes)

// Serve built frontend in production
const distPath = join(__dirname, '../client/dist')
app.use(express.static(distPath))
app.get('*', (_req, res) => res.sendFile(join(distPath, 'index.html')))

app.listen(PORT, () => console.log(`FlowPatch running on http://localhost:${PORT}`))

export default app
```

- [ ] **Step 6: Create client/index.html**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>FlowPatch</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Create client/src/main.jsx**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 8: Create client/src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 9: Create client/vite.config.js**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001'
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js'],
    globals: true
  }
})
```

- [ ] **Step 10: Create client/src/setupTests.js**

```js
import '@testing-library/jest-dom'
```

- [ ] **Step 11: Create client/tailwind.config.js**

```js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {} },
  plugins: []
}
```

- [ ] **Step 12: Create client/postcss.config.js**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
}
```

- [ ] **Step 13: Install all dependencies**

```bash
npm install
npm install --prefix server
npm install --prefix client
```

Expected: no errors, `node_modules` created in root, server/, client/.

- [ ] **Step 14: Commit**

```bash
git init
git add .
git commit -m "chore: project scaffold — Express + React + Vite + Tailwind"
```

---

## Task 2: Backend — JSON Store

**Files:**
- Create: `server/store.js`
- Create: `server/__tests__/store.test.js`

- [ ] **Step 1: Write failing tests for store**

```js
// server/__tests__/store.test.js
import { strict as assert } from 'assert'
import { mkdtemp, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { readTasks, writeTasks } from '../store.js'

let tmpDir
let dataFile

// Setup: fresh temp dir per test run
tmpDir = await mkdtemp(join(tmpdir(), 'flowpatch-'))
dataFile = join(tmpDir, 'tasks.json')

// Helper to set DATA_FILE env before importing store
// We use the dataFile variable via env override
process.env.DATA_FILE = dataFile

describe('store', () => {
  it('readTasks returns empty array when file missing', async () => {
    const tasks = await readTasks()
    assert.deepStrictEqual(tasks, [])
  })

  it('writeTasks persists and readTasks retrieves', async () => {
    const tasks = [{ id: '1', title: 'Test', type: 'todo', status: 'pending' }]
    await writeTasks(tasks)
    const result = await readTasks()
    assert.deepStrictEqual(result, tasks)
  })

  it('writeTasks overwrites previous data', async () => {
    await writeTasks([{ id: '1', title: 'Old' }])
    await writeTasks([{ id: '2', title: 'New' }])
    const result = await readTasks()
    assert.strictEqual(result.length, 1)
    assert.strictEqual(result[0].title, 'New')
  })
})

await rm(tmpDir, { recursive: true })
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test --prefix server
```

Expected: FAIL — `Cannot find module '../store.js'`

- [ ] **Step 3: Implement store.js**

```js
// server/store.js
import { readFile, writeFile, mkdir } from 'fs/promises'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DEFAULT_DATA_FILE = join(__dirname, 'data', 'tasks.json')

function dataFile() {
  return process.env.DATA_FILE ?? DEFAULT_DATA_FILE
}

export async function readTasks() {
  try {
    const raw = await readFile(dataFile(), 'utf8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export async function writeTasks(tasks) {
  const file = dataFile()
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, JSON.stringify(tasks, null, 2), 'utf8')
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test --prefix server
```

Expected: PASS — all 3 store tests green

- [ ] **Step 5: Commit**

```bash
git add server/store.js server/__tests__/store.test.js
git commit -m "feat: JSON file store with read/write"
```

---

## Task 3: Backend — REST API Routes

**Files:**
- Create: `server/routes/tasks.js`
- Create: `server/__tests__/tasks.route.test.js`

- [ ] **Step 1: Write failing route tests**

```js
// server/__tests__/tasks.route.test.js
import { strict as assert } from 'assert'
import { mkdtemp, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

const tmpDir = await mkdtemp(join(tmpdir(), 'flowpatch-route-'))
process.env.DATA_FILE = join(tmpDir, 'tasks.json')

// Dynamic import AFTER env is set
const { default: app } = await import('../index.js')

async function req(method, path, body) {
  const res = await fetch(`http://localhost:3001${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined
  })
  return { status: res.status, body: await res.json() }
}

describe('GET /api/tasks', () => {
  it('returns empty array initially', async () => {
    const { status, body } = await req('GET', '/api/tasks')
    assert.strictEqual(status, 200)
    assert.deepStrictEqual(body, [])
  })
})

describe('POST /api/tasks', () => {
  it('creates a task with generated id and timestamps', async () => {
    const { status, body } = await req('POST', '/api/tasks', {
      title: 'Fix pipeline',
      type: 'waiting',
      note: 'build takes 1h'
    })
    assert.strictEqual(status, 201)
    assert.ok(body.id)
    assert.strictEqual(body.title, 'Fix pipeline')
    assert.strictEqual(body.type, 'waiting')
    assert.strictEqual(body.status, 'pending')
    assert.ok(body.createdAt)
  })

  it('returns 400 when title is missing', async () => {
    const { status } = await req('POST', '/api/tasks', { type: 'todo' })
    assert.strictEqual(status, 400)
  })
})

describe('PATCH /api/tasks/:id', () => {
  it('updates status of existing task', async () => {
    const { body: created } = await req('POST', '/api/tasks', { title: 'A task', type: 'todo' })
    const { status, body } = await req('PATCH', `/api/tasks/${created.id}`, { status: 'doing' })
    assert.strictEqual(status, 200)
    assert.strictEqual(body.status, 'doing')
  })

  it('returns 404 for unknown id', async () => {
    const { status } = await req('PATCH', '/api/tasks/unknown-id', { status: 'done' })
    assert.strictEqual(status, 404)
  })
})

describe('DELETE /api/tasks/:id', () => {
  it('removes task and returns 204', async () => {
    const { body: created } = await req('POST', '/api/tasks', { title: 'To delete', type: 'todo' })
    const { status } = await req('DELETE', `/api/tasks/${created.id}`)
    assert.strictEqual(status, 204)
    const { body: all } = await req('GET', '/api/tasks')
    assert.ok(!all.find(t => t.id === created.id))
  })

  it('returns 404 for unknown id', async () => {
    const { status } = await req('DELETE', '/api/tasks/unknown-id')
    assert.strictEqual(status, 404)
  })
})

await rm(tmpDir, { recursive: true })
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test --prefix server
```

Expected: FAIL — route handler not implemented

- [ ] **Step 3: Implement routes/tasks.js**

```js
// server/routes/tasks.js
import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { readTasks, writeTasks } from '../store.js'

const router = Router()

router.get('/', async (_req, res) => {
  const tasks = await readTasks()
  res.json(tasks)
})

router.post('/', async (req, res) => {
  const { title, type = 'todo', status = 'pending', note = '', due = null, related = null } = req.body
  if (!title?.trim()) return res.status(400).json({ error: 'title required' })

  const now = new Date().toISOString()
  const task = { id: uuidv4(), title: title.trim(), type, status, note, due, related, createdAt: now, updatedAt: now }

  const tasks = await readTasks()
  tasks.push(task)
  await writeTasks(tasks)
  res.status(201).json(task)
})

router.patch('/:id', async (req, res) => {
  const tasks = await readTasks()
  const idx = tasks.findIndex(t => t.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'not found' })

  const allowed = ['title', 'type', 'status', 'note', 'due', 'related']
  const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)))
  tasks[idx] = { ...tasks[idx], ...updates, updatedAt: new Date().toISOString() }
  await writeTasks(tasks)
  res.json(tasks[idx])
})

router.delete('/:id', async (req, res) => {
  const tasks = await readTasks()
  const idx = tasks.findIndex(t => t.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'not found' })

  tasks.splice(idx, 1)
  await writeTasks(tasks)
  res.status(204).end()
})

export default router
```

- [ ] **Step 4: Run all backend tests**

```bash
npm test --prefix server
```

Expected: PASS — all store + route tests green

- [ ] **Step 5: Commit**

```bash
git add server/routes/tasks.js server/__tests__/tasks.route.test.js
git commit -m "feat: REST API for tasks CRUD"
```

---

## Task 4: Frontend — API Client & useTasks Hook

**Files:**
- Create: `client/src/api.js`
- Create: `client/src/hooks/useTasks.js`
- Create: `client/src/__tests__/useTasks.test.jsx`

- [ ] **Step 1: Write failing hook tests**

```jsx
// client/src/__tests__/useTasks.test.jsx
import { renderHook, act, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useTasks } from '../hooks/useTasks.js'

const mockTasks = [
  { id: '1', title: 'Wait for build', type: 'waiting', status: 'pending', note: '', due: null, related: null, createdAt: '2026-04-05T10:00:00Z', updatedAt: '2026-04-05T10:00:00Z' }
]

beforeEach(() => {
  global.fetch = vi.fn()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useTasks', () => {
  it('fetches tasks on mount', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => mockTasks })
    const { result } = renderHook(() => useTasks())

    await waitFor(() => expect(result.current.tasks).toHaveLength(1))
    expect(result.current.tasks[0].title).toBe('Wait for build')
  })

  it('addTask posts and appends returned task', async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => mockTasks[0] })

    const { result } = renderHook(() => useTasks())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.addTask({ title: 'Wait for build', type: 'waiting' })
    })

    expect(result.current.tasks).toHaveLength(1)
    expect(fetch).toHaveBeenCalledWith('/api/tasks', expect.objectContaining({ method: 'POST' }))
  })

  it('updateTask patches and replaces task in state', async () => {
    const updated = { ...mockTasks[0], status: 'doing' }
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockTasks })
      .mockResolvedValueOnce({ ok: true, json: async () => updated })

    const { result } = renderHook(() => useTasks())
    await waitFor(() => expect(result.current.tasks).toHaveLength(1))

    await act(async () => {
      await result.current.updateTask('1', { status: 'doing' })
    })

    expect(result.current.tasks[0].status).toBe('doing')
  })

  it('deleteTask removes task from state', async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockTasks })
      .mockResolvedValueOnce({ ok: true, status: 204, json: async () => null })

    const { result } = renderHook(() => useTasks())
    await waitFor(() => expect(result.current.tasks).toHaveLength(1))

    await act(async () => {
      await result.current.deleteTask('1')
    })

    expect(result.current.tasks).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test --prefix client
```

Expected: FAIL — `Cannot find module '../hooks/useTasks.js'`

- [ ] **Step 3: Implement api.js**

```js
// client/src/api.js
const BASE = '/api/tasks'

export async function fetchTasks() {
  const res = await fetch(BASE)
  if (!res.ok) throw new Error('fetch failed')
  return res.json()
}

export async function createTask(data) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('create failed')
  return res.json()
}

export async function patchTask(id, data) {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('patch failed')
  return res.json()
}

export async function removeTask(id) {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('delete failed')
}
```

- [ ] **Step 4: Implement hooks/useTasks.js**

```js
// client/src/hooks/useTasks.js
import { useState, useEffect, useCallback } from 'react'
import { fetchTasks, createTask, patchTask, removeTask } from '../api.js'

export function useTasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchTasks()
      .then(setTasks)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  const addTask = useCallback(async (data) => {
    const task = await createTask(data)
    setTasks(prev => [...prev, task])
    return task
  }, [])

  const updateTask = useCallback(async (id, changes) => {
    const task = await patchTask(id, changes)
    setTasks(prev => prev.map(t => t.id === id ? task : t))
    return task
  }, [])

  const deleteTask = useCallback(async (id) => {
    await removeTask(id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }, [])

  return { tasks, loading, error, addTask, updateTask, deleteTask }
}
```

- [ ] **Step 5: Run tests**

```bash
npm test --prefix client
```

Expected: PASS — all 4 useTasks tests green

- [ ] **Step 6: Commit**

```bash
git add client/src/api.js client/src/hooks/useTasks.js client/src/__tests__/useTasks.test.jsx
git commit -m "feat: useTasks hook with fetch/create/patch/delete"
```

---

## Task 5: Keyword-Based Type Detection

**Files:**
- Create: `client/src/utils/detectType.js`
- Create: `client/src/__tests__/detectType.test.js`

- [ ] **Step 1: Write failing tests**

```js
// client/src/__tests__/detectType.test.js
import { describe, it, expect } from 'vitest'
import { detectType } from '../utils/detectType.js'

describe('detectType', () => {
  it('returns waiting for "wait" prefix', () => expect(detectType('wait pipeline')).toBe('waiting'))
  it('returns waiting for "waiting" prefix', () => expect(detectType('waiting for john')).toBe('waiting'))
  it('returns followup for "ask" prefix', () => expect(detectType('ask John about API')).toBe('followup'))
  it('returns followup for "follow" prefix', () => expect(detectType('follow up on PR')).toBe('followup'))
  it('returns followup for "check" prefix', () => expect(detectType('check deploy status')).toBe('followup'))
  it('returns shadow for "shadow" prefix', () => expect(detectType('shadow: help team B')).toBe('shadow'))
  it('returns ad-hoc for "adhoc" prefix', () => expect(detectType('adhoc: fix typo')).toBe('ad-hoc'))
  it('returns todo as default', () => expect(detectType('review PR')).toBe('todo'))
  it('is case-insensitive', () => expect(detectType('WAIT for build')).toBe('waiting'))
})
```

- [ ] **Step 2: Run to verify fail**

```bash
npm test --prefix client
```

Expected: FAIL — `Cannot find module '../utils/detectType.js'`

- [ ] **Step 3: Implement detectType.js**

```js
// client/src/utils/detectType.js
const rules = [
  [/^wait(ing)?\b/i, 'waiting'],
  [/^(ask|follow|check)\b/i, 'followup'],
  [/^shadow\b/i, 'shadow'],
  [/^ad-?hoc\b/i, 'ad-hoc']
]

export function detectType(title) {
  for (const [re, type] of rules) {
    if (re.test(title.trim())) return type
  }
  return 'todo'
}
```

- [ ] **Step 4: Run tests**

```bash
npm test --prefix client
```

Expected: PASS — all 9 detectType tests green

- [ ] **Step 5: Commit**

```bash
git add client/src/utils/detectType.js client/src/__tests__/detectType.test.js
git commit -m "feat: keyword-based task type detection"
```

---

## Task 6: QuickInput Component

**Files:**
- Create: `client/src/components/QuickInput.jsx`
- Create: `client/src/__tests__/QuickInput.test.jsx`

- [ ] **Step 1: Write failing tests**

```jsx
// client/src/__tests__/QuickInput.test.jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect } from 'vitest'
import QuickInput from '../components/QuickInput.jsx'

describe('QuickInput', () => {
  it('renders input placeholder', () => {
    render(<QuickInput onAdd={vi.fn()} />)
    expect(screen.getByPlaceholderText(/add task/i)).toBeInTheDocument()
  })

  it('calls onAdd with title and detected type on Enter', async () => {
    const onAdd = vi.fn()
    render(<QuickInput onAdd={onAdd} />)
    const input = screen.getByPlaceholderText(/add task/i)
    await userEvent.type(input, 'wait pipeline{Enter}')
    expect(onAdd).toHaveBeenCalledWith({ title: 'wait pipeline', type: 'waiting' })
  })

  it('clears input after submit', async () => {
    render(<QuickInput onAdd={vi.fn()} />)
    const input = screen.getByPlaceholderText(/add task/i)
    await userEvent.type(input, 'some task{Enter}')
    expect(input).toHaveValue('')
  })

  it('does not call onAdd for empty input', async () => {
    const onAdd = vi.fn()
    render(<QuickInput onAdd={onAdd} />)
    const input = screen.getByPlaceholderText(/add task/i)
    await userEvent.type(input, '{Enter}')
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('shows type badge preview as user types', async () => {
    render(<QuickInput onAdd={vi.fn()} />)
    const input = screen.getByPlaceholderText(/add task/i)
    await userEvent.type(input, 'wait')
    expect(screen.getByText('waiting')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to verify fail**

```bash
npm test --prefix client
```

Expected: FAIL — component not found

- [ ] **Step 3: Implement QuickInput.jsx**

```jsx
// client/src/components/QuickInput.jsx
import { useState } from 'react'
import { detectType } from '../utils/detectType.js'

const TYPE_COLORS = {
  todo: 'bg-gray-200 text-gray-700',
  waiting: 'bg-yellow-200 text-yellow-800',
  followup: 'bg-blue-200 text-blue-800',
  'ad-hoc': 'bg-purple-200 text-purple-800',
  shadow: 'bg-pink-200 text-pink-800'
}

export default function QuickInput({ onAdd }) {
  const [value, setValue] = useState('')
  const type = detectType(value)

  function handleKeyDown(e) {
    if (e.key !== 'Enter') return
    const title = value.trim()
    if (!title) return
    onAdd({ title, type })
    setValue('')
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-white border-b border-gray-200 shadow-sm">
      <input
        className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        placeholder="Add task — type 'wait', 'ask', 'check'… then Enter"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
      />
      {value && (
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${TYPE_COLORS[type]}`}>
          {type}
        </span>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
npm test --prefix client
```

Expected: PASS — all 5 QuickInput tests green

- [ ] **Step 5: Commit**

```bash
git add client/src/components/QuickInput.jsx client/src/__tests__/QuickInput.test.jsx
git commit -m "feat: QuickInput with type preview and keyword detection"
```

---

## Task 7: TaskCard Component

**Files:**
- Create: `client/src/components/TaskCard.jsx`
- Create: `client/src/__tests__/TaskCard.test.jsx`

- [ ] **Step 1: Write failing tests**

```jsx
// client/src/__tests__/TaskCard.test.jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect } from 'vitest'
import TaskCard from '../components/TaskCard.jsx'

const task = {
  id: '1',
  title: 'Wait for pipeline',
  type: 'waiting',
  status: 'pending',
  note: 'Build takes ~1h',
  due: null,
  related: 'ADO-1234',
  createdAt: '2026-04-05T10:00:00Z',
  updatedAt: '2026-04-05T10:00:00Z'
}

describe('TaskCard', () => {
  it('renders title and type badge', () => {
    render(<TaskCard task={task} onUpdate={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Wait for pipeline')).toBeInTheDocument()
    expect(screen.getByText('waiting')).toBeInTheDocument()
  })

  it('shows note when present', () => {
    render(<TaskCard task={task} onUpdate={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Build takes ~1h')).toBeInTheDocument()
  })

  it('shows related ADO link text', () => {
    render(<TaskCard task={task} onUpdate={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('ADO-1234')).toBeInTheDocument()
  })

  it('calls onUpdate with status=doing when → Doing clicked', async () => {
    const onUpdate = vi.fn()
    render(<TaskCard task={task} onUpdate={onUpdate} onDelete={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /doing/i }))
    expect(onUpdate).toHaveBeenCalledWith('1', { status: 'doing' })
  })

  it('calls onDelete when delete button clicked', async () => {
    const onDelete = vi.fn()
    render(<TaskCard task={task} onUpdate={vi.fn()} onDelete={onDelete} />)
    await userEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(onDelete).toHaveBeenCalledWith('1')
  })
})
```

- [ ] **Step 2: Run to verify fail**

```bash
npm test --prefix client
```

Expected: FAIL — component not found

- [ ] **Step 3: Implement TaskCard.jsx**

```jsx
// client/src/components/TaskCard.jsx

const TYPE_COLORS = {
  todo: 'bg-gray-100 text-gray-600 border-gray-200',
  waiting: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  followup: 'bg-blue-50 text-blue-700 border-blue-200',
  'ad-hoc': 'bg-purple-50 text-purple-700 border-purple-200',
  shadow: 'bg-pink-50 text-pink-700 border-pink-200'
}

const TYPE_BADGE = {
  todo: 'bg-gray-200 text-gray-700',
  waiting: 'bg-yellow-200 text-yellow-800',
  followup: 'bg-blue-200 text-blue-800',
  'ad-hoc': 'bg-purple-200 text-purple-800',
  shadow: 'bg-pink-200 text-pink-800'
}

const STATUS_ACTIONS = {
  pending: [{ label: '→ Doing', status: 'doing' }, { label: '→ Done', status: 'done' }],
  doing: [{ label: '→ Done', status: 'done' }, { label: '← Back', status: 'pending' }],
  done: [{ label: '← Reopen', status: 'pending' }]
}

export default function TaskCard({ task, onUpdate, onDelete }) {
  const colorClass = TYPE_COLORS[task.type] ?? TYPE_COLORS.todo
  const badgeClass = TYPE_BADGE[task.type] ?? TYPE_BADGE.todo

  return (
    <div className={`rounded-lg border p-3 text-sm ${colorClass} space-y-1.5`}>
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium leading-snug">{task.title}</span>
        <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${badgeClass}`}>{task.type}</span>
      </div>

      {task.note && <p className="text-xs opacity-70">{task.note}</p>}
      {task.related && <p className="text-xs font-mono opacity-60">{task.related}</p>}

      <div className="flex items-center justify-between pt-1">
        <div className="flex gap-1">
          {(STATUS_ACTIONS[task.status] ?? []).map(({ label, status }) => (
            <button
              key={status}
              aria-label={label}
              onClick={() => onUpdate(task.id, { status })}
              className="text-xs px-2 py-0.5 rounded bg-white/60 hover:bg-white/90 border border-current/20 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
        <button
          aria-label="delete"
          onClick={() => onDelete(task.id)}
          className="text-xs px-1.5 py-0.5 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
npm test --prefix client
```

Expected: PASS — all 5 TaskCard tests green

- [ ] **Step 5: Commit**

```bash
git add client/src/components/TaskCard.jsx client/src/__tests__/TaskCard.test.jsx
git commit -m "feat: TaskCard with status actions and type badge"
```

---

## Task 8: Column Component

**Files:**
- Create: `client/src/components/Column.jsx`
- Create: `client/src/__tests__/Column.test.jsx`

- [ ] **Step 1: Write failing tests**

```jsx
// client/src/__tests__/Column.test.jsx
import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import Column from '../components/Column.jsx'

const tasks = [
  { id: '1', title: 'Task A', type: 'waiting', status: 'pending', note: '', due: null, related: null, createdAt: '', updatedAt: '' },
  { id: '2', title: 'Task B', type: 'todo', status: 'doing', note: '', due: null, related: null, createdAt: '', updatedAt: '' }
]

describe('Column', () => {
  it('renders column title', () => {
    render(<Column title="Waiting" tasks={[]} onUpdate={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Waiting')).toBeInTheDocument()
  })

  it('renders all task cards', () => {
    render(<Column title="All" tasks={tasks} onUpdate={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Task A')).toBeInTheDocument()
    expect(screen.getByText('Task B')).toBeInTheDocument()
  })

  it('shows empty state message when no tasks', () => {
    render(<Column title="Done" tasks={[]} onUpdate={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText(/nothing here/i)).toBeInTheDocument()
  })

  it('shows task count in header', () => {
    render(<Column title="Doing" tasks={tasks} onUpdate={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('2')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to verify fail**

```bash
npm test --prefix client
```

Expected: FAIL — component not found

- [ ] **Step 3: Implement Column.jsx**

```jsx
// client/src/components/Column.jsx
import TaskCard from './TaskCard.jsx'

const HEADER_COLORS = {
  'Doing': 'text-indigo-700 border-indigo-300',
  'Waiting': 'text-yellow-700 border-yellow-300',
  'Done': 'text-green-700 border-green-300'
}

export default function Column({ title, tasks, onUpdate, onDelete }) {
  const headerColor = HEADER_COLORS[title] ?? 'text-gray-700 border-gray-300'

  return (
    <div className="flex flex-col flex-1 min-w-0">
      <div className={`flex items-center gap-2 pb-2 mb-3 border-b-2 ${headerColor}`}>
        <h2 className="font-semibold text-sm uppercase tracking-wide">{title}</h2>
        <span className="text-xs font-bold bg-current/10 rounded-full px-2 py-0.5">{tasks.length}</span>
      </div>
      <div className="flex flex-col gap-2 overflow-y-auto">
        {tasks.length === 0
          ? <p className="text-xs text-gray-400 italic text-center py-6">Nothing here</p>
          : tasks.map(task => (
              <TaskCard key={task.id} task={task} onUpdate={onUpdate} onDelete={onDelete} />
            ))
        }
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
npm test --prefix client
```

Expected: PASS — all 4 Column tests green

- [ ] **Step 5: Commit**

```bash
git add client/src/components/Column.jsx client/src/__tests__/Column.test.jsx
git commit -m "feat: Column component with empty state and task count"
```

---

## Task 9: App — Wire Everything Together

**Files:**
- Create: `client/src/App.jsx`
- Create: `client/src/__tests__/App.test.jsx`

- [ ] **Step 1: Write failing integration test**

```jsx
// client/src/__tests__/App.test.jsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import App from '../App.jsx'

const mockTasks = [
  { id: '1', title: 'Wait for pipeline', type: 'waiting', status: 'pending', note: '', due: null, related: null, createdAt: '', updatedAt: '' },
  { id: '2', title: 'Fix the bug', type: 'todo', status: 'doing', note: '', due: null, related: null, createdAt: '', updatedAt: '' },
  { id: '3', title: 'Old PR', type: 'todo', status: 'done', note: '', due: null, related: null, createdAt: '', updatedAt: '' }
]

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => mockTasks })
})

afterEach(() => vi.restoreAllMocks())

describe('App', () => {
  it('renders three kanban columns', async () => {
    render(<App />)
    await waitFor(() => expect(screen.getByText('Doing')).toBeInTheDocument())
    expect(screen.getByText('Waiting')).toBeInTheDocument()
    expect(screen.getByText('Done')).toBeInTheDocument()
  })

  it('renders tasks in correct columns', async () => {
    render(<App />)
    await waitFor(() => expect(screen.getByText('Wait for pipeline')).toBeInTheDocument())
    expect(screen.getByText('Fix the bug')).toBeInTheDocument()
    expect(screen.getByText('Old PR')).toBeInTheDocument()
  })

  it('adds a task via QuickInput', async () => {
    const newTask = { id: '4', title: 'ask John', type: 'followup', status: 'pending', note: '', due: null, related: null, createdAt: '', updatedAt: '' }
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockTasks })
      .mockResolvedValueOnce({ ok: true, json: async () => newTask })

    render(<App />)
    await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument())

    const input = screen.getByPlaceholderText(/add task/i)
    await userEvent.type(input, 'ask John{Enter}')

    await waitFor(() => expect(screen.getByText('ask John')).toBeInTheDocument())
  })
})
```

- [ ] **Step 2: Run to verify fail**

```bash
npm test --prefix client
```

Expected: FAIL — App not implemented

- [ ] **Step 3: Implement App.jsx**

```jsx
// client/src/App.jsx
import { useTasks } from './hooks/useTasks.js'
import QuickInput from './components/QuickInput.jsx'
import Column from './components/Column.jsx'

const COLUMNS = [
  { title: 'Doing', statuses: ['doing'] },
  { title: 'Waiting', statuses: ['pending'] },
  { title: 'Done', statuses: ['done'] }
]

export default function App() {
  const { tasks, loading, error, addTask, updateTask, deleteTask } = useTasks()

  if (loading) return <div className="flex h-screen items-center justify-center text-gray-400">Loading…</div>
  if (error) return <div className="flex h-screen items-center justify-center text-red-400">Error loading tasks</div>

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans">
      <header className="flex items-center gap-3 px-4 py-3 bg-indigo-700 text-white shadow">
        <span className="text-lg font-bold tracking-tight">FlowPatch</span>
        <span className="text-indigo-300 text-sm">Reality Tracker</span>
      </header>

      <QuickInput onAdd={addTask} />

      <main className="flex flex-1 gap-4 p-4 overflow-hidden">
        {COLUMNS.map(({ title, statuses }) => (
          <Column
            key={title}
            title={title}
            tasks={tasks.filter(t => statuses.includes(t.status))}
            onUpdate={updateTask}
            onDelete={deleteTask}
          />
        ))}
      </main>
    </div>
  )
}
```

- [ ] **Step 4: Run all tests**

```bash
npm test --prefix client
```

Expected: PASS — all client tests green

- [ ] **Step 5: Run backend tests too**

```bash
npm test --prefix server
```

Expected: PASS — all server tests green

- [ ] **Step 6: Commit**

```bash
git add client/src/App.jsx client/src/__tests__/App.test.jsx
git commit -m "feat: kanban App layout — wires columns, QuickInput, useTasks"
```

---

## Task 10: Smoke Test & Start Scripts

**Files:**
- Modify: `package.json` (verify scripts)
- Create: `README.md`

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Expected output:
```
[0] FlowPatch running on http://localhost:3001
[1] VITE v5.x  ready in Xms
[1]  ➜  Local: http://localhost:5173/
```

- [ ] **Step 2: Open browser and verify**

Open `http://localhost:5173`

Check:
- [ ] Header shows "FlowPatch — Reality Tracker"
- [ ] Three columns visible: Doing / Waiting / Done
- [ ] Type `wait pipeline` in input → badge shows "waiting"
- [ ] Press Enter → card appears in Waiting column
- [ ] Type `ask john about API` → badge shows "followup"
- [ ] Press Enter → card appears in Waiting column (status: pending)
- [ ] Click `→ Doing` on a card → it moves to Doing column
- [ ] Click `→ Done` → it moves to Done column
- [ ] Refresh page → tasks persist (loaded from tasks.json)
- [ ] Click ✕ → card is deleted

- [ ] **Step 3: Create README.md**

```markdown
# FlowPatch

Personal execution layer — supplements ADO with waiting tasks, follow-ups, ad-hoc and shadow work.

## Setup

```bash
npm install
npm install --prefix server
npm install --prefix client
```

## Run (dev)

```bash
npm run dev
```

Open http://localhost:5173

## Run (prod)

```bash
npm run build
node server/index.js
```

Open http://localhost:3001

## Quick Input Keywords

| Prefix | Type |
|--------|------|
| `wait …` | waiting |
| `waiting …` | waiting |
| `ask …` | followup |
| `follow …` | followup |
| `check …` | followup |
| `shadow …` | shadow |
| `adhoc …` | ad-hoc |
| anything else | todo |

## Data

Stored in `server/data/tasks.json`.
```

- [ ] **Step 4: Final commit**

```bash
git add README.md
git commit -m "docs: add README with setup and keyword reference"
```

---

## Self-Review

### Spec Coverage

| Requirement | Covered by |
|-------------|-----------|
| Web app, no database | Task 2 (JSON store) |
| 5 task types: todo/waiting/followup/ad-hoc/shadow | Task 5 (detectType), Task 3 (routes accept type) |
| 3 columns: Doing/Waiting/Done | Task 8 (Column), Task 9 (App) |
| Quick input (type + Enter) | Task 6 (QuickInput) |
| Keyword auto-detection | Task 5 (detectType) |
| Persist across refresh | Task 2 (JSON store) + Task 3 (API) |
| Move tasks between columns | Task 7 (TaskCard status actions) |
| Notes + ADO related field | Task 3 (schema), Task 7 (TaskCard renders them) |
| Local only (no auth) | CORS + localhost binding in Task 1 |

### Placeholder Scan — None found. All steps contain complete code.

### Type Consistency Check

- `onUpdate(id, changes)` — consistent across TaskCard, Column, App, useTasks ✓
- `onDelete(id)` — consistent across TaskCard, Column, App, useTasks ✓
- `task.status` values: `pending | doing | done` — consistent in STATUS_ACTIONS, COLUMNS filter, and API ✓
- `task.type` values: `todo | waiting | followup | ad-hoc | shadow` — consistent in detectType, TYPE_COLORS, API default ✓
