import { useState } from 'react'
import { detectType } from '../utils/detectType.js'

const TYPE_COLORS = {
  todo:     'bg-gray-200 text-gray-700',
  waiting:  'bg-yellow-200 text-yellow-800',
  followup: 'bg-blue-200 text-blue-800',
  'ad-hoc': 'bg-purple-200 text-purple-800',
  shadow:   'bg-pink-200 text-pink-800',
}

export default function QuickInput({ onAdd, onOpenDetails }) {
  const [value, setValue] = useState('')
  const type = detectType(value)

  async function submit() {
    const title = value.trim()
    if (!title) return

    await onAdd({ title, type, status: 'inbox' })
    setValue('')
  }

  function openDetails() {
    const title = value.trim()
    if (!title) return

    onOpenDetails({ title, type, status: 'inbox' })
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="border-b border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <input
          className="min-w-[16rem] flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="Capture fast: wait on QA, ask ops, shadow review..."
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        {value && (
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${TYPE_COLORS[type]}`}>
            {type}
          </span>
        )}
        <button
          type="button"
          onClick={openDetails}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-600 transition-colors hover:border-slate-400 hover:bg-slate-50 disabled:opacity-40"
          disabled={!value.trim()}
        >
          Details
        </button>
        <button
          type="button"
          onClick={submit}
          className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-40"
          disabled={!value.trim()}
        >
          Add
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500">Press Enter to capture now. Use Details only when you need context up front.</p>
    </div>
  )
}
