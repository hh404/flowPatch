import { useState, useEffect, useRef } from 'react'
import { normalizeTaskStatus } from '../utils/taskStatus.js'
import { normalizePriority } from '../utils/priority.js'
import { plusHours, toDateTimeLocalValue, toReminderIso } from '../utils/reminders.js'

const TYPES = [
  { value: 'todo',     label: 'Todo',      bg: 'bg-gray-100',    ring: 'ring-gray-400',    text: 'text-gray-700' },
  { value: 'waiting',  label: 'Waiting',   bg: 'bg-yellow-100',  ring: 'ring-yellow-400',  text: 'text-yellow-800' },
  { value: 'followup', label: 'Follow-up', bg: 'bg-blue-100',    ring: 'ring-blue-400',    text: 'text-blue-800' },
  { value: 'ad-hoc',   label: 'Ad-hoc',    bg: 'bg-purple-100',  ring: 'ring-purple-400',  text: 'text-purple-800' },
  { value: 'shadow',   label: 'Shadow',    bg: 'bg-pink-100',    ring: 'ring-pink-400',    text: 'text-pink-800' },
]

const STATUSES = [
  { value: 'inbox', label: 'Inbox' },
  { value: 'doing', label: 'Doing' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'done', label: 'Done' }
]

const PRIORITIES = [
  { value: 'high', label: 'High', className: 'border-rose-300 bg-rose-50 text-rose-700' },
  { value: 'medium', label: 'Medium', className: 'border-amber-300 bg-amber-50 text-amber-700' },
  { value: 'low', label: 'Low', className: 'border-sky-300 bg-sky-50 text-sky-700' }
]

function buildInitialState(task) {
  return {
    title: task?.title ?? '',
    type: task?.type ?? 'todo',
    status: normalizeTaskStatus(task?.status ?? 'inbox'),
    priority: normalizePriority(task?.priority),
    note: task?.note ?? '',
    related: task?.related ?? '',
    waitingOn: task?.waitingOn ?? '',
    followUpAt: task?.followUpAt ?? '',
    remindAt: toDateTimeLocalValue(task?.remindAt)
  }
}

export default function TaskModal({ mode = 'create', initialTask, onConfirm, onClose }) {
  const [form, setForm] = useState(() => buildInitialState(initialTask))
  const titleRef = useRef(null)
  const showsFollowUpFields = form.type === 'waiting' || form.type === 'followup'
  const initialReminder = initialTask?.remindAt ?? null
  const allowBackdropClose = mode !== 'edit'

  useEffect(() => {
    titleRef.current?.focus()
    titleRef.current?.select()
  }, [])

  useEffect(() => {
    setForm(buildInitialState(initialTask))
  }, [initialTask])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleSubmit(e) {
    e.preventDefault()
    const t = form.title.trim()
    if (!t) return
    const remindAt = toReminderIso(form.remindAt)
    onConfirm({
      title: t,
      type: form.type,
      status: form.status,
      priority: form.priority,
      note: form.note.trim(),
      related: form.related.trim() || null,
      waitingOn: form.waitingOn.trim() || null,
      followUpAt: form.followUpAt || null,
      remindAt,
      remindedAt: remindAt !== initialReminder ? null : initialTask?.remindedAt ?? null
    })
  }

  return (
    <div
      data-testid="task-modal-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm"
      onClick={event => {
        if (allowBackdropClose && event.target === event.currentTarget) onClose()
      }}
    >
      <div className="flex min-h-full items-start justify-center p-4 sm:items-center">
        <div
          data-testid="task-modal-surface"
          className="flex w-full max-w-md max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
          <div className="border-b border-gray-100 px-5 pb-4 pt-5">
            <h2 className="text-base font-semibold text-gray-800">{mode === 'edit' ? 'Edit Task' : 'New Task'}</h2>
          </div>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div
              data-testid="task-modal-scroll-body"
              className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 pb-4 pt-4"
            >
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Title</label>
                <input
                  ref={titleRef}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={form.title}
                  onChange={e => setForm(current => ({ ...current, title: e.target.value }))}
                  placeholder="What needs to happen?"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-gray-500">Type</label>
                <div className="flex flex-wrap gap-2">
                  {TYPES.map(t => (
                    <button
                      type="button"
                      key={t.value}
                      onClick={() => setForm(current => ({ ...current, type: t.value }))}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${t.bg} ${t.text}
                        ${form.type === t.value ? `ring-2 ${t.ring} scale-105` : 'opacity-60 hover:opacity-90'}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-gray-500">Status</label>
                <div className="grid grid-cols-4 gap-2">
                  {STATUSES.map(status => (
                    <button
                      type="button"
                      key={status.value}
                      onClick={() => setForm(current => ({ ...current, status: status.value }))}
                      className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                        form.status === status.value
                          ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-gray-500">Priority</label>
                <div className="grid grid-cols-3 gap-2">
                  {PRIORITIES.map(priority => (
                    <button
                      type="button"
                      key={priority.value}
                      onClick={() => setForm(current => ({ ...current, priority: priority.value }))}
                      className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                        form.priority === priority.value
                          ? priority.className
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {priority.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Note <span className="font-normal text-gray-400">(optional)</span></label>
                <textarea
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  rows={3}
                  value={form.note}
                  onChange={e => setForm(current => ({ ...current, note: e.target.value }))}
                  placeholder="Context, blockers, links…"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">ADO Ticket <span className="font-normal text-gray-400">(optional)</span></label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={form.related}
                  onChange={e => setForm(current => ({ ...current, related: e.target.value }))}
                  placeholder="e.g. ADO-1234"
                />
              </div>

              <div>
                {showsFollowUpFields && (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">Waiting On <span className="font-normal text-gray-400">(optional)</span></label>
                      <input
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        value={form.waitingOn}
                        onChange={e => setForm(current => ({ ...current, waitingOn: e.target.value }))}
                        placeholder="Person, team, system..."
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">Follow Up Date <span className="font-normal text-gray-400">(optional)</span></label>
                      <input
                        type="date"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        value={form.followUpAt}
                        onChange={e => setForm(current => ({ ...current, followUpAt: e.target.value }))}
                      />
                    </div>
                  </>
                )}
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <label className="block text-xs font-medium text-gray-500">Reminder <span className="font-normal text-gray-400">(optional)</span></label>
                  <button
                    type="button"
                    onClick={() => setForm(current => ({ ...current, remindAt: toDateTimeLocalValue(plusHours(1)) }))}
                    className="text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-700"
                  >
                    +1h
                  </button>
                </div>
                <input
                  type="datetime-local"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={form.remindAt}
                  onChange={e => setForm(current => ({ ...current, remindAt: e.target.value }))}
                />
              </div>

            </div>

            <div
              data-testid="task-modal-actions"
              className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4"
            >
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!form.title.trim()}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {mode === 'edit' ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
