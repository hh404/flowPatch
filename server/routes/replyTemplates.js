import { Router } from 'express'
import { readReplyTemplates, writeReplyTemplates } from '../replyTemplateStore.js'

const router = Router()
const CATEGORY_FIELDS = ['id', 'name', 'icon']
const REPLY_FIELDS = ['id', 'title', 'keywords', 'polite', 'firm']

function normalizeRequiredText(value) {
  return value?.trim() ?? ''
}

function normalizeOptionalText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeKeywords(keywords) {
  if (!Array.isArray(keywords)) return []

  const seen = new Set()
  const normalized = []

  keywords.forEach(keyword => {
    const value = normalizeRequiredText(keyword)
    if (!value) return

    const dedupeKey = value.toLowerCase()
    if (seen.has(dedupeKey)) return

    seen.add(dedupeKey)
    normalized.push(value)
  })

  return normalized
}

function normalizeReply(reply) {
  const legacyText = normalizeRequiredText(reply?.text)

  return {
    id: normalizeRequiredText(reply?.id),
    title: normalizeRequiredText(reply?.title),
    keywords: normalizeKeywords(reply?.keywords),
    polite: normalizeRequiredText(reply?.polite) || legacyText,
    firm: normalizeRequiredText(reply?.firm) || legacyText
  }
}

function normalizeCategory(category) {
  return {
    id: normalizeRequiredText(category?.id),
    name: normalizeRequiredText(category?.name),
    icon: normalizeOptionalText(category?.icon),
    replies: Array.isArray(category?.replies)
      ? category.replies.map(normalizeReply).filter(reply => reply.id && reply.title && reply.polite && reply.firm)
      : []
  }
}

function normalizeReplyTemplates(replyTemplates) {
  return {
    categories: Array.isArray(replyTemplates?.categories)
      ? replyTemplates.categories.map(normalizeCategory).filter(category => category.id && category.name)
      : []
  }
}

function getCategoryIndex(categories, categoryId) {
  return categories.findIndex(category => category.id === categoryId)
}

function getReplyIndex(replies, replyId) {
  return replies.findIndex(reply => reply.id === replyId)
}

function categoryExists(categories, categoryId, excludeId = '') {
  return categories.some(category => category.id === categoryId && category.id !== excludeId)
}

function replyExists(replies, replyId, excludeId = '') {
  return replies.some(reply => reply.id === replyId && reply.id !== excludeId)
}

router.get('/', async (_req, res) => {
  try {
    const replyTemplates = await readReplyTemplates()
    res.json(normalizeReplyTemplates(replyTemplates))
  } catch {
    res.status(500).json({ error: 'internal error' })
  }
})

router.post('/categories', async (req, res) => {
  try {
    const replyTemplates = normalizeReplyTemplates(await readReplyTemplates())
    const category = normalizeCategory({ ...req.body, replies: [] })

    if (!category.id || !category.name) {
      return res.status(400).json({ error: 'category id and name are required' })
    }

    if (categoryExists(replyTemplates.categories, category.id)) {
      return res.status(409).json({ error: 'category id already exists' })
    }

    replyTemplates.categories.push(category)
    await writeReplyTemplates(replyTemplates)
    res.status(201).json(category)
  } catch {
    res.status(500).json({ error: 'internal error' })
  }
})

router.patch('/categories/:id', async (req, res) => {
  try {
    const replyTemplates = normalizeReplyTemplates(await readReplyTemplates())
    const categoryIndex = getCategoryIndex(replyTemplates.categories, req.params.id)
    if (categoryIndex === -1) return res.status(404).json({ error: 'category not found' })

    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => CATEGORY_FIELDS.includes(key))
    )

    if (updates.id !== undefined) {
      updates.id = normalizeRequiredText(updates.id)
      if (!updates.id) return res.status(400).json({ error: 'category id is required' })
    }

    if (updates.name !== undefined) {
      updates.name = normalizeRequiredText(updates.name)
      if (!updates.name) return res.status(400).json({ error: 'category name is required' })
    }

    if (updates.icon !== undefined) {
      updates.icon = normalizeOptionalText(updates.icon)
    }

    const currentCategory = replyTemplates.categories[categoryIndex]
    const nextId = updates.id ?? currentCategory.id
    if (categoryExists(replyTemplates.categories, nextId, currentCategory.id)) {
      return res.status(409).json({ error: 'category id already exists' })
    }

    replyTemplates.categories[categoryIndex] = {
      ...currentCategory,
      ...updates
    }

    await writeReplyTemplates(replyTemplates)
    res.json(replyTemplates.categories[categoryIndex])
  } catch {
    res.status(500).json({ error: 'internal error' })
  }
})

router.delete('/categories/:id', async (req, res) => {
  try {
    const replyTemplates = normalizeReplyTemplates(await readReplyTemplates())
    const categoryIndex = getCategoryIndex(replyTemplates.categories, req.params.id)
    if (categoryIndex === -1) return res.status(404).json({ error: 'category not found' })

    replyTemplates.categories.splice(categoryIndex, 1)
    await writeReplyTemplates(replyTemplates)
    res.status(204).end()
  } catch {
    res.status(500).json({ error: 'internal error' })
  }
})

router.post('/categories/:id/replies', async (req, res) => {
  try {
    const replyTemplates = normalizeReplyTemplates(await readReplyTemplates())
    const categoryIndex = getCategoryIndex(replyTemplates.categories, req.params.id)
    if (categoryIndex === -1) return res.status(404).json({ error: 'category not found' })

    const reply = normalizeReply(req.body)
    if (!reply.id || !reply.title || !reply.polite || !reply.firm) {
      return res.status(400).json({ error: 'reply id, title, polite, and firm are required' })
    }

    const replies = replyTemplates.categories[categoryIndex].replies
    if (replyExists(replies, reply.id)) {
      return res.status(409).json({ error: 'reply id already exists' })
    }

    replies.push(reply)
    await writeReplyTemplates(replyTemplates)
    res.status(201).json(reply)
  } catch {
    res.status(500).json({ error: 'internal error' })
  }
})

router.patch('/categories/:categoryId/replies/:replyId', async (req, res) => {
  try {
    const replyTemplates = normalizeReplyTemplates(await readReplyTemplates())
    const categoryIndex = getCategoryIndex(replyTemplates.categories, req.params.categoryId)
    if (categoryIndex === -1) return res.status(404).json({ error: 'category not found' })

    const replies = replyTemplates.categories[categoryIndex].replies
    const replyIndex = getReplyIndex(replies, req.params.replyId)
    if (replyIndex === -1) return res.status(404).json({ error: 'reply not found' })

    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => REPLY_FIELDS.includes(key))
    )

    if (updates.id !== undefined) {
      updates.id = normalizeRequiredText(updates.id)
      if (!updates.id) return res.status(400).json({ error: 'reply id is required' })
    }

    if (updates.title !== undefined) {
      updates.title = normalizeRequiredText(updates.title)
      if (!updates.title) return res.status(400).json({ error: 'reply title is required' })
    }

    if (updates.polite !== undefined) {
      updates.polite = normalizeRequiredText(updates.polite)
      if (!updates.polite) return res.status(400).json({ error: 'reply polite text is required' })
    }

    if (updates.firm !== undefined) {
      updates.firm = normalizeRequiredText(updates.firm)
      if (!updates.firm) return res.status(400).json({ error: 'reply firm text is required' })
    }

    if (updates.keywords !== undefined) {
      updates.keywords = normalizeKeywords(updates.keywords)
    }

    const currentReply = replies[replyIndex]
    const nextId = updates.id ?? currentReply.id
    if (replyExists(replies, nextId, currentReply.id)) {
      return res.status(409).json({ error: 'reply id already exists' })
    }

    replies[replyIndex] = {
      ...currentReply,
      ...updates
    }

    await writeReplyTemplates(replyTemplates)
    res.json(replies[replyIndex])
  } catch {
    res.status(500).json({ error: 'internal error' })
  }
})

router.delete('/categories/:categoryId/replies/:replyId', async (req, res) => {
  try {
    const replyTemplates = normalizeReplyTemplates(await readReplyTemplates())
    const categoryIndex = getCategoryIndex(replyTemplates.categories, req.params.categoryId)
    if (categoryIndex === -1) return res.status(404).json({ error: 'category not found' })

    const replies = replyTemplates.categories[categoryIndex].replies
    const replyIndex = getReplyIndex(replies, req.params.replyId)
    if (replyIndex === -1) return res.status(404).json({ error: 'reply not found' })

    replies.splice(replyIndex, 1)
    await writeReplyTemplates(replyTemplates)
    res.status(204).end()
  } catch {
    res.status(500).json({ error: 'internal error' })
  }
})

export default router
