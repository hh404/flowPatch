import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useReplyTemplates } from '../hooks/useReplyTemplates.js'

const mockReplyTemplates = {
  categories: [
    {
      id: 'release',
      name: 'Release / Build',
      icon: '🚀',
      replies: [
        {
          id: 'release-timeline',
          title: 'Release timeline explanation',
          keywords: ['timeline', 'review'],
          polite: 'After code freeze, we still need time for QA.',
          firm: 'The release timeline has already been shared.'
        }
      ]
    }
  ]
}

beforeEach(() => {
  global.fetch = vi.fn()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useReplyTemplates', () => {
  it('fetches reply templates on mount', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => mockReplyTemplates })
    const { result } = renderHook(() => useReplyTemplates())

    await waitFor(() => expect(result.current.categories).toHaveLength(1))
    expect(result.current.categories[0].name).toBe('Release / Build')
    expect(result.current.categories[0].replies[0].id).toBe('release-timeline')
  })

  it('addCategory posts and appends the returned category', async () => {
    const createdCategory = {
      id: 'process',
      name: 'Process / Workflow',
      icon: '📋',
      replies: []
    }

    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockReplyTemplates })
      .mockResolvedValueOnce({ ok: true, json: async () => createdCategory })

    const { result } = renderHook(() => useReplyTemplates())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.addCategory({
        id: 'process',
        name: 'Process / Workflow',
        icon: '📋'
      })
    })

    expect(result.current.categories).toHaveLength(2)
    expect(fetch).toHaveBeenCalledWith('/api/reply-templates/categories', expect.objectContaining({ method: 'POST' }))
  })

  it('updateReply patches and replaces the reply in state', async () => {
    const updatedReply = {
      id: 'release-window',
      title: 'Release window',
      keywords: ['window', 'submission'],
      polite: 'We can only control when we submit.',
      firm: 'We do not control Apple review speed after submission.'
    }

    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockReplyTemplates })
      .mockResolvedValueOnce({ ok: true, json: async () => updatedReply })

    const { result } = renderHook(() => useReplyTemplates())
    await waitFor(() => expect(result.current.categories).toHaveLength(1))

    await act(async () => {
      await result.current.updateReply('release', 'release-timeline', {
        id: 'release-window',
        title: 'Release window',
        keywords: ['window', 'submission'],
        polite: 'We can only control when we submit.',
        firm: 'We do not control Apple review speed after submission.'
      })
    })

    expect(result.current.categories[0].replies[0].id).toBe('release-window')
    expect(result.current.categories[0].replies[0].title).toBe('Release window')
    expect(result.current.categories[0].replies[0].firm).toBe('We do not control Apple review speed after submission.')
  })

  it('deleteCategory removes the category from state', async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockReplyTemplates })
      .mockResolvedValueOnce({ ok: true, status: 204, json: async () => null })

    const { result } = renderHook(() => useReplyTemplates())
    await waitFor(() => expect(result.current.categories).toHaveLength(1))

    await act(async () => {
      await result.current.deleteCategory('release')
    })

    expect(result.current.categories).toHaveLength(0)
  })
})
