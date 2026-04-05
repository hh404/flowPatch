import { useState } from 'react'
import { detectType } from '../utils/detectType.js'

const TYPE_COLORS = {
  todo:     'bg-gray-200 text-gray-700',
  waiting:  'bg-yellow-200 text-yellow-800',
  followup: 'bg-blue-200 text-blue-800',
  'ad-hoc': 'bg-purple-200 text-purple-800',
  shadow:   'bg-pink-200 text-pink-800',
}

export default function QuickInput({ onOpenModal }) {
  const [value, setValue] = useState('')
  const type = detectType(value)

  function submit() {
    const title = value.trim()
    if (!title) return
    onOpenModal({ title, type })
    setValue('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') submit()
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-white border-b border-gray-200 shadow-sm">
      <input
        className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        placeholder="Add task — type 'wait', 'ask', 'check'… then Enter"
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
        onClick={submit}
        className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-40"
        disabled={!value.trim()}
      >
        +
      </button>
    </div>
  )
}
