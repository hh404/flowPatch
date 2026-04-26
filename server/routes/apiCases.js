import { Router } from 'express'
import { selectLocalFolder } from '../localLink.js'
import {
  getApiCasesRootDir,
  readApiCaseInterfaces,
  setApiCasesRootDir
} from '../apiCaseStore.js'

const router = Router()

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

router.get('/', async (_req, res) => {
  try {
    const interfaces = await readApiCaseInterfaces()
    res.json(interfaces)
  } catch {
    res.status(500).json({ error: 'internal error' })
  }
})

router.get('/config', async (_req, res) => {
  try {
    const rootDir = await getApiCasesRootDir()
    res.json({ rootDir })
  } catch {
    res.status(500).json({ error: 'internal error' })
  }
})

router.post('/config', async (req, res) => {
  try {
    const rootDir = normalizeText(req.body.rootDir)
    if (!rootDir) return res.status(400).json({ error: 'rootDir required' })

    const savedRootDir = await setApiCasesRootDir(rootDir)
    res.json({ rootDir: savedRootDir })
  } catch (error) {
    if (error.message === 'rootDir required') {
      return res.status(400).json({ error: error.message })
    }

    res.status(500).json({ error: 'internal error' })
  }
})

router.post('/select-root', async (req, res) => {
  try {
    const currentPath = normalizeText(req.body.currentPath)
    const result = await selectLocalFolder(currentPath)
    const selectedPath = normalizeText(result.path)
    if (!selectedPath) return res.status(400).json({ error: 'local path required' })

    const rootDir = await setApiCasesRootDir(selectedPath)
    res.json({ rootDir })
  } catch (error) {
    if (error.message === 'invalid file url' || error.message === 'local path required') {
      return res.status(400).json({ error: error.message })
    }

    res.status(500).json({ error: 'internal error' })
  }
})

export default router
