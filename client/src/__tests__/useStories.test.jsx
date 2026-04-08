import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useStories } from '../hooks/useStories.js'

const mockStories = [
  {
    id: 's-1',
    mvp: 'Core Platform MVP',
    title: 'MVP board',
    link: 'https://dev.azure.com/example/story-1',
    branch: 'feature/mvp-board',
    folder: '/Users/hans/workspaces/core-platform/mvp-board',
    description: 'Story context',
    status: 'Ready for Develop',
    createdAt: '2026-04-05T10:00:00Z',
    updatedAt: '2026-04-05T10:00:00Z'
  }
]

beforeEach(() => {
  global.fetch = vi.fn()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useStories', () => {
  it('fetches stories on mount', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => mockStories })
    const { result } = renderHook(() => useStories())

    await waitFor(() => expect(result.current.stories).toHaveLength(1))
    expect(result.current.stories[0].title).toBe('MVP board')
    expect(result.current.stories[0].mvp).toBe('Core Platform MVP')
    expect(result.current.stories[0].branch).toBe('feature/mvp-board')
    expect(result.current.stories[0].folder).toBe('/Users/hans/workspaces/core-platform/mvp-board')
    expect(result.current.stories[0].description).toBe('Story context')
  })

  it('addStory posts and appends returned story', async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => mockStories[0] })

    const { result } = renderHook(() => useStories())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.addStory({
        mvp: 'Core Platform MVP',
        title: 'MVP board',
        link: 'https://dev.azure.com/example/story-1',
        branch: 'feature/mvp-board',
        folder: '/Users/hans/workspaces/core-platform/mvp-board',
        description: 'Story context',
        status: 'Ready for Develop'
      })
    })

    expect(result.current.stories).toHaveLength(1)
    expect(fetch).toHaveBeenCalledWith('/api/stories', expect.objectContaining({ method: 'POST' }))
  })

  it('updateStory patches and replaces story in state', async () => {
    const updated = {
      ...mockStories[0],
      mvp: 'Search MVP',
      branch: 'release/search-board',
      folder: '/Users/hans/workspaces/search/mvp-board',
      description: 'Updated context',
      status: 'In Review'
    }
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockStories })
      .mockResolvedValueOnce({ ok: true, json: async () => updated })

    const { result } = renderHook(() => useStories())
    await waitFor(() => expect(result.current.stories).toHaveLength(1))

    await act(async () => {
      await result.current.updateStory('s-1', {
        mvp: 'Search MVP',
        branch: 'release/search-board',
        folder: '/Users/hans/workspaces/search/mvp-board',
        description: 'Updated context',
        status: 'In Review'
      })
    })

    expect(result.current.stories[0].status).toBe('In Review')
    expect(result.current.stories[0].mvp).toBe('Search MVP')
    expect(result.current.stories[0].branch).toBe('release/search-board')
    expect(result.current.stories[0].folder).toBe('/Users/hans/workspaces/search/mvp-board')
    expect(result.current.stories[0].description).toBe('Updated context')
  })

  it('deleteStory removes story from state', async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockStories })
      .mockResolvedValueOnce({ ok: true, status: 204, json: async () => null })

    const { result } = renderHook(() => useStories())
    await waitFor(() => expect(result.current.stories).toHaveLength(1))

    await act(async () => {
      await result.current.deleteStory('s-1')
    })

    expect(result.current.stories).toHaveLength(0)
  })
})
