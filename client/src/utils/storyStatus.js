const STORY_STATUS_FLOW = [
  {
    label: 'New',
    aliases: ['planned', 'todo', 'backlog'],
    className: 'border-slate-200 bg-slate-50 text-slate-700'
  },
  {
    label: 'Next Release',
    aliases: ['moved to next release', 'deferred', 'carry over', 'punted'],
    className: 'border-stone-200 bg-stone-50 text-stone-700'
  },
  {
    label: 'Ready for Develop',
    aliases: ['ready', 'ready for dev', 'ready for development'],
    className: 'border-sky-200 bg-sky-50 text-sky-700'
  },
  {
    label: 'In Progress',
    aliases: ['active', 'doing', 'developing', 'dev'],
    className: 'border-blue-200 bg-blue-50 text-blue-700'
  },
  {
    label: 'Blocked',
    aliases: ['on hold', 'hold', 'waiting', 'stuck', 'risk'],
    className: 'border-rose-200 bg-rose-50 text-rose-700'
  },
  {
    label: 'In Review',
    aliases: ['review', 'pr review', 'code review'],
    className: 'border-amber-200 bg-amber-50 text-amber-700'
  },
  {
    label: 'Ready for QA',
    aliases: ['ready for test', 'ready for testing'],
    className: 'border-indigo-200 bg-indigo-50 text-indigo-700'
  },
  {
    label: 'In QA',
    aliases: ['qa', 'testing', 'in testing'],
    className: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700'
  },
  {
    label: 'Done',
    aliases: ['complete', 'completed'],
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700'
  },
  {
    label: 'Merged',
    aliases: [],
    className: 'border-green-200 bg-green-50 text-green-700'
  },
  {
    label: 'Released',
    aliases: ['deployed', 'live', 'production'],
    className: 'border-lime-200 bg-lime-50 text-lime-700'
  }
]

const STORY_STATUS_LOOKUP = new Map()

function normalizeStatusKey(status) {
  return status.trim().toLowerCase().replace(/\s+/g, ' ')
}

STORY_STATUS_FLOW.forEach((status, index) => {
  const meta = { ...status, rank: index }
  const keys = [status.label, ...status.aliases]

  keys.forEach(key => {
    STORY_STATUS_LOOKUP.set(normalizeStatusKey(key), meta)
  })
})

export const STORY_STATUS_OPTIONS = STORY_STATUS_FLOW.map(status => status.label)
export const DEFAULT_STORY_STATUS = 'Ready for Develop'

function getStatusMeta(status) {
  const trimmed = status?.trim()
  if (!trimmed) return null
  return STORY_STATUS_LOOKUP.get(normalizeStatusKey(trimmed)) ?? null
}

export function normalizeStoryStatus(status) {
  const trimmed = status?.trim()
  if (!trimmed) return DEFAULT_STORY_STATUS

  return getStatusMeta(trimmed)?.label ?? trimmed
}

export function getStoryStatusMeta(status) {
  const normalized = normalizeStoryStatus(status)
  const matched = getStatusMeta(normalized)

  return {
    label: normalized,
    rank: matched?.rank ?? STORY_STATUS_FLOW.length,
    className: matched?.className ?? 'border-slate-200 bg-slate-50 text-slate-700'
  }
}

export function compareStories(left, right) {
  const rankDiff = getStoryStatusMeta(left.status).rank - getStoryStatusMeta(right.status).rank
  if (rankDiff !== 0) return rankDiff

  const leftUpdated = left.updatedAt ? new Date(left.updatedAt).getTime() : 0
  const rightUpdated = right.updatedAt ? new Date(right.updatedAt).getTime() : 0
  return rightUpdated - leftUpdated
}
