const TYPE_COLORS = {
  todo: 'bg-gray-100 text-gray-600 border-gray-200',
  waiting: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  followup: 'bg-blue-50 text-blue-700 border-blue-200',
  'ad-hoc': 'bg-purple-50 text-purple-700 border-purple-200',
  shadow: 'bg-pink-50 text-pink-700 border-pink-200'
}

const TYPE_BADGE = {
  todo: 'bg-gray-200 text-gray-700',
  waiting: 'bg-yellow-200 text-yellow-800',
  followup: 'bg-blue-200 text-blue-800',
  'ad-hoc': 'bg-purple-200 text-purple-800',
  shadow: 'bg-pink-200 text-pink-800'
}

const STATUS_ACTIONS = {
  pending: [{ label: '→ Doing', status: 'doing' }, { label: '→ Done', status: 'done' }],
  doing: [{ label: '→ Done', status: 'done' }, { label: '← Back', status: 'pending' }],
  done: [{ label: '← Reopen', status: 'pending' }]
}

export default function TaskCard({ task, onUpdate, onDelete }) {
  const colorClass = TYPE_COLORS[task.type] ?? TYPE_COLORS.todo
  const badgeClass = TYPE_BADGE[task.type] ?? TYPE_BADGE.todo

  return (
    <div className={`rounded-lg border p-3 text-sm ${colorClass} space-y-1.5`}>
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium leading-snug">{task.title}</span>
        <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${badgeClass}`}>{task.type}</span>
      </div>

      {task.note && <p className="text-xs opacity-70">{task.note}</p>}
      {task.related && <p className="text-xs font-mono opacity-60">{task.related}</p>}

      <div className="flex items-center justify-between pt-1">
        <div className="flex gap-1">
          {(STATUS_ACTIONS[task.status] ?? []).map(({ label, status }) => (
            <button
              key={status}
              aria-label={label}
              onClick={() => onUpdate(task.id, { status })}
              className="text-xs px-2 py-0.5 rounded bg-white/60 hover:bg-white/90 border border-current/20 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
        <button
          aria-label="delete"
          onClick={() => onDelete(task.id)}
          className="text-xs px-1.5 py-0.5 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
