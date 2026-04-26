import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { readPackageReleases, writePackageReleases } from '../packageReleaseStore.js'

const router = Router()
const ALLOWED_FIELDS = ['release', 'checklist', 'notes', 'qaConfirmed']

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeList(value) {
  if (!Array.isArray(value)) return []
  return value.map(item => normalizeText(item)).filter(Boolean)
}

function normalizeChecklist(value) {
  if (!value || typeof value !== 'object') return {}

  return Object.fromEntries(
    Object.entries(value).map(([key, checked]) => [key, Boolean(checked)])
  )
}

function normalizeRelease(value = {}) {
  return {
    market: normalizeText(value.market),
    project: normalizeText(value.project),
    stage: normalizeText(value.stage),
    mvp: normalizeText(value.mvp),
    appVersion: normalizeText(value.appVersion),
    buildNumber: normalizeText(value.buildNumber),
    branch: normalizeText(value.branch),
    packageDate: normalizeText(value.packageDate),
    qaOwner: normalizeText(value.qaOwner),
    testFlightScreenshot: normalizeText(value.testFlightScreenshot),
    stories: normalizeList(value.stories)
  }
}

function normalizeNotes(value = {}) {
  return {
    teamsMessage: normalizeText(value.teamsMessage),
    adoComment: normalizeText(value.adoComment),
    emailSubject: normalizeText(value.emailSubject),
    emailBody: normalizeText(value.emailBody),
    confluenceRow: normalizeText(value.confluenceRow)
  }
}

function normalizePackageRelease(item) {
  return {
    ...item,
    release: normalizeRelease(item.release),
    checklist: normalizeChecklist(item.checklist),
    notes: normalizeNotes(item.notes),
    qaConfirmed: Boolean(item.qaConfirmed)
  }
}

function validateRelease(release) {
  if (!release.buildNumber) return 'build number required'
  if (!release.market) return 'market required'
  if (!release.project) return 'project required'
  if (!release.stage) return 'stage required'
  if (release.stories.length === 0) return 'at least one story required'
  return null
}

router.get('/', async (_req, res) => {
  try {
    const releases = await readPackageReleases()
    res.json(releases.map(normalizePackageRelease))
  } catch {
    res.status(500).json({ error: 'internal error' })
  }
})

router.post('/', async (req, res) => {
  try {
    const release = normalizeRelease(req.body.release)
    const validationError = validateRelease(release)
    if (validationError) return res.status(400).json({ error: validationError })

    const now = new Date().toISOString()
    const item = {
      id: uuidv4(),
      release,
      checklist: normalizeChecklist(req.body.checklist),
      notes: normalizeNotes(req.body.notes),
      qaConfirmed: Boolean(req.body.qaConfirmed),
      createdAt: now,
      updatedAt: now
    }

    const releases = await readPackageReleases()
    releases.push(item)
    await writePackageReleases(releases)
    res.status(201).json(item)
  } catch {
    res.status(500).json({ error: 'internal error' })
  }
})

router.patch('/:id', async (req, res) => {
  try {
    const releases = await readPackageReleases()
    const idx = releases.findIndex(item => item.id === req.params.id)
    if (idx === -1) return res.status(404).json({ error: 'not found' })

    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => ALLOWED_FIELDS.includes(key))
    )

    if (updates.release !== undefined) {
      updates.release = normalizeRelease(updates.release)
      const validationError = validateRelease(updates.release)
      if (validationError) return res.status(400).json({ error: validationError })
    }

    if (updates.checklist !== undefined) updates.checklist = normalizeChecklist(updates.checklist)
    if (updates.notes !== undefined) updates.notes = normalizeNotes(updates.notes)
    if (updates.qaConfirmed !== undefined) updates.qaConfirmed = Boolean(updates.qaConfirmed)

    releases[idx] = {
      ...normalizePackageRelease(releases[idx]),
      ...updates,
      updatedAt: new Date().toISOString()
    }
    await writePackageReleases(releases)
    res.json(releases[idx])
  } catch {
    res.status(500).json({ error: 'internal error' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const releases = await readPackageReleases()
    const idx = releases.findIndex(item => item.id === req.params.id)
    if (idx === -1) return res.status(404).json({ error: 'not found' })

    releases.splice(idx, 1)
    await writePackageReleases(releases)
    res.status(204).end()
  } catch {
    res.status(500).json({ error: 'internal error' })
  }
})

export default router
