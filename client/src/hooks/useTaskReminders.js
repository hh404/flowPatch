import { useCallback, useEffect, useRef, useState } from 'react'

function supportsNotifications() {
  return typeof window !== 'undefined' && 'Notification' in window
}

function hasWindow() {
  return typeof window !== 'undefined'
}

function canRemind(task) {
  if (!task.remindAt) return false
  if (task.remindedAt) return false
  return task.status !== 'done'
}

function buildReminderKey(task) {
  return `${task.id}:${task.remindAt}`
}

export function useTaskReminders(tasks, updateTask) {
  const [alerts, setAlerts] = useState([])
  const [permission, setPermission] = useState(() => {
    if (!supportsNotifications()) return 'unsupported'
    return window.Notification.permission
  })
  const timersRef = useRef(new Map())
  const inFlightRef = useRef(new Set())

  const dismissAlert = useCallback((key) => {
    setAlerts(current => current.filter(alert => alert.key !== key))
  }, [])

  const triggerReminder = useCallback(async (task) => {
    if (!canRemind(task)) return

    const key = buildReminderKey(task)
    if (inFlightRef.current.has(key)) return

    inFlightRef.current.add(key)

    setAlerts(current => (
      current.some(alert => alert.key === key)
        ? current
        : [{ key, taskId: task.id, title: task.title, remindAt: task.remindAt }, ...current]
    ))

    if (supportsNotifications() && window.Notification.permission === 'granted') {
      new window.Notification('FlowPatch reminder', {
        body: task.waitingOn
          ? `${task.title} · check ${task.waitingOn}`
          : task.title
      })
    }

    try {
      await updateTask(task.id, {
        remindedAt: new Date().toISOString()
      })
    } finally {
      inFlightRef.current.delete(key)
    }
  }, [updateTask])

  useEffect(() => {
    if (!hasWindow()) return undefined

    const nextKeys = new Set()
    const now = Date.now()

    for (const task of tasks) {
      if (!canRemind(task)) continue

      const remindAt = new Date(task.remindAt).getTime()
      if (Number.isNaN(remindAt)) continue

      const key = buildReminderKey(task)
      nextKeys.add(key)

      if (remindAt <= now) {
        void triggerReminder(task)
        continue
      }

      if (!timersRef.current.has(key)) {
        const timeoutId = window.setTimeout(() => {
          timersRef.current.delete(key)
          void triggerReminder(task)
        }, remindAt - now)

        timersRef.current.set(key, timeoutId)
      }
    }

    for (const [key, timeoutId] of timersRef.current.entries()) {
      if (nextKeys.has(key)) continue
      window.clearTimeout(timeoutId)
      timersRef.current.delete(key)
    }

    return undefined
  }, [tasks, triggerReminder])

  useEffect(() => {
    return () => {
      for (const timeoutId of timersRef.current.values()) {
        window.clearTimeout(timeoutId)
      }
      timersRef.current.clear()
    }
  }, [])

  const requestPermission = useCallback(async () => {
    if (!supportsNotifications()) return 'unsupported'

    const result = await window.Notification.requestPermission()
    setPermission(result)
    return result
  }, [])

  return {
    alerts,
    dismissAlert,
    notificationsSupported: supportsNotifications(),
    notificationPermission: permission,
    requestPermission
  }
}
