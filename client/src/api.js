const BASE = '/api/tasks'
const MVPS_BASE = '/api/mvps'
const STORIES_BASE = '/api/stories'
const TEST_ACCOUNTS_BASE = '/api/test-accounts'

export async function fetchTasks() {
  const res = await fetch(BASE)
  if (!res.ok) throw new Error('fetch failed')
  return res.json()
}

export async function createTask(data) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('create failed')
  return res.json()
}

export async function patchTask(id, data) {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('patch failed')
  return res.json()
}

export async function removeTask(id) {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('delete failed')
}

export async function fetchStories() {
  const res = await fetch(STORIES_BASE)
  if (!res.ok) throw new Error('fetch stories failed')
  return res.json()
}

export async function fetchMvpFolders() {
  const res = await fetch(MVPS_BASE)
  if (!res.ok) throw new Error('fetch mvp folders failed')
  return res.json()
}

export async function upsertMvpFolder(data) {
  const res = await fetch(MVPS_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('upsert mvp folder failed')
  return res.json()
}

export async function removeMvpFolder(name) {
  const res = await fetch(`${MVPS_BASE}/${encodeURIComponent(name)}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('delete mvp folder failed')
}

export async function openOutlookSearch(title) {
  const res = await fetch(`${MVPS_BASE}/open-outlook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title })
  })

  if (!res.ok) throw new Error('open outlook search failed')
  return res.json()
}

export async function createStory(data) {
  const res = await fetch(STORIES_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('create story failed')
  return res.json()
}

export async function patchStory(id, data) {
  const res = await fetch(`${STORIES_BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('patch story failed')
  return res.json()
}

export async function removeStory(id) {
  const res = await fetch(`${STORIES_BASE}/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('delete story failed')
}

export async function openStoryLocalLink(path, action = 'open') {
  const res = await fetch(`${STORIES_BASE}/open-local`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, action })
  })

  if (!res.ok) throw new Error('open local story link failed')
  return res.json()
}

export async function selectStoryLocalFolder(currentPath = '') {
  const res = await fetch(`${STORIES_BASE}/select-local-folder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPath })
  })

  if (!res.ok) throw new Error('select local story folder failed')
  return res.json()
}

export async function fetchTestAccounts() {
  const res = await fetch(TEST_ACCOUNTS_BASE)
  if (!res.ok) throw new Error('fetch test accounts failed')
  return res.json()
}

export async function createTestAccount(data) {
  const res = await fetch(TEST_ACCOUNTS_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('create test account failed')
  return res.json()
}

export async function patchTestAccount(id, data) {
  const res = await fetch(`${TEST_ACCOUNTS_BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('patch test account failed')
  return res.json()
}

export async function removeTestAccount(id) {
  const res = await fetch(`${TEST_ACCOUNTS_BASE}/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('delete test account failed')
}
