import { useEffect, useState } from 'react'
import { compareStories, getStoryStatusMeta } from '../utils/storyStatus.js'
import { compareStoryGroups, normalizeStoryMvp } from '../utils/storyMvp.js'

function StoryCard({ story, onEdit, onDelete }) {
  const statusMeta = getStoryStatusMeta(story.status)

  return (
    <article className="flex min-h-28 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <a
            href={story.link}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold leading-snug text-slate-800 underline decoration-slate-200 underline-offset-4 transition-colors hover:text-indigo-700"
          >
            {story.title}
          </a>
          <span className={`shrink-0 rounded-full border px-2 py-1 text-[11px] font-medium ${statusMeta.className}`}>
            {statusMeta.label}
          </span>
        </div>
        <a
          href={story.link}
          target="_blank"
          rel="noreferrer"
          className="block truncate text-xs text-slate-500 transition-colors hover:text-slate-700"
        >
          {story.link}
        </a>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1">
        <button
          type="button"
          aria-label={`Edit story ${story.title}`}
          onClick={() => onEdit(story)}
          className="rounded-lg px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          Edit
        </button>
        <button
          type="button"
          aria-label={`Delete story ${story.title}`}
          onClick={() => onDelete(story.id)}
          className="rounded-lg px-2 py-1 text-xs text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
        >
          Delete
        </button>
      </div>
    </article>
  )
}

function groupStoriesByMvp(stories) {
  const groups = new Map()

  stories.forEach(story => {
    const mvp = normalizeStoryMvp(story.mvp)
    const current = groups.get(mvp) ?? { name: mvp, stories: [], lastUpdated: 0 }
    const updatedAt = story.updatedAt ? new Date(story.updatedAt).getTime() : 0

    current.stories.push({ ...story, mvp })
    current.lastUpdated = Math.max(current.lastUpdated, updatedAt)
    groups.set(mvp, current)
  })

  return [...groups.values()]
    .map(group => ({
      ...group,
      stories: [...group.stories].sort(compareStories)
    }))
    .sort(compareStoryGroups)
}

export default function StoryPanel({ stories, onAdd, onEdit, onDelete }) {
  const groups = groupStoriesByMvp(stories)
  const [activeMvp, setActiveMvp] = useState('')
  const activeGroup = groups.find(group => group.name === activeMvp) ?? groups[0] ?? null

  useEffect(() => {
    if (groups.length === 0) {
      setActiveMvp('')
      return
    }

    if (!groups.some(group => group.name === activeMvp)) {
      setActiveMvp(groups[0].name)
    }
  }, [activeMvp, groups])

  return (
    <section className="mx-auto w-full max-w-6xl rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Story List</h2>
          <p className="mt-1 text-xs text-slate-500">Switch one MVP at a time so large story lists stay readable.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{groups.length} MVPs</span>
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm">{stories.length} stories</span>
          <button
            type="button"
            onClick={() => onAdd()}
            className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
          >
            Add Story
          </button>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-6 text-center text-sm text-slate-500">
          No stories yet. Add your first MVP and start dropping stories into it.
        </div>
      ) : (
        <div className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current MVP</div>
                <div className="mt-2">
                  {groups.length <= 6 ? (
                    <div className="flex flex-wrap gap-2" role="tablist" aria-label="MVP switcher">
                      {groups.map(group => {
                        const isActive = group.name === activeGroup?.name

                        return (
                          <button
                            key={group.name}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => setActiveMvp(group.name)}
                            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                              isActive
                                ? 'bg-slate-900 text-white'
                                : 'bg-white text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {group.name}
                            <span className={`ml-2 rounded-full px-2 py-0.5 text-[11px] ${isActive ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-500'}`}>
                              {group.stories.length}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="active-mvp" className="mb-1 block text-xs font-medium text-slate-500">MVP</label>
                      <select
                        id="active-mvp"
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
                        value={activeGroup?.name ?? ''}
                        onChange={event => setActiveMvp(event.target.value)}
                      >
                        {groups.map(group => (
                          <option key={group.name} value={group.name}>
                            {group.name} ({group.stories.length})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {activeGroup && (
                <button
                  type="button"
                  aria-label={`Add to ${activeGroup.name}`}
                  onClick={() => onAdd(activeGroup.name)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                >
                  Add to Current MVP
                </button>
              )}
            </div>

            {activeGroup && (
              <>
                <div className="mb-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <div className="text-base font-semibold text-slate-800">{activeGroup.name}</div>
                  <p className="mt-1 text-xs text-slate-500">{activeGroup.stories.length} stories in this MVP</p>
                </div>

                <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                  {activeGroup.stories.map(story => (
                    <StoryCard key={story.id} story={story} onEdit={onEdit} onDelete={onDelete} />
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </section>
  )
}
