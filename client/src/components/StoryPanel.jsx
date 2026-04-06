import { useEffect, useState } from 'react'
import { openStoryLocalLink } from '../api.js'
import { parseStoryDescription } from '../utils/storyDescription.js'
import { compareStories, getStoryStatusMeta } from '../utils/storyStatus.js'
import { getStoryLinkDisplay, getStoryLinkFullText, isLocalStoryLink } from '../utils/storyLink.js'
import { compareStoryGroups, normalizeStoryMvp } from '../utils/storyMvp.js'

function DescriptionSegment({ segment, onOpenLocalLink }) {
  if (segment.type === 'text') {
    return <span className="whitespace-pre-wrap break-words text-slate-600">{segment.value}</span>
  }

  if (segment.local) {
    return (
      <span className="inline-flex max-w-full min-w-0 items-center gap-1 rounded-md bg-sky-50 px-2 py-1 text-sky-700">
        <button
          type="button"
          title={getStoryLinkFullText(segment.target)}
          onClick={() => onOpenLocalLink(segment.target, 'open')}
          className="min-w-0 max-w-full truncate font-medium underline decoration-sky-200 underline-offset-4"
        >
          {segment.label}
        </button>
        <button
          type="button"
          aria-label={`Reveal ${segment.label}`}
          onClick={() => onOpenLocalLink(segment.target, 'reveal')}
          className="rounded-full border border-sky-200 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide transition-colors hover:bg-white"
        >
          Reveal
        </button>
      </span>
    )
  }

  return (
    <a
      href={segment.target}
      target="_blank"
      rel="noreferrer"
      title={getStoryLinkFullText(segment.target)}
      className="inline-flex max-w-full min-w-0 items-center truncate rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 transition-colors hover:bg-slate-200"
    >
      {segment.label}
    </a>
  )
}

function DescriptionBlock({ description, onOpenLocalLink }) {
  const lines = parseStoryDescription(description)
  if (lines.length === 0) return null

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Description</div>
      <div className="min-w-0 space-y-1 text-sm leading-6">
        {lines.map((line, lineIndex) => (
          line.length === 0
            ? <div key={`line-${lineIndex}`} className="h-3" />
            : (
              <div key={`line-${lineIndex}`} className="flex min-w-0 flex-wrap items-center gap-1.5">
                {line.map((segment, segmentIndex) => (
                  <DescriptionSegment
                    key={`segment-${lineIndex}-${segmentIndex}`}
                    segment={segment}
                    onOpenLocalLink={onOpenLocalLink}
                  />
                ))}
              </div>
              )
        ))}
      </div>
    </div>
  )
}

function StoryCard({ story, onEdit, onDelete, onOpenLocalLink }) {
  const statusMeta = getStoryStatusMeta(story.status)
  const localLink = isLocalStoryLink(story.link)
  const displayLink = getStoryLinkDisplay(story.link)
  const fullLinkText = getStoryLinkFullText(story.link)
  const folderPath = story.folder?.trim() ?? ''
  const folderDisplay = folderPath ? getStoryLinkDisplay(folderPath) : ''
  const fullFolderText = folderPath ? getStoryLinkFullText(folderPath) : ''

  return (
    <article className="flex min-h-28 min-w-0 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="min-w-0 space-y-2">
        <div className="flex min-w-0 items-start justify-between gap-3">
          {localLink ? (
            <button
              type="button"
              title={story.title}
              onClick={() => onOpenLocalLink(story.link, 'open')}
              className="min-w-0 flex-1 truncate text-left text-sm font-semibold leading-snug text-slate-800 underline decoration-slate-200 underline-offset-4 transition-colors hover:text-indigo-700"
            >
              {story.title}
            </button>
          ) : (
            <a
              href={story.link}
              target="_blank"
              rel="noreferrer"
              title={story.title}
              className="min-w-0 flex-1 truncate text-sm font-semibold leading-snug text-slate-800 underline decoration-slate-200 underline-offset-4 transition-colors hover:text-indigo-700"
            >
              {story.title}
            </a>
          )}
          <span className={`shrink-0 rounded-full border px-2 py-1 text-[11px] font-medium ${statusMeta.className}`}>
            {statusMeta.label}
          </span>
        </div>
        {localLink ? (
          <button
            type="button"
            title={fullLinkText}
            onClick={() => onOpenLocalLink(story.link, 'reveal')}
            className="block max-w-full truncate text-left font-mono text-xs text-slate-500 transition-colors hover:text-slate-700"
          >
            {displayLink}
          </button>
        ) : (
          <a
            href={story.link}
            target="_blank"
            rel="noreferrer"
            title={fullLinkText}
            className="block max-w-full truncate text-xs text-slate-500 transition-colors hover:text-slate-700"
          >
            {displayLink}
          </a>
        )}
        <DescriptionBlock description={story.description} onOpenLocalLink={onOpenLocalLink} />
      </div>

      <div className="mt-3 flex items-center gap-1">
        {localLink && (
          <>
            <button
              type="button"
              aria-label={`Open local path for ${story.title}`}
              onClick={() => onOpenLocalLink(story.link, 'open')}
              className="rounded-lg px-2 py-1 text-xs text-emerald-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
            >
              Open
            </button>
            <button
              type="button"
              aria-label={`Reveal local path for ${story.title}`}
              onClick={() => onOpenLocalLink(story.link, 'reveal')}
              className="rounded-lg px-2 py-1 text-xs text-sky-600 transition-colors hover:bg-sky-50 hover:text-sky-700"
            >
              Reveal
            </button>
          </>
        )}
        {folderPath ? (
          <button
            type="button"
            aria-label={`Open folder for ${story.title}`}
            title={fullFolderText}
            onClick={() => onOpenLocalLink(folderPath, 'open')}
            className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-left text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <span className="block truncate">Folder: {folderDisplay}</span>
          </button>
        ) : (
          <div className="flex-1" />
        )}
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

export default function StoryPanel({
  stories,
  mvpFolders = [],
  onAdd,
  onEdit,
  onDelete,
  onSetMvpFolder,
  onClearMvpFolder
}) {
  const groups = groupStoriesByMvp(stories)
  const [activeMvp, setActiveMvp] = useState('')
  const [localLinkError, setLocalLinkError] = useState('')
  const [mvpFolderPendingAction, setMvpFolderPendingAction] = useState('')
  const activeGroup = groups.find(group => group.name === activeMvp) ?? groups[0] ?? null
  const mvpFolderMap = new Map(
    mvpFolders.map(item => [normalizeStoryMvp(item.name), item.folder?.trim() ?? ''])
  )
  const activeMvpFolder = activeGroup ? (mvpFolderMap.get(activeGroup.name) ?? '') : ''
  const activeMvpFolderDisplay = activeMvpFolder ? getStoryLinkDisplay(activeMvpFolder) : ''
  const activeMvpFolderFullText = activeMvpFolder ? getStoryLinkFullText(activeMvpFolder) : ''

  useEffect(() => {
    if (groups.length === 0) {
      setActiveMvp('')
      return
    }

    if (!groups.some(group => group.name === activeMvp)) {
      setActiveMvp(groups[0].name)
    }
  }, [activeMvp, groups])

  async function handleOpenLocalLink(link, action) {
    try {
      await openStoryLocalLink(link, action)
      setLocalLinkError('')
    } catch {
      setLocalLinkError(action === 'reveal'
        ? 'Could not reveal the local path. Check that the file or folder still exists.'
        : 'Could not open the local path. Check that the file or folder still exists.'
      )
    }
  }

  async function handleSetActiveMvpFolder() {
    if (!activeGroup || !onSetMvpFolder) return

    setMvpFolderPendingAction('choose')
    try {
      await onSetMvpFolder(activeGroup.name, activeMvpFolder)
      setLocalLinkError('')
    } catch {
      setLocalLinkError('Could not set the MVP folder. Check that the folder picker is available.')
    } finally {
      setMvpFolderPendingAction('')
    }
  }

  async function handleClearActiveMvpFolder() {
    if (!activeGroup || !activeMvpFolder || !onClearMvpFolder) return

    setMvpFolderPendingAction('clear')
    try {
      await onClearMvpFolder(activeGroup.name)
      setLocalLinkError('')
    } catch {
      setLocalLinkError('Could not clear the MVP folder.')
    } finally {
      setMvpFolderPendingAction('')
    }
  }

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

      {localLinkError && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <span>{localLinkError}</span>
          <button
            type="button"
            onClick={() => setLocalLinkError('')}
            className="rounded-full border border-rose-200 px-3 py-1 text-xs font-medium transition-colors hover:bg-white"
          >
            Dismiss
          </button>
        </div>
      )}

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
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {activeMvpFolder ? (
                      <button
                        type="button"
                        aria-label={`Open folder for ${activeGroup.name}`}
                        title={activeMvpFolderFullText}
                        onClick={() => handleOpenLocalLink(activeMvpFolder, 'open')}
                        className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
                      >
                        <span className="block truncate">MVP Folder: {activeMvpFolderDisplay}</span>
                      </button>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-500">
                        No MVP folder linked yet.
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleSetActiveMvpFolder}
                      disabled={!activeGroup || mvpFolderPendingAction !== ''}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-wait disabled:opacity-60"
                    >
                      {mvpFolderPendingAction === 'choose' ? 'Choosing…' : (activeMvpFolder ? 'Change MVP Folder' : 'Choose MVP Folder')}
                    </button>
                    <button
                      type="button"
                      onClick={handleClearActiveMvpFolder}
                      disabled={!activeMvpFolder || mvpFolderPendingAction !== ''}
                      className="rounded-lg px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                  {activeGroup.stories.map(story => (
                    <StoryCard
                      key={story.id}
                      story={story}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onOpenLocalLink={handleOpenLocalLink}
                    />
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
