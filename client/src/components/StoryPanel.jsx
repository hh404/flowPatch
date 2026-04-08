import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { openOutlookSearch, openStoryLocalLink } from '../api.js'
import { parseStoryDescription } from '../utils/storyDescription.js'
import { compareStories, getStoryStatusMeta } from '../utils/storyStatus.js'
import { findTailTruncatedText, getStoryLinkDisplay, getStoryLinkFullText, isLocalStoryLink } from '../utils/storyLink.js'
import { compareStoryGroups, normalizeStoryMvp } from '../utils/storyMvp.js'

const PANEL_TABS = {
  stories: 'stories',
  shortcuts: 'shortcuts'
}

function createShortcutDraft(shortcut = null) {
  return {
    id: shortcut?.id ?? '',
    label: shortcut?.label ?? '',
    title: shortcut?.title ?? ''
  }
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'absolute'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()

  try {
    const copied = document.execCommand('copy')
    if (!copied) throw new Error('copy failed')
  } finally {
    document.body.removeChild(textarea)
  }
}

function TailPriorityText({ text, className = '' }) {
  const containerRef = useRef(null)
  const measureRef = useRef(null)
  const [displayText, setDisplayText] = useState(text)

  useLayoutEffect(() => {
    const container = containerRef.current
    const measure = measureRef.current

    if (!container || !measure) {
      setDisplayText(text)
      return
    }

    function updateDisplayText() {
      const availableWidth = container.clientWidth

      if (!availableWidth) {
        setDisplayText(text)
        return
      }

      const nextText = findTailTruncatedText(text, candidate => {
        measure.textContent = candidate
        return measure.scrollWidth <= availableWidth
      })

      setDisplayText(nextText)
    }

    updateDisplayText()

    if (typeof ResizeObserver === 'undefined') {
      return undefined
    }

    const observer = new ResizeObserver(() => {
      updateDisplayText()
    })

    observer.observe(container)

    return () => observer.disconnect()
  }, [text])

  return (
    <span ref={containerRef} className={`relative block max-w-full overflow-hidden whitespace-nowrap ${className}`}>
      <span className="block">{displayText}</span>
      <span
        ref={measureRef}
        aria-hidden="true"
        className="pointer-events-none absolute invisible whitespace-nowrap"
      />
    </span>
  )
}

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

function StoryCard({ story, onEdit, onDelete, onOpenLocalLink, onCopyBranch }) {
  const statusMeta = getStoryStatusMeta(story.status)
  const localLink = isLocalStoryLink(story.link)
  const displayLink = getStoryLinkDisplay(story.link)
  const fullLinkText = getStoryLinkFullText(story.link)
  const branch = story.branch?.trim() ?? ''
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
          <div className="min-w-0">
            <button
              type="button"
              title={fullLinkText}
              onClick={() => onOpenLocalLink(story.link, 'reveal')}
              className="inline-block max-w-full overflow-hidden rounded-full bg-white/70 px-2 py-1 text-left text-[11px] font-mono text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800"
            >
              <span className="block truncate">{displayLink}</span>
            </button>
          </div>
        ) : (
          <div className="min-w-0">
            <a
              href={story.link}
              target="_blank"
              rel="noreferrer"
              title={fullLinkText}
              className="inline-block max-w-full overflow-hidden rounded-full bg-white/70 px-2 py-1 text-[11px] font-mono text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800"
            >
              <TailPriorityText text={displayLink} />
            </a>
          </div>
        )}
        {branch && (
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              title={branch}
              aria-label={`Copy branch for ${story.title}`}
              onClick={() => onCopyBranch(branch)}
              className="inline-flex min-w-0 max-w-full items-center gap-1 rounded-full bg-violet-50 px-2 py-1 text-[11px] text-violet-700 transition-colors hover:bg-violet-100"
            >
              <span className="shrink-0 font-semibold uppercase tracking-wide text-violet-500">Branch</span>
              <span className="min-w-0 truncate font-mono">{branch}</span>
            </button>
          </div>
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

function ShortcutCard({ shortcut, isBusy, onRun, onEdit, onDelete }) {
  return (
    <article className="flex min-h-40 min-w-0 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-slate-800">{shortcut.label}</h3>
            <p className="mt-1 text-xs text-slate-500">Copies this title, then activates Outlook.</p>
          </div>
          <span className="shrink-0 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700">
            Outlook
          </span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Search Title</div>
          <div className="mt-1 break-words font-mono text-xs text-slate-700">{shortcut.title}</div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onRun(shortcut)}
          disabled={isBusy}
          className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-wait disabled:opacity-60"
        >
          {isBusy ? 'Opening…' : 'Open Outlook + Copy'}
        </button>
        <button
          type="button"
          onClick={() => onEdit(shortcut)}
          disabled={isBusy}
          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(shortcut.id)}
          disabled={isBusy}
          className="rounded-lg px-3 py-2 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </article>
  )
}

function groupStoriesByMvp(stories, mvpFolders) {
  const groups = new Map()

  stories.forEach(story => {
    const mvp = normalizeStoryMvp(story.mvp)
    const current = groups.get(mvp) ?? { name: mvp, stories: [], lastUpdated: 0 }
    const updatedAt = story.updatedAt ? new Date(story.updatedAt).getTime() : 0

    current.stories.push({ ...story, mvp })
    current.lastUpdated = Math.max(current.lastUpdated, updatedAt)
    groups.set(mvp, current)
  })

  mvpFolders.forEach(item => {
    const mvp = normalizeStoryMvp(item.name)
    if (!mvp) return

    const current = groups.get(mvp) ?? { name: mvp, stories: [], lastUpdated: 0 }
    const updatedAt = item.updatedAt ? new Date(item.updatedAt).getTime() : 0

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
  onClearMvpFolder,
  onSetMvpShortcuts
}) {
  const groups = groupStoriesByMvp(stories, mvpFolders)
  const [activeMvp, setActiveMvp] = useState('')
  const [activePanelTab, setActivePanelTab] = useState(PANEL_TABS.stories)
  const [panelError, setPanelError] = useState('')
  const [panelStatus, setPanelStatus] = useState('')
  const [mvpFolderPendingAction, setMvpFolderPendingAction] = useState('')
  const [shortcutPendingAction, setShortcutPendingAction] = useState('')
  const [shortcutDraft, setShortcutDraft] = useState(createShortcutDraft())
  const activeGroup = groups.find(group => group.name === activeMvp) ?? groups[0] ?? null
  const mvpConfigMap = new Map(
    mvpFolders.map(item => [normalizeStoryMvp(item.name), item])
  )
  const activeMvpConfig = activeGroup ? mvpConfigMap.get(activeGroup.name) ?? null : null
  const activeMvpFolder = activeMvpConfig?.folder?.trim() ?? ''
  const activeShortcuts = activeMvpConfig?.shortcuts ?? []
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

  useEffect(() => {
    setShortcutDraft(createShortcutDraft())
  }, [activeGroup?.name])

  useEffect(() => {
    if (!panelStatus) return undefined

    const timer = window.setTimeout(() => {
      setPanelStatus('')
    }, 2200)

    return () => window.clearTimeout(timer)
  }, [panelStatus])

  async function handleOpenLocalLink(link, action) {
    try {
      await openStoryLocalLink(link, action)
      setPanelError('')
    } catch {
      setPanelError(action === 'reveal'
        ? 'Could not reveal the local path. Check that the file or folder still exists.'
        : 'Could not open the local path. Check that the file or folder still exists.'
      )
    }
  }

  async function handleCopyBranch(branch) {
    try {
      await copyTextToClipboard(branch)
      setPanelError('')
      setPanelStatus(`Copied branch "${branch}".`)
    } catch {
      setPanelError('Could not copy the branch name.')
    }
  }

  async function handleSetActiveMvpFolder() {
    if (!activeGroup || !onSetMvpFolder) return

    setMvpFolderPendingAction('choose')
    try {
      await onSetMvpFolder(activeGroup.name, activeMvpFolder)
      setPanelError('')
      setPanelStatus('MVP folder updated.')
    } catch {
      setPanelError('Could not set the MVP folder. Check that the folder picker is available.')
    } finally {
      setMvpFolderPendingAction('')
    }
  }

  async function handleClearActiveMvpFolder() {
    if (!activeGroup || !activeMvpFolder || !onClearMvpFolder) return

    setMvpFolderPendingAction('clear')
    try {
      await onClearMvpFolder(activeGroup.name)
      setPanelError('')
      setPanelStatus('MVP folder cleared.')
    } catch {
      setPanelError('Could not clear the MVP folder.')
    } finally {
      setMvpFolderPendingAction('')
    }
  }

  function startEditingShortcut(shortcut) {
    setShortcutDraft(createShortcutDraft(shortcut))
    setPanelError('')
    setPanelStatus('')
  }

  function resetShortcutDraft() {
    setShortcutDraft(createShortcutDraft())
  }

  async function handleSaveShortcut(event) {
    event.preventDefault()
    if (!activeGroup || !onSetMvpShortcuts) return

    const label = shortcutDraft.label.trim()
    const title = shortcutDraft.title.trim()

    if (!label || !title) {
      setPanelError('Shortcut name and search title are required.')
      return
    }

    const nextShortcuts = shortcutDraft.id
      ? activeShortcuts.map(shortcut => (
        shortcut.id === shortcutDraft.id ? { ...shortcut, label, title } : shortcut
      ))
      : [...activeShortcuts, { label, title }]

    setShortcutPendingAction('save')
    try {
      await onSetMvpShortcuts(activeGroup.name, nextShortcuts)
      setPanelError('')
      setPanelStatus(shortcutDraft.id ? 'Shortcut updated.' : 'Shortcut added.')
      resetShortcutDraft()
    } catch {
      setPanelError('Could not save the shortcut.')
    } finally {
      setShortcutPendingAction('')
    }
  }

  async function handleDeleteShortcut(shortcutId) {
    if (!activeGroup || !onSetMvpShortcuts) return

    setShortcutPendingAction(`delete:${shortcutId}`)
    try {
      await onSetMvpShortcuts(
        activeGroup.name,
        activeShortcuts.filter(shortcut => shortcut.id !== shortcutId)
      )
      setPanelError('')
      setPanelStatus('Shortcut removed.')

      if (shortcutDraft.id === shortcutId) {
        resetShortcutDraft()
      }
    } catch {
      setPanelError('Could not delete the shortcut.')
    } finally {
      setShortcutPendingAction('')
    }
  }

  async function handleRunShortcut(shortcut) {
    setShortcutPendingAction(`run:${shortcut.id}`)
    try {
      await openOutlookSearch(shortcut.title)
      setPanelError('')
      setPanelStatus(`Copied "${shortcut.title}" and opened Outlook.`)
    } catch {
      setPanelError('Could not open Outlook or copy the search title.')
    } finally {
      setShortcutPendingAction('')
    }
  }

  return (
    <section className="mx-auto w-full max-w-6xl rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Story List</h2>
          <p className="mt-1 text-xs text-slate-500">Switch between stories and saved shortcuts for the current MVP.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center rounded-full bg-slate-100 p-1" role="tablist" aria-label="Story panel sections">
            {[
              { key: PANEL_TABS.stories, label: 'Stories' },
              { key: PANEL_TABS.shortcuts, label: 'Shortcuts' }
            ].map(tab => {
              const isActive = activePanelTab === tab.key

              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActivePanelTab(tab.key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
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

      {panelError && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <span>{panelError}</span>
          <button
            type="button"
            onClick={() => setPanelError('')}
            className="rounded-full border border-rose-200 px-3 py-1 text-xs font-medium transition-colors hover:bg-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {panelStatus && (
        <div className="pointer-events-none fixed right-4 top-4 z-[60]">
          <div
            role="status"
            aria-live="polite"
            className="rounded-2xl border border-emerald-200 bg-emerald-50/95 px-4 py-3 text-sm text-emerald-700 shadow-lg shadow-emerald-900/10 backdrop-blur"
          >
            {panelStatus}
          </div>
        </div>
      )}

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-6 text-center text-sm text-slate-500">
          No stories or shortcuts yet. Add your first MVP and save the search terms you never want to memorize again.
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

              {activeGroup && activePanelTab === PANEL_TABS.stories && (
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
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold text-slate-800">{activeGroup.name}</div>
                      <p className="mt-1 text-xs text-slate-500">
                        {activeGroup.stories.length} stories and {activeShortcuts.length} shortcuts in this MVP
                      </p>
                    </div>
                    {activePanelTab === PANEL_TABS.shortcuts && (
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                        Outlook shortcuts
                      </span>
                    )}
                  </div>
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

                {activePanelTab === PANEL_TABS.stories ? (
                  activeGroup.stories.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
                      No stories in this MVP yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                      {activeGroup.stories.map(story => (
                        <StoryCard
                          key={story.id}
                          story={story}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          onOpenLocalLink={handleOpenLocalLink}
                          onCopyBranch={handleCopyBranch}
                        />
                      ))}
                    </div>
                  )
                ) : (
                  <div className="space-y-4">
                    {activeShortcuts.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
                        No shortcuts yet. Save the random mailbox title here and let the button copy it for Outlook.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                        {activeShortcuts.map(shortcut => (
                          <ShortcutCard
                            key={shortcut.id}
                            shortcut={shortcut}
                            isBusy={shortcutPendingAction !== ''}
                            onRun={handleRunShortcut}
                            onEdit={startEditingShortcut}
                            onDelete={handleDeleteShortcut}
                          />
                        ))}
                      </div>
                    )}

                    <form onSubmit={handleSaveShortcut} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-800">
                            {shortcutDraft.id ? 'Edit Shortcut' : 'New Shortcut'}
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">Use a friendly label, but save the exact title you want copied to the clipboard.</p>
                        </div>
                        {shortcutDraft.id && (
                          <button
                            type="button"
                            onClick={resetShortcutDraft}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
                          >
                            Cancel Edit
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <label className="block">
                          <span className="mb-1 block text-xs font-medium text-slate-600">Shortcut Name</span>
                          <input
                            type="text"
                            value={shortcutDraft.label}
                            onChange={event => setShortcutDraft(current => ({ ...current, label: event.target.value }))}
                            placeholder="Mailing List"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-xs font-medium text-slate-600">Search Title</span>
                          <input
                            type="text"
                            value={shortcutDraft.title}
                            onChange={event => setShortcutDraft(current => ({ ...current, title: event.target.value }))}
                            placeholder="mvp3 package notification"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
                          />
                        </label>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          type="submit"
                          disabled={shortcutPendingAction !== ''}
                          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-wait disabled:opacity-60"
                        >
                          {shortcutPendingAction === 'save'
                            ? 'Saving…'
                            : (shortcutDraft.id ? 'Save Shortcut' : 'Add Shortcut')}
                        </button>
                        <span className="text-xs text-slate-500">Clicking the shortcut button will open Outlook and leave this title on your clipboard.</span>
                      </div>
                    </form>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </section>
  )
}
