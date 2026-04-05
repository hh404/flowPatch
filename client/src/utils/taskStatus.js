export function normalizeTaskStatus(status) {
  if (status === 'pending') return 'waiting'
  return status ?? 'inbox'
}
