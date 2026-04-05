import { strict as assert } from 'assert'
import { mkdtemp, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

const tmpDir = await mkdtemp(join(tmpdir(), 'flowpatch-route-'))
process.env.DATA_FILE = join(tmpDir, 'tasks.json')
process.env.PORT = '3099'

const { default: app } = await import('../index.js')

const BASE = 'http://localhost:3099'

async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined
  })
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch {}
  return { status: res.status, body: json }
}

// GET /api/tasks — empty initially
{
  const { status, body } = await api('GET', '/api/tasks')
  assert.strictEqual(status, 200, 'GET returns 200')
  assert.deepStrictEqual(body, [], 'GET returns empty array initially')
}

// POST /api/tasks — creates with defaults
let createdId
{
  const { status, body } = await api('POST', '/api/tasks', {
    title: 'Fix pipeline',
    type: 'waiting',
    note: 'build takes 1h'
  })
  assert.strictEqual(status, 201, 'POST returns 201')
  assert.ok(body.id, 'POST returns id')
  assert.strictEqual(body.title, 'Fix pipeline', 'POST title')
  assert.strictEqual(body.type, 'waiting', 'POST type')
  assert.strictEqual(body.status, 'pending', 'POST default status')
  assert.ok(body.createdAt, 'POST createdAt')
  createdId = body.id
}

// POST /api/tasks — missing title returns 400
{
  const { status } = await api('POST', '/api/tasks', { type: 'todo' })
  assert.strictEqual(status, 400, 'POST without title returns 400')
}

// PATCH /api/tasks/:id — updates status
{
  const { status, body } = await api('PATCH', `/api/tasks/${createdId}`, { status: 'doing' })
  assert.strictEqual(status, 200, 'PATCH returns 200')
  assert.strictEqual(body.status, 'doing', 'PATCH updates status')
}

// PATCH /api/tasks/:id — unknown id returns 404
{
  const { status } = await api('PATCH', '/api/tasks/unknown-id', { status: 'done' })
  assert.strictEqual(status, 404, 'PATCH unknown id returns 404')
}

// DELETE /api/tasks/:id — removes task
{
  const { status } = await api('DELETE', `/api/tasks/${createdId}`)
  assert.strictEqual(status, 204, 'DELETE returns 204')
  const { body: all } = await api('GET', '/api/tasks')
  assert.ok(!all.find(t => t.id === createdId), 'DELETE removes from list')
}

// DELETE /api/tasks/:id — unknown id returns 404
{
  const { status } = await api('DELETE', '/api/tasks/unknown-id')
  assert.strictEqual(status, 404, 'DELETE unknown id returns 404')
}

await rm(tmpDir, { recursive: true })
console.log('All route tests passed')
process.exit(0)
