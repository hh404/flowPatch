import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { isLocalStoryLink, openLocalStoryLink, selectLocalFolder } from '../localLink.js'
import { readStories, writeStories } from '../storyStore.js'

const router = Router()
const DEFAULT_MVP_NAME = 'Current MVP'
const ALLOWED_FIELDS = ['mvp', 'title', 'link', 'branch', 'folder', 'description', 'status']

function normalizeRequiredText(value) {
  return value?.trim() ?? ''
}

function normalizeOptionalText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeStory(story) {
  return {
    ...story,
    mvp: normalizeRequiredText(story.mvp) || DEFAULT_MVP_NAME,
    branch: normalizeOptionalText(story.branch),
    folder: normalizeOptionalText(story.folder),
    description: normalizeOptionalText(story.description)
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
    const branch = normalizeOptionalText(req.body.branch)
    const folder = normalizeOptionalText(req.body.folder)
    const description = normalizeOptionalText(req.body.description)
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
      branch,
      folder,
      description,
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

router.post('/open-local', async (req, res) => {
  try {
    const path = normalizeRequiredText(req.body.path)
    const action = normalizeRequiredText(req.body.action) || 'open'

    if (!path || !isLocalStoryLink(path)) {
      return res.status(400).json({ error: 'local path required' })
    }

    const result = await openLocalStoryLink(path, action)
    res.json(result)
  } catch (error) {
    if (error.message === 'invalid action' || error.message === 'invalid file url' || error.message === 'local path required') {
      return res.status(400).json({ error: error.message })
    }

    if (error.code === 'ENOENT') {
      return res.status(404).json({ error: 'path not found' })
    }

    res.status(500).json({ error: 'internal error' })
  }
})

router.post('/select-local-folder', async (req, res) => {
  try {
    const currentPath = normalizeOptionalText(req.body.currentPath)
    const result = await selectLocalFolder(currentPath)
    res.json(result)
  } catch (error) {
    if (error.message === 'invalid file url' || error.message === 'local path required') {
      return res.status(400).json({ error: error.message })
    }

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

    if (updates.branch !== undefined) {
      updates.branch = normalizeOptionalText(updates.branch)
    }

    if (updates.folder !== undefined) {
      updates.folder = normalizeOptionalText(updates.folder)
    }

    if (updates.description !== undefined) {
      updates.description = normalizeOptionalText(updates.description)
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
