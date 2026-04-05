import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTaskReminders } from '../hooks/useTaskReminders.js'

describe('useTaskReminders', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-05T10:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('schedules a reminder, creates an alert, and marks it sent', async () => {
    const NotificationMock = vi.fn()
    NotificationMock.permission = 'granted'
    NotificationMock.requestPermission = vi.fn().mockResolvedValue('granted')
    vi.stubGlobal('Notification', NotificationMock)

    const updateTask = vi.fn().mockResolvedValue({})
    const tasks = [
      {
        id: '1',
        title: 'Wait for pipeline',
        status: 'waiting',
        remindAt: '2026-04-05T11:00:00.000Z',
        remindedAt: null,
        waitingOn: 'CI'
      }
    ]

    const { result } = renderHook(() => useTaskReminders(tasks, updateTask))

    await act(async () => {
      await Promise.resolve()
      await vi.advanceTimersByTimeAsync(60 * 60 * 1000)
    })

    expect(result.current.alerts).toHaveLength(1)
    expect(NotificationMock).toHaveBeenCalledWith('FlowPatch reminder', expect.objectContaining({
      body: expect.stringContaining('Wait for pipeline')
    }))
    expect(updateTask).toHaveBeenCalledWith('1', expect.objectContaining({
      remindedAt: expect.any(String)
    }))
  })

  it('requests notification permission on demand', async () => {
    const NotificationMock = vi.fn()
    NotificationMock.permission = 'default'
    NotificationMock.requestPermission = vi.fn().mockResolvedValue('granted')
    vi.stubGlobal('Notification', NotificationMock)

    const { result } = renderHook(() => useTaskReminders([], vi.fn()))

    await act(async () => {
      await result.current.requestPermission()
    })

    expect(NotificationMock.requestPermission).toHaveBeenCalled()
    expect(result.current.notificationPermission).toBe('granted')
  })
})
