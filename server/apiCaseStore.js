import { mkdir, readFile, readdir, writeFile } from 'fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DEFAULT_CASES_ROOT_DIR = join(__dirname, 'data', 'api-cases')
const DEFAULT_CONFIG_FILE = join(__dirname, 'data', 'apiCaseConfig.json')
const REQUEST_FILE_PATTERN = /^request--(.+)--(\d{8,})\.json$/
const RESPONSE_FILE_PATTERN = /^response--(.+)--(\d{8,})\.json$/

function configFile() {
  return process.env.API_CASES_CONFIG_FILE ?? DEFAULT_CONFIG_FILE
}

async function readJson(file, fallback) {
  try {
    const raw = await readFile(file, 'utf8')
    return JSON.parse(raw)
  } catch (error) {
    if (error.code === 'ENOENT') return fallback
    throw error
  }
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value
}

function normalizeIndex(value) {
  const doc = normalizeObject(value)
  const cases = normalizeObject(doc.cases)

  return {
    id: normalizeText(doc.id),
    name: normalizeText(doc.name),
    method: normalizeText(doc.method),
    path: normalizeText(doc.path),
    cases
  }
}

function normalizeConfig(value) {
  const doc = normalizeObject(value)
  return {
    rootDir: normalizeText(doc.rootDir)
  }
}

export async function readApiCaseConfig() {
  return normalizeConfig(await readJson(configFile(), {}))
}

export async function writeApiCaseConfig(config) {
  const file = configFile()
  const normalized = normalizeConfig(config)
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, JSON.stringify(normalized, null, 2), 'utf8')
  return normalized
}

export async function getApiCasesRootDir() {
  const envRoot = normalizeText(process.env.API_CASES_ROOT_DIR)
  if (envRoot) return envRoot

  const config = await readApiCaseConfig()
  if (config.rootDir) return config.rootDir

  return DEFAULT_CASES_ROOT_DIR
}

export async function setApiCasesRootDir(rootDir) {
  const normalized = normalizeText(rootDir)
  if (!normalized) {
    throw new Error('rootDir required')
  }

  const config = await writeApiCaseConfig({ rootDir: normalized })
  return config.rootDir
}

function normalizeCaseMeta(value) {
  const item = normalizeObject(value)
  return {
    name: normalizeText(item.name),
    description: normalizeText(item.desc || item.description),
    bau: normalizeText(item.bau),
    current: normalizeText(item.current)
  }
}

function buildVersionList(caseVersions, aliases) {
  const timestamps = [...caseVersions.keys()].sort((left, right) => left.localeCompare(right))

  if (timestamps.length === 0) {
    return {
      versions: [],
      bauVersion: aliases.bau || '',
      currentVersion: aliases.current || '',
      currentPayload: { request: null, response: null },
      bauPayload: { request: null, response: null }
    }
  }

  const first = timestamps[0]
  const latest = timestamps[timestamps.length - 1]
  const bauVersion = caseVersions.has(aliases.bau) ? aliases.bau : first
  const currentVersion = caseVersions.has(aliases.current) ? aliases.current : latest

  const versions = timestamps
    .map(timestamp => {
      const payload = caseVersions.get(timestamp) || {}
      return {
        timestamp,
        request: payload.request ?? null,
        response: payload.response ?? null,
        isBau: timestamp === bauVersion,
        isCurrent: timestamp === currentVersion
      }
    })
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp))

  const currentPayload = caseVersions.get(currentVersion) || {}
  const bauPayload = caseVersions.get(bauVersion) || {}

  return {
    versions,
    bauVersion,
    currentVersion,
    currentPayload: {
      request: currentPayload.request ?? null,
      response: currentPayload.response ?? null
    },
    bauPayload: {
      request: bauPayload.request ?? null,
      response: bauPayload.response ?? null
    }
  }
}

async function readApiFolder(folderPath, folderName) {
  const [indexDoc, folderEntries] = await Promise.all([
    readJson(join(folderPath, '_index.json'), {}),
    readdir(folderPath, { withFileTypes: true })
  ])

  const index = normalizeIndex(indexDoc)
  const casesFromIndex = Object.entries(index.cases).reduce((result, [caseId, meta]) => {
    const normalizedId = normalizeText(caseId)
    if (!normalizedId) return result
    result.set(normalizedId, normalizeCaseMeta(meta))
    return result
  }, new Map())

  const versionMap = new Map()

  for (const entry of folderEntries) {
    if (!entry.isFile()) continue

    const requestMatch = entry.name.match(REQUEST_FILE_PATTERN)
    const responseMatch = entry.name.match(RESPONSE_FILE_PATTERN)
    const match = requestMatch || responseMatch
    if (!match) continue

    const [, rawCaseId, timestamp] = match
    const caseId = normalizeText(rawCaseId)
    if (!caseId) continue

    const isRequest = Boolean(requestMatch)
    const payload = await readJson(join(folderPath, entry.name), null)

    if (!versionMap.has(caseId)) versionMap.set(caseId, new Map())
    const caseVersions = versionMap.get(caseId)
    const versionPayload = caseVersions.get(timestamp) ?? {}
    caseVersions.set(timestamp, {
      ...versionPayload,
      ...(isRequest ? { request: payload } : { response: payload })
    })
  }

  const allCaseIds = [...new Set([...casesFromIndex.keys(), ...versionMap.keys()])].sort((left, right) => left.localeCompare(right))
  const cases = allCaseIds.map(caseId => {
    const meta = casesFromIndex.get(caseId) ?? { name: '', description: '', bau: '', current: '' }
    const caseVersions = versionMap.get(caseId) ?? new Map()
    const details = buildVersionList(caseVersions, { bau: meta.bau, current: meta.current })

    return {
      id: caseId,
      name: meta.name || caseId,
      description: meta.description,
      bauVersion: details.bauVersion,
      currentVersion: details.currentVersion,
      versions: details.versions,
      request: details.currentPayload.request,
      response: details.currentPayload.response,
      bauRequest: details.bauPayload.request,
      bauResponse: details.bauPayload.response
    }
  })

  return {
    id: index.id || folderName,
    name: index.name || folderName,
    method: index.method,
    path: index.path,
    cases
  }
}

export async function readApiCaseInterfaces() {
  const baseDir = await getApiCasesRootDir()

  const entries = await readdir(baseDir, { withFileTypes: true }).catch(error => {
    if (error.code === 'ENOENT') return []
    throw error
  })

  const folders = entries
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort((left, right) => left.localeCompare(right))

  const interfaces = []
  for (const folderName of folders) {
    interfaces.push(await readApiFolder(join(baseDir, folderName), folderName))
  }

  return interfaces
}
