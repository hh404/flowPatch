import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { readStories, writeStories } from '../storyStore.js'

const router = Router()
const DEFAULT_MVP_NAME = 'Current MVP'
const ALLOWED_FIELDS = ['mvp', 'title', 'link', 'status']

function normalizeRequiredText(value) {
  return value?.trim() ?? ''
}

function normalizeStory(story) {
  return {
    ...story,
    mvp: normalizeRequiredText(story.mvp) || DEFAULT_MVP_NAME
  }
}

router.get('/', async (_req, res) => {
  try {
    const stories = await readStories()
    res.json(stories.map(normalizeStory))
  } catch {
    res.status(500).json({ error: 'internal error' })
  }
})

router.post('/', async (req, res) => {
  try {
    const mvp = normalizeRequiredText(req.body.mvp) || DEFAULT_MVP_NAME
    const title = normalizeRequiredText(req.body.title)
    const link = normalizeRequiredText(req.body.link)
    const status = normalizeRequiredText(req.body.status)

    if (!title || !link || !status) {
      return res.status(400).json({ error: 'title, link, and status are required' })
    }

    const now = new Date().toISOString()
    const story = {
      mvp,
      id: uuidv4(),
      title,
      link,
      status,
      createdAt: now,
      updatedAt: now
    }

    const stories = await readStories()
    stories.push(story)
    await writeStories(stories)
    res.status(201).json(story)
  } catch {
    res.status(500).json({ error: 'internal error' })
  }
})

router.patch('/:id', async (req, res) => {
  try {
    const stories = await readStories()
    const idx = stories.findIndex(story => story.id === req.params.id)
    if (idx === -1) return res.status(404).json({ error: 'not found' })

    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => ALLOWED_FIELDS.includes(key))
    )

    if (updates.mvp !== undefined) {
      updates.mvp = normalizeRequiredText(updates.mvp)
      if (!updates.mvp) return res.status(400).json({ error: 'mvp required' })
    }

    if (updates.title !== undefined) {
      updates.title = normalizeRequiredText(updates.title)
      if (!updates.title) return res.status(400).json({ error: 'title required' })
    }

    if (updates.link !== undefined) {
      updates.link = normalizeRequiredText(updates.link)
      if (!updates.link) return res.status(400).json({ error: 'link required' })
    }

    if (updates.status !== undefined) {
      updates.status = normalizeRequiredText(updates.status)
      if (!updates.status) return res.status(400).json({ error: 'status required' })
    }

    stories[idx] = { ...normalizeStory(stories[idx]), ...updates, updatedAt: new Date().toISOString() }
    await writeStories(stories)
    res.json(stories[idx])
  } catch {
    res.status(500).json({ error: 'internal error' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const stories = await readStories()
    const idx = stories.findIndex(story => story.id === req.params.id)
    if (idx === -1) return res.status(404).json({ error: 'not found' })

    stories.splice(idx, 1)
    await writeStories(stories)
    res.status(204).end()
  } catch {
    res.status(500).json({ error: 'internal error' })
  }
})

export default router
