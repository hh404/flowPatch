import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useMvpFolders } from '../hooks/useMvpFolders.js'

const mockMvpFolders = [
  {
    name: 'Core Platform MVP',
    folder: '/Users/hans/workspaces/core-platform',
    shortcuts: []
  }
]

beforeEach(() => {
  global.fetch = vi.fn()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useMvpFolders', () => {
  it('fetches folders on mount', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => mockMvpFolders })

    const { result } = renderHook(() => useMvpFolders())

    await waitFor(() => expect(result.current.mvpFolders).toHaveLength(1))
    expect(result.current.mvpFolders[0].name).toBe('Core Platform MVP')
    expect(result.current.mvpFolders[0].folder).toBe('/Users/hans/workspaces/core-platform')
  })

  it('upserts a folder', async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => mockMvpFolders[0] })

    const { result } = renderHook(() => useMvpFolders())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.setMvpFolder('Core Platform MVP', '/Users/hans/workspaces/core-platform')
    })

    expect(result.current.mvpFolders).toHaveLength(1)
    expect(fetch).toHaveBeenCalledWith('/api/mvps', expect.objectContaining({ method: 'POST' }))
  })

  it('deletes a folder binding', async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockMvpFolders })
      .mockResolvedValueOnce({ ok: true, status: 204, json: async () => null })

    const { result } = renderHook(() => useMvpFolders())
    await waitFor(() => expect(result.current.mvpFolders).toHaveLength(1))

    await act(async () => {
      await result.current.deleteMvpFolder('Core Platform MVP')
    })

    expect(result.current.mvpFolders).toHaveLength(0)
  })

  it('saves shortcuts for an mvp', async () => {
    const saved = {
      name: 'Core Platform MVP',
      folder: '/Users/hans/workspaces/core-platform',
      shortcuts: [
        {
          id: 'shortcut-1',
          label: 'Mailing List',
          title: 'mvp3 package notification'
        }
      ]
    }

    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockMvpFolders })
      .mockResolvedValueOnce({ ok: true, json: async () => saved })

    const { result } = renderHook(() => useMvpFolders())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.setMvpShortcuts('Core Platform MVP', saved.shortcuts)
    })

    expect(fetch).toHaveBeenCalledWith('/api/mvps', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        name: 'Core Platform MVP',
        shortcuts: saved.shortcuts
      })
    }))
    expect(result.current.mvpFolders[0].shortcuts).toEqual(saved.shortcuts)
  })
})
