import { describe, expect, it } from 'vitest'
import { compareStories, getStoryStatusMeta, normalizeStoryStatus } from '../utils/storyStatus.js'

describe('storyStatus', () => {
  it('maps older status names into the current workflow', () => {
    expect(normalizeStoryStatus('Planned')).toBe('New')
    expect(normalizeStoryStatus('moved to next release')).toBe('Next Release')
    expect(normalizeStoryStatus('ready for dev')).toBe('Ready for Develop')
    expect(normalizeStoryStatus('testing')).toBe('In QA')
  })

  it('sorts stories by workflow stage before updatedAt', () => {
    const stories = [
      { id: 'story-1', status: 'Merged', updatedAt: '2026-04-05T12:00:00Z' },
      { id: 'story-2', status: 'Ready for Develop', updatedAt: '2026-04-05T09:00:00Z' },
      { id: 'story-3', status: 'Ready for Develop', updatedAt: '2026-04-05T13:00:00Z' }
    ]

    const ordered = [...stories].sort(compareStories)

    expect(ordered.map(story => story.id)).toEqual(['story-3', 'story-2', 'story-1'])
  })

  it('returns a fallback badge for unknown statuses', () => {
    expect(getStoryStatusMeta('Waiting on release train')).toMatchObject({
      label: 'Waiting on release train',
      className: 'border-slate-200 bg-slate-50 text-slate-700'
    })
  })
})
