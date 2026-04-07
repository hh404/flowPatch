import { useCallback, useEffect, useState } from 'react'
import { fetchMvpFolders, removeMvpFolder, upsertMvpFolder } from '../api.js'
import { normalizeStoryMvp } from '../utils/storyMvp.js'

function normalizeShortcut(item) {
  return {
    id: typeof item?.id === 'string' ? item.id.trim() : '',
    label: typeof item?.label === 'string' ? item.label.trim() : '',
    title: typeof item?.title === 'string' ? item.title.trim() : ''
  }
}

function normalizeShortcuts(items) {
  if (!Array.isArray(items)) return []

  return items
    .map(normalizeShortcut)
    .filter(item => item.label && item.title)
}

function normalizeMvpFolder(item) {
  return {
    ...item,
    name: normalizeStoryMvp(item?.name),
    folder: typeof item?.folder === 'string' ? item.folder.trim() : '',
    shortcuts: normalizeShortcuts(item?.shortcuts)
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

  const saveMvpConfig = useCallback(async (name, updates) => {
    const normalizedName = normalizeStoryMvp(name)
    const current = mvpFolders.find(item => item.name === normalizedName) ?? {
      name: normalizedName,
      folder: '',
      shortcuts: []
    }
    const next = normalizeMvpFolder({ ...current, ...updates, name: normalizedName })
    const hasFolder = Boolean(next.folder)
    const hasShortcuts = next.shortcuts.length > 0

    if (!hasFolder && !hasShortcuts) {
      if (mvpFolders.some(item => item.name === normalizedName)) {
        await removeMvpFolder(normalizedName)
        setMvpFolders(prev => prev.filter(item => item.name !== normalizedName))
      }

      return next
    }

    const payload = { name: normalizedName }

    if (Object.prototype.hasOwnProperty.call(updates, 'folder')) {
      payload.folder = next.folder
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'shortcuts')) {
      payload.shortcuts = next.shortcuts
    }

    const saved = await upsertMvpFolder(payload)
    const normalized = normalizeMvpFolder(saved)

    setMvpFolders(prev => {
      const index = prev.findIndex(item => item.name === normalized.name)
      if (index === -1) return [...prev, normalized]

      const next = [...prev]
      next[index] = normalized
      return next
    })

    return normalized
  }, [mvpFolders])

  const setMvpFolder = useCallback(async (name, folder) => (
    saveMvpConfig(name, { folder: folder?.trim() ?? '' })
  ), [saveMvpConfig])

  const setMvpShortcuts = useCallback(async (name, shortcuts) => (
    saveMvpConfig(name, { shortcuts: normalizeShortcuts(shortcuts) })
  ), [saveMvpConfig])

  const deleteFolder = useCallback(async (name) => {
    await saveMvpConfig(name, { folder: '' })
  }, [saveMvpConfig])

  return {
    mvpFolders,
    loading,
    error,
    setMvpFolder,
    setMvpShortcuts,
    deleteMvpFolder: deleteFolder
  }
}
