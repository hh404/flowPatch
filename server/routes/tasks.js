import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { readTasks, writeTasks } from '../store.js'

const router = Router()

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
    const { title, type = 'todo', status = 'pending', note = '', due = null, related = null } = req.body
    if (!title?.trim()) return res.status(400).json({ error: 'title required' })

    const now = new Date().toISOString()
    const task = {
      id: uuidv4(),
      title: title.trim(),
      type,
      status,
      note,
      due,
      related,
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

    const allowed = ['title', 'type', 'status', 'note', 'due', 'related']
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    )
    if (updates.title !== undefined) updates.title = updates.title.trim()
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
