import { useState, useEffect, useCallback } from 'react'
import { fetchTasks, createTask, patchTask, removeTask } from '../api.js'

export function useTasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchTasks()
      .then(setTasks)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  const addTask = useCallback(async (data) => {
    const task = await createTask(data)
    setTasks(prev => [...prev, task])
    return task
  }, [])

  const updateTask = useCallback(async (id, changes) => {
    const task = await patchTask(id, changes)
    setTasks(prev => prev.map(t => t.id === id ? task : t))
    return task
  }, [])

  const deleteTask = useCallback(async (id) => {
    await removeTask(id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }, [])

  return { tasks, loading, error, addTask, updateTask, deleteTask }
}
