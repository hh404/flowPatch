import { useCallback, useEffect, useState } from 'react'
import { createStory, fetchStories, patchStory, removeStory } from '../api.js'
import { normalizeStory } from '../utils/storyMvp.js'

export function useStories() {
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchStories()
      .then(items => setStories(items.map(normalizeStory)))
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  const addStory = useCallback(async (data) => {
    const story = await createStory(data)
    const normalized = normalizeStory(story)
    setStories(prev => [...prev, normalized])
    return normalized
  }, [])

  const updateStory = useCallback(async (id, changes) => {
    const story = await patchStory(id, changes)
    const normalized = normalizeStory(story)
    setStories(prev => prev.map(item => (item.id === id ? normalized : item)))
    return normalized
  }, [])

  const deleteStory = useCallback(async (id) => {
    await removeStory(id)
    setStories(prev => prev.filter(item => item.id !== id))
  }, [])

  return { stories, loading, error, addStory, updateStory, deleteStory }
}
