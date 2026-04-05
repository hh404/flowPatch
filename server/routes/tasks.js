import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { readTasks, writeTasks } from '../store.js'

const router = Router()
const ALLOWED_FIELDS = ['title', 'type', 'status', 'priority', 'note', 'related', 'waitingOn', 'followUpAt', 'remindAt', 'remindedAt']
const VALID_PRIORITIES = new Set(['high', 'medium', 'low'])

function normalizeStatus(status) {
  if (status === 'pending') return 'waiting'
  return status ?? 'inbox'
}

function normalizePriority(priority) {
  return VALID_PRIORITIES.has(priority) ? priority : 'medium'
}

function normalizeOptionalText(value) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

router.get('/', async (_req, res) => {
  try {
    const tasks = await readTasks()
    res.json(tasks)
  } catch {
    res.status(500).json({ error: 'internal error' })
  }
})

router.post('/', async (req, res) => {
  try {
    const {
      title,
      type = 'todo',
      status = 'inbox',
      priority = 'medium',
      note = '',
      related = null,
      waitingOn = null,
      followUpAt = null,
      remindAt = null,
      remindedAt = null
    } = req.body

    if (!title?.trim()) return res.status(400).json({ error: 'title required' })

    const now = new Date().toISOString()
    const task = {
      id: uuidv4(),
      title: title.trim(),
      type,
      status: normalizeStatus(status),
      priority: normalizePriority(priority),
      note: note.trim(),
      related: normalizeOptionalText(related),
      waitingOn: normalizeOptionalText(waitingOn),
      followUpAt: followUpAt || null,
      remindAt: remindAt || null,
      remindedAt: remindedAt || null,
      createdAt: now,
      updatedAt: now
    }

    const tasks = await readTasks()
    tasks.push(task)
    await writeTasks(tasks)
    res.status(201).json(task)
  } catch {
    res.status(500).json({ error: 'internal error' })
  }
})

router.patch('/:id', async (req, res) => {
  try {
    const tasks = await readTasks()
    const idx = tasks.findIndex(t => t.id === req.params.id)
    if (idx === -1) return res.status(404).json({ error: 'not found' })

    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => ALLOWED_FIELDS.includes(key))
    )

    if (updates.title !== undefined) {
      updates.title = updates.title.trim()
      if (!updates.title) return res.status(400).json({ error: 'title required' })
    }

    if (updates.note !== undefined) updates.note = updates.note.trim()
    if (updates.priority !== undefined) updates.priority = normalizePriority(updates.priority)
    if (updates.related !== undefined) updates.related = normalizeOptionalText(updates.related)
    if (updates.waitingOn !== undefined) updates.waitingOn = normalizeOptionalText(updates.waitingOn)
    if (updates.followUpAt !== undefined) updates.followUpAt = updates.followUpAt || null
    if (updates.remindAt !== undefined) {
      updates.remindAt = updates.remindAt || null
      if (updates.remindedAt === undefined) updates.remindedAt = null
    }
    if (updates.remindedAt !== undefined) updates.remindedAt = updates.remindedAt || null
    if (updates.status !== undefined) updates.status = normalizeStatus(updates.status)

    tasks[idx] = { ...tasks[idx], ...updates, updatedAt: new Date().toISOString() }
    await writeTasks(tasks)
    res.json(tasks[idx])
  } catch {
    res.status(500).json({ error: 'internal error' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const tasks = await readTasks()
    const idx = tasks.findIndex(t => t.id === req.params.id)
    if (idx === -1) return res.status(404).json({ error: 'not found' })

    tasks.splice(idx, 1)
    await writeTasks(tasks)
    res.status(204).end()
  } catch {
    res.status(500).json({ error: 'internal error' })
  }
})

export default router
