import { useEffect, useState } from 'react'
import {
  fetchApiCases,
  fetchApiCasesConfig,
  selectApiCasesRoot,
  updateApiCasesConfig
} from '../api.js'

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeVersion(item = {}) {
  return {
    timestamp: normalizeText(item.timestamp),
    request: item.request ?? null,
    response: item.response ?? null,
    isBau: Boolean(item.isBau),
    isCurrent: Boolean(item.isCurrent)
  }
}

function normalizeCase(item = {}) {
  return {
    id: normalizeText(item.id),
    name: normalizeText(item.name),
    description: normalizeText(item.description),
    bauVersion: normalizeText(item.bauVersion),
    currentVersion: normalizeText(item.currentVersion),
    request: item.request ?? null,
    response: item.response ?? null,
    bauRequest: item.bauRequest ?? null,
    bauResponse: item.bauResponse ?? null,
    versions: Array.isArray(item.versions)
      ? item.versions.map(normalizeVersion).filter(version => version.timestamp)
      : []
  }
}

function normalizeInterface(item = {}) {
  return {
    id: normalizeText(item.id),
    name: normalizeText(item.name),
    method: normalizeText(item.method),
    path: normalizeText(item.path),
    cases: Array.isArray(item.cases)
      ? item.cases.map(normalizeCase).filter(testCase => testCase.id)
      : []
  }
}

export function useApiCases() {
  const [interfaces, setInterfaces] = useState([])
  const [rootDir, setRootDir] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function reload() {
    setLoading(true)
    setError(null)

    try {
      const [config, items] = await Promise.all([
        fetchApiCasesConfig(),
        fetchApiCases()
      ])

      setRootDir(normalizeText(config?.rootDir))
      setInterfaces(Array.isArray(items) ? items.map(normalizeInterface) : [])
    } catch (event) {
      setError(event)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [])

  async function setApiCasesRoot(rootPath) {
    await updateApiCasesConfig(rootPath)
    await reload()
  }

  async function chooseApiCasesRoot(currentPath = '') {
    await selectApiCasesRoot(currentPath)
    await reload()
  }

  return {
    interfaces,
    rootDir,
    loading,
    error,
    reload,
    setApiCasesRoot,
    chooseApiCasesRoot
  }
}
