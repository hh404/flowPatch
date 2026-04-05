const PRIORITY_RANK = {
  high: 0,
  medium: 1,
  low: 2
}

export function normalizePriority(priority) {
  return Object.hasOwn(PRIORITY_RANK, priority) ? priority : 'medium'
}

export function compareTasksByPriority(left, right) {
  const rankDiff = PRIORITY_RANK[normalizePriority(left.priority)] - PRIORITY_RANK[normalizePriority(right.priority)]
  if (rankDiff !== 0) return rankDiff

  const leftReminder = left.remindAt ? new Date(left.remindAt).getTime() : Number.POSITIVE_INFINITY
  const rightReminder = right.remindAt ? new Date(right.remindAt).getTime() : Number.POSITIVE_INFINITY
  if (leftReminder !== rightReminder) return leftReminder - rightReminder

  const leftUpdated = left.updatedAt ? new Date(left.updatedAt).getTime() : 0
  const rightUpdated = right.updatedAt ? new Date(right.updatedAt).getTime() : 0
  return rightUpdated - leftUpdated
}
