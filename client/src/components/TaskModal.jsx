import { useState, useEffect, useRef } from 'react'

const TYPES = [
  { value: 'todo',     label: 'Todo',      bg: 'bg-gray-100',    ring: 'ring-gray-400',    text: 'text-gray-700' },
  { value: 'waiting',  label: 'Waiting',   bg: 'bg-yellow-100',  ring: 'ring-yellow-400',  text: 'text-yellow-800' },
  { value: 'followup', label: 'Follow-up', bg: 'bg-blue-100',    ring: 'ring-blue-400',    text: 'text-blue-800' },
  { value: 'ad-hoc',   label: 'Ad-hoc',    bg: 'bg-purple-100',  ring: 'ring-purple-400',  text: 'text-purple-800' },
  { value: 'shadow',   label: 'Shadow',    bg: 'bg-pink-100',    ring: 'ring-pink-400',    text: 'text-pink-800' },
]

export default function TaskModal({ initialTitle, initialType, onConfirm, onClose }) {
  const [title, setTitle] = useState(initialTitle)
  const [type, setType] = useState(initialType)
  const [note, setNote] = useState('')
  const [related, setRelated] = useState('')
  const titleRef = useRef(null)

  useEffect(() => {
    titleRef.current?.focus()
    titleRef.current?.select()
  }, [])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleSubmit(e) {
    e.preventDefault()
    const t = title.trim()
    if (!t) return
    onConfirm({ title: t, type, note: note.trim(), related: related.trim() || null })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="px-5 pt-5 pb-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 text-base">New Task</h2>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pt-4 pb-5 space-y-4">

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
            <input
              ref={titleRef}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What needs to happen?"
            />
          </div>

          {/* Type selector */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Type</label>
            <div className="flex flex-wrap gap-2">
              {TYPES.map(t => (
                <button
                  type="button"
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${t.bg} ${t.text}
                    ${type === t.value ? `ring-2 ${t.ring} scale-105` : 'opacity-60 hover:opacity-90'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Note <span className="font-normal text-gray-400">(optional)</span></label>
            <textarea
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              rows={3}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Context, blockers, links…"
            />
          </div>

          {/* Related ADO */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">ADO Ticket <span className="font-normal text-gray-400">(optional)</span></label>
            <input
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={related}
              onChange={e => setRelated(e.target.value)}
              placeholder="e.g. ADO-1234"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Add Task
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
