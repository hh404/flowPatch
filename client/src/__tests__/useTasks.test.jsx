import { renderHook, act, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useTasks } from '../hooks/useTasks.js'

const mockTasks = [
  {
    id: '1',
    title: 'Wait for build',
    type: 'waiting',
    status: 'pending',
    note: '',
    due: null,
    related: null,
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

describe('useTasks', () => {
  it('fetches tasks on mount', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => mockTasks })
    const { result } = renderHook(() => useTasks())
    await waitFor(() => expect(result.current.tasks).toHaveLength(1))
    expect(result.current.tasks[0].title).toBe('Wait for build')
  })

  it('addTask posts and appends returned task', async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => mockTasks[0] })

    const { result } = renderHook(() => useTasks())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.addTask({ title: 'Wait for build', type: 'waiting' })
    })

    expect(result.current.tasks).toHaveLength(1)
    expect(fetch).toHaveBeenCalledWith('/api/tasks', expect.objectContaining({ method: 'POST' }))
  })

  it('updateTask patches and replaces task in state', async () => {
    const updated = { ...mockTasks[0], status: 'doing' }
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockTasks })
      .mockResolvedValueOnce({ ok: true, json: async () => updated })

    const { result } = renderHook(() => useTasks())
    await waitFor(() => expect(result.current.tasks).toHaveLength(1))

    await act(async () => {
      await result.current.updateTask('1', { status: 'doing' })
    })

    expect(result.current.tasks[0].status).toBe('doing')
  })

  it('deleteTask removes task from state', async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockTasks })
      .mockResolvedValueOnce({ ok: true, status: 204, json: async () => null })

    const { result } = renderHook(() => useTasks())
    await waitFor(() => expect(result.current.tasks).toHaveLength(1))

    await act(async () => {
      await result.current.deleteTask('1')
    })

    expect(result.current.tasks).toHaveLength(0)
  })
})
