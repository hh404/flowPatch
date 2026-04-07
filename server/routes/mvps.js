import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { readMvps, writeMvps } from '../mvpStore.js'
import { openOutlookAndCopyTitle } from '../outlookSearch.js'

const router = Router()

function normalizeRequiredText(value) {
  return value?.trim() ?? ''
}

function normalizeOptionalText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeShortcut(item) {
  const label = normalizeRequiredText(item?.label)
  const title = normalizeRequiredText(item?.title)

  if (!label || !title) return null

  return {
    id: normalizeRequiredText(item?.id) || uuidv4(),
    label,
    title
  }
}

function normalizeShortcuts(items) {
  if (!Array.isArray(items)) return []
  return items
    .map(normalizeShortcut)
    .filter(Boolean)
}

function normalizeMvp(item) {
  return {
    ...item,
    name: normalizeRequiredText(item.name),
    folder: normalizeOptionalText(item.folder),
    shortcuts: normalizeShortcuts(item.shortcuts)
  }
}

router.get('/', async (_req, res) => {
  try {
    const mvps = await readMvps()
    const deduped = new Map()

    mvps
      .map(normalizeMvp)
      .filter(item => item.name)
      .forEach(item => deduped.set(item.name, item))

    res.json([...deduped.values()])
  } catch {
    res.status(500).json({ error: 'internal error' })
  }
})

router.post('/', async (req, res) => {
  try {
    const name = normalizeRequiredText(req.body.name)
    const hasFolder = Object.prototype.hasOwnProperty.call(req.body, 'folder')
    const hasShortcuts = Object.prototype.hasOwnProperty.call(req.body, 'shortcuts')

    if (!name || (!hasFolder && !hasShortcuts)) {
      return res.status(400).json({ error: 'name and at least one setting are required' })
    }

    const now = new Date().toISOString()
    const mvps = (await readMvps()).map(normalizeMvp)
    const index = mvps.findIndex(item => item.name === name)
    const current = index >= 0 ? mvps[index] : { name, folder: '', shortcuts: [] }
    const folder = hasFolder ? normalizeOptionalText(req.body.folder) : current.folder
    let shortcuts = current.shortcuts

    if (hasShortcuts) {
      if (!Array.isArray(req.body.shortcuts)) {
        return res.status(400).json({ error: 'shortcuts must be an array' })
      }

      shortcuts = normalizeShortcuts(req.body.shortcuts)
      if (req.body.shortcuts.length !== shortcuts.length) {
        return res.status(400).json({ error: 'each shortcut requires label and title' })
      }
    }

    if (!folder && shortcuts.length === 0) {
      return res.status(400).json({ error: 'folder or shortcuts are required' })
    }

    const next = {
      ...current,
      name,
      folder,
      shortcuts,
      updatedAt: now
    }

    if (index >= 0) {
      mvps[index] = next
    } else {
      mvps.push(next)
    }

    await writeMvps(mvps)
    res.status(index >= 0 ? 200 : 201).json(next)
  } catch {
    res.status(500).json({ error: 'internal error' })
  }
})

router.post('/open-outlook', async (req, res) => {
  try {
    const title = normalizeRequiredText(req.body.title)
    const result = await openOutlookAndCopyTitle(title)
    res.json(result)
  } catch (error) {
    if (error.message === 'title required') {
      return res.status(400).json({ error: error.message })
    }

    res.status(500).json({ error: 'internal error' })
  }
})

router.delete('/:name', async (req, res) => {
  try {
    const name = normalizeRequiredText(req.params.name)
    if (!name) return res.status(400).json({ error: 'name required' })

    const mvps = (await readMvps()).map(normalizeMvp)
    const index = mvps.findIndex(item => item.name === name)
    if (index === -1) return res.status(404).json({ error: 'not found' })

    mvps.splice(index, 1)
    await writeMvps(mvps)
    res.status(204).end()
  } catch {
    res.status(500).json({ error: 'internal error' })
  }
})

export default router
