import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { readTestAccounts, writeTestAccounts } from '../testAccountStore.js'

const router = Router()
const ALLOWED_FIELDS = ['env', 'account', 'password', 'note', 'simulator']

function normalizeRequiredText(value) {
  return value?.trim() ?? ''
}

function normalizeOptionalText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeTestAccount(testAccount) {
  return {
    ...testAccount,
    env: normalizeRequiredText(testAccount.env),
    account: normalizeRequiredText(testAccount.account),
    password: normalizeRequiredText(testAccount.password),
    note: normalizeOptionalText(testAccount.note),
    simulator: normalizeOptionalText(testAccount.simulator)
  }
}

router.get('/', async (_req, res) => {
  try {
    const testAccounts = await readTestAccounts()
    res.json(testAccounts.map(normalizeTestAccount))
  } catch {
    res.status(500).json({ error: 'internal error' })
  }
})

router.post('/', async (req, res) => {
  try {
    const env = normalizeRequiredText(req.body.env)
    const account = normalizeRequiredText(req.body.account)
    const password = normalizeRequiredText(req.body.password)
    const note = normalizeOptionalText(req.body.note)
    const simulator = normalizeOptionalText(req.body.simulator)

    if (!env || !account || !password) {
      return res.status(400).json({ error: 'env, account, and password are required' })
    }

    const now = new Date().toISOString()
    const testAccount = {
      id: uuidv4(),
      env,
      account,
      password,
      note,
      simulator,
      createdAt: now,
      updatedAt: now
    }

    const testAccounts = await readTestAccounts()
    testAccounts.push(testAccount)
    await writeTestAccounts(testAccounts)
    res.status(201).json(testAccount)
  } catch {
    res.status(500).json({ error: 'internal error' })
  }
})

router.patch('/:id', async (req, res) => {
  try {
    const testAccounts = await readTestAccounts()
    const index = testAccounts.findIndex(item => item.id === req.params.id)
    if (index === -1) return res.status(404).json({ error: 'not found' })

    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => ALLOWED_FIELDS.includes(key))
    )

    if (updates.env !== undefined) {
      updates.env = normalizeRequiredText(updates.env)
      if (!updates.env) return res.status(400).json({ error: 'env required' })
    }

    if (updates.account !== undefined) {
      updates.account = normalizeRequiredText(updates.account)
      if (!updates.account) return res.status(400).json({ error: 'account required' })
    }

    if (updates.password !== undefined) {
      updates.password = normalizeRequiredText(updates.password)
      if (!updates.password) return res.status(400).json({ error: 'password required' })
    }

    if (updates.note !== undefined) {
      updates.note = normalizeOptionalText(updates.note)
    }

    if (updates.simulator !== undefined) {
      updates.simulator = normalizeOptionalText(updates.simulator)
    }

    testAccounts[index] = {
      ...normalizeTestAccount(testAccounts[index]),
      ...updates,
      updatedAt: new Date().toISOString()
    }
    await writeTestAccounts(testAccounts)
    res.json(testAccounts[index])
  } catch {
    res.status(500).json({ error: 'internal error' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const testAccounts = await readTestAccounts()
    const index = testAccounts.findIndex(item => item.id === req.params.id)
    if (index === -1) return res.status(404).json({ error: 'not found' })

    testAccounts.splice(index, 1)
    await writeTestAccounts(testAccounts)
    res.status(204).end()
  } catch {
    res.status(500).json({ error: 'internal error' })
  }
})

export default router
