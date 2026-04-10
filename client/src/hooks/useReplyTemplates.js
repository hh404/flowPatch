import { useCallback, useEffect, useState } from 'react'
import {
  createReplyTemplateCategory,
  createReplyTemplateReply,
  fetchReplyTemplates,
  patchReplyTemplateCategory,
  patchReplyTemplateReply,
  removeReplyTemplateCategory,
  removeReplyTemplateReply
} from '../api.js'

function normalizeRequiredText(value) {
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
    icon: typeof category?.icon === 'string' ? category.icon.trim() : '',
    replies: Array.isArray(category?.replies) ? category.replies.map(normalizeReply) : []
  }
}

function normalizeReplyTemplates(replyTemplates) {
  return {
    categories: Array.isArray(replyTemplates?.categories)
      ? replyTemplates.categories.map(normalizeCategory)
      : []
  }
}

export function useReplyTemplates() {
  const [replyTemplates, setReplyTemplates] = useState({ categories: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchReplyTemplates()
      .then(document => setReplyTemplates(normalizeReplyTemplates(document)))
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  const addCategory = useCallback(async data => {
    const category = normalizeCategory(await createReplyTemplateCategory(data))
    setReplyTemplates(prev => ({
      ...prev,
      categories: [...prev.categories, category]
    }))
    return category
  }, [])

  const updateCategory = useCallback(async (id, changes) => {
    const category = normalizeCategory(await patchReplyTemplateCategory(id, changes))
    setReplyTemplates(prev => ({
      ...prev,
      categories: prev.categories.map(item => (item.id === id ? category : item))
    }))
    return category
  }, [])

  const deleteCategory = useCallback(async id => {
    await removeReplyTemplateCategory(id)
    setReplyTemplates(prev => ({
      ...prev,
      categories: prev.categories.filter(item => item.id !== id)
    }))
  }, [])

  const addReply = useCallback(async (categoryId, data) => {
    const reply = normalizeReply(await createReplyTemplateReply(categoryId, data))
    setReplyTemplates(prev => ({
      ...prev,
      categories: prev.categories.map(category => (
        category.id === categoryId
          ? { ...category, replies: [...category.replies, reply] }
          : category
      ))
    }))
    return reply
  }, [])

  const updateReply = useCallback(async (categoryId, replyId, changes) => {
    const reply = normalizeReply(await patchReplyTemplateReply(categoryId, replyId, changes))
    setReplyTemplates(prev => ({
      ...prev,
      categories: prev.categories.map(category => (
        category.id === categoryId
          ? {
              ...category,
              replies: category.replies.map(item => (item.id === replyId ? reply : item))
            }
          : category
      ))
    }))
    return reply
  }, [])

  const deleteReply = useCallback(async (categoryId, replyId) => {
    await removeReplyTemplateReply(categoryId, replyId)
    setReplyTemplates(prev => ({
      ...prev,
      categories: prev.categories.map(category => (
        category.id === categoryId
          ? { ...category, replies: category.replies.filter(item => item.id !== replyId) }
          : category
      ))
    }))
  }, [])

  return {
    replyTemplates,
    categories: replyTemplates.categories,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    addReply,
    updateReply,
    deleteReply
  }
}
