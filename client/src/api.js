const BASE = '/api/tasks'

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
