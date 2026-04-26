import { useCallback, useEffect, useState } from 'react'
import {
  createPackageRelease,
  fetchPackageReleases,
  patchPackageRelease,
  removePackageRelease
} from '../api.js'

export function usePackageReleases() {
  const [packageReleases, setPackageReleases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchPackageReleases()
      .then(setPackageReleases)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  const addPackageRelease = useCallback(async (data) => {
    const packageRelease = await createPackageRelease(data)
    setPackageReleases(prev => [...prev, packageRelease])
    return packageRelease
  }, [])

  const updatePackageRelease = useCallback(async (id, changes) => {
    const packageRelease = await patchPackageRelease(id, changes)
    setPackageReleases(prev => prev.map(item => (item.id === id ? packageRelease : item)))
    return packageRelease
  }, [])

  const deletePackageRelease = useCallback(async (id) => {
    await removePackageRelease(id)
    setPackageReleases(prev => prev.filter(item => item.id !== id))
  }, [])

  return {
    packageReleases,
    loading,
    error,
    addPackageRelease,
    updatePackageRelease,
    deletePackageRelease
  }
}
