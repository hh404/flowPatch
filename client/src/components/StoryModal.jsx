import { useEffect, useRef, useState } from 'react'
import { selectStoryLocalFolder } from '../api.js'
import { normalizeStoryDescription } from '../utils/storyDescription.js'
import { getStoryLinkDisplay, getStoryLinkFullText } from '../utils/storyLink.js'
import { DEFAULT_STORY_STATUS, normalizeStoryStatus, STORY_STATUS_OPTIONS } from '../utils/storyStatus.js'
import { DEFAULT_STORY_MVP, normalizeStoryMvp } from '../utils/storyMvp.js'

function buildInitialState(story) {
  const status = normalizeStoryStatus(story?.status)

  return {
    mvp: normalizeStoryMvp(story?.mvp),
    title: story?.title ?? '',
    link: story?.link ?? '',
    branch: story?.branch ?? '',
    folder: story?.folder ?? '',
    description: normalizeStoryDescription(story?.description),
    status: STORY_STATUS_OPTIONS.includes(status) ? status : DEFAULT_STORY_STATUS
  }
}

export default function StoryModal({ mode = 'create', initialStory, mvpOptions = [], onConfirm, onClose }) {
  const [form, setForm] = useState(() => buildInitialState(initialStory))
  const [folderPickerPending, setFolderPickerPending] = useState(false)
  const [folderPickerError, setFolderPickerError] = useState('')
  const titleRef = useRef(null)
  const allowBackdropClose = mode !== 'edit'

  useEffect(() => {
    titleRef.current?.focus()
    titleRef.current?.select()
  }, [])

  useEffect(() => {
    setForm(buildInitialState(initialStory))
  }, [initialStory])

  useEffect(() => {
    setFolderPickerError('')
    setFolderPickerPending(false)
  }, [initialStory, mode])

  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleSubmit(event) {
    event.preventDefault()

    const mvp = form.mvp.trim()
    const title = form.title.trim()
    const link = form.link.trim()
    const branch = form.branch.trim()
    const folder = form.folder.trim()
    const description = normalizeStoryDescription(form.description)
    const status = form.status.trim()
    if (!mvp || !title || !link || !status) return

    onConfirm({ mvp, title, link, branch, folder, description, status })
  }

  async function handleChooseFolder() {
    setFolderPickerPending(true)
    setFolderPickerError('')

    try {
      const result = await selectStoryLocalFolder(form.folder)
      setForm(current => ({ ...current, folder: result.path ?? '' }))
    } catch {
      setFolderPickerError('Could not open the folder picker.')
    } finally {
      setFolderPickerPending(false)
    }
  }

  const folderDisplay = form.folder ? getStoryLinkDisplay(form.folder) : ''
  const fullFolderText = form.folder ? getStoryLinkFullText(form.folder) : ''

  return (
    <div
      data-testid="story-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={event => {
        if (allowBackdropClose && event.target === event.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-gray-100 px-5 pb-4 pt-5">
          <h2 className="text-base font-semibold text-gray-800">{mode === 'edit' ? 'Edit Story' : 'Add Story'}</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 pb-5 pt-4">
          <div>
            <label htmlFor="story-mvp" className="mb-1 block text-xs font-medium text-gray-500">MVP</label>
            <input
              id="story-mvp"
              list="story-mvp-suggestions"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={form.mvp}
              onChange={event => setForm(current => ({ ...current, mvp: event.target.value }))}
              placeholder={DEFAULT_STORY_MVP}
            />
            <datalist id="story-mvp-suggestions">
              {mvpOptions.map(mvp => (
                <option key={mvp} value={mvp} />
              ))}
            </datalist>
          </div>

          <div>
            <label htmlFor="story-title" className="mb-1 block text-xs font-medium text-gray-500">Title</label>
            <input
              id="story-title"
              ref={titleRef}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={form.title}
              onChange={event => setForm(current => ({ ...current, title: event.target.value }))}
              placeholder="Story title"
            />
          </div>

          <div>
            <label htmlFor="story-link" className="mb-1 block text-xs font-medium text-gray-500">Link or Path</label>
            <input
              id="story-link"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={form.link}
              onChange={event => setForm(current => ({ ...current, link: event.target.value }))}
              placeholder="https://dev.azure.com/... or /Users/... or ~/..."
            />
            <p className="mt-1 text-xs text-gray-500">
              Supports web URLs plus local file paths like `file://`, `/Users/...`, `~/...`, `./...`.
            </p>
          </div>

          <div>
            <label htmlFor="story-branch" className="mb-1 block text-xs font-medium text-gray-500">Branch <span className="font-normal text-gray-400">(optional)</span></label>
            <input
              id="story-branch"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={form.branch}
              onChange={event => setForm(current => ({ ...current, branch: event.target.value }))}
              placeholder="feature/mvp3-package-fix"
            />
            <p className="mt-1 text-xs text-gray-500">
              Optional. Use this when the actual git branch does not match the ticket number or title.
            </p>
          </div>

          <div>
            <label id="story-folder-label" className="mb-1 block text-xs font-medium text-gray-500">Local Folder</label>
            <div
              role="group"
              aria-labelledby="story-folder-label"
              className="rounded-xl border border-gray-200 bg-slate-50 p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleChooseFolder}
                  disabled={folderPickerPending}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-wait disabled:opacity-60"
                >
                  {folderPickerPending ? 'Choosing…' : 'Choose Folder'}
                </button>
                <button
                  type="button"
                  onClick={() => setForm(current => ({ ...current, folder: '' }))}
                  disabled={!form.folder || folderPickerPending}
                  className="rounded-lg px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Clear
                </button>
              </div>
              <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2">
                {form.folder ? (
                  <>
                    <div className="text-sm font-medium text-slate-800" title={fullFolderText}>
                      {folderDisplay}
                    </div>
                    <div className="mt-1 truncate font-mono text-xs text-slate-500" title={fullFolderText}>
                      {fullFolderText}
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-slate-500">No local folder linked yet.</div>
                )}
              </div>
              {folderPickerError && (
                <p className="mt-2 text-xs text-rose-600">{folderPickerError}</p>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Optional. Choose a local folder when this story has a dedicated workspace on disk.
            </p>
          </div>

          <div>
            <label htmlFor="story-description" className="mb-1 block text-xs font-medium text-gray-500">Description</label>
            <textarea
              id="story-description"
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm leading-6 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={form.description}
              onChange={event => setForm(current => ({ ...current, description: event.target.value }))}
              placeholder={'Half-finished notes, artifact paths, and context...\nUse [mockup](/Users/.../demo.html) or [doc](https://...) for links.'}
            />
            <p className="mt-1 text-xs text-gray-500">
              Supports normal text plus links like `[label](https://...)` or `[label](/Users/.../demo.html)`.
            </p>
          </div>

          <div>
            <label htmlFor="story-status" className="mb-1 block text-xs font-medium text-gray-500">Status</label>
            <select
              id="story-status"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={form.status}
              onChange={event => setForm(current => ({ ...current, status: event.target.value }))}
            >
              {STORY_STATUS_OPTIONS.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Flow: New, Next Release, Ready for Develop, In Progress, Blocked, In Review, Ready for QA, In QA, Done, Merged, Released.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!form.mvp.trim() || !form.title.trim() || !form.link.trim() || !form.status.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {mode === 'edit' ? 'Save Story' : 'Create Story'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
