import { useCallback, useEffect, useState } from 'react'
import { fetchMvpFolders, removeMvpFolder, upsertMvpFolder } from '../api.js'
import { normalizeStoryMvp } from '../utils/storyMvp.js'

function normalizeMvpFolder(item) {
  return {
    ...item,
    name: normalizeStoryMvp(item?.name),
    folder: typeof item?.folder === 'string' ? item.folder.trim() : ''
  }
}

export function useMvpFolders() {
  const [mvpFolders, setMvpFolders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchMvpFolders()
      .then(items => setMvpFolders(items.map(normalizeMvpFolder)))
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  const setMvpFolder = useCallback(async (name, folder) => {
    const saved = await upsertMvpFolder({
      name: normalizeStoryMvp(name),
      folder: folder?.trim() ?? ''
    })
    const normalized = normalizeMvpFolder(saved)

    setMvpFolders(prev => {
      const index = prev.findIndex(item => item.name === normalized.name)
      if (index === -1) return [...prev, normalized]

      const next = [...prev]
      next[index] = normalized
      return next
    })

    return normalized
  }, [])

  const deleteFolder = useCallback(async (name) => {
    const normalizedName = normalizeStoryMvp(name)
    await removeMvpFolder(normalizedName)
    setMvpFolders(prev => prev.filter(item => item.name !== normalizedName))
  }, [])

  return { mvpFolders, loading, error, setMvpFolder, deleteMvpFolder: deleteFolder }
}
