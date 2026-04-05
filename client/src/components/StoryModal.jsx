import { useEffect, useRef, useState } from 'react'
import { DEFAULT_STORY_STATUS, normalizeStoryStatus, STORY_STATUS_OPTIONS } from '../utils/storyStatus.js'
import { DEFAULT_STORY_MVP, normalizeStoryMvp } from '../utils/storyMvp.js'

function buildInitialState(story) {
  const status = normalizeStoryStatus(story?.status)

  return {
    mvp: normalizeStoryMvp(story?.mvp),
    title: story?.title ?? '',
    link: story?.link ?? '',
    status: STORY_STATUS_OPTIONS.includes(status) ? status : DEFAULT_STORY_STATUS
  }
}

export default function StoryModal({ mode = 'create', initialStory, mvpOptions = [], onConfirm, onClose }) {
  const [form, setForm] = useState(() => buildInitialState(initialStory))
  const titleRef = useRef(null)

  useEffect(() => {
    titleRef.current?.focus()
    titleRef.current?.select()
  }, [])

  useEffect(() => {
    setForm(buildInitialState(initialStory))
  }, [initialStory])

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
    const status = form.status.trim()
    if (!mvp || !title || !link || !status) return

    onConfirm({ mvp, title, link, status })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={event => { if (event.target === event.currentTarget) onClose() }}
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
            <label htmlFor="story-link" className="mb-1 block text-xs font-medium text-gray-500">Link</label>
            <input
              id="story-link"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={form.link}
              onChange={event => setForm(current => ({ ...current, link: event.target.value }))}
              placeholder="https://dev.azure.com/..."
            />
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
