import { Router } from 'express'
import { readMvps, writeMvps } from '../mvpStore.js'

const router = Router()

function normalizeRequiredText(value) {
  return value?.trim() ?? ''
}

function normalizeOptionalText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeMvp(item) {
  return {
    ...item,
    name: normalizeRequiredText(item.name),
    folder: normalizeOptionalText(item.folder)
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
    const folder = normalizeRequiredText(req.body.folder)

    if (!name || !folder) {
      return res.status(400).json({ error: 'name and folder are required' })
    }

    const now = new Date().toISOString()
    const mvps = (await readMvps()).map(normalizeMvp)
    const index = mvps.findIndex(item => item.name === name)
    const next = {
      ...(index >= 0 ? mvps[index] : {}),
      name,
      folder,
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
